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
          text2: 'Please upload a file smaller than 10MB',
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
    await deletePolicy(fileName);
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
        borderColor: '#eee',
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ flex: 1, fontSize: 13 }}>{item.fileName}</Text>
      <Text style={{ flex: 1, marginLeft: 15, fontSize: 13 }}>
        {new Date(item.lastUpdated).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        onPress={() => handleDelete(item.fileName)}
        style={{ paddingHorizontal: 6 }}
      >
        {isDeleting === item.fileName ? (
          <ActivityIndicator size="small" color="orange" />
        ) : (
          <Ionicons name="trash" size={20} color="red" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Card
      topNavBackgroundColor="#f0f0f0"
      topNavContent={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/policy')}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, marginLeft: 12, fontWeight: '600' }}>
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
            backgroundColor: '#000',
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
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color="white" />
          )}
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {isUploading ? 'Uploading...' : 'Choose File to Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          marginTop: 40,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#f8f8f8',
            paddingVertical: 12,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            borderColor: '#ccc',
          }}
        >
          <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 13 }}>Policy Name</Text>
          <Text style={{ width: 100, fontWeight: 'bold', fontSize: 13 }}>Last Updated</Text>
          <Text style={{ width: 60, fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>Action</Text>
        </View>

        {isUploading && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              paddingHorizontal: 10,
              borderBottomWidth: 1,
              borderColor: '#eee',
              backgroundColor: '#fff7e6',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', fontSize: 13 }}>{fileName}</Text>
              <CustomProgressBar progress={uploadProgress} />
            </View>
            <TouchableOpacity onPress={handleCancelUpload} style={{ width: 40, alignItems: 'center' }}>
              <Ionicons name="close-circle-outline" size={20} color="orange" />
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
                <ActivityIndicator size="large" color="#007bff" />
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Image
                  source={require('../../../assets/images/noemployee.png')}
                  style={{ width: 200, height: 200, resizeMode: 'contain' }}
                />
                <Text style={{ marginTop: 12, fontSize: 16, color: '#666' }}>
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
