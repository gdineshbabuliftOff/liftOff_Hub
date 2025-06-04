import { formatDateFull } from '@/constants/common';
import { getLocalData } from '@/utils/localData';
import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { Href, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageSourcePropType,
  Modal as ReactNativeModal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { logoutUser } from '../Api/authentication';
import { fetchEmployeeProfile } from '../Api/userApi';
import ProfilePictureModal from '../Dashboard/ProfilePictureModal';
import Card from '../Layouts/Card';


const DASHBOARD_ROUTE = '/dashboard';

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
import { Employee, EmployeeFormData } from '@/constants/interface';
import { ENDPOINTS } from '@/utils/endPoints';
import DeactivationModal from '../Dashboard/DeactivationModal';
import DeletePermanentlyModal from '../Dashboard/DeletePermanentlyModal';
import EmployeeActionMenu from '../Dashboard/EmployeeActions';
import EmployeeForm from '../Dashboard/EmployeeForm';
import { styles } from '../Styles/ProfileStyles';

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
  aadharCard = 'Aadhar Card',
  panCard = 'PAN Card',
  tenthMarksCard = '10th Marks Card',
  twelthMarksCard = '12th Marks Card',
  bachelorsOrHigherDegree = 'Bachelors/Higher Degree',
  last3MonthsPayslips = 'Last 3 Months Payslips',
  last3OrgRelievingOfferLetter = 'Last Org. Relieving/Offer Letter',
  fullAndFinalSettlement = 'Full and Final Settlement',
  agreement = 'Agreement',
}

type ParsedUserData = {
  userId: string;
  role: Roles;
  [key: string]: any;
};

type ApiDocumentDetail = {
  documentGroup: string;
  name: string;
  documentType: string;
  url: string;
};

type WebViewDocument = {
  documentTypeDisplay: string;
  url: string;
  name: string;
  documentGroup?: string;
};

const EXPERIENCE_SPECIFIC_DOCS: string[] = [
  DetailsCard.last3MonthsPayslips,
  DetailsCard.last3OrgRelievingOfferLetter,
  DetailsCard.fullAndFinalSettlement,
];

type ContactType = {
  name: string;
  phoneNumber: string;
  relationship?: string;
};


const shouldShowDocumentsSectionOriginal = (pathname: string, userRole: Roles | null) => {
  return (pathname === '/profile' && (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR)) ||
    (pathname === '/employee-details' && userRole === Roles.ADMIN);
};

const shouldShowBankDetailsOriginal = (userRole: Roles | null, currentJoineeType: JoineeTypes | null, pathname: string) => {
  return (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR || pathname === '/employee-details') &&
    (currentJoineeType === JoineeTypes.NEW || pathname === '/employee-details');
};

