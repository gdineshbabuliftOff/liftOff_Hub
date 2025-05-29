import { formatDateFull } from '@/constants/common';
import { Routes } from '@/constants/enums';
import { getLocalData } from '@/utils/localData';
import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { logoutUser } from '../Api/authentication';
import { fetchEmployeeProfile } from '../Api/userApi';
import Card from '../Layouts/Card';
import { styles } from '../Styles/ProfileStyles';

export enum Roles {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  EDITOR = 'EDITOR',
}

export enum JoineeTypes {
  NEW = 'NEW',
  EXISTING = 'EXISTING',
}

export enum DetailsCard {
  aadharCard = 'aadharCard',
  panCard = 'panCard',
  tenthMarksCard = 'tenthMarksCard',
  twelthMarksCard = 'twelthMarksCard',
  bachelorsOrHigherDegree = 'bachelorsOrHigherDegree',
  last3MonthsPayslips = 'last3MonthsPayslips',
  last3OrgRelievingOfferLetter = 'last3OrgRelievingOfferLetter',
  fullAndFinalSettlement = 'fullAndFinalSettlement',
  agreement = 'agreement',
}

type ParsedUserData = {
  userId: string;
  role: Roles;
  [key: string]: any;
};

type Document = {
  documentType: string;
  url: string;
  name: string;
  documentGroup: string;
};

const FRESHER_EXCLUDED_DOCS = [
  DetailsCard.last3MonthsPayslips,
  DetailsCard.last3OrgRelievingOfferLetter,
  DetailsCard.fullAndFinalSettlement,
];

const shouldShowDocumentsSection = (pathname: string, userRole: Roles | null) => {
  return (pathname === '/profile' && (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR)) ||
    (pathname === '/employee-details' && userRole === Roles.ADMIN);
};

