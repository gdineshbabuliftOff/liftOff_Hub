import apiClient from '@/components/Api/apiClient';
import { deleteDocument } from '@/components/Api/userApi';
import { Roles } from '@/constants/enums';
import CustomProgressBar from '@/constants/ProgressBar';
import { ENDPOINTS } from '@/utils/endPoints';
import { getLocalData } from '@/utils/localData';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Toast from 'react-native-toast-message';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const idCard = [
  { field: 'aadharCard', label: 'Aadhar Card', icon: 'credit-card', groupColor: '#6366F1' },
  { field: 'panCard', label: 'Pan Card', icon: 'credit-card', groupColor: '#6366F1' },
];

// FIX: Changed the color from green to blue for better visual distinction
export const marksSheets = [
  { field: 'tenthMarksCard', label: '10th Marks Card', icon: 'school', groupColor: '#3B82F6' },
  { field: 'twelthMarksCard', label: '12th Marks Card', icon: 'school', groupColor: '#3B82F6' },
  { field: 'bachelorsOrHigherDegree', label: 'Bachelors or Higher Degree', icon: 'school', groupColor: '#3B82F6' },
];

export const paySlips = [
  { field: 'last3MonthsPayslips', label: 'Last 3 Months Pay Slips', icon: 'receipt-long', groupColor: '#FBBF24' },
  { field: 'last3OrgRelievingOfferLetter', label: 'Last 3 Org. Offer & Hike Letter', icon: 'article', groupColor: '#FBBF24' },
  { field: 'fullAndFinalSettlement', label: 'Full and Final Settlement', icon: 'paid', groupColor: '#FBBF24' },
];

