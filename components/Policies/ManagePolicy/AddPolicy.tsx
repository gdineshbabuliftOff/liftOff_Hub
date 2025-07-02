import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { deletePolicy, getPolicies } from '@/components/Api/adminApi';
import Card from '@/components/Layouts/Card';
import CustomProgressBar from '@/constants/ProgressBar';
import HandlePoliciesUpload, { cancelCurrentUpload } from './HandlePolicyUpload';

type Policy = {
  signedUrl: string;
  fileName: string;
  lastUpdated: string;
};

const paletteV2 = {
  primaryMain: '#5DBBAD',
  primaryDark: '#3E9C90',
  primaryLight: '#A7D7D3',
  accentMain: '#FCA311',
  backgroundLight: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimaryOnLight: '#4A5568',
  textSecondaryOnLight: '#6B7280',
  textDisabled: '#9CA3AF',
  textPrimaryOnDark: '#FFFFFF',
  errorMain: '#E53935',
  warningMain: '#FFB300',
  successMain: '#43A047',
  iconDefault: '#8FA3AD',
  iconSubtle: '#B0BEC5',
  neutralDark: '#6A7881',
  neutralLight: '#ECEFF1',
  neutralMedium: '#9CA3AF',
  neutralWhite: '#FFFFFF',
  gradientPrimaryButton: ['#5DBBAD', '#3E9C90'],
};

export default function AddPolicyScreen() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const MAX_FILE_SIZE_MB = 10;
  const router = useRouter();

  const fetchPolicies = async () => {
    try {
      setIsFetching(true);
      const res = await getPolicies();
      const sortedPolicies = res.sort(
        (a: Policy, b: Policy) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      setPolicies(sortedPolicies);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch policies',
        position: 'bottom',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.length) {
      const file = result.assets[0];
      if (!file.size || file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
        Toast.show({
          type: 'error',
          text1: 'File too large',
          text2: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB`,
          position: 'bottom',
        });
        return;
      }

      const duplicate = policies.find((p) => p.fileName === file.name);
      if (duplicate) {
        Toast.show({
          type: 'info',
          text1: 'This policy already exists',
          position: 'bottom',
        });
        return;
      }

      const fileObj = {
        uri: file.uri,
        name: file.name,
        size: file.size,
        type: file.mimeType || 'application/octet-stream',
      };

      const fileListLike = {
        0: fileObj,
        length: 1,
        item: (index: number) => (index === 0 ? fileObj : null),
      } as unknown as FileList;

      setIsUploading(true);

      const success = await HandlePoliciesUpload(
        fileListLike,
        setUploadProgress,
        setFileName,
        setFileSize
      );

      if (success) {
        fetchPolicies();
      }

      setIsUploading(false);
      setFileName('');
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      setIsDeleting(fileName);
      await deletePolicy(fileName);
      Toast.show({
        type: 'success',
        text1: `${fileName} Policy deleted`,
        position: 'bottom',
      });
      fetchPolicies();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete policy',
        position: 'bottom',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelUpload = async () => {
    cancelCurrentUpload();
    await deletePolicy(fileName); // Assuming you want to delete the partially uploaded file
    Toast.show({
      type: 'error',
      text1: `${fileName} Upload canceled`,
      position: 'bottom',
    });
    setIsUploading(false);
    setFileName('');
    setUploadProgress(0);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const renderItem = ({ item }: { item: Policy }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: paletteV2.neutralLight,
        backgroundColor: paletteV2.surface,
      }}
    >
      <Text style={{ flex: 1, fontSize: 13, color: paletteV2.textPrimaryOnLight }}>{item.fileName}</Text>
      <Text style={{ flex: 1, marginLeft: 15, fontSize: 13, color: paletteV2.textSecondaryOnLight }}>
        {new Date(item.lastUpdated).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        onPress={() => handleDelete(item.fileName)}
        style={{ paddingHorizontal: 6 }}
      >
        {isDeleting === item.fileName ? (
          <ActivityIndicator size="small" color={paletteV2.accentMain} />
        ) : (
          <Ionicons name="trash" size={20} color={paletteV2.errorMain} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Card
      topNavBackgroundColor={paletteV2.backgroundLight}
      topNavContent={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/policy')}>
            <Ionicons name="arrow-back" size={24} color={paletteV2.textPrimaryOnLight} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, marginLeft: 12, fontWeight: '600', color: paletteV2.textPrimaryOnLight }}>
            Upload Policy
          </Text>
        </View>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 24 }}>
        <TouchableOpacity
          onPress={pickFile}
          disabled={isUploading}
          style={{
            backgroundColor: paletteV2.primaryMain,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            opacity: isUploading ? 0.7 : 1,
          }}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={paletteV2.neutralWhite} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={paletteV2.neutralWhite} />
          )}
          <Text style={{ color: paletteV2.neutralWhite, fontSize: 16, fontWeight: '600' }}>
            {isUploading ? 'Uploading...' : 'Choose File to Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          marginTop: 40,
          borderWidth: 1,
          borderColor: paletteV2.neutralMedium,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: paletteV2.backgroundLight,
            paddingVertical: 12,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            borderColor: paletteV2.neutralMedium,
          }}
        >
          <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 13, color: paletteV2.textPrimaryOnLight }}>Policy Name</Text>
          <Text style={{ width: 100, fontWeight: 'bold', fontSize: 13, color: paletteV2.textPrimaryOnLight }}>Last Updated</Text>
          <Text style={{ width: 60, fontWeight: 'bold', textAlign: 'center', fontSize: 13, color: paletteV2.textPrimaryOnLight }}>Action</Text>
        </View>

        {isUploading && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              paddingHorizontal: 10,
              borderBottomWidth: 1,
              borderColor: paletteV2.neutralLight,
              backgroundColor: paletteV2.warningMain + '1A', // A slight tint for warning
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', fontSize: 13, color: paletteV2.textPrimaryOnLight }}>{fileName}</Text>
              <CustomProgressBar progress={uploadProgress} />
            </View>
            <TouchableOpacity onPress={handleCancelUpload} style={{ width: 40, alignItems: 'center' }}>
              <Ionicons name="close-circle-outline" size={20} color={paletteV2.accentMain} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={policies}
          keyExtractor={(item) => item.fileName}
          renderItem={renderItem}
          refreshing={isFetching}
          onRefresh={fetchPolicies}
          ListEmptyComponent={
            isFetching ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={paletteV2.primaryMain} />
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Image
                  source={require('../../../assets/images/noemployee.png')}
                  style={{ width: 200, height: 200, resizeMode: 'contain' }}
                />
                <Text style={{ marginTop: 12, fontSize: 16, color: paletteV2.textSecondaryOnLight }}>
                  No policies found
                </Text>
              </View>
            )
          }
        />
      </View>
    </Card>
  );
}