const shouldShowBankDetails = (userRole: Roles | null, joineeType: JoineeTypes | null, pathname: string) => {
  return (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR || pathname === '/employee-details') &&
    (joineeType === JoineeTypes.NEW || pathname === '/employee-details');
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
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Roles | null>(null);
  const [joineeType, setJoineeType] = useState<JoineeTypes | null>(null);
  const defaultImage = require('../../assets/images/newUser.png');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
  setImageLoading(false);
  setImageError(false);
  };

  const handleImageError = () => {
  setImageLoading(false);
  setImageError(true);
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const localData = await getLocalData();
      const userdata: ParsedUserData = localData?.userData
        ? JSON.parse(localData.userData)
        : {};
      const userId = userdata?.userId;
      setUserRole(userdata?.role);

      if (userId) {
        const response = await fetchEmployeeProfile(userId);
        setProfile(response);
        setJoineeType(response?.employeeDetails?.joineeType);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

      const downloadResult = await FileSystem.downloadAsync(document.url, fileUri);

      if (!downloadResult || !downloadResult.uri) {
        alert('Failed to download file.');
        return;
      }

      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        alert('Permission denied to access storage.');
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
        <ActivityIndicator size="large" color="#000" />
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

  const { employee, documents, bankAccount, photoUrl } = profile;
  const employeeDetails = profile?.employeeDetails || employee;
  console.log(profile);

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

  const handleEditDetails = () => {
    console.log('Edit Details Pressed');
  };

  const handleUploadDocument = () => {
    console.log('Upload Document Pressed');
  };

  const handleAddBankAccount = () => {
    console.log('Add Bank Account Pressed');
  };

  const handleAddEmergencyContact = () => {
    console.log('Add Emergency Contact Pressed');
  };

  const renderProfileContent = () => {
    return (
      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadProfileData}
          colors={['#000000']}
          tintColor="#000000"
        />
      }>
        <Section title="Employee Details">
        <View style={styles.profileHeader}>
            {photoUrl ? (
                <View style={styles.avatarContainer}>
                {imageLoading && (
                    <ActivityIndicator 
                    size="small" 
                    color="#000" 
                    style={styles.imageLoader}
                    />
                )}
                <Image 
                    source={imageError ? defaultImage : { uri: photoUrl }}
                    style={styles.avatar}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                </View>
            ) : (
                <Image source={defaultImage} style={styles.avatar} />
            )}
            {pathname === '/profile' ? (
                <TouchableOpacity style={styles.editButton} onPress={handleEditDetails}>
                <Text style={styles.editText}>Edit Details</Text>
                </TouchableOpacity>
            ) : null}
        </View>
        {renderRow([
            renderField('Email', profile.email),
        ])}
        {renderRow([
            renderField('DOB', formatDateFull(profile.dateOfBirth)),
            renderField('Gender', profile.gender),
        ])}
        {renderRow([
            renderField('Blood Group', profile.bloodGroup),
            renderField('Phone', profile.phone),
        ])}
        {renderRow([
            renderField('Father Name', profile?.fatherName),
            renderField('Designation', employeeDetails?.designation),
        ])}
        {renderRow([
            renderField('DOJ', formatDateFull(employeeDetails?.dateOfJoining)),
            renderField('UAN', employeeDetails?.uan),
        ])}
        {renderRow([
            renderField('PAN', employeeDetails?.pan),
            renderField('Aadhar', employeeDetails?.aadhar),
        ])}
        {renderRow([
            renderField('Current Address', profile?.currentAddress),
        ])}
        {renderRow([
            renderField('Permanent Address', profile?.permanentAddress),
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
                    renderField('Phone', contact.phoneNumber),
                ])}
                </View>
            )
            )
        ) : (
            <Text style={styles.value}>No emergency contacts available.</Text>
        )}
        </Section>

        {shouldShowDocumentsSection(pathname, userRole) && (
          <Section title="Documents">
            {Object.values(DetailsCard).map((detailCardKey) => {
              const doc = documents?.[detailCardKey];

              if (employeeDetails?.status === 'Fresher' && FRESHER_EXCLUDED_DOCS.includes(detailCardKey as DetailsCard)) {
                return null;
              }

              return (
                <View key={detailCardKey} style={styles.documentItem}>
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={24}
                    color="#D32F2F"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.documentName}>{detailCardKey}</Text>
                  {doc?.url ? (
                    <TouchableOpacity
                      onPress={() => handleViewDocument(doc)}
                      style={styles.viewButton}
                    >
                      <Text style={styles.viewText}>View</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Section>
        )}

        {shouldShowBankDetails(userRole, joineeType, pathname) && (
          <Section title="Bank Details">
            {bankAccount ? (
              <>
                {renderRow([
                  renderField('Name', bankAccount.name),
                  renderField('Bank Name', bankAccount.bankName),
                ])}
                {renderRow([
                  renderField('Account Number', bankAccount.accountNumber),
                  renderField('IFSC', bankAccount.ifscCode),
                ])}
                {renderRow([renderField('Branch', bankAccount.branchName)])}
              </>
            ) : (
              <Text style={styles.value}>No bank details available.</Text>
            )}
          </Section>
        )}

        {pathname === '/employee-details' && (
          <View style={styles.adminButtonsContainer}>
            <TouchableOpacity style={styles.adminButton} onPress={() => {}}>
              <Text style={styles.adminButtonText}>Edit Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminButton} onPress={handleUploadDocument}>
              <Text style={styles.adminButtonText}>Upload Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminButton} onPress={handleAddBankAccount}>
              <Text style={styles.adminButtonText}>Add Bank Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminButton} onPress={handleAddEmergencyContact}>
              <Text style={styles.adminButtonText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Card
    topNavBackgroundColor="#f0f0f0"
    topNavContent={
      <View style={styles.header}>
          <>
          {pathname === '/employee-details' ? (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ): ''}
            <View style={styles.employeeHeaderInfo}>
              <Text style={styles.headerTitle}>
                {`${profile.firstName} ${profile.lastName}`}
              </Text>
              {employeeDetails?.employeeCode && (
                <Text style={styles.employeeCode}>
                  - {employeeDetails.employeeCode}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutContainer}>
                
                <Text style={styles.logoutText}>Logout</Text>
                <MaterialIcons name="logout" size={20} color="red" />
            </TouchableOpacity>
          </>
      </View>
    }
  >
    {renderProfileContent()}
  </Card>
  );
}