const allDocuments = [...idCard, ...marksSheets, ...paySlips];
const REQUIRED_FIELDS = ['aadharCard', 'panCard'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type FormHandle = {
  submit: () => Promise<boolean>;
  save: () => Promise<boolean>;
  isSubmitting: boolean;
  isSubmittingSave: boolean;
  isSubmittingNext: boolean;
};

interface DocumentsFormProps {
    onDirtyChange: (isDirty: boolean) => void;
}

type DocumentStatus = {
  name: string;
  url: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  size: number | null;
};

type DocumentStates = Record<string, DocumentStatus>;
type ParsedUserData = { userId: string; role: Roles; [key: string]: any; };
type ApiDocumentEntry = { name: string; url: string; [key: string]: any; };
type DocumentsApiResponse = { [key: string]: ApiDocumentEntry; };

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


const DocumentsForm = forwardRef<FormHandle, DocumentsFormProps>(({ onDirtyChange }, ref) => {
  const [initialDocumentStates, setInitialDocumentStates] = useState<DocumentStates>({});
  const [documentStates, setDocumentStates] = useState<DocumentStates>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSubmittingNext, setIsSubmittingNext] = useState(false);
  const [isSubmittingSave, setIsSubmittingSave] = useState(false);
  
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});
  const [isDeleting, setIsDeleting] = useState(false);
  
  const activeUploads = useRef<Record<string, XMLHttpRequest>>({});
  
  const fetchAndSetDocuments = useCallback(async (isInitialLoad = false) => {
    try {
      const localdata = await getLocalData();
      const token = localdata?.token;
      const currentUserData: ParsedUserData = localdata?.userData ? JSON.parse(localdata.userData) : { userId: '', role: Roles.EMPLOYEE };
      const userId = currentUserData?.userId;
      if (!userId) throw new Error("User ID not found");
      
      const response = await apiClient<DocumentsApiResponse>(`${ENDPOINTS.DOCUMENTS}${userId}`, { method: 'GET', token });

      const newStates: DocumentStates = {};
      allDocuments.forEach(doc => {
        const docData = response?.[doc.field];
        newStates[doc.field] = {
          name: docData?.name || '',
          url: docData?.url || null,
          progress: docData ? 100 : 0,
          status: docData ? 'success' : 'idle',
          size: null,
        };
      });
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDocumentStates(newStates);
      if (isInitialLoad) {
        setInitialDocumentStates(newStates);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      Toast.show({ type: 'error', text1: 'Could not load documents.' });
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetDocuments(true);
    return () => {
      Object.values(activeUploads.current).forEach(xhr => xhr.abort());
    };
  }, [fetchAndSetDocuments]);

  useEffect(() => {
    const isDirty = Object.keys(documentStates).some(field => {
        if (!documentStates[field] || !initialDocumentStates[field]) {
            return false;
        }
        return documentStates[field].url !== initialDocumentStates[field].url;
    });
    onDirtyChange(isDirty);
  }, [documentStates, initialDocumentStates, onDirtyChange]);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAndSetDocuments(true);
    setIsRefreshing(false);
    Toast.show({ type: 'info', text1: 'Documents refreshed.' });
  }, [fetchAndSetDocuments]);

  const updateDocumentState = (field: string, newState: Partial<DocumentStatus>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDocumentStates(prev => ({ ...prev, [field]: { ...prev[field], ...newState } }));
  };

  const handleFileSelectAndUpload = async (field: string) => {
    if (validationErrors[field]) {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;
      
      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        Toast.show({ type: 'error', text1: 'File Too Large', text2: `Please select a file smaller than ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
        return;
      }
      
      updateDocumentState(field, { name: file.name, size: file.size, status: 'uploading', progress: 0 });

      const uploadResult = await uploadFile(
        file, field,
        (progress) => updateDocumentState(field, { progress }),
        (xhr) => { activeUploads.current[field] = xhr; }
      );
      
      delete activeUploads.current[field];

      if (uploadResult.success) {
        updateDocumentState(field, { status: 'success', progress: 100, url: uploadResult.url, name: uploadResult.name || file.name });
        Toast.show({ type: 'success', text1: `${file.name} uploaded successfully!` });
      }
      
    } catch (error) {
        delete activeUploads.current[field];
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('aborted')) {
            console.log(`Upload for ${field} was canceled by the user.`);
            updateDocumentState(field, { name: '', url: null, progress: 0, status: 'idle', size: null });
            try {
                await deleteDocument(field);
                Toast.show({ type: 'info', text1: 'Upload canceled' });
            } catch (deleteError) {
                console.error(`Failed to delete document ${field} after cancellation:`, deleteError);
                Toast.show({ type: 'error', text1: 'Could not clean up canceled upload.' });
            }
        } else {
            console.error("File selection or upload error:", error);
            updateDocumentState(field, { status: 'error', progress: 0 });
            Toast.show({ type: 'error', text1: `Upload failed`, text2: 'Please try again.' });
        }
    }
  };

  const handleDelete = (field: string, label: string) => {
    setModalTitle('Delete Document');
    setModalMessage(`Are you sure you want to delete "${label}"? This action cannot be undone.`);
    const confirmAction = async () => {
      setIsDeleting(true);
      try {
        await deleteDocument(field);
        updateDocumentState(field, { name: '', url: null, progress: 0, status: 'idle', size: null });
        Toast.show({ type: 'success', text1: 'Document deleted successfully.' });
      } catch (error) {
        console.error("Delete failed:", error);
        Toast.show({ type: 'error', text1: 'Failed to delete document.' });
      } finally {
        setIsDeleting(false);
        setIsModalVisible(false);
      }
    };
    setOnConfirm(() => confirmAction);
    setIsModalVisible(true);
  };
  
  const handlePreview = async (url: string | null) => {
    if (!url) return Toast.show({ type: 'error', text1: 'Preview not available.' });
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert(`Don't know how to open this URL: ${url}`);
    } catch (error) {
        Alert.alert('Error', 'Could not open the document preview.');
    }
  };

  const isAnyFileUploading = () => Object.values(documentStates).some(s => s.status === 'uploading');

  useImperativeHandle(ref, () => ({
    submit: async () => {
      setIsSubmittingNext(true);
      setValidationErrors({});
      try {
        if (isAnyFileUploading()) {
          Toast.show({ type: 'info', text1: 'Upload in Progress', text2: 'Please wait for all documents to finish uploading.' });
          return false;
        }

        const missingRequiredFields = REQUIRED_FIELDS.filter(
          field => documentStates[field]?.status !== 'success'
        );

        if (missingRequiredFields.length > 0) {
          const newErrors: Record<string, boolean> = {};
          missingRequiredFields.forEach(field => {
            newErrors[field] = true;
          });
          setValidationErrors(newErrors);
          Toast.show({ type: 'error', text1: 'Incomplete Documents', text2: 'Please upload all required documents.' });
          return false;
        }
        
        const localData = await getLocalData();
        const step = localData?.activeStep || 0;
        if (step < 2) await AsyncStorage.setItem('activeStep', String(2));
        
        setInitialDocumentStates(documentStates);
        Toast.show({type: 'success', text1: 'Documents verified successfully!'});
        return true;
      } catch (error) {
        console.error("Submission error:", error);
        Toast.show({type: 'error', text1: 'An unexpected error occurred.'});
        return false;
      } finally {
        setIsSubmittingNext(false);
      }
    },
    save: async () => {
      setIsSubmittingSave(true);
      try {
        if (isAnyFileUploading()) {
          Toast.show({ type: 'info', text1: 'Upload in Progress', text2: 'Please wait for uploads to finish before saving.' });
          return false;
        }
        setInitialDocumentStates(documentStates);
        Toast.show({ type: 'success', text1: 'Your progress has been saved.' });
        return true;
      } catch (error) {
        console.error("Save error:", error);
        Toast.show({type: 'error', text1: 'An unexpected error occurred while saving.'});
        return false;
      } finally {
        setIsSubmittingSave(false);
      }
    },
    isSubmitting: isSubmittingNext || isSubmittingSave,
    isSubmittingSave,
    isSubmittingNext,
  }));
  
  const renderDocumentCard = (doc: { field: string; label: string; icon: any; groupColor: string }) => {
    const state = documentStates[doc.field];
    if (!state) return null;

    const { status, name, url, progress } = state;
    const isUploading = status === 'uploading';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isIdle = status === 'idle';
    const isRequired = REQUIRED_FIELDS.includes(doc.field);
    const hasValidationError = validationErrors[doc.field];

    return (
      <View key={doc.field} style={[styles.card, hasValidationError && styles.cardError]}>
        <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${doc.groupColor}20` }]}>
                <MaterialIcons name={doc.icon} size={24} color={doc.groupColor} />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.label}>
                    {doc.label}
                    {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
                </Text>
                {hasValidationError && <Text style={styles.inlineErrorText}>This document is required.</Text>}
            </View>
        </View>

        <View style={styles.cardBody}>
          {isIdle && (
            <TouchableOpacity style={styles.dropzone} activeOpacity={0.7} onPress={() => handleFileSelectAndUpload(doc.field)}>
              <MaterialIcons name="cloud-upload" size={28} color="#9CA3AF" />
              <Text style={styles.dropzoneText}>Tap to upload PDF</Text>
              <Text style={styles.dropzoneSubText}>(Max 10MB)</Text>
            </TouchableOpacity>
          )}

          {isError && (
            <TouchableOpacity style={[styles.dropzone, styles.dropzoneError]} activeOpacity={0.7} onPress={() => handleFileSelectAndUpload(doc.field)}>
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
                    <TouchableOpacity onPress={() => activeUploads.current[doc.field]?.abort()} style={styles.cancelButtonIcon}>
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
                <TouchableOpacity onPress={() => handlePreview(url)} style={styles.smallActionButton}>
                  <MaterialIcons name="visibility" size={20} color="#A78BFA" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(doc.field, doc.label)} style={styles.smallActionButton}>
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
        {allDocuments.map(renderDocumentCard)}
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
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <Text style={styles.modalMessage}>{modalMessage}</Text>
                <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)} disabled={isDeleting}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={onConfirm} disabled={isDeleting}>
                    {isDeleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 20,
      elevation: 1,
      shadowColor: '#4B5563',
      shadowOpacity: 0.05,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 5 },
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    cardError: {
        borderColor: '#EF4444', 
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cardIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardBody: {
      padding: 16,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      color: '#1F2937',
    },
    requiredAsterisk: {
      color: '#EF4444',
    },
    inlineErrorText: {
        fontSize: 13,
        color: '#EF4444',
        marginTop: 4,
    },
    dropzone: {
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    dropzoneError: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    dropzoneText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#4B5563',
    },
    dropzoneSubText: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF'
    },
    errorText: {
        color: '#EF4444',
    },
    uploadingContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
    },
    progressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginHorizontal: 10,
    },
    fileName: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    cancelButtonIcon: {
        padding: 4,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    fileNameSuccess: {
        fontSize: 14,
        fontWeight: '500',
        color: '#059669',
        flex: 1,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallActionButton: {
      padding: 6,
      marginLeft: 16,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(17, 24, 39, 0.6)',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 340,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      elevation: 20,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      color: '#111827',
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      color: '#4B5563',
      lineHeight: 24,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#E5E7EB',
      marginRight: 8,
    },
    cancelButtonText: {
      color: '#374151',
      fontWeight: '600',
      fontSize: 16,
    },
    deleteButton: {
      backgroundColor: '#EF4444',
      marginLeft: 8,
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
});

export default DocumentsForm;