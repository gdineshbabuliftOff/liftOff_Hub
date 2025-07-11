import { Employee, EmployeeFormData } from '@/constants/interface'; // Ensure these are defined and exported
import { getLocalData } from '@/utils/localData';
import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { Href, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, Platform, RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { logoutUser } from '../Api/authentication';
import { fetchEmployeeProfile } from '../Api/userApi';
import Card from '../Layouts/Card';

import {
  resignationDate as apiResignationDate,
  deleteUser,
  deleteUserPermanently,
  disableEditRights,
  downloadAllDetails,
  downloadAllDocuments,
  enableEditRights,
  sendReminder,
  sendSignupMail,
} from '../Api/adminApi';

import { MENU_ACTIONS } from '@/constants/common';
import { JoineeTypes, Roles } from '@/constants/enums';
import { ENDPOINTS } from '@/utils/endPoints';
import { styles } from '../Styles/ProfileStyles';
import ProfileDetailsSection from './ProfileDetailsSection';
import ProfileModalsAndActions from './ProfileModalsAndActions';



const DASHBOARD_ROUTE = '/dashboard';

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

// Re-defining enums and types that were moved out, or import them from a shared constants/types file
type ParsedUserData = {
  userId: string;
  role: Roles;
  [key: string]: any;
};

type WebViewDocument = {
  documentTypeDisplay: string;
  url: string;
  name: string;
  documentGroup?: string;
};


interface WebViewModalProps {
  document: WebViewDocument;
  onClose: () => void;
  onDownload: (document: WebViewDocument) => void;
  isDownloading: boolean;
}

const WebViewModal: React.FC<WebViewModalProps> = ({ document, onClose, onDownload, isDownloading }) => {
  const [pdfLoadingWeb, setPdfLoadingWeb] = useState(false);
  const jumpAnimWeb = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnimWeb, { toValue: -10, duration: 400, useNativeDriver: true }),
        Animated.timing(jumpAnimWeb, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, [jumpAnimWeb]);

  return (
    <View style={{ flex: 1, backgroundColor: paletteV2.backgroundLight }}>
      <View style={styles.webviewHeader}>
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <MaterialIcons name="arrow-back" size={28} color={paletteV2.textPrimaryOnLight} />
        </TouchableOpacity>
        <Text style={styles.webviewTitle} numberOfLines={1} ellipsizeMode="tail">
          {document.documentTypeDisplay}
        </Text>
      </View>
      {pdfLoadingWeb && (
        <View style={styles.pdfLoaderContainer}>
          <ActivityIndicator size="large" color={paletteV2.primaryMain} />
        </View>
      )}
      <WebView
        source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(document.url)}` }}
        style={{ flex: 1, opacity: pdfLoadingWeb ? 0 : 1 }}
        originWhitelist={['*']}
        startInLoadingState={true}
        onLoadStart={() => setPdfLoadingWeb(true)}
        onLoadEnd={() => setPdfLoadingWeb(false)}
        onError={(syntheticEvent) => {
          setPdfLoadingWeb(false);
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          alert(`Error loading document: ${nativeEvent.description || nativeEvent.code}`);
        }}
      />
      <Animated.View style={[styles.downloadButton, { transform: [{ translateY: jumpAnimWeb }] }]}>
        <TouchableOpacity onPress={() => onDownload(document)} disabled={isDownloading}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={paletteV2.textPrimaryOnDark} />
          ) : (
            <MaterialIcons name="file-download" size={30} color={paletteV2.textPrimaryOnDark} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

interface TopNavigationBarProps {
    pathname: string;
    profile: any;
    employeeData: any;
    loggedInUserRole: Roles | null;
    employeeForMenu: Employee | null;
    onBackPress: () => void;
    onAdminMenuPress: () => void;
    onLogoutPress: () => void;
}

const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
    pathname,
    profile,
    employeeData,
    loggedInUserRole,
    employeeForMenu,
    onBackPress,
    onAdminMenuPress,
    onLogoutPress,
}) => (
    <View style={styles.headerBar}>
        {pathname === '/employee-details' ? (
            <TouchableOpacity onPress={onBackPress} style={styles.headerNavButton}>
                <MaterialIcons name="arrow-back" size={26} color={paletteV2.textPrimaryOnLight} />
            </TouchableOpacity>
        ) : <View style={styles.headerNavButton} />
        }
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText} numberOfLines={1} ellipsizeMode="tail">
                {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : 'Profile'}
            </Text>
            {profile && employeeData?.employeeCode && (
                <Text style={styles.headerSubtitleText} numberOfLines={1} ellipsizeMode="tail">
                    Emp ID: {employeeData.employeeCode}
                </Text>
            )}
        </View>
        <View style={styles.headerActions}>
            {pathname === '/employee-details' && loggedInUserRole === Roles.ADMIN && employeeForMenu && (
                <TouchableOpacity onPress={onAdminMenuPress} style={styles.headerNavButton}>
                    <MaterialCommunityIcons name="dots-vertical" size={26} color={paletteV2.textPrimaryOnLight} />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onLogoutPress} style={[styles.headerNavButton, styles.logoutButtonContainer]}>
                <MaterialIcons name="logout" size={22} color={paletteV2.errorMain} />
            </TouchableOpacity>
        </View>
    </View>
);

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<WebViewDocument | null>(null);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const [loggedInUserRole, setLoggedInUserRole] = useState<Roles | null>(null);
  const [currentProfileJoineeType, setCurrentProfileJoineeType] = useState<JoineeTypes | null>(null);
  const defaultImage = require('../../assets/images/newUser.png');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const [isAdminMenuVisible, setIsAdminMenuVisible] = useState(false);
  const [loadingActionProfile, setLoadingActionProfile] = useState<{ userId: string; action: string } | null>(null);
  const [isDeactivationModalVisibleProfile, setIsDeactivationModalVisibleProfile] = useState(false);
  const [isDeletePermanentlyModalVisibleProfile, setIsDeletePermanentlyModalVisibleProfile] = useState(false);
  const [resignationDateInputProfile, setResignationDateInputProfile] = useState('');
  const [employeeToProcessForAction, setEmployeeToProcessForAction] = useState<Employee | null>(null);

  const [isProfileFormVisible, setIsProfileFormVisible] = useState(false);
  const [editingProfileForForm, setEditingProfileForForm] = useState<Employee | null>(null);

  const [isProfilePicModalVisible, setIsProfilePicModalVisible] = useState<boolean>(false);

  const handleImageLoad = useCallback(() => { setImageLoading(false); setImageError(false); }, []);
  const handleImageError = useCallback(() => { setImageLoading(false); setImageError(true); }, []);

  const getEmployeeObjectFromProfile = useCallback((p: any): Employee | null => {
    if (!p) return null;
    const empDetails = p.employeeDetails || p.employee || {};
    return {
        userId: p.id,
        employeeCode: empDetails.employeeCode,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        designation: empDetails.designation,
        status: empDetails.status,
        joineeType: empDetails.joineeType as JoineeTypes,
        dateOfJoining: empDetails.dateOfJoining,
        editRights: p.editRights,
        photoUrl: p.photoUrl,
        allFieldsFilled: p.allFieldsFilled,
    } as Employee;
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setImageLoading(true);
      const localData = await getLocalData();
      const currentUserData: ParsedUserData = localData?.userData
        ? JSON.parse(localData.userData)
        : { userId: '', role: Roles.EMPLOYEE };
      
      setLoggedInUserRole(currentUserData?.role);
      let userIdToFetch: string | undefined;

      if (pathname === '/employee-details') {
        userIdToFetch = params.userId as string;
        if (!userIdToFetch || (currentUserData?.role !== Roles.ADMIN && currentUserData?.userId !== userIdToFetch)) {
          Toast.show({type: 'error', text1: 'Access Denied', text2: 'You do not have permission to view this profile.', position: 'bottom'});
          setProfile(null); setLoading(false); 
          return;
        }
      } else { 
        userIdToFetch = currentUserData?.userId; 
      }
      
      setTargetUserId(userIdToFetch || null);

      if (userIdToFetch) {
        const response = await fetchEmployeeProfile(userIdToFetch);
        setProfile(response);
        const fetchedJoineeType = response?.employeeDetails?.joineeType || null;
        setCurrentProfileJoineeType(fetchedJoineeType);
        if (!response?.photoUrl) {
            setImageLoading(false);
        }
      } else { 
        setProfile(null); 
        setImageLoading(false);
        Toast.show({type: 'error', text1: 'Error', text2: 'User ID not found.', position: 'bottom'});
      }
    } catch (error) { 
      console.error('Failed to fetch profile:', error); 
      setProfile(null);
      setImageLoading(false);
      Toast.show({type: 'error', text1: 'Profile Load Failed', text2: (error as Error).message || 'Could not fetch profile.', position: 'bottom'});
    } finally { 
      setLoading(false); 
    }
  }, [pathname, params.userId, router]);

  useEffect(() => { loadProfileData(); }, [loadProfileData]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const localdata = await getLocalData();
      const token = localdata?.token;
      if (token) await logoutUser(token);
      await AsyncStorage.clear();
      openURL(DASHBOARD_ROUTE.replace('/dashboard', '/login'));
    } catch (error) { 
      console.error('Logout failed:', error);
      Toast.show({type: 'error', text1: 'Logout Failed', text2: (error as Error).message || 'An unexpected error occurred.', position: 'bottom'});
    } finally { 
      setLoggingOut(false); 
    }
  };

  const handleViewDocument = useCallback((document: WebViewDocument) => setSelectedDocument(document), []);

  const downloadFile = useCallback(async (document: WebViewDocument) => {
    try {
      setDownloading(true);
      const fileName = document.name || `${(document.documentTypeDisplay || 'document').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const toastPosition = Platform.OS === 'ios' ? 'top' : 'bottom';
      Toast.show({ type: 'info', text1: 'Download Starting', text2: `Downloading ${fileName}...`, position: toastPosition });

      const baseDirectory = Platform.OS === 'ios' 
        ? FileSystem.documentDirectory 
        : FileSystem.cacheDirectory;

      const fileUri = baseDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(document.url, fileUri);

      if (!downloadResult || !downloadResult.uri) { 
        Toast.show({ type: 'error', text1: 'Download Failed', text2: 'Could not retrieve downloaded file URI.', position: toastPosition });
        setDownloading(false); return; 
      }

      if (Platform.OS === 'ios') {
        Toast.show({ type: 'success', text1: 'File Downloaded', text2: `Downloaded to: ${fileUri}`, position: toastPosition });
      } else {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) { 
          Toast.show({ type: 'warning', text1: 'Permission Denied', text2: 'Storage access permission is required to save the file.', position: toastPosition });
          setDownloading(false); return; 
        }
        
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: FileSystem.EncodingType.Base64 });
        const newFileUriInSharedStorage = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
        
        if (newFileUriInSharedStorage) {
          await FileSystem.writeAsStringAsync(newFileUriInSharedStorage, base64, { encoding: FileSystem.EncodingType.Base64 });
          Toast.show({ type: 'success', text1: 'File Saved', text2: `${fileName} saved successfully!`, position: toastPosition });
        } else { 
          Toast.show({ type: 'error', text1: 'Save Failed', text2: 'Could not create file in the selected directory.', position: toastPosition });
        }
      }
    } catch (error: any) { 
      console.error('Download error:', error); 
      Toast.show({ type: 'error', text1: 'Download Error', text2: error.message || 'An unexpected error occurred during download.', position: 'bottom' });
    } finally { 
      setDownloading(false); 
    }
  }, []);
  
  const handleSelfEditDetails = useCallback(() => {
    router.push({
      pathname: '/multiStepForm',
      params: { targetStep: '0' }
    });
  }, [router]);

  const executeProfileAction = useCallback(async (action: string, employeeForAction: Employee) => {
    if (!targetUserId || employeeForAction.userId?.toString() !== targetUserId) {
        Toast.show({ type: 'error', text1: 'Action Error', text2: 'User context mismatch.', position: 'bottom'});
        return;
    }
    setLoadingActionProfile({ userId: targetUserId, action });
    try {
        let successMessage = ''; let shouldRefetch = false;
        const userIdStr = targetUserId;

        switch (action) {
            case MENU_ACTIONS.REMINDER_EMAIL:
                await sendReminder({ email: employeeForAction.email, name: `${employeeForAction.firstName} ${employeeForAction.lastName}` });
                successMessage = 'Reminder Sent Successfully';
                break;
            case MENU_ACTIONS.TOGGLE_EDIT_RIGHTS:
                if (profile?.editRights) { await disableEditRights(userIdStr); successMessage = 'Edit Rights Disabled'; }
                else { await enableEditRights(userIdStr); successMessage = 'Edit Rights Enabled'; }
                shouldRefetch = true;
                break;
            case MENU_ACTIONS.DOWNLOAD_DETAILS:
                await downloadAllDetails({ userId: userIdStr, userName: `${employeeForAction.firstName} ${employeeForAction.lastName}` });
                successMessage = 'Details Download Initiated';
                break;
            case MENU_ACTIONS.DOWNLOAD_DOCUMENTS:
                await downloadAllDocuments({ userId: userIdStr, userName: `${employeeForAction.firstName} ${employeeForAction.lastName}` });
                successMessage = 'Documents Download Initiated';
                break;
            case MENU_ACTIONS.DELETE_USER:
                await deleteUser({ userId: userIdStr });
                successMessage = 'User Deactivated Successfully';
                shouldRefetch = true;
                break;
            case MENU_ACTIONS.DELETE_USER_PERMANENTLY:
                await deleteUserPermanently({ userId: userIdStr });
                successMessage = 'User Permanently Deleted';
                Toast.show({ type: 'success', text1: successMessage, text2: `Action completed for ${employeeForAction.firstName}.`, position: 'bottom' });
                router.replace(DASHBOARD_ROUTE as Href);
                return;
        }
        Toast.show({ type: 'success', text1: successMessage, text2: `Action completed for ${employeeForAction.firstName}.`, position: 'bottom' });
        if (shouldRefetch) { loadProfileData(); }
    } catch (error: any) {
        console.error(`Failed to ${action} for user ${targetUserId}:`, error);
        const actionText = action.replace(/([A-Z])/g, ' $1').trim();
        Toast.show({ type: 'error', text1: `${actionText} Failed`, text2: error.message || `Could not perform ${actionText.toLowerCase()}.`, position: 'bottom' });
    } finally {
        setLoadingActionProfile(null);
        setIsAdminMenuVisible(false);
    }
  }, [targetUserId, profile?.editRights, router, loadProfileData]);

  const handleOpenProfileEditForm = useCallback((employee: Employee | null) => {
    if (employee) {
      setEditingProfileForForm(employee);
      setIsProfileFormVisible(true);
      setIsAdminMenuVisible(false);
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Cannot edit profile, data missing.', position: 'bottom' });
    }
  }, []);

  const handleAdminProfileMenuAction = useCallback((action: string, employeeDataForAction: Employee | null) => {
    if (!employeeDataForAction) {
      Toast.show({type: 'error', text1: 'Error', text2: 'User data not available for action.', position: 'bottom'});
      setIsAdminMenuVisible(false);
      return;
    }
    setEmployeeToProcessForAction(employeeDataForAction); 

    if (action === MENU_ACTIONS.EDIT_USER) {
      handleOpenProfileEditForm(employeeDataForAction);
      return; 
    }
    
    setIsAdminMenuVisible(false);

    if (action === MENU_ACTIONS.DELETE_USER) {
      setResignationDateInputProfile('');
      setIsDeactivationModalVisibleProfile(true);
    } else if (action === MENU_ACTIONS.DELETE_USER_PERMANENTLY) {
      setIsDeletePermanentlyModalVisibleProfile(true);
    } else {
      executeProfileAction(action, employeeDataForAction);
    }
  }, [handleOpenProfileEditForm, executeProfileAction]);

  const handleProfileFormSubmit = useCallback(async (submittedFormData: EmployeeFormData, formMode: 'add' | 'edit', employeeIdToEdit?: string) => {
    if (formMode !== 'edit' || !targetUserId || !editingProfileForForm) {
      Toast.show({ type: 'error', text1: 'Submission Error', text2: 'Invalid form mode or missing user data.', position: 'bottom' });
      return;
    }
    
    const { 
        employeeCode = editingProfileForForm.employeeCode, 
        firstName, 
        lastName, 
        email, 
        designation, 
        status, 
        joineeType 
    } = submittedFormData;
    
    const dateOfJoiningValue = submittedFormData.dateOfJoining || editingProfileForForm.dateOfJoining || '';

    const apiEndPoint = `${ENDPOINTS.EDIT_RIGHTS}${targetUserId}/edit-details`;
    const apiMethod = 'PATCH';
    const permissions = (profile?.permissions as string[]) || [];

    try {
      await sendSignupMail(employeeCode, firstName, lastName, dateOfJoiningValue, email, designation, status, joineeType, apiEndPoint, apiMethod, permissions);
      Toast.show({ type: 'success', text1: 'Profile Updated', text2: `${firstName} ${lastName}'s profile has been successfully updated.`, position: 'bottom' });
      setIsProfileFormVisible(false);
      setEditingProfileForForm(null);
      loadProfileData();
    } catch (err: any) {
      console.error(`Failed to update employee (ProfileScreen):`, err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Could not update profile. Please try again.';
      Toast.show({ type: 'error', text1: 'Update Failed', text2: errorMessage, position: 'bottom'});
    }
  }, [targetUserId, editingProfileForForm, profile?.permissions, loadProfileData]);


  const handleConfirmDeactivationProfile = useCallback(async () => {
    if (!employeeToProcessForAction || !targetUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Required data missing for deactivation.', position: 'bottom' });
        return;
    }
    setLoadingActionProfile({ userId: targetUserId, action: MENU_ACTIONS.DELETE_USER });
    
    if (!resignationDateInputProfile.trim()) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Resignation date is required.', position: 'bottom' });
        setLoadingActionProfile(null); return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(resignationDateInputProfile)) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Invalid date format. Use YYYY-MM-DD.', position: 'bottom' });
        setLoadingActionProfile(null); return;
    }

    try {
        await apiResignationDate(targetUserId, resignationDateInputProfile);
        await executeProfileAction(MENU_ACTIONS.DELETE_USER, employeeToProcessForAction);
    } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Deactivation Error', text2: error.message || 'Could not set resignation date or deactivate user.', position: 'bottom' });
        setLoadingActionProfile(null);
    } finally {
        setIsDeactivationModalVisibleProfile(false);
        setResignationDateInputProfile('');
    }
  }, [employeeToProcessForAction, targetUserId, resignationDateInputProfile, executeProfileAction]);

  const handleConfirmPermanentDeleteProfile = useCallback(async () => {
    if (!employeeToProcessForAction || !targetUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Required data missing for permanent deletion.', position: 'bottom' });
        return;
    }
    setIsDeletePermanentlyModalVisibleProfile(false);
    await executeProfileAction(MENU_ACTIONS.DELETE_USER_PERMANENTLY, employeeToProcessForAction);
  }, [employeeToProcessForAction, targetUserId, executeProfileAction]);

  const handleCancelModalProfile = useCallback(() => {
    setIsDeactivationModalVisibleProfile(false);
    setIsDeletePermanentlyModalVisibleProfile(false);
    setResignationDateInputProfile('');
    setEmployeeToProcessForAction(null);
    setLoadingActionProfile(null);
  }, []);

  if (loading || loggingOut) { 
    return ( 
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={paletteV2.primaryMain} />
        <Text style={{marginTop:10, color:paletteV2.textSecondaryOnLight}}>
          {loggingOut ? 'Logging out...' : 'Loading profile...'}
        </Text>
      </View> 
    ); 
  }

  if (!profile) { 
    return ( 
      <View style={styles.loaderContainer}>
        <MaterialIcons name="error-outline" size={60} color={paletteV2.errorMain} />
        <Text style={styles.errorText}>Failed to load profile information.</Text>
        <TouchableOpacity onPress={loadProfileData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View> 
    ); 
  }
  
  if (selectedDocument) {
    return (
      <WebViewModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onDownload={downloadFile}
        isDownloading={downloading}
      />
    );
  }

  const employeeData = profile?.employeeDetails || profile?.employee || {};
  const employeeForMenu = getEmployeeObjectFromProfile(profile);
  
  return (
    <Card
      topNavBackgroundColor={paletteV2.surface}
      topNavContent={
        <TopNavigationBar
            pathname={pathname}
            profile={profile}
            employeeData={employeeData}
            loggedInUserRole={loggedInUserRole}
            employeeForMenu={employeeForMenu}
            onBackPress={() => router.replace(DASHBOARD_ROUTE as Href)}
            onAdminMenuPress={() => setIsAdminMenuVisible(true)}
            onLogoutPress={handleLogout}
        />
      }
      fullHeight={pathname === '/employee-details'}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        refreshControl={ 
          <RefreshControl 
            refreshing={loading && !loggingOut && !profile}
            onRefresh={loadProfileData} 
            colors={[paletteV2.primaryMain]} 
            tintColor={paletteV2.primaryMain} 
          /> 
        }
      >
        <ProfileDetailsSection
          profile={profile}
          employeeData={employeeData}
          pathname={pathname}
          loggedInUserRole={loggedInUserRole}
          currentProfileJoineeType={currentProfileJoineeType}
          defaultImage={defaultImage}
          imageLoading={imageLoading}
          imageError={imageError}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          handleSelfEditDetails={handleSelfEditDetails}
          handleViewDocument={handleViewDocument}
          setIsProfilePicModalVisible={setIsProfilePicModalVisible}
        />
      </ScrollView>

      <ProfileModalsAndActions
        loggedInUserRole={loggedInUserRole}
        employeeForMenu={employeeForMenu}
        isAdminMenuVisible={isAdminMenuVisible}
        setIsAdminMenuVisible={setIsAdminMenuVisible}
        loadingActionProfile={loadingActionProfile}
        isDeactivationModalVisibleProfile={isDeactivationModalVisibleProfile}
        setIsDeactivationModalVisibleProfile={setIsDeactivationModalVisibleProfile}
        isDeletePermanentlyModalVisibleProfile={isDeletePermanentlyModalVisibleProfile}
        setIsDeletePermanentlyModalVisibleProfile={setIsDeletePermanentlyModalVisibleProfile}
        resignationDateInputProfile={resignationDateInputProfile}
        setResignationDateInputProfile={setResignationDateInputProfile}
        employeeToProcessForAction={employeeToProcessForAction}
        handleAdminProfileMenuAction={handleAdminProfileMenuAction}
        handleConfirmDeactivationProfile={handleConfirmDeactivationProfile}
        handleConfirmPermanentDeleteProfile={handleConfirmPermanentDeleteProfile}
        handleCancelModalProfile={handleCancelModalProfile}
        isProfileFormVisible={isProfileFormVisible}
        setIsProfileFormVisible={setIsProfileFormVisible}
        editingProfileForForm={editingProfileForForm}
        setEditingProfileForForm={setEditingProfileForForm}
        handleProfileFormSubmit={handleProfileFormSubmit}
        isProfilePicModalVisible={isProfilePicModalVisible}
        setIsProfilePicModalVisible={setIsProfilePicModalVisible}
        profilePhotoUrl={profile.photoUrl}
        defaultImage={defaultImage}
        targetUserId={targetUserId}
      />
    </Card>
  );
}