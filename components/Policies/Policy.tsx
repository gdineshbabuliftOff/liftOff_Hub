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
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { getPolicies } from '../Api/adminApi';
import Card from '../Layouts/Card';
import { styles } from '../Styles/PolicyStyles'; // Assuming styles are defined here

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
  
      const downloadResult = await FileSystem.downloadAsync(policy.signedUrl, fileUri);
  
      if (!downloadResult || !downloadResult.uri) {
        alert('Failed to download file.');
        setDownloading(false);
        return;
      }
  
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        alert('Permission denied to access storage.');
        setDownloading(false);
        return;
      }
  
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
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
      <Ionicons name="document-text-outline" size={24} color={paletteV2.primaryMain} style={{ marginRight: 12 }} />
      <Text style={styles.fileName}>{item.fileName}</Text>
    </TouchableOpacity>
  );

  const renderPdfViewer = (policy: Policy) => (
    <Card
      topNavBackgroundColor={paletteV2.surface}
      topNavContent={
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => setSelectedPolicy(null)}>
            <Ionicons name="arrow-back" size={24} color={paletteV2.textPrimaryOnLight} style={{ marginRight: 10 }} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
            {policy.fileName}
          </Text>
        </View>
      }
      fullHeight={true} // Set fullHeight to true for PDF viewer
    >
      {pdfLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={paletteV2.primaryMain} />
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
            <ActivityIndicator size="small" color={paletteV2.primaryMain} />
          ) : (
            <MaterialIcons name="file-download" size={32} color={paletteV2.primaryMain} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={paletteV2.primaryMain} />
      </View>
    );
  }

  return selectedPolicy ? (
    renderPdfViewer(selectedPolicy)
  ) : (
    <Card
      topNavBackgroundColor={paletteV2.backgroundLight}
      topNavContent={
        <View style={styles.navBar}>
          <Ionicons name="document" size={22} color={paletteV2.textPrimaryOnLight} style={{ marginRight: 8 }} />
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search Policies"
              placeholderTextColor={paletteV2.textSecondaryOnLight}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={paletteV2.iconSubtle} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="search" size={20} color={paletteV2.iconSubtle} />
            )}
          </View>
        </View>
      }
    >
      {filteredPolicies.length === 0 ? (
        <View style={{ alignItems: 'center', flex: 1, marginTop: 50 }}>
          <Image
            source={require('../../assets/images/noemployee.png')}
            style={{ width: 150, height: 150, resizeMode: 'contain', opacity: 0.7 }}
          />
          <Text style={{ marginTop: 10, fontSize: 17, color: paletteV2.textSecondaryOnLight }}>
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
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[paletteV2.primaryMain]}
              tintColor={paletteV2.primaryMain}
            />
          }
        />
      )}

      {policyAdd && (
        <TouchableOpacity
          onPress={() => router.push('/managePolicy')}
          // Apply the primaryMain color to the FAB background
          style={[styles.fab, { backgroundColor: paletteV2.primaryMain }]} 
        >
          <Ionicons name="add" size={28} color={paletteV2.textPrimaryOnDark} />
        </TouchableOpacity>
      )}
    </Card>
  );
};

export default PoliciesScreen;