import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { getPolicies } from '../Api/adminApi';

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
  const [pdfLoading, setPdfLoading] = useState(false); // New state to track PDF loading
  const jumpAnim = useRef(new Animated.Value(0)).current;

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

  // Start jumping animation when a policy is selected
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
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        return;
      }

      const fileUri = FileSystem.documentDirectory + policy.fileName;
      const downloadedFile = await FileSystem.downloadAsync(
        policy.signedUrl,
        fileUri
      );

      const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      alert('Download completed!');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file.');
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

      {pdfLoading && ( // Conditionally render the loader when the PDF is loading
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
        onLoadStart={() => setPdfLoading(true)} // Show loader when loading starts
        onLoadEnd={() => setPdfLoading(false)} // Hide loader when loading ends
      />

      <Animated.View
        style={[
          styles.downloadButton,
          {
            transform: [{ translateY: jumpAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => downloadFile(policy)}>
          <MaterialIcons name="file-download" size={32} color="#000" />
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

      <FlatList
        data={filteredPolicies}
        keyExtractor={(item) => item.fileName}
        renderItem={renderPolicy}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: 60,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  list: {
    padding: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  fileName: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default PoliciesScreen;
