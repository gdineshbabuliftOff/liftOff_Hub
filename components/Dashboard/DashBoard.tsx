import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as yup from 'yup';
import {
  deleteUser,
  deleteUserPermanently,
  disableEditRights,
  downloadAllDetails,
  enableEditRights,
  fetchEmployeesData,
  resignationDate, // Imported the new API function
  sendReminder,
  sendSignupMail
} from '../Api/adminApi';
import Card from '../Layouts/Card';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { ENDPOINTS } from '@/utils/endPoints';
import Toast from 'react-native-toast-message';

const defaultImage = require('../../assets/images/newUser.png');


interface Employee {
  userId: number;
  firstName: string;
  lastName:string;
  email: string;
  employeeCode: string;
  status: string;
  designation?: string;
  dateOfJoining?: string;
  photoUrl?: string;
  editRights: boolean;
  joineeType?: string;
  allFieldsFilled?: boolean;
}

interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfJoining: string;
  email: string;
  designation: string;
  status: 'Fresher' | 'Experienced' | string;
  joineeType: 'NEW' | 'EXISTING';
}

const initialFormData: EmployeeFormData = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  dateOfJoining: '',
  email: '',
  designation: '',
  status: 'Fresher',
  joineeType: 'NEW',
};

interface FormErrors {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfJoining?: string;
  email?: string;
  designation?: string;
  status?: string;
  joineeType?: string;
  general?: string;
}

const employeeFormSchema = yup.object().shape({
  employeeCode: yup
    .string()
    .required('Employee Code is required.')
    .matches(/^U\d{3}$/, "Code must be 'U' followed by 3 digits (e.g., U001)."),
  firstName: yup.string().required('First Name is required.').min(2, 'First Name is too short.'),
  lastName: yup.string().required('Last Name is required.').min(2, 'Last Name is too short.'),
  email: yup
    .string()
    .email('Invalid email format.')
    .required('Email is required.')
    .test('domain', 'Email must end with @liftoffllc.com', (value) =>
      value ? value.toLowerCase().endsWith('@liftoffllc.com') : false
    ),
  dateOfJoining: yup
    .date()
    .required('Date of Joining is required.')
    .max(new Date(), 'Date of Joining cannot be in the future.')
    .typeError('Invalid date (YYYY-MM-DD).'),
  designation: yup.string().required('Designation is required.'),
  status: yup.string().oneOf(['Fresher', 'Experienced'], 'Invalid status.').required('Status is required.'),
  joineeType: yup.string().oneOf(['NEW', 'EXISTING'], 'Invalid joinee type.').required('Joinee Type is required.'),
});


interface EmployeesApiResponse {
  data: Employee[];
  total: number;
}

const SORTABLE_FIELDS = [
  { key: 'userId', label: 'ID' },
  { key: 'email', label: 'Email' },
  { key: 'firstName', label: 'Name' },
  { key: 'dateOfJoining', label: 'Joined' },
];

const DEFAULT_LIMIT = 100;
const ITEMS_PER_PAGE_OPTIONS = [100, 200, 500];

const MENU_ACTIONS = {
  REMINDER_EMAIL: 'Send Reminder',
  TOGGLE_EDIT_RIGHTS: 'Toggle Edit Rights',
  DOWNLOAD_DETAILS: 'Download Details',
  DOWNLOAD_DOCUMENTS: 'Download Documents',
  EDIT_USER: 'Edit User',
  DELETE_USER: 'Deactivate User',
  DELETE_USER_PERMANENTLY: 'Delete User Permanently',
};

const MENU_ACTION_ICONS: { [key: string]: string } = {
  [MENU_ACTIONS.REMINDER_EMAIL]: 'email-send-outline',
  [MENU_ACTIONS.TOGGLE_EDIT_RIGHTS]: 'account-edit-outline',
  [MENU_ACTIONS.DOWNLOAD_DETAILS]: 'download-circle-outline',
  [MENU_ACTIONS.DOWNLOAD_DOCUMENTS]: 'folder-download-outline',
  [MENU_ACTIONS.EDIT_USER]: 'account-cog-outline',
  [MENU_ACTIONS.DELETE_USER]: 'account-cancel-outline',
  [MENU_ACTIONS.DELETE_USER_PERMANENTLY]: 'trash-can-outline',
};

const ALL_MENU_ITEMS_ORDERED = [
  MENU_ACTIONS.REMINDER_EMAIL,
  MENU_ACTIONS.TOGGLE_EDIT_RIGHTS,
  MENU_ACTIONS.DOWNLOAD_DETAILS,
  MENU_ACTIONS.DOWNLOAD_DOCUMENTS,
  MENU_ACTIONS.EDIT_USER,
  MENU_ACTIONS.DELETE_USER,
  MENU_ACTIONS.DELETE_USER_PERMANENTLY,
];

const paletteV2 = {
  primaryDark: '#004A3F',
  primaryMain: '#00796B',
  primaryLight: '#4DB6AC',
  primaryLighter: '#A7D8D4',
  primaryUltraLight: '#E0F2F1',

  accentMain: '#FF7043',
  accentLight: '#FFAB91',

  gradientPrimaryButton: ['#00796B', '#00645A'] as const,
  gradientAccentButton: ['#00897B', '#00695C'] as const,
  gradientDisabled: ['#B0BEC5', '#9E9E9E'] as const,
  
  neutralDarker: '#1B2B34',
  neutralDark: '#344955',
  neutralMedium: '#566573',
  neutralLight: '#90A4AE',
  neutralExtraLight: '#D4D8DC',
  neutralUltraLight: '#F5F7F8',

  iconDefault: '#566573',  

  backgroundPage: '#E9EFF3',
  surfaceNav: '#FFFFFF',    
  surfaceCard: '#FFFFFF',        
  
  errorMain: '#E53935',      
  errorLight: '#FFEBEE',    
  successMain: '#388E3C',
  successLight: '#E8F5E9',  
  warningMain: '#FFB300',  
  warningLight: '#FFFDE7',

  textPrimaryOnLight: '#1B2B34',  
  textSecondaryOnLight: '#566573',  
  textPlaceholderOnLight: '#90A4AE',  

  textPrimaryOnDark: '#FFFFFF',  
  textSecondaryOnDark: '#E0E0E0',  

  borderFocus: '#00796B',
  borderDefault: '#CFD8DC',
  borderLight: '#E0E0E0',
};


