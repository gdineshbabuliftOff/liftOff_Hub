import apiClient from '@/components/Api/apiClient';
import { deleteDocument, getAgreement, getLiftoffPdfUrl } from '@/components/Api/userApi';
import { styles } from '@/components/Styles/AgreementStyles';
import { Roles } from '@/constants/enums';
import CustomProgressBar from '@/constants/ProgressBar';
import { ENDPOINTS } from '@/utils/endPoints';
import { getLocalData } from '@/utils/localData';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing'; // <--- Import expo-sharing
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Linking, Modal, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Toast from 'react-native-toast-message';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ParsedUserData = { userId: string; role: Roles; [key: string]: any; };
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type FormHandle = {
  submit: () => Promise<boolean>;
};

export type AgreementFormProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

type DocumentStatus = {
  name: string;
  url: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  size: number | null;
};

interface AgreementDocument {
  documentGroup: string;
  name: string;
  documentType: string;
  url: string;
}

interface GetAgreementApiResponse {
  agreement: AgreementDocument;
}

const uploadFile = async (
  file: DocumentPicker.DocumentPickerAsset,
  documentType: string,
  onProgress: (progress: number) => void,
  onUploadInit: (xhr: XMLHttpRequest) => void
): Promise<{success: boolean, url?: string, name?: string}> => {
  try {
    onProgress(0);
    const localData = await getLocalData();
    if (!localData?.userData || !localData.token) throw new Error('User not authenticated');

    const userdata: ParsedUserData = JSON.parse(localData.userData);
    const payload = {
      fileName: file.name,
      fileSize: file.size,
      userId: userdata.userId,
      documentType: documentType,
    };
    const presignedUrlResponse = await apiClient<{ preSignedUrl: string, finalizedUrl: string }>(
      `${ENDPOINTS.DOCUMENTS}${userdata.userId}/upload`,
      { method: 'POST', body: payload, token: localData.token }
    );
    const signedUrl = presignedUrlResponse?.preSignedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');

    const uploadSuccess = await new Promise<boolean>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      onUploadInit(xhr);
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', file.mimeType || 'application/octet-stream');
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(Math.min(progress, 100));
        }
      };
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.onload = () => (xhr.status === 200 ? resolve(true) : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('Upload network error.'));

      FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 })
        .then(base64 => {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          xhr.send(bytes);
        }).catch(reject);
    });

    if (uploadSuccess) {
        return { success: true, url: presignedUrlResponse.finalizedUrl, name: file.name };
    }
    return { success: false };

  } catch (error) {
    const errorMessage = (error as Error).message;
    if (!errorMessage.includes('aborted')) {
        console.error("Upload error:", error);
    }
    onProgress(0);
    throw error;
  }
};

const AgreementForm = forwardRef<FormHandle, AgreementFormProps>(({ onDirtyChange }, ref) => {
  const [documentState, setDocumentState] = useState<DocumentStatus>({
    name: '',
    url: null,
    progress: 0,
    status: 'idle',
    size: null,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const activeUpload = useRef<XMLHttpRequest | null>(null);
  
  const fetchAndSetAgreement = useCallback(async () => {
    try {
      const response = await getAgreement();
      if (response && typeof response === 'object' && 'agreement' in response && response.agreement && typeof response.agreement === 'object' && 'url' in response.agreement) {
        const typedResponse = response as GetAgreementApiResponse;
        setDocumentState({
          name: typedResponse.agreement.name || 'Signed Agreement',
          url: typedResponse.agreement.url,
          progress: 100,
          status: 'success',
          size: null,
        });
      } else {
        setDocumentState({ name: '', url: null, progress: 0, status: 'idle', size: null });
      }
    } catch (error) {
      console.error("Failed to fetch agreement:", error);
      Toast.show({ type: 'error', text1: 'Could not load agreement status.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetAgreement();
    return () => {
      activeUpload.current?.abort();
    };
  }, [fetchAndSetAgreement]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAndSetAgreement();
    setIsRefreshing(false);
    Toast.show({ type: 'info', text1: 'Refreshed!' });
  }, [fetchAndSetAgreement]);

  const updateDocumentState = (newState: Partial<DocumentStatus>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDocumentState(prev => ({ ...prev, ...newState }));
  };

  const handleFileSelectAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;
      
      onDirtyChange?.(true);

      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        Toast.show({ type: 'error', text1: 'File Too Large', text2: `Please select a file smaller than ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
        return;
      }
      
      updateDocumentState({ name: file.name, size: file.size, status: 'uploading', progress: 0 });

      const uploadResult = await uploadFile(
        file, 'agreement',
        (progress) => updateDocumentState({ progress }),
        (xhr) => { activeUpload.current = xhr; }
      );
      
      activeUpload.current = null;

      if (uploadResult.success) {
        updateDocumentState({ status: 'success', progress: 100, url: uploadResult.url, name: uploadResult.name || file.name });
        Toast.show({ type: 'success', text1: `${file.name} uploaded successfully!` });
      }
      
    } catch (error) {
        activeUpload.current = null;
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('aborted')) {
            console.log(`Upload for agreement was canceled.`);
            updateDocumentState({ name: '', url: null, progress: 0, status: 'idle', size: null });
            Toast.show({ type: 'info', text1: 'Upload canceled' });
        } else {
            console.error("File selection or upload error:", error);
            updateDocumentState({ status: 'error', progress: 0 });
            Toast.show({ type: 'error', text1: `Upload failed`, text2: 'Please try again.' });
        }
    }
  };

  const handleDelete = () => {
    setIsModalVisible(true);
  };
  
  const confirmDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteDocument('agreement');
        updateDocumentState({ name: '', url: null, progress: 0, status: 'idle', size: null });
        onDirtyChange?.(true);
        Toast.show({ type: 'success', text1: 'Agreement deleted successfully.' });
      } catch (error) {
        console.error("Delete failed:", error);
        Toast.show({ type: 'error', text1: 'Failed to delete agreement.' });
      } finally {
        setIsDeleting(false);
        setIsModalVisible(false);
      }
  };

  const handlePreview = async () => {
    if (!documentState.url) return Toast.show({ type: 'error', text1: 'Preview not available.' });
    try {
        const supported = await Linking.canOpenURL(documentState.url);
        if (supported) await Linking.openURL(documentState.url);
        else Alert.alert(`Don't know how to open this URL: ${documentState.url}`);
    } catch (error) {
        Alert.alert('Error', 'Could not open the document preview.');
    }
  };
  
  const handleDownloadAgreement = async () => {
    setIsDownloading(true);
    const url = await getLiftoffPdfUrl();
    if (url) {
      try {
        const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0];
        const localUri = `${FileSystem.documentDirectory}${filename || 'agreement.pdf'}`;
        
        Toast.show({ type: 'info', text1: 'Downloading...', text2: `Saving "${filename || 'agreement.pdf'}"`, position: 'top' });

        const { uri: tempFileUri } = await FileSystem.downloadAsync(url, localUri);

        if (Platform.OS === 'android') {
          try {
            const directoryUri = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!directoryUri.granted) {
              Toast.show({ type: 'info', text1: 'Permission Denied', text2: "File not saved to Downloads. It's in app's private folder.", position: 'top' });
              console.log(`File saved temporarily to: ${tempFileUri}`);
              return;
            }

            const content = await FileSystem.readAsStringAsync(tempFileUri, { encoding: FileSystem.EncodingType.Base64 });
            const fileUriInDownloads = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri.directoryUri,
              filename || 'agreement.pdf',
              'application/pdf'
            );

            await FileSystem.writeAsStringAsync(fileUriInDownloads, content, { encoding: FileSystem.EncodingType.Base64 });
            
            Toast.show({
              type: 'success',
              text1: 'Download Complete!',
              text2: `File "${filename || 'agreement.pdf'}" saved successfully!`,
              position: 'top'
            });

            await FileSystem.deleteAsync(tempFileUri, { idempotent: true });

          } catch (safError: any) {
            console.error("SAF Error:", safError);
            Toast.show({
              type: 'error',
              text1: 'Could not save file',
              text2: `Error: ${safError.message}. File is in app's private folder.`,
              position: 'top'
            });
          }
        } else { // iOS
            const available = await Sharing.isAvailableAsync();
            if (available) {
                await Sharing.shareAsync(tempFileUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                Toast.show({
                  type: 'success',
                  text1: 'Share Initiated',
                  text2: 'Please choose where to save or open the agreement.',
                  position: 'top'
                });
            } else {
                Toast.show({
                  type: 'error',
                  text1: 'Sharing Not Available',
                  text2: 'File downloaded, but sharing is not supported on this device.',
                  position: 'top'
                });
                Alert.alert(`File Downloaded`, `The agreement form has been downloaded to your device at:\n\n${tempFileUri}\n\nYou can access it using a file management app.`);
            }
        }
      } catch (error) {
        console.error("Download error:", error);
        Toast.show({
          type: 'error',
          text1: 'Download Failed',
          text2: 'Could not download the agreement file. Please try again.',
          position: 'top'
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Could not get the agreement URL.',
        position: 'top'
      });
    }
    setIsDownloading(false);
  }

  useImperativeHandle(ref, () => ({
    submit: async () => {
      setIsSubmitting(true);
      try {
        if (documentState.status !== 'success') {
          Toast.show({ type: 'error', text1: 'Agreement Required', text2: 'Please upload the signed agreement to continue.' });
          return false;
        }
        
        const localData = await getLocalData();
        const step = localData?.activeStep || 0;
        if (step < 4) {
            await AsyncStorage.setItem('activeStep', String(4));
        }
        Toast.show({type: 'success', text1: 'Agreement submitted successfully!'});
        return true;
      } catch (error) {
        console.error("Submission error:", error);
        Toast.show({type: 'error', text1: 'An unexpected error occurred.'});
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
  }));
  
  const renderDocumentCard = () => {
    const { status, name, progress } = documentState;
    const isUploading = status === 'uploading';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isIdle = status === 'idle';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#A78BFA20' }]}>
                <MaterialIcons name={'description'} size={24} color={'#A78BFA'} />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.label}>Upload Signed Agreement</Text>
            </View>
        </View>

        <View style={styles.cardBody}>
          {isIdle && (
            <TouchableOpacity style={styles.dropzone} activeOpacity={0.7} onPress={handleFileSelectAndUpload}>
              <MaterialIcons name="cloud-upload" size={28} color="#9CA3AF" />
              <Text style={styles.dropzoneText}>Tap to upload PDF</Text>
              <Text style={styles.dropzoneSubText}>(Max 10MB)</Text>
            </TouchableOpacity>
          )}

          {isError && (
            <TouchableOpacity style={[styles.dropzone, styles.dropzoneError]} activeOpacity={0.7} onPress={handleFileSelectAndUpload}>
              <MaterialIcons name="error-outline" size={28} color="#F87171" />
              <Text style={[styles.dropzoneText, styles.errorText]}>Upload Failed</Text>
              <Text style={[styles.dropzoneSubText, {color: '#F87171'}]}>Tap to retry</Text>
            </TouchableOpacity>
          )}

          {isUploading && (
            <View style={styles.uploadingContainer}>
               <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{name}</Text>
               <View style={styles.progressWrapper}>
                    <View style={{flex: 1}}>
                      <CustomProgressBar progress={progress} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                    <TouchableOpacity onPress={() => activeUpload.current?.abort()} style={styles.cancelButtonIcon}>
                        <MaterialIcons name="cancel" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
               </View>
            </View>
          )}

          {isSuccess && (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={20} color="#34D399" style={{marginRight: 8}}/>
              <Text style={styles.fileNameSuccess} numberOfLines={1} ellipsizeMode="middle">{name}</Text>
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity onPress={handlePreview} style={styles.smallActionButton}>
                  <MaterialIcons name="visibility" size={20} color="#A78BFA" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.smallActionButton}>
                  <MaterialIcons name="delete" size={20} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  return (
    <View style={{flex: 1}}>
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={['#6366F1']}
                    tintColor={'#6366F1'}
                />
            }
        >
            <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownloadAgreement}
                disabled={isDownloading}
            >
                {isDownloading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <MaterialIcons name="cloud-download" size={20} color="#FFFFFF" style={{marginRight: 8}}/>
                        <Text style={styles.downloadButtonText}>Download & Sign Agreement</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionText}>1. Download the employee agreement form and take a printout.</Text>
                <Text style={styles.instructionText}>2. Sign in all Pages.</Text>
                <Text style={styles.instructionText}>3. Scan Documents.</Text>
                <Text style={styles.instructionText}>4. Upload the signed Document.</Text>
            </View>

            {renderDocumentCard()}
        </ScrollView>
        <Toast position="bottom" bottomOffset={20} />
        <Modal
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => !isDeleting && setIsModalVisible(false)}
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Delete Agreement</Text>
                <Text style={styles.modalMessage}>Are you sure you want to delete the uploaded agreement? This action cannot be undone.</Text>
                <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setIsModalVisible(false)} disabled={isDeleting}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>
    </View>
  );
});

export default AgreementForm;