interface DetailItemProps {
  label: string;
  value?: string | number | null;
  fullWidth?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, fullWidth = false }) => (
  <View style={[styles.fieldContainer, fullWidth && styles.fieldContainerFullWidth]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>
      {value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : 'N/A'}
    </Text>
  </View>
);

interface DetailRowProps {
  children: React.ReactElement<DetailItemProps> | React.ReactElement<DetailItemProps>[];
}

const DetailRow: React.FC<DetailRowProps> = ({ children }) => (
  <View style={styles.row}>
    {React.Children.map(children, (child) => (
      <View style={[styles.column, React.Children.count(children) === 1 && styles.fullColumn]}>
        {child}
      </View>
    ))}
  </View>
);

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface ProfileHeaderProps {
  photoUrl?: string;
  defaultImage: ImageSourcePropType;
  imageLoading: boolean;
  imageError: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  showEditButton: boolean;
  onEditPress: () => void;
  onAvatarPress?: () => void;
}

const ProfileHeaderComponent: React.FC<ProfileHeaderProps> = ({
  photoUrl,
  defaultImage,
  imageLoading,
  imageError,
  onImageLoad,
  onImageError,
  showEditButton,
  onEditPress,
  onAvatarPress,
}) => (
  <View style={styles.profileHeaderMain}>
    <TouchableOpacity onPress={onAvatarPress} disabled={!onAvatarPress}>
      <View style={styles.avatarContainer}>
        {imageLoading && !imageError && photoUrl && (
          <ActivityIndicator size="small" color={paletteV2.primaryMain} style={styles.imageLoader} />
        )}
        <Image
          source={imageError || !photoUrl ? defaultImage : { uri: photoUrl }}
          style={styles.avatar}
          onLoad={onImageLoad}
          onError={onImageError}
        />
      </View>
    </TouchableOpacity>
    {showEditButton && (
      <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
        <MaterialIcons name="edit" size={18} color={paletteV2.textPrimaryOnDark} style={{ marginRight: 8 }} />
        <Text style={styles.actionButtonText}>Edit My Details</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface DocumentItemProps {
  documentDisplayLabel: string;
  docFromApi?: ApiDocumentDetail;
  onViewDocument: (doc: WebViewDocument) => void;
}

const DocumentItemComponent: React.FC<DocumentItemProps> = ({ documentDisplayLabel, docFromApi, onViewDocument }) => (
  <View style={styles.documentItem}>
    <MaterialIcons name="description" size={24} color={paletteV2.primaryMain} />
    <Text style={styles.documentName}>{documentDisplayLabel}</Text>
    {docFromApi?.url ? (
      <TouchableOpacity
        onPress={() => onViewDocument({
          url: docFromApi.url,
          name: docFromApi.name,
          documentTypeDisplay: documentDisplayLabel,
          documentGroup: docFromApi.documentGroup,
        })}
        style={styles.viewButton}
      >
        <Text style={styles.viewButtonText}>View</Text>
        <MaterialIcons name="visibility" size={16} color={paletteV2.primaryDark} style={{ marginLeft: 5 }} />
      </TouchableOpacity>
    ) : (
      <View style={styles.pendingTag}>
        <Text style={styles.pendingTagText}>Pending</Text>
      </View>
    )}
  </View>
);


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

  const handleImageLoad = () => { setImageLoading(false); setImageError(false); };
  const handleImageError = () => { setImageLoading(false); setImageError(true); };

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

  const handleViewDocument = (document: WebViewDocument) => setSelectedDocument(document);

  const downloadFile = async (document: WebViewDocument) => {
    try {
      setDownloading(true);
      const fileName = document.name || `${(document.documentTypeDisplay || 'document').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      Toast.show({ type: 'info', text1: 'Download Starting', text2: `Downloading ${fileName}...`, position: 'bottom' });

      const downloadResult = await FileSystem.downloadAsync(document.url, fileUri);

      if (!downloadResult || !downloadResult.uri) { 
        Toast.show({ type: 'error', text1: 'Download Failed', text2: 'Could not retrieve downloaded file URI.', position: 'bottom' });
        setDownloading(false); return; 
      }

      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) { 
        Toast.show({ type: 'warning', text1: 'Permission Denied', text2: 'Storage access permission is required to save the file.', position: 'bottom' });
        setDownloading(false); return; 
      }
      
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: FileSystem.EncodingType.Base64 });
      const newFileUriInSharedStorage = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
      
      if (newFileUriInSharedStorage) {
        await FileSystem.writeAsStringAsync(newFileUriInSharedStorage, base64, { encoding: FileSystem.EncodingType.Base64 });
        Toast.show({ type: 'success', text1: 'File Saved', text2: `${fileName} saved successfully!`, position: 'bottom' });
      } else { 
        Toast.show({ type: 'error', text1: 'Save Failed', text2: 'Could not create file in the selected directory.', position: 'bottom' });
      }
    } catch (error: any) { 
      console.error('Download error:', error); 
      Toast.show({ type: 'error', text1: 'Download Error', text2: error.message || 'An unexpected error occurred during download.', position: 'bottom' });
    } finally { 
      setDownloading(false); 
    }
  };
  
  const handleSelfEditDetails = () => {
    const employeeForForm = getEmployeeObjectFromProfile(profile);
    if (employeeForForm) {
        setEditingProfileForForm(employeeForForm);
        setIsProfileFormVisible(true);
    } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Profile data not available for editing.', position: 'bottom' });
    }
  };

  const executeProfileAction = async (action: string, employeeForAction: Employee) => {
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
  };

  const handleOpenProfileEditForm = (employee: Employee | null) => {
    if (employee) {
      setEditingProfileForForm(employee);
      setIsProfileFormVisible(true);
      setIsAdminMenuVisible(false);
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Cannot edit profile, data missing.', position: 'bottom' });
    }
  };

  const handleAdminProfileMenuAction = (action: string, employeeDataForAction: Employee | null) => {
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
  };

  const handleProfileFormSubmit = async (submittedFormData: EmployeeFormData, formMode: 'add' | 'edit', employeeIdToEdit?: string) => {
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
  };


  const handleConfirmDeactivationProfile = async () => {
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
  };

  const handleConfirmPermanentDeleteProfile = async () => {
    if (!employeeToProcessForAction || !targetUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Required data missing for permanent deletion.', position: 'bottom' });
        return;
    }
    setIsDeletePermanentlyModalVisibleProfile(false);
    await executeProfileAction(MENU_ACTIONS.DELETE_USER_PERMANENTLY, employeeToProcessForAction);
  };

  const handleCancelModalProfile = () => {
    setIsDeactivationModalVisibleProfile(false);
    setIsDeletePermanentlyModalVisibleProfile(false);
    setResignationDateInputProfile('');
    setEmployeeToProcessForAction(null);
    setLoadingActionProfile(null);
  };

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

  const { photoUrl, bankAccount } = profile;
  const employeeData = profile?.employeeDetails || profile?.employee || {};
  const employeeForMenu = getEmployeeObjectFromProfile(profile);
  
  const canShowSensitiveDataForRoleAndPath = 
    (pathname === '/profile' && (loggedInUserRole === Roles.EMPLOYEE || loggedInUserRole === Roles.EDITOR)) ||
    (pathname === '/employee-details' && loggedInUserRole === Roles.ADMIN);

  const canShowSensitiveJoineeType = currentProfileJoineeType === JoineeTypes.NEW;

  const showDocuments = shouldShowDocumentsSectionOriginal(pathname, loggedInUserRole) &&
                       (canShowSensitiveJoineeType || pathname === '/employee-details');

  const showBankDetails = shouldShowBankDetailsOriginal(loggedInUserRole, currentProfileJoineeType, pathname);
  

  const renderProfileContent = () => {
    return (
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
        <ProfileSection title="Employee Details">
          <ProfileHeaderComponent
            photoUrl={photoUrl}
            defaultImage={defaultImage}
            imageLoading={imageLoading}
            imageError={imageError}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            showEditButton={pathname === '/profile' && profile?.editRights === true}
            onEditPress={handleSelfEditDetails}
            onAvatarPress={() => {
              if (photoUrl || !imageError) {
                setIsProfilePicModalVisible(true);
              }
            }}
          />
          <DetailRow><DetailItem label="Email" value={profile?.email} fullWidth /></DetailRow>
          <DetailRow>
            <DetailItem label="DOB" value={formatDateFull(profile?.dateOfBirth)} />
            <DetailItem label="Gender" value={profile?.gender} />
          </DetailRow>
          <DetailRow>
            <DetailItem label="Blood Group" value={profile?.bloodGroup} />
            <DetailItem label="Phone" value={profile?.phone} />
          </DetailRow>
           <DetailRow>
            <DetailItem label="Father Name" value={profile?.fatherName} />
            <DetailItem label="Designation" value={employeeData?.designation} />
          </DetailRow>
          <DetailRow>
            <DetailItem label="DOJ" value={formatDateFull(employeeData?.dateOfJoining)} />
            <DetailItem label="UAN" value={employeeData?.uan} />
          </DetailRow>
          <DetailRow>
            <DetailItem label="PAN" value={employeeData?.pan} />
            <DetailItem label="Aadhar" value={employeeData?.aadhar} />
          </DetailRow>
          <DetailRow><DetailItem label="Current Address" value={profile?.currentAddress} fullWidth /></DetailRow>
          <DetailRow><DetailItem label="Permanent Address" value={profile?.permanentAddress} fullWidth /></DetailRow>
          <DetailRow><DetailItem label="About You" value={profile?.bio} fullWidth /></DetailRow>
        </ProfileSection>

        <ProfileSection title="Emergency Contacts">
          {Array.isArray(employeeData?.contacts) && employeeData.contacts.length > 0 ? ( 
            employeeData.contacts.map((contact: ContactType, index: number) => {
              const isLastItem = index === employeeData.contacts.length - 1;
              return (
                <View 
                    key={index} 
                    style={[
                        styles.contactItemContainer, 
                        isLastItem && styles.lastContactItemContainer
                    ]}
                >
                  <DetailRow>
                    <DetailItem label="Name" value={contact.name} />
                    <DetailItem label="Phone" value={contact.phoneNumber} />
                  </DetailRow>
                </View> 
              );
            }) 
          ) : ( <Text style={styles.noDataText}>No emergency contacts available.</Text> )}
        </ProfileSection>
        
        {showDocuments && (
          <ProfileSection title="Documents">
            {Object.keys(DetailsCard).map((enumKey) => {
              const documentDisplayLabel = DetailsCard[enumKey as keyof typeof DetailsCard];
              const apiDocKey = enumKey;
              const docFromApi = profile?.documents?.[apiDocKey] as ApiDocumentDetail | undefined;
              
              if (EXPERIENCE_SPECIFIC_DOCS.includes(documentDisplayLabel)) {
                if (employeeData?.status !== 'Experienced') {
                  return null; 
                }
              }
              return (
                <DocumentItemComponent
                  key={apiDocKey}
                  documentDisplayLabel={documentDisplayLabel}
                  docFromApi={docFromApi}
                  onViewDocument={handleViewDocument}
                />
              );
            })}
          </ProfileSection>
        )}

        {showBankDetails && (
          <ProfileSection title="Bank Details">
            {bankAccount ? ( 
              <>
                <DetailRow>
                  <DetailItem label="Account Holder Name" value={bankAccount.name} />
                  <DetailItem label="Bank Name" value={bankAccount.bankName}/>
                </DetailRow>
                <DetailRow>
                  <DetailItem label="Account Number" value={bankAccount.accountNumber} />
                  <DetailItem label="IFSC Code" value={bankAccount.ifscCode}/>
                </DetailRow>
                <DetailRow>
                  <DetailItem label="Branch Name" value={bankAccount.branchName} fullWidth/>
                </DetailRow>
              </> 
            ) : ( <Text style={styles.noDataText}>No bank details available.</Text> )}
          </ProfileSection>
        )}
      </ScrollView>
    );
  };

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
      {renderProfileContent()}

      {loggedInUserRole === Roles.ADMIN && employeeForMenu && (
         <ReactNativeModal 
            animationType="fade" 
            transparent={true} 
            visible={isAdminMenuVisible} 
            onRequestClose={() => setIsAdminMenuVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay_Profile} 
              activeOpacity={1} 
              onPressOut={() => setIsAdminMenuVisible(false)}
            >
                <View style={styles.adminMenuOuterContainer_Profile} onStartShouldSetResponder={() => true}> 
                    <EmployeeActionMenu 
                        employee={employeeForMenu}
                        isVisible={isAdminMenuVisible}
                        onAction={handleAdminProfileMenuAction}
                        loadingAction={loadingActionProfile ? {userId: parseInt(loadingActionProfile.userId || '0' ,10), action: loadingActionProfile.action} : null}
                    />
                </View>
            </TouchableOpacity>
        </ReactNativeModal>
      )}

      <DeactivationModal
        isVisible={isDeactivationModalVisibleProfile}
        employee={employeeToProcessForAction}
        onConfirm={handleConfirmDeactivationProfile}
        onCancel={handleCancelModalProfile}
        isLoading={loadingActionProfile?.action === MENU_ACTIONS.DELETE_USER && loadingActionProfile?.userId === targetUserId}
        resignationDate={resignationDateInputProfile}
        onResignationDateChange={setResignationDateInputProfile}
       />

      <DeletePermanentlyModal
        isVisible={isDeletePermanentlyModalVisibleProfile}
        employee={employeeToProcessForAction}
        onConfirm={handleConfirmPermanentDeleteProfile}
        onCancel={handleCancelModalProfile}
        isLoading={loadingActionProfile?.action === MENU_ACTIONS.DELETE_USER_PERMANENTLY && loadingActionProfile?.userId === targetUserId}
      />
      
      <EmployeeForm
        isVisible={isProfileFormVisible}
        mode="edit"
        employeeToEdit={editingProfileForForm}
        onSubmit={(formData, mode) => handleProfileFormSubmit(formData, mode, editingProfileForForm?.userId?.toString())}
        onClose={() => {
          setIsProfileFormVisible(false);
          setEditingProfileForForm(null);
        }}
      />

      <ProfilePictureModal
        isVisible={isProfilePicModalVisible}
        imageUrl={photoUrl || null}
        defaultImage={defaultImage}
        onClose={() => setIsProfilePicModalVisible(false)}
      />
    </Card>
  );
}