const DashboardScreen = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sort, setSort] = useState('userId');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [menuVisibleFor, setMenuVisibleFor] = useState<number | null>(null);
  const [loadingAction, setLoadingAction] = useState<{ userId: number; action: string } | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isExistingJoinee, setIsExistingJoinee] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleteActionType, setDeleteActionType] = useState<string | null>(null);
  const [resignationDateInput, setResignationDateInput] = useState(''); // State for resignation date


  const paginationOpacity = useRef(new Animated.Value(0)).current;
  const paginationTranslateY = useRef(new Animated.Value(20)).current;

  const closeMenu = useCallback(() => {
    if (menuVisibleFor !== null) {
      setMenuVisibleFor(null);
    }
  }, [menuVisibleFor]);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader && !isRefreshing && !formSubmitting) setIsLoading(true);
    if (isRefreshing) {
      setSearchTerm('');
      setSearchInput('');
      setCurrentPage(1);
    }
    try {
      const response = (await fetchEmployeesData(
        currentPage,
        searchTerm,
        limit,
        sort,
        direction,
      )) as EmployeesApiResponse;
      setEmployees(response?.data || []);
      setTotalEmployees(response?.total || 0);
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      Toast.show({type: 'error', text1: 'Fetch Failed', text2: 'Could not load employee data.', position: 'bottom'})
    } finally {
      if (showLoader && !isRefreshing && !formSubmitting) setIsLoading(false);
      if (isRefreshing) setIsRefreshing(false);
    }
  }, [currentPage, searchTerm, limit, sort, direction, isRefreshing, formSubmitting]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Animated.timing(paginationOpacity, {
      toValue: totalEmployees > limit ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(paginationTranslateY, {
      toValue: totalEmployees > limit ? 0 : 20,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [totalEmployees, limit, paginationOpacity, paginationTranslateY]);

  const totalPages = Math.ceil(totalEmployees / limit);

  const handleSortToggle = (fieldKey: string) => {
    if (sort === fieldKey) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(fieldKey);
      setDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput.trim());
    setShowSortOptions(false);
    closeMenu();
    Keyboard.dismiss();
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    setShowPerPageDropdown(false);
    closeMenu();
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    closeMenu();
  }, [closeMenu]);

    useEffect(() => {
    if (isRefreshing) {
      fetchData(false);
    }
  }, [isRefreshing, fetchData]);

  const handleMenuToggle = (userId: number) => {
    if (loadingAction && loadingAction.userId === userId && menuVisibleFor !== userId) return;
    setMenuVisibleFor((prev) => (prev === userId ? null : userId));
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setFormData(initialFormData);
    setIsExistingJoinee(false);
    setEditingEmployee(null);
    setFormErrors({});
    setIsFormVisible(true);
    closeMenu();
  };

  const handleOpenEditForm = (employee: Employee) => {
    setFormMode('edit');
    setEditingEmployee(employee);
    setFormData({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      dateOfJoining: employee.dateOfJoining || '',
      email: employee.email,
      designation: employee.designation || '',
      status: employee.status as 'Fresher' | 'Experienced',
      joineeType: (employee.joineeType || 'NEW') as 'NEW' | 'EXISTING',
    });
    const isExisting = employee.joineeType === 'EXISTING';
    setIsExistingJoinee(isExisting);
    if (isExisting) {
        setFormData(prev => ({...prev, status: 'Experienced'}));
    }
    setFormErrors({});
    setIsFormVisible(true);
    closeMenu();
  };
  

  const handleMenuAction = async (action: string, employee: Employee) => {
    const ASYNC_ACTIONS_WITH_LOADER = [
      MENU_ACTIONS.REMINDER_EMAIL,
      MENU_ACTIONS.TOGGLE_EDIT_RIGHTS,
      MENU_ACTIONS.DOWNLOAD_DETAILS,
      MENU_ACTIONS.DELETE_USER,
      MENU_ACTIONS.DELETE_USER_PERMANENTLY,
    ];

    if (action === MENU_ACTIONS.EDIT_USER) {
      handleOpenEditForm(employee);
      return;
    }

    if (ASYNC_ACTIONS_WITH_LOADER.includes(action)) {
      if (loadingAction?.userId === employee.userId && loadingAction?.action === action) return;
      
      if (action === MENU_ACTIONS.DELETE_USER || action === MENU_ACTIONS.DELETE_USER_PERMANENTLY) {
        setEmployeeToDelete(employee);
        setDeleteActionType(action);
        if (action === MENU_ACTIONS.DELETE_USER) {
            setResignationDateInput(''); // Clear previous date for new deactivation
        }
        setIsDeleteConfirmVisible(true);
        closeMenu();
      } else {
        setLoadingAction({ userId: employee.userId, action });
        await executeAsyncAction(action, employee);
      }
    } else {
      if (action === MENU_ACTIONS.DOWNLOAD_DOCUMENTS) {
        Toast.show({type: 'info', text1: 'Download Documents', text2: `Preparing documents for ${employee.firstName}...`, position: 'bottom'});
      }
      closeMenu();
    }
  };

  const executeAsyncAction = async (action: string, employee: Employee) => {
    // Note: setLoadingAction should be managed by the caller (handleConfirmDelete) if multiple steps are involved before this.
    // However, for single actions, this function will set its own loadingAction and clear it.
    // If called from handleConfirmDelete for DELETE_USER, setLoadingAction is already set.
    if (!(loadingAction && loadingAction.userId === employee.userId && loadingAction.action === action)) {
        setLoadingAction({ userId: employee.userId, action });
    }

    try {
      let successMessage = '';
      let shouldRefetch = false;

      switch (action) {
        case MENU_ACTIONS.REMINDER_EMAIL:
          await sendReminder({ email: employee.email, name: `${employee.firstName} ${employee.lastName}` });
          successMessage = 'Reminder Sent Successfully';
          break;
        case MENU_ACTIONS.TOGGLE_EDIT_RIGHTS:
          if (employee.editRights) {
            await disableEditRights(employee.userId.toString());
            successMessage = 'Edit Rights Disabled';
          } else {
            await enableEditRights(employee.userId.toString());
            successMessage = 'Edit Rights Enabled';
          }
          shouldRefetch = true;
          break;
        case MENU_ACTIONS.DOWNLOAD_DETAILS: // Handle download details action
          await downloadAllDetails({ userId: employee.userId.toString(), userName: `${employee.firstName} ${employee.lastName}` });
          successMessage = 'Details Downloaded Successfully to local storage.'; // Updated message
          break;
        case MENU_ACTIONS.DELETE_USER: // Deactivation part
          await deleteUser({ userId: employee.userId.toString() });
          successMessage = 'User Deactivated Successfully'; // Updated message
          shouldRefetch = true;
          break;
        case MENU_ACTIONS.DELETE_USER_PERMANENTLY:
          await deleteUserPermanently({ userId: employee.userId.toString() });
          successMessage = 'User Permanently Deleted';
          shouldRefetch = true;
          break;
      }

      Toast.show({ type: 'success', text1: successMessage, text2: `Action completed for ${employee.firstName} ${employee.lastName}.`, position: 'bottom' });
      if (shouldRefetch) {
        fetchData(false);
      }

    } catch (error: any) {
      console.error(`Failed to ${action} for user ${employee.userId}:`, error);
      const actionText = action.replace(/([A-Z])/g, ' $1').trim();
      Toast.show({
        type: 'error',
        text1: `${actionText} Failed`,
        text2: error.message || `Could not perform ${actionText.toLowerCase()}.`,
        position: 'bottom'
      });
    } finally {
      setLoadingAction(null); // Clear loading state specific to this action
      closeMenu(); // Ensure menu is closed
    }
  }

  const handleConfirmDelete = async () => {
    if (!employeeToDelete || !deleteActionType) return;

    const currentEmployee = employeeToDelete; // Capture before state is cleared
    const currentActionType = deleteActionType;

    // Set loading state for the specific action within the modal
    setLoadingAction({ userId: currentEmployee.userId, action: currentActionType });

    try {
        if (currentActionType === MENU_ACTIONS.DELETE_USER) {
            if (!resignationDateInput.trim()) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Resignation date is required for deactivation.', position: 'bottom' });
                // Do not clear loading state or modal states, allow user to correct input
                setLoadingAction(null); // Clear loading since this was a validation error, not API call failure
                return;
            }
            // Simple date format validation (YYYY-MM-DD) - can be enhanced
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(resignationDateInput)) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please use YYYY-MM-DD format for resignation date.', position: 'bottom' });
                setLoadingAction(null); // Clear loading
                return;
            }

            try {
                await resignationDate(currentEmployee.userId.toString(), resignationDateInput);
                Toast.show({ type: 'info', text1: 'Resignation Date Set', text2: `Proceeding with deactivation for ${currentEmployee.firstName}.`, position: 'bottom' });
                await executeAsyncAction(MENU_ACTIONS.DELETE_USER, currentEmployee); // This will handle its own loading clear
            } catch (error: any) {
                console.error(`Failed to set resignation date for user ${currentEmployee.userId}:`, error);
                Toast.show({
                    type: 'error',
                    text1: 'Resignation Date Error',
                    text2: error.message || 'Could not set resignation date. Please try again.',
                    position: 'bottom'
                });
                setLoadingAction(null); // Clear loading if resignationDate fails
            }
        } else if (currentActionType === MENU_ACTIONS.DELETE_USER_PERMANENTLY) {
            await executeAsyncAction(MENU_ACTIONS.DELETE_USER_PERMANENTLY, currentEmployee); // This will handle its own loading clear
        }
    } catch (error) {
        // This catch block will only be hit if executeAsyncAction throws an unhandled error,
        // but executeAsyncAction already handles its own errors and sets loading to null.
        // Keeping it here for robustness.
        setLoadingAction(null);
    } finally {
        setIsDeleteConfirmVisible(false); // Close modal only after action attempt
        setResignationDateInput('');
        setEmployeeToDelete(null);
        setDeleteActionType(null);
    }
  };


  const handleCancelDelete = () => {
      setIsDeleteConfirmVisible(false);
      setEmployeeToDelete(null);
      setDeleteActionType(null);
      setResignationDateInput('');
  };

  const handleViewProfile = (employee: Employee) => {
    closeMenu();
    router.push(`/employee-details?userId=${employee.userId}&email=${encodeURIComponent(employee.email)}` as Href);
  };

  const handleFormInputChange = (name: keyof EmployeeFormData, value: string) => {
    let processedValue = value;
    if (name === 'employeeCode') {
      processedValue = value.toUpperCase();
      if (value.length === 1 && value.toLowerCase() === 'u') {
        processedValue = 'U';
      }
      if (processedValue.length > 1) {
        processedValue = 'U' + processedValue.substring(1).replace(/\D/g, '');
      }
      if(processedValue.length > 4) {
        processedValue = processedValue.substring(0,4);
      }
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
      if (formErrors.general){
        setFormErrors(prev => ({ ...prev, general: undefined}));
    }
  };

  const handleJoineeTypeChange = (isChecked: boolean) => {
    setIsExistingJoinee(isChecked);
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        joineeType: 'EXISTING',
        status: 'Experienced',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        joineeType: 'NEW',
      }));
    }
  };

  const handleStatusChange = (newStatus: 'Fresher' | 'Experienced') => {
    if (!isExistingJoinee) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleFormSubmit = async () => {
    Keyboard.dismiss();
    setFormSubmitting(true);
    setFormErrors({});

    try {
      await employeeFormSchema.validate(formData, { abortEarly: false });
      
      const { employeeCode, firstName, lastName, dateOfJoining, email, designation, status, joineeType } = formData;
      const apiEndPoint = formMode === 'add' ? ENDPOINTS.ADD_NEW_EMPLOYEE : `${ENDPOINTS.EDIT_RIGHTS}${editingEmployee?.userId}/edit-details`;
      const apiMethod = formMode === 'add' ? 'POST' : 'PATCH';
      const permissions: string[] = [];

      await sendSignupMail(
        employeeCode,
        firstName,
        lastName,
        dateOfJoining,
        email,
        designation,
        status,
        joineeType,
        apiEndPoint,
        apiMethod,
        permissions
      );
      Toast.show({
        type: 'success',
        text1: `Employee ${formMode === 'add' ? 'Added' : 'Updated'}`,
        text2: `${firstName} ${lastName} has been successfully ${formMode === 'add' ? 'added' : 'updated'}.`,
        position: 'bottom'
      });
      setIsFormVisible(false);
      fetchData(false);

    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: FormErrors = {};
        err.inner.forEach(error => {
          if (error.path && !newErrors[error.path as keyof FormErrors]) {
            newErrors[error.path as keyof EmployeeFormData] = error.message;
          }
        });
        setFormErrors(newErrors);
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please correct the highlighted fields.', position: 'bottom' });
      } else {
        console.error(`Failed to ${formMode} employee:`, err);
        const error = err as any;
        let errorMessage = `Could not ${formMode} employee. Please try again.`;
        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }
        setFormErrors({general: errorMessage});
        Toast.show({
          type: 'error',
          text1: `${formMode === 'add' ? 'Add' : 'Update'} Failed`,
          text2: errorMessage,
          position: 'bottom'
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };


  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const isActionLoading = (action: string) => loadingAction?.userId === item.userId && loadingAction?.action === action;
    const isMenuOpenForThisCard = menuVisibleFor === item.userId;

    const getMenuItemText = (actionName: string) => {
      if (actionName === MENU_ACTIONS.TOGGLE_EDIT_RIGHTS) {
        return item.editRights ? 'Disable Edit Rights' : 'Enable Edit Rights';
      }
      return actionName;
    };
    
    const employeeMenuItems = ALL_MENU_ITEMS_ORDERED.filter(actionName => {
        if (actionName === MENU_ACTIONS.REMINDER_EMAIL && !item.editRights) { 
            return false;
        }
        if (actionName === MENU_ACTIONS.DOWNLOAD_DOCUMENTS && item.joineeType === 'EXISTING') { 
            return false;
        }
        return true;
    });

    const getActionItemTextStyle = (actionName: string) => {
        if (actionName === MENU_ACTIONS.DELETE_USER_PERMANENTLY) return styles.menuItemTextDestructive;
        if (actionName === MENU_ACTIONS.DELETE_USER) return styles.menuItemTextDestructiveSimple;
        if (actionName === MENU_ACTIONS.TOGGLE_EDIT_RIGHTS && item.editRights) return styles.menuItemTextDestructiveSimple;
        return styles.menuItemText;
    };
    
    const getIconColorForAction = (actionName: string) => {
        const textStyle = getActionItemTextStyle(actionName);
        return textStyle.color || styles.menuItemIconDefault.color;
    };

    return (
      <View style={[styles.employeeCard, isMenuOpenForThisCard && styles.employeeCardActive]}>
        <View style={styles.cardHeader}>
          <Image
            source={item.photoUrl ? { uri: item.photoUrl } : defaultImage}
            style={styles.employeeImage}
          />
          <View style={styles.employeeMainInfo}>
            <Text style={styles.employeeNameText}>{`${item.firstName} ${item.lastName}`}</Text>
            <Text style={styles.employeeEmailText}>{item.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleMenuToggle(item.userId)}
            style={styles.menuButton}
            disabled={loadingAction?.userId === item.userId && !!loadingAction?.action && !isMenuOpenForThisCard}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}  
          >
            <MaterialCommunityIcons  
              name={isMenuOpenForThisCard ? "close-circle" : "dots-vertical"}  
              size={28}  
              color={(loadingAction?.userId === item.userId && !!loadingAction?.action && !isMenuOpenForThisCard) ? styles.iconDisabled.color : (isMenuOpenForThisCard ? paletteV2.primaryMain : paletteV2.iconDefault)}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Emp Code:</Text>  
            <Text style={styles.detailValue}>{item.employeeCode}</Text>
          </View>
          <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{item.status}</Text>
          </View>
            <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Designation:</Text>
            <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">{item.designation || 'N/A'}</Text>
          </View>
          <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Joined On:</Text>
            <Text style={styles.detailValue}>{item.dateOfJoining || 'N/A'}</Text>
          </View>
            <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Edit Rights:</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold', color: item.editRights ? paletteV2.successMain : paletteV2.warningMain}]}>{item.editRights ? 'Enabled' : 'Disabled'}</Text>
          </View>
          <View style={styles.detailItemRow}>
            <Text style={styles.detailLabel}>Profile Status:</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold', color: typeof item.allFieldsFilled === 'boolean' ? (item.allFieldsFilled ? paletteV2.successMain : paletteV2.errorMain) : paletteV2.neutralLight }]}>
              {typeof item.allFieldsFilled === 'boolean' ? (item.allFieldsFilled ? 'Complete' : 'Incomplete') : 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleViewProfile(item) }>
          <Text style={styles.viewDetailsButtonText}>View Full Profile</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color={paletteV2.primaryMain} style={{marginLeft: 8}}/>
        </TouchableOpacity>
        {/* Moved menuDropdown to be rendered last to help with potential overlap issues */}
        {isMenuOpenForThisCard && (
          <View style={styles.menuDropdown}>
            {employeeMenuItems.map((actionName, index) => (
              <React.Fragment key={actionName}>
                <TouchableOpacity
                  style={styles.menuItemTouchable}
                  onPress={() => handleMenuAction(actionName, item)}
                  disabled={isActionLoading(actionName)}
                >
                  {isActionLoading(actionName) ? (
                    <View style={styles.menuItemContent}>
                        <ActivityIndicator size={22} color={getIconColorForAction(actionName)} />
                    </View>
                  ) : (
                    <View style={styles.menuItemContent}>
                        <MaterialCommunityIcons  
                            name={MENU_ACTION_ICONS[actionName] || 'help-circle-outline'}  
                            size={22}  
                            color={getIconColorForAction(actionName)}
                            style={styles.menuItemIcon}  
                        />
                        <Text style={getActionItemTextStyle(actionName)}>
                           {getMenuItemText(actionName)}
                        </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {index < employeeMenuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <Card  
      topNavBackgroundColor={styles.bgSurface.backgroundColor}  
      topNavContent={
        <View style={styles.topNavWrapper}>  
          {!showSortOptions ? (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={22} color={paletteV2.iconDefault} style={styles.searchIconPrefix} />
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Search employees..."
                  placeholderTextColor={styles.textPlaceholder.color}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  onFocus={() => menuVisibleFor !== null && closeMenu()}
                  clearButtonMode="while-editing"
                />
              </View>
              <TouchableOpacity
                onPress={() => { setShowSortOptions(true); closeMenu(); }}
                style={styles.filterSortButton}
              >
                <MaterialCommunityIcons name="filter-variant" size={24} color={paletteV2.primaryMain} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sortOptionsSingleRowContainer}>
                <Text style={styles.sortByLabelCompact}>Sort by:</Text>
                <ScrollView  
                    horizontal  
                    showsHorizontalScrollIndicator={false}  
                    contentContainerStyle={styles.sortButtonsScrollContainer}
                    style={{flexShrink: 1, marginHorizontal: 8 }}  
                >
                    {SORTABLE_FIELDS.map((field) => (
                    <TouchableOpacity
                        key={field.key}
                        onPress={() => handleSortToggle(field.key)}
                        style={[
                        styles.sortOptionButtonCompact,
                        sort === field.key && styles.sortOptionButtonActiveCompact,
                        ]}
                    >
                        <Text
                        style={[
                            styles.sortOptionButtonTextCompact,
                            sort === field.key && styles.sortOptionButtonTextActiveCompact,
                        ]}
                        >
                        {field.label}
                        </Text>
                        {sort === field.key && (
                        <MaterialCommunityIcons  
                            name={direction === 'asc' ? 'arrow-up' : 'arrow-down'}  
                            size={14}  
                            color={paletteV2.primaryDark}  
                            style={styles.sortIconCompact}
                        />
                        )}
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity
                    onPress={() => { setShowSortOptions(false); closeMenu();}}
                    style={styles.closeSortButtonCompact}  
                >
                    <MaterialIcons name="close" size={22} color={paletteV2.neutralMedium} />
                </TouchableOpacity>
            </View>
          )}
        </View>
      }
    >
        <View style={styles.mainContentContainer}>  
          <View style={styles.scrollableContentArea}>
            {isLoading && !isRefreshing && !loadingAction && !formSubmitting ? (
              <View style={styles.fullScreenLoaderContainer}>
                  <ActivityIndicator size="large" color={paletteV2.primaryMain} />
                  <Text style={styles.loadingText}>Fetching Employees...</Text>
              </View>
            ) : employees.length === 0 && searchTerm !== '' && !isLoading && !formSubmitting ? (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="account-search-outline" size={80} color={styles.iconSubtle.color} />
                <Text style={styles.noDataTitle}>No Employees Found</Text>
                <Text style={styles.noDataTextDetail}>
                  Your search for "{searchTerm}" did not return any results. Try different keywords.
                </Text>
              </View>
            ) : employees.length === 0 && searchTerm === '' && !isLoading && !formSubmitting ? (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="account-multiple-plus-outline" size={80} color={styles.iconSubtle.color} />
                <Text style={styles.noDataTitle}>Your Team Awaits!</Text>
                <Text style={styles.noDataTextDetail}>Get started by adding your first employee.</Text>
                <TouchableOpacity onPress={handleOpenAddForm}>
                    <LinearGradient
                        colors={paletteV2.gradientPrimaryButton}
                        style={styles.addNewFromEmptyStateButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={paletteV2.textPrimaryOnDark}/>
                        <Text style={styles.addNewFromEmptyStateButtonText}>Add First Employee</Text>
                    </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={employees}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={renderEmployeeCard}
                contentContainerStyle={styles.listContainer}
                onScrollBeginDrag={() => {
                  if (!loadingAction && menuVisibleFor !== null) {  
                      closeMenu();
                  }
                }}
                keyboardShouldPersistTaps="handled"  
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={[paletteV2.primaryMain, paletteV2.accentMain]}  
                    tintColor={paletteV2.primaryMain}
                  />
                }
              />
            )}
          </View>

          {employees.length > 0 && !isFormVisible && (
            <TouchableOpacity style={styles.addEmployeeFabTouchable} onPress={handleOpenAddForm}>
                    <LinearGradient
                        colors={paletteV2.gradientAccentButton}
                        style={styles.addEmployeeFab}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                    >
                        <MaterialCommunityIcons name="plus" size={28} color={paletteV2.textPrimaryOnDark} />
                    </LinearGradient>
            </TouchableOpacity>
          )}

          {totalEmployees > limit && !isFormVisible && (
            <Animated.View
              style={[
                styles.pagination,
                {
                  opacity: paginationOpacity,
                  transform: [{ translateY: paginationTranslateY }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); closeMenu(); }}
                disabled={currentPage === 1 || !!loadingAction}
                style={styles.paginationNavButton}
              >
                <MaterialIcons name="chevron-left" size={30} color={(currentPage === 1 || !!loadingAction) ? styles.iconDisabled.color : paletteV2.primaryMain} />
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); closeMenu();}}
                disabled={currentPage === totalPages || !!loadingAction}
                style={styles.paginationNavButton}
              >
                <MaterialIcons name="chevron-right" size={30} color={(currentPage === totalPages || !!loadingAction) ? styles.iconDisabled.color : paletteV2.primaryMain} />
              </TouchableOpacity>

              <View style={styles.itemsPerPageWrapper}>
                <TouchableOpacity
                  onPress={() => { setShowPerPageDropdown(!showPerPageDropdown); closeMenu();}}
                  style={styles.itemsPerPageDropdownTrigger}
                  disabled={!!loadingAction}
                >
                  <Text style={styles.itemsPerPageCurrentText}>{limit}</Text>
                  <MaterialIcons
                    name={showPerPageDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
                    size={24}
                    color={!!loadingAction ? styles.iconDisabled.color : paletteV2.textPrimaryOnLight}
                  />
                </TouchableOpacity>
                {showPerPageDropdown && (
                  <View style={styles.itemsPerPageDropdownOptions}>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => handleLimitChange(option)}  
                        style={styles.itemsPerPageDropdownOptionItem}
                      >
                        <Text
                          style={[
                            styles.itemsPerPageDropdownOptionText,
                            limit === option && styles.itemsPerPageOptionTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={isFormVisible}
            onRequestClose={() => {
              if (!formSubmitting) setIsFormVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ScrollView contentContainerStyle={styles.formScrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>{formMode === 'add' ? 'Add New Employee' : 'Edit Employee Details'}</Text>
                    <TouchableOpacity onPress={() => { if (!formSubmitting) setIsFormVisible(false); }} style={styles.formCloseButton}>
                        <MaterialCommunityIcons name="close" size={24} color={paletteV2.neutralMedium} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.formLabel}>Employee Code <Text style={styles.requiredIndicator}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput, formErrors.employeeCode && styles.formInputError]}
                    value={formData.employeeCode}
                    onChangeText={(val) => handleFormInputChange('employeeCode', val)}
                    placeholder="e.g., U001"
                    placeholderTextColor={styles.textPlaceholder.color}
                    maxLength={4}
                    autoCapitalize="characters"
                  />
                  {formErrors.employeeCode && <Text style={styles.formErrorText}>{formErrors.employeeCode}</Text>}
                  
                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                        <Text style={styles.formLabel}>First Name <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={[styles.formInput, formErrors.firstName && styles.formInputError]}
                            value={formData.firstName}
                            onChangeText={(val) => handleFormInputChange('firstName', val)}
                            placeholder="Enter first name"
                            placeholderTextColor={styles.textPlaceholder.color}
                        />
                        {formErrors.firstName && <Text style={styles.formErrorText}>{formErrors.firstName}</Text>}
                    </View>
                    <View style={styles.formColumn}>
                        <Text style={styles.formLabel}>Last Name <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={[styles.formInput, formErrors.lastName && styles.formInputError]}
                            value={formData.lastName}
                            onChangeText={(val) => handleFormInputChange('lastName', val)}
                            placeholder="Enter last name"
                            placeholderTextColor={styles.textPlaceholder.color}
                        />
                        {formErrors.lastName && <Text style={styles.formErrorText}>{formErrors.lastName}</Text>}
                    </View>
                  </View>
                  
                  <Text style={styles.formLabel}>Email <Text style={styles.requiredIndicator}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput, formMode === 'edit' && styles.disabledInput, formErrors.email && styles.formInputError]}
                    value={formData.email}
                    onChangeText={(val) => handleFormInputChange('email', val)}
                    placeholder="employee@liftoffllc.com"
                    placeholderTextColor={styles.textPlaceholder.color}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={formMode === 'add'}
                  />
                  {formErrors.email && <Text style={styles.formErrorText}>{formErrors.email}</Text>}

                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                        <Text style={styles.formLabel}>Date of Joining <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={[styles.formInput, formErrors.dateOfJoining && styles.formInputError]}
                            value={formData.dateOfJoining}
                            onChangeText={(val) => handleFormInputChange('dateOfJoining', val)}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={styles.textPlaceholder.color}
                            maxLength={10}  
                        />
                        {formErrors.dateOfJoining && <Text style={styles.formErrorText}>{formErrors.dateOfJoining}</Text>}
                    </View>
                    <View style={styles.formColumn}>
                        <Text style={styles.formLabel}>Designation <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={[styles.formInput, formErrors.designation && styles.formInputError]}
                            value={formData.designation}
                            onChangeText={(val) => handleFormInputChange('designation', val)}
                            placeholder="e.g., Software Engineer"
                            placeholderTextColor={styles.textPlaceholder.color}
                        />
                        {formErrors.designation && <Text style={styles.formErrorText}>{formErrors.designation}</Text>}
                    </View>
                  </View>

                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity onPress={() => handleJoineeTypeChange(!isExistingJoinee)} style={styles.checkboxTouchable}>
                      <MaterialCommunityIcons  
                        name={isExistingJoinee ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}  
                        size={26}  
                        color={isExistingJoinee ? paletteV2.primaryMain : paletteV2.neutralMedium}
                        style={styles.checkboxIcon}
                      />
                      <Text style={styles.checkboxLabel}>This is an Existing Employee</Text>
                    </TouchableOpacity>
                      <Text style={styles.derivedInfoLabel}>(Joinee Type: {isExistingJoinee ? 'EXISTING' : 'NEW'})</Text>
                  </View>

                  <Text style={styles.formLabel}>Experience Status <Text style={styles.requiredIndicator}>*</Text></Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity  
                      style={[styles.radioButtonContainer, formData.status === 'Fresher' && styles.radioButtonActive, isExistingJoinee && styles.radioButtonDisabled]}
                      onPress={() => handleStatusChange('Fresher')}
                      disabled={isExistingJoinee}
                    >
                      <MaterialCommunityIcons  
                        name={formData.status === 'Fresher' ? "radiobox-marked" : "radiobox-blank"}  
                        size={22}  
                        color={isExistingJoinee ? paletteV2.neutralLight : (formData.status === 'Fresher' ? paletteV2.primaryMain : paletteV2.iconDefault)}
                      />
                      <Text style={[styles.radioLabel, isExistingJoinee && {color: paletteV2.neutralLight}]}>Fresher</Text>
                    </TouchableOpacity>
                    <TouchableOpacity  
                      style={[styles.radioButtonContainer, formData.status === 'Experienced' && styles.radioButtonActive, isExistingJoinee && styles.radioButtonActive]}  
                      onPress={() => handleStatusChange('Experienced')}
                      disabled={isExistingJoinee}
                    >
                        <MaterialCommunityIcons  
                            name={formData.status === 'Experienced' || isExistingJoinee ? "radiobox-marked" : "radiobox-blank"}  
                            size={22}  
                            color={isExistingJoinee ? paletteV2.primaryMain : (formData.status === 'Experienced' ? paletteV2.primaryMain : paletteV2.iconDefault)}
                        />
                      <Text style={[styles.radioLabel, isExistingJoinee && {color: paletteV2.textPrimaryOnLight, fontWeight:'500'}]}>Experienced</Text>
                    </TouchableOpacity>
                  </View>
                  {(formErrors.status || formErrors.joineeType || formErrors.general) && <Text style={[styles.formErrorText, styles.formGeneralErrorText]}>{formErrors.status || formErrors.joineeType || formErrors.general}</Text>}


                  <View style={styles.formActions}>
                    <TouchableOpacity  
                        style={[styles.formButtonBase, styles.cancelButton]}  
                        onPress={() => { if (!formSubmitting) setIsFormVisible(false);}}
                        disabled={formSubmitting}
                    >
                      <Text style={[styles.formButtonText, styles.cancelButtonText]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity  
                        onPress={handleFormSubmit}
                        disabled={formSubmitting}
                        style={[styles.formButtonBase, formSubmitting && styles.submitButtonDisabled]}
                    >
                        <LinearGradient
                            colors={formSubmitting ? paletteV2.gradientDisabled : paletteV2.gradientPrimaryButton}
                            style={styles.submitButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {formSubmitting ? (
                                <ActivityIndicator size="small" color={paletteV2.textPrimaryOnDark} />
                            ) : (
                                <Text style={styles.formButtonText}>{formMode === 'add' ? 'Add Employee' : 'Save Changes'}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={isDeleteConfirmVisible}
            onRequestClose={handleCancelDelete}
          >
            <View style={styles.confirmModalOverlay}>
              <View style={styles.confirmModalContent}>
                <View style={styles.confirmModalIconContainer}>
                    <MaterialCommunityIcons  
                        name={deleteActionType === MENU_ACTIONS.DELETE_USER_PERMANENTLY ? "alert-octagon-outline" : "alert-circle-outline"}  
                        size={48}  
                        color={deleteActionType === MENU_ACTIONS.DELETE_USER_PERMANENTLY ? paletteV2.errorMain : paletteV2.warningMain}  
                    />
                </View>
                <Text style={styles.confirmModalTitle}>
                  {deleteActionType === MENU_ACTIONS.DELETE_USER ? "Confirm Deactivation" : "Confirm Permanent Deletion"}
                </Text>
                <Text style={styles.confirmModalMessage}>
                  Are you sure you want to {deleteActionType === MENU_ACTIONS.DELETE_USER ? 'deactivate' : 'permanently delete'} <Text style={{fontWeight: 'bold'}}>{employeeToDelete?.firstName} {employeeToDelete?.lastName}</Text>?
                  {deleteActionType === MENU_ACTIONS.DELETE_USER_PERMANENTLY && "\nThis action cannot be undone and is irreversible."}
                </Text>

                {deleteActionType === MENU_ACTIONS.DELETE_USER && (
                    <View style={styles.resignationDateContainer}>
                        <Text style={styles.formLabel}>Resignation Date <Text style={styles.requiredIndicator}>*</Text></Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={paletteV2.textPlaceholderOnLight}
                            value={resignationDateInput}
                            onChangeText={setResignationDateInput}
                            maxLength={10}
                        />
                    </View>
                )}

                <View style={styles.confirmModalActions}>
                  <TouchableOpacity
                    style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                    onPress={handleCancelDelete}
                    disabled={loadingAction?.userId === employeeToDelete?.userId && loadingAction?.action === deleteActionType}
                  >
                    <Text style={[styles.confirmModalButtonText, styles.confirmModalCancelButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                        styles.confirmModalButton,
                        deleteActionType === MENU_ACTIONS.DELETE_USER_PERMANENTLY ? styles.confirmModalDeleteButtonDestructive : styles.confirmModalDeleteButtonWarn,
                        (loadingAction?.userId === employeeToDelete?.userId && loadingAction?.action === deleteActionType) && styles.submitButtonDisabled
                    ]}
                    onPress={handleConfirmDelete}
                    disabled={loadingAction?.userId === employeeToDelete?.userId && loadingAction?.action === deleteActionType}
                  >
                    {loadingAction?.userId === employeeToDelete?.userId && loadingAction?.action === deleteActionType ? (
                        <ActivityIndicator size="small" color={paletteV2.textPrimaryOnDark} />
                    ) : (
                        <Text style={styles.confirmModalButtonText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
    </Card>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  bgSurface: { backgroundColor: paletteV2.surfaceNav },
  iconDisabled: { color: paletteV2.neutralExtraLight },
  iconSubtle: { color: paletteV2.neutralLight },
  textPlaceholder: { color: paletteV2.textPlaceholderOnLight },
  
  mainContentContainer: {
    flex: 1,
    backgroundColor: paletteV2.backgroundPage,  
  },
  scrollableContentArea: {
    flex: 1,
  },
  fullScreenLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 239, 243, 0.85)',  
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: paletteV2.neutralMedium,
    fontWeight: '500',
  },
  topNavWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,  
    borderBottomWidth: 1,
    borderBottomColor: paletteV2.borderDefault,
    backgroundColor: paletteV2.surfaceNav,  
    minHeight: 52,  
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,  
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paletteV2.neutralUltraLight,  
    borderRadius: 10,
    paddingHorizontal: 12,
    height: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: paletteV2.textPrimaryOnLight,
    marginLeft: 8,
  },
  searchIconPrefix:{
    marginRight: 4,
  },
  filterSortButton: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 10,  
    backgroundColor: paletteV2.primaryUltraLight,
  },
  sortOptionsSingleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,  
    height: 44,  
  },
  sortByLabelCompact: {
    color: paletteV2.textSecondaryOnLight,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  sortButtonsScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,  
  },
  sortOptionButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: paletteV2.neutralUltraLight,
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sortOptionButtonActiveCompact: {
    backgroundColor: paletteV2.primaryUltraLight,
    borderColor: paletteV2.primaryMain,
  },
  sortOptionButtonTextCompact: {
    color: paletteV2.neutralDark,
    fontWeight: '500',
    fontSize: 13,
  },
  sortOptionButtonTextActiveCompact: {
    color: paletteV2.primaryDark,
    fontWeight: '600',
  },
  sortIconCompact: {
    marginLeft: 5,
  },
  closeSortButtonCompact: {
    padding: 8,
    marginLeft: 'auto',  
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 220 : 200,  
  },
  employeeCard: {
    backgroundColor: paletteV2.surfaceCard,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: paletteV2.neutralDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,  
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
  },
  employeeCardActive: {  
    elevation: 10,  
    shadowOpacity: 0.12,
    borderColor: paletteV2.primaryMain,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  employeeImage: {
    width: 52,
    height: 52,
    borderRadius: 26,  
    backgroundColor: paletteV2.neutralUltraLight,
    marginRight: 14,
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
  },
  employeeMainInfo: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 17,
    fontWeight: '600',
    color: paletteV2.textPrimaryOnLight,
    marginBottom: 1,
  },
  employeeEmailText: {
    fontSize: 13,
    color: paletteV2.textSecondaryOnLight,
  },
  menuButton: {
    padding: 8,  
    borderRadius: 20,
  },
  menuDropdown: {
    position: 'absolute',  
    top: 60,  
    right: 16,
    backgroundColor: paletteV2.surfaceCard,
    borderRadius: 12,
    shadowColor: paletteV2.neutralDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,  
    zIndex: 2000, // Adjusted zIndex to be higher
    width: 270,  
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
  },
  menuItemTouchable: {
    justifyContent: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal:18,
  },
  menuItemIcon: {
    marginRight: 16,
    width: 20,  
  },
  menuItemIconDefault: {  
    color: paletteV2.neutralMedium,
  },
  menuItemText: {
    fontSize: 15,
    color: paletteV2.textPrimaryOnLight,
    flex: 1,  
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: paletteV2.borderLight,
    marginHorizontal: 16,
  },
  menuItemTextDestructive: {  
    fontSize: 15,
    color: paletteV2.errorMain,
    fontWeight: '500',
    flex: 1,
  },
  menuItemTextDestructiveSimple: {  
    fontSize: 15,
    color: paletteV2.warningMain,  
    fontWeight: '500',
    flex: 1,
  },
  cardDetails: {
    paddingHorizontal: 18,
    paddingBottom: 12,  
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: paletteV2.borderLight,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,  
  },
  detailLabel: {
    fontSize: 13,  
    color: paletteV2.textSecondaryOnLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,  
    color: paletteV2.textPrimaryOnLight,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,  
    marginLeft: 8,  
  },
  viewDetailsButton: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: paletteV2.primaryUltraLight,
    paddingVertical: 12,  
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: paletteV2.primaryLighter,
  },
  viewDetailsButtonText: {
    color: paletteV2.primaryDark,
    fontWeight: '600',  
    fontSize: 14,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 80,  
  },
  noDataTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: paletteV2.neutralDarker,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataTextDetail: {
    fontSize: 15,
    color: paletteV2.neutralMedium,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  addNewFromEmptyStateButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,  
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: paletteV2.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 7,
  },
  addNewFromEmptyStateButtonText: {
    color: paletteV2.textPrimaryOnDark,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  addEmployeeFabTouchable: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 90 : 75,
    zIndex: 900,
    shadowColor: paletteV2.neutralDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addEmployeeFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,  
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: paletteV2.borderDefault,
    backgroundColor: paletteV2.surfaceNav,  
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationNavButton: {
    padding: 10,  
    borderRadius: 20,  
  },
  pageInfo: {
    fontSize: 14,  
    fontWeight: '500',
    color: paletteV2.neutralMedium,
    marginHorizontal: 8,
  },
  itemsPerPageWrapper: {
      position: 'relative',  
  },
  itemsPerPageDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paletteV2.neutralUltraLight,
    paddingVertical: 8,  
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemsPerPageCurrentText: {
    fontSize: 14,  
    fontWeight: '500',
    color: paletteV2.textPrimaryOnLight,
    marginRight: 4,
  },
  itemsPerPageDropdownOptions: {
    position: 'absolute',
    bottom: '100%',  
    marginBottom: 8,  
    right: 0,
    backgroundColor: paletteV2.surfaceCard,
    borderRadius: 10,
    borderColor: paletteV2.borderDefault,
    borderWidth: 1,
    shadowColor: paletteV2.neutralDark,
    shadowOffset: { width: 0, height: -4 },  
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,  
    width: 160,  
    zIndex: 2000,  
  },
  itemsPerPageDropdownOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemsPerPageDropdownOptionText: {
    fontSize: 14,
    color: paletteV2.textPrimaryOnLight,
  },
  itemsPerPageOptionTextActive: {
    color: paletteV2.primaryMain,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 43, 52, 0.85)',  
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 12,
  },
  modalContent: {
    backgroundColor: paletteV2.surfaceCard,
    borderRadius: 18,  
    padding: 0,  
    width: Platform.OS === 'web' ? 680 : '97%',  
    maxWidth: 680,
    maxHeight: '90%',
    shadowColor: '#000000',  
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 18,
    overflow: 'hidden',  
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: paletteV2.borderLight,
  },
  formCloseButton: {
    padding: 8,  
    borderRadius: 18,
  },
  formScrollView: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 22,
  },
  formTitle: {
    fontSize: 19,  
    fontWeight: '600',
    color: paletteV2.primaryDark,  
  },
  formLabel: {
    fontSize: 13,
    color: paletteV2.textSecondaryOnLight,
    marginBottom: 7,
    fontWeight: '500',
    marginTop: 14,
  },
  requiredIndicator: {
    color: paletteV2.errorMain,
    marginLeft: 2,
  },
  formInput: {
    backgroundColor: paletteV2.neutralUltraLight,  
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,  
    fontSize: 15,
    color: paletteV2.textPrimaryOnLight,
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,  
  },
  formInputError: {
    borderColor: paletteV2.errorMain,
    backgroundColor: paletteV2.errorLight,
    borderWidth: 1.5,
  },
  formErrorText: {
    fontSize: 12.5,
    color: paletteV2.errorMain,
    marginTop: 5,
    marginBottom: 7,  
  },
  formGeneralErrorText: {
    textAlign: 'center',  
    marginBottom: 14,  
    fontWeight: '500'
  },
  disabledInput: {
    backgroundColor: paletteV2.neutralExtraLight,
    color: paletteV2.neutralMedium,
    borderColor: paletteV2.neutralLight,
  },
  formRow: {
    flexDirection: 'row',
    gap: 14,
  },
  formColumn: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'column',  
    alignItems: 'flex-start',
    marginBottom: 14,
    marginTop: 10,
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkboxIcon: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: paletteV2.textPrimaryOnLight,
    fontWeight: '500',
  },
  derivedInfoLabel: {
    fontSize: 12,
    color: paletteV2.neutralMedium,
    marginLeft: 0,  
    marginTop: 2,
    fontStyle: 'italic',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 6,
    gap: 10,  
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,  
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
    backgroundColor: paletteV2.neutralUltraLight,  
    flex: 1,  
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: paletteV2.primaryMain,
    backgroundColor: paletteV2.primaryUltraLight,  
    borderWidth: 1.5,
  },
  radioButtonDisabled: {
    backgroundColor: paletteV2.neutralExtraLight,
    borderColor: paletteV2.neutralLight,
    opacity: 0.7,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: paletteV2.textPrimaryOnLight,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',  
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: paletteV2.borderLight,
    paddingTop: 20,
    gap: 10,  
  },
  formButtonBase: {
    borderRadius: 10,
    minWidth: 120,  
  },
  submitButtonGradient: {
    paddingVertical: 12,  
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  cancelButton: {
    backgroundColor: paletteV2.neutralUltraLight,  
    borderWidth: 1,
    borderColor: paletteV2.borderDefault,
    paddingVertical: 12,  
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButtonText: {
    color: paletteV2.neutralDark,
    fontWeight: '600',
    fontSize: 14,
  },
  formButtonText: {
    color: paletteV2.textPrimaryOnDark,  
    fontSize: 14,
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 43, 52, 0.88)',  
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: paletteV2.surfaceCard,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: Platform.OS === 'web' ? 400 : '88%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    alignItems: 'center',
  },
  confirmModalIconContainer: {
    marginBottom: 14,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: paletteV2.neutralUltraLight,  
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: paletteV2.neutralDarker,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 14,
    color: paletteV2.neutralMedium,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16, // Adjusted margin for date input
  },
  resignationDateContainer: {
    width: '100%',
    marginBottom: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8, // Add margin if date input is present
  },
  confirmModalButton: {
    borderRadius: 10,
    paddingVertical: 11,  
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCancelButton: {
    backgroundColor: paletteV2.neutralExtraLight,
    marginRight: 7,
  },
  confirmModalCancelButtonText: {
    color: paletteV2.neutralDark,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmModalDeleteButtonWarn: {
      backgroundColor: paletteV2.warningMain,
      marginLeft: 7,
  },
  confirmModalDeleteButtonDestructive: {
    backgroundColor: paletteV2.errorMain,
    marginLeft: 7,
  },
  confirmModalButtonText: {
    color: paletteV2.textPrimaryOnDark,
    fontSize: 14,
    fontWeight: '600',
  },
});