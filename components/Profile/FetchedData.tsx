import { Routes } from '@/constants/enums';
import { getLocalData } from '@/utils/localData';
import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { logoutUser } from '../Api/authentication';
import { fetchEmployeeProfile } from '../Api/userApi';
import Card from '../Layouts/Card';

type ParsedUserData = {
  userId: string;
  [key: string]: any;
};

type Document = {
  documentType: string;
  url: string;
  name: string;
  documentGroup: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const localData = await getLocalData();
        const userdata: ParsedUserData = localData?.userData
          ? JSON.parse(localData.userData)
          : {};
        const userId = userdata?.userId;
        if (userId) {
          const response = await fetchEmployeeProfile(userId);
          setProfile(response);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const localdata = await getLocalData();
      const token = localdata?.token;
      await logoutUser(token);
      await AsyncStorage.clear();
      openURL(Routes.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
  };

    const downloadFile = async (document: Document) => {
      try {
        setDownloading(true);
    
        const fileName = document.name || 'downloaded_file.pdf';
        const fileUri = FileSystem.cacheDirectory + fileName;
    
        // Step 1: Download file to cache
        const downloadResult = await FileSystem.downloadAsync(document.url, fileUri);
    
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

  useEffect(() => {
    if (selectedDocument) {
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
  }, [selectedDocument]);

  if (loading || loggingOut) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Failed to load profile.</Text>
      </View>
    );
  }

  if (selectedDocument) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setSelectedDocument(null)}>
            <MaterialIcons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.webviewTitle} numberOfLines={1} ellipsizeMode="tail">
            {selectedDocument.documentType}
          </Text>
        </View>

        {pdfLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}

        <WebView
          source={{
            uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedDocument.url)}`,
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
          <TouchableOpacity
            onPress={() => downloadFile(selectedDocument)}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <MaterialIcons name="file-download" size={32} color="#000" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const { employeeDetails, employee, documents, bankAccount, photoUrl } = profile;

  const renderField = (label: string, value: string | number | null | undefined) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? 'N/A'}</Text>
    </View>
  );

  const renderRow = (fields: React.ReactElement[]) => (
    <View style={styles.row}>
      {fields.map((field, index) => (
        <View key={index} style={styles.column}>{field}</View>
      ))}
    </View>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
      <View style={styles.hr} />
    </View>
  );

  return (
    <Card
      topNavBackgroundColor="#f0f0f0"
      topNavContent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Section title="Employee Details">
          {photoUrl && <Image source={{ uri: photoUrl }} style={styles.avatar} />}
          {renderRow([
            renderField('First Name', profile.firstName),
            renderField('Last Name', profile.lastName)
          ])}
          {renderRow([
            renderField('Email', profile.email),
            renderField('Phone', profile.phone)
          ])}
          {renderRow([
            renderField('DOB', profile.dateOfBirth),
            renderField('Gender', profile.gender)
          ])}
          {renderRow([
            renderField('Blood Group', profile.bloodGroup),
            renderField('Designation', employeeDetails?.designation)
          ])}
          {renderRow([
            renderField('DOJ', employeeDetails?.dateOfJoining),
            renderField('Status', employeeDetails?.status)
          ])}
          {renderRow([
            renderField('Experience', `${employeeDetails?.yearsOfExperience} year(s)`),
            renderField('UAN', employeeDetails?.uan)
          ])}
          {renderRow([
            renderField('PAN', employeeDetails?.pan),
            renderField('Aadhar', employeeDetails?.aadhar)
          ])}
        </Section>

        <Section title="Emergency Contacts">
          {employee?.contacts?.length > 0 ? (
            employee.contacts.map(
              (
                contact: { name: string; phoneNumber: string; relationship: string },
                index: number
              ) => (
                <View key={index} style={styles.contactContainer}>
                  {renderRow([
                    renderField('Name', contact.name),
                    renderField('Phone', contact.phoneNumber)
                  ])}
                  {renderRow([
                    renderField('Relationship', contact.relationship)
                  ])}
                </View>
              )
            )
          ) : (
            <Text style={styles.value}>No emergency contacts available.</Text>
          )}
        </Section>

        <Section title="Documents">
          {Object.entries(documents || {}).map(([key, doc]: any) => (
            <View key={key} style={styles.documentItem}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#D32F2F" style={{ marginRight: 12 }} />
              <Text style={styles.documentName}>{doc.documentType}</Text>
              <TouchableOpacity
                onPress={() => handleViewDocument(doc)}
                style={styles.viewButton}
              >
                <Text style={styles.viewText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Section>

        <Section title="Bank Details">
          {bankAccount ? (
            <>
              {renderRow([
                renderField('Name', bankAccount.name),
                renderField('Bank Name', bankAccount.bankName)
              ])}
              {renderRow([
                renderField('Account Number', bankAccount.accountNumber),
                renderField('IFSC', bankAccount.ifscCode)
              ])}
              {renderRow([
                renderField('Branch', bankAccount.branchName)
              ])}
            </>
          ) : (
            <Text style={styles.value}>No bank details available.</Text>
          )}
        </Section>
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  logoutText: {
    color: 'red',
    fontWeight: '600'
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  hr: {
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  column: {
    flex: 1,
    paddingRight: 8
  },
  fieldContainer: {
    marginBottom: 4
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555'
  },
  value: {
    fontSize: 16,
    color: '#000'
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    alignSelf: 'center',
    borderColor: '#000',
    borderWidth: 2,
  },
  contactContainer: {
    marginBottom: 12
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  documentName: {
    flex: 1,
    fontSize: 16,
    color: '#000'
  },
  viewButton: {
    padding: 8
  },
  viewText: {
    color: '#1E90FF',
    fontWeight: '500'
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  webviewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12
  },
  downloadButton: {
    position: 'absolute',
    right: 20,
    bottom: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});