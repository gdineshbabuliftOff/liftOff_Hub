import { addPolicy, isAdmin, isEditor } from '@/utils/permissions';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { getPolicies } from '../Api/adminApi';
import { styles } from '../Styles/PolicyStyles';

type Policy = {
  signedUrl: string;
  fileName: string;
  lastUpdated: string;
};

const PoliciesScreen = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const [downloading, setDownloading] = useState(false);
  const [policyAdd, setPolicyAdd] = useState(false);
  const router = useRouter();

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await getPolicies();
      setPolicies(data);
      setFilteredPolicies(data);
    } catch (err) {
      console.error('Failed to fetch policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      const admin = await isAdmin();
      const editor = await isEditor();
      const canAdd = await addPolicy();
      setPolicyAdd(admin || (editor && canAdd));
    };
    checkPermissions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPolicies();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredPolicies(policies);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredPolicies(
        policies.filter((p) => p.fileName.toLowerCase().includes(lower))
      );
    }
  }, [searchText, policies]);

  useEffect(() => {
    if (selectedPolicy) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(jumpAnim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(jumpAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [selectedPolicy]);

  const downloadFile = async (policy: Policy) => {
    try {
      setDownloading(true);
  
      const fileName = policy.fileName || 'downloaded_file.pdf';
      const fileUri = FileSystem.cacheDirectory + fileName;
  
      // Step 1: Download file to cache
      const downloadResult = await FileSystem.downloadAsync(policy.signedUrl, fileUri);
  
      if (!downloadResult || !downloadResult.uri) {
        alert('Failed to download file.');
        return;
      }
  
      // Step 2: Ask user to pick folder using SAF (Android only)
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        alert('Permission denied to access storage.');
        return;
      }
  
      // Step 3: Read the downloaded file as base64
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Step 4: Create file in chosen folder and write contents
      const newUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/pdf'
      );
  
      if (newUri) {
        await FileSystem.writeAsStringAsync(newUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        alert('File saved successfully!');
      } else {
        alert('Failed to create file in selected directory.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };
  

  const renderPolicy = ({ item }: { item: Policy }) => (
    <TouchableOpacity style={styles.item} onPress={() => setSelectedPolicy(item)}>
      <Ionicons name="document-text-outline" size={24} color="red" style={{ marginRight: 12 }} />
      <Text style={styles.fileName}>{item.fileName}</Text>
    </TouchableOpacity>
  );

  const renderPdfViewer = (policy: Policy) => (
    <View style={{ flex: 1 }}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setSelectedPolicy(null)}>
          <Ionicons name="arrow-back" size={24} color="#000" style={{ marginRight: 10 }} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
          {policy.fileName}
        </Text>
      </View>

      {pdfLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      <WebView
        source={{
          uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(policy.signedUrl)}`,
        }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        startInLoadingState={true}
        onLoadStart={() => setPdfLoading(true)}
        onLoadEnd={() => setPdfLoading(false)}
      />

      <Animated.View
        style={[
          styles.downloadButton,
          {
            transform: [{ translateY: jumpAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => downloadFile(policy)} disabled={downloading}>
          {downloading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <MaterialIcons name="file-download" size={32} color="#000" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return selectedPolicy ? (
    renderPdfViewer(selectedPolicy)
  ) : (
    <View style={{ flex: 1 }}>
      <View style={styles.navBar}>
        <Ionicons name="document" size={22} color="#000" style={{ marginRight: 8 }} />
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search"
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="search" size={20} color="#888" />
          )}
        </View>
      </View>

      {filteredPolicies.length === 0 ? (
        <View style={{ alignItems: 'center', flex: 1, marginTop: 50 }}>
          <Image
            source={require('../../assets/images/noemployee.png')}
            style={{ width: 150, height: 150, resizeMode: 'contain' }}
          />
          <Text style={{ marginTop: 5, fontSize: 16, color: '#666' }}>
            No policies found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPolicies}
          keyExtractor={(item) => item.fileName}
          renderItem={renderPolicy}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {policyAdd && (
        <TouchableOpacity
          onPress={() => router.push('/managePolicy')}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PoliciesScreen;
