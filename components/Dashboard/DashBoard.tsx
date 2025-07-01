import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  resignationDate as apiResignationDate,
  deleteUser,
  deleteUserPermanently,
  disableEditRights,
  downloadAllDetails,
  downloadAllDocuments,
  enableEditRights,
  fetchEmployeesData,
  sendReminder,
  sendSignupMail
} from '../Api/adminApi';
import Card from '../Layouts/Card';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { DEFAULT_LIMIT, ITEMS_PER_PAGE_OPTIONS, MENU_ACTIONS, SORTABLE_FIELDS } from '@/constants/common';
import { Employee, EmployeeFormData, EmployeesApiResponse } from '@/constants/interface';
import { ENDPOINTS } from '@/utils/endPoints';
import Toast from 'react-native-toast-message';
import { paletteV2, styles } from '../Styles/DashBoardStyles';
import EmployeeForm from './EmployeeForm';

import { getLocalData } from '@/utils/localData';
import DeactivationModal from './DeactivationModal';
import DeletePermanentlyModal from './DeletePermanentlyModal';
import EmployeeDetailsCard from './EmployeeDetailsCard';
import ProfilePictureModal from './ProfilePictureModal';


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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [employeeToProcess, setEmployeeToProcess] = useState<Employee | null>(null);
  const [isDeactivationModalVisible, setIsDeactivationModalVisible] = useState(false);
  const [isDeletePermanentlyModalVisible, setIsDeletePermanentlyModalVisible] = useState(false);
  const [resignationDateInput, setResignationDateInput] = useState('');


  const [isProfileImageModalVisible, setIsProfileImageModalVisible] = useState(false);
  const [selectedProfileImageUrl, setSelectedProfileImageUrl] = useState<string | null>(null);

  const paginationOpacity = useRef(new Animated.Value(0)).current;
  const paginationTranslateY = useRef(new Animated.Value(20)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const defaultImage = require('../../assets/images/newUser.png');

  const animateFabIn = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [fabScale]);

  const animateFabOut = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 0,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [fabScale]);

  const closeMenu = useCallback(() => {
    if (menuVisibleFor !== null) {
      setMenuVisibleFor(null);
    }
  }, [menuVisibleFor]);

  const fetchData = useCallback(async (showLoader = true, isSubmittingForm = false) => {
    if (showLoader && !isRefreshing && !isSubmittingForm) setIsLoading(true);
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
      if ((response?.data || []).length > 0 && !isFormVisible) {
          animateFabIn();
      } else if ((response?.data || []).length === 0){
          animateFabOut();
      }
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      Toast.show({type: 'error', text1: 'Fetch Failed', text2: 'Could not load employee data.', position: 'bottom'})
    } finally {
      if (showLoader && !isRefreshing && !isSubmittingForm) setIsLoading(false);
      if (isRefreshing) setIsRefreshing(false);
    }
  }, [currentPage, searchTerm, limit, sort, direction, isRefreshing, isFormVisible, animateFabIn, animateFabOut]);

  useEffect(() => {
  const init = async () => {
    const localdata = await getLocalData();
    const token = localdata?.token;

    if (token) {
      fetchData();
    }
  };

  init();
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

   useEffect(() => {
    if (employees.length > 0 && !isFormVisible) {
      animateFabIn();
    } else {
      animateFabOut();
    }
  }, [employees.length, isFormVisible, animateFabIn, animateFabOut]);


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
    setEditingEmployee(null);
    setIsFormVisible(true);
    closeMenu();
  };

  const handleOpenEditForm = (employee: Employee) => {
    setFormMode('edit');
    setEditingEmployee(employee);
    setIsFormVisible(true);
    closeMenu();
  };

  const executeAsyncAction = async (action: string, employee: Employee, additionalParams?: any) => {
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
        case MENU_ACTIONS.DOWNLOAD_DETAILS:
          await downloadAllDetails({ userId: employee.userId.toString(), userName: `${employee.firstName} ${employee.lastName}` });
          successMessage = 'Details Download Initiated';
          break;
        case MENU_ACTIONS.DOWNLOAD_DOCUMENTS:
          await downloadAllDocuments({ userId: employee.userId.toString(), userName: `${employee.firstName} ${employee.lastName}` });
          successMessage = 'Documents Download Initiated';
          break;
        case MENU_ACTIONS.DELETE_USER:
          await deleteUser({ userId: employee.userId.toString() });
          successMessage = 'User Deactivated Successfully';
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
      setLoadingAction(null);
      closeMenu();
    }
  };

  const handleMenuAction = async (action: string, employee: Employee) => {
    const ASYNC_ACTIONS_WITH_LOADER = [
      MENU_ACTIONS.REMINDER_EMAIL,
      MENU_ACTIONS.TOGGLE_EDIT_RIGHTS,
      MENU_ACTIONS.DOWNLOAD_DETAILS,
      MENU_ACTIONS.DOWNLOAD_DOCUMENTS,
    ];

    if (action === MENU_ACTIONS.EDIT_USER) {
      handleOpenEditForm(employee);
      return;
    }

    if (action === MENU_ACTIONS.DELETE_USER) {
      setEmployeeToProcess(employee);
      setResignationDateInput('');
      setIsDeactivationModalVisible(true);
      closeMenu();
    } else if (action === MENU_ACTIONS.DELETE_USER_PERMANENTLY) {
      setEmployeeToProcess(employee);
      setIsDeletePermanentlyModalVisible(true);
      closeMenu();
    } else if (ASYNC_ACTIONS_WITH_LOADER.includes(action)) {
      if (loadingAction?.userId === employee.userId && loadingAction?.action === action) return;
      await executeAsyncAction(action, employee);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!employeeToProcess) return;

    const currentEmployee = employeeToProcess;
    setLoadingAction({ userId: currentEmployee.userId, action: MENU_ACTIONS.DELETE_USER });
    setIsDeactivationModalVisible(false);

    if (!resignationDateInput.trim()) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Resignation date is required for deactivation.', position: 'bottom' });
        setLoadingAction(null);
        return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(resignationDateInput)) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please use YYYY-MM-DD format for resignation date.', position: 'bottom' });
        setLoadingAction(null);
        return;
    }

    try {
        await apiResignationDate(currentEmployee.userId.toString(), resignationDateInput);
        Toast.show({ type: 'info', text1: 'Resignation Date Set', text2: `Proceeding with deactivation for ${currentEmployee.firstName}.`, position: 'bottom'});
        await executeAsyncAction(MENU_ACTIONS.DELETE_USER, currentEmployee);
    } catch (error: any) {
        console.error(`Failed to set resignation date or deactivate user ${currentEmployee.userId}:`, error);
        Toast.show({
            type: 'error',
            text1: 'Deactivation Error',
            text2: error.message || 'Could not set resignation date or deactivate. Please try again.',
            position: 'bottom'
        });
        setLoadingAction(null);
    } finally {
        setResignationDateInput('');
        setEmployeeToProcess(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!employeeToProcess) return;
    const currentEmployee = employeeToProcess;
    setIsDeletePermanentlyModalVisible(false);
    await executeAsyncAction(MENU_ACTIONS.DELETE_USER_PERMANENTLY, currentEmployee);
    setEmployeeToProcess(null);
  };

  const handleCancelModal = () => {
    setIsDeactivationModalVisible(false);
    setIsDeletePermanentlyModalVisible(false);
    setEmployeeToProcess(null);
    setResignationDateInput('');
  };


  const handleEmployeeFormSubmit = async (submittedFormData: EmployeeFormData, submittedFormMode: 'add' | 'edit', employeeIdToEdit?: number) => {
    try {
      const { employeeCode, firstName, lastName, dateOfJoining, email, designation, status, joineeType } = submittedFormData;
      const apiEndPoint = submittedFormMode === 'add'
        ? ENDPOINTS.ADD_NEW_EMPLOYEE
        : `${ENDPOINTS.EDIT_RIGHTS}${employeeIdToEdit}/edit-details`;
      const apiMethod = submittedFormMode === 'add' ? 'POST' : 'PATCH';
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
        text1: `Employee ${submittedFormMode === 'add' ? 'Added' : 'Updated'}`,
        text2: `${firstName} ${lastName} has been successfully ${submittedFormMode === 'add' ? 'added' : 'updated'}.`,
        position: 'bottom'
      });
      setIsFormVisible(false);
      fetchData(false, true);
    } catch (err) {
        console.error(`Failed to ${submittedFormMode} employee (DashboardScreen):`, err);
        const error = err as any;
        let errorMessage = `Could not ${submittedFormMode} employee. Please try again.`;
        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }
        Toast.show({
          type: 'error',
          text1: `${submittedFormMode === 'add' ? 'Add' : 'Update'} Failed`,
          text2: errorMessage,
          position: 'bottom'
        });
    }
  };


  const handleViewProfile = (employee: Employee) => {
    closeMenu();
    router.push(`/employee-details?userId=${employee.userId}&email=${encodeURIComponent(employee.email)}` as Href);
  };

  const openProfileImageModal = (imageUrl: string | undefined) => {
    setSelectedProfileImageUrl(imageUrl || null);
    setIsProfileImageModalVisible(true);
    closeMenu();
  };

  const closeProfileImageModal = () => {
    setIsProfileImageModalVisible(false);
    setSelectedProfileImageUrl(null);
  };

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    return (
      <EmployeeDetailsCard
        employee={item}
        isMenuOpen={menuVisibleFor === item.userId}
        loadingAction={loadingAction}
        defaultImage={defaultImage}
        onMenuToggle={handleMenuToggle}
        onAction={handleMenuAction}
        onViewProfile={handleViewProfile}
        onOpenProfileImageModal={openProfileImageModal}
      />
    );
  };


  return (
    <Card
      topNavBackgroundColor={styles.bgSurface.backgroundColor}
      topNavContent={
        <View style={styles.topNavWrapper}>
          {!showSortOptions ? (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={24} color={paletteV2.iconDefault} style={styles.searchIconPrefix} />
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
                <MaterialCommunityIcons name="filter-variant" size={26} color={paletteV2.primaryMain} />
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
                            size={16}
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
                    <MaterialIcons name="close" size={24} color={paletteV2.neutralMedium} />
                </TouchableOpacity>
            </View>
          )}
        </View>
      }
    >
        <View style={styles.mainContentContainer}>
            <View style={styles.scrollableContentArea}>
            {isLoading && !isRefreshing && !(loadingAction && !menuVisibleFor) ? (
                <View style={styles.fullScreenLoaderContainer}>
                    <ActivityIndicator size="large" color={paletteV2.primaryMain} />
                    <Text style={styles.loadingText}>Fetching Employees...</Text>
                </View>
            ) : employees.length === 0 && searchTerm !== '' && !isLoading ? (
                <View style={styles.noDataContainer}>
                    <MaterialCommunityIcons name="account-search-outline" size={90} color={styles.iconSubtle.color} />
                    <Text style={styles.noDataTitle}>No Employees Found</Text>
                    <Text style={styles.noDataTextDetail}>
                        Your search for "{searchTerm}" did not return any results. Try different keywords.
                    </Text>
                </View>
            ) : employees.length === 0 && searchTerm === '' && !isLoading ? (
                <View style={styles.noDataContainer}>
                    <MaterialCommunityIcons name="account-multiple-plus-outline" size={90} color={styles.iconSubtle.color} />
                    <Text style={styles.noDataTitle}>Your Team Awaits!</Text>
                    <Text style={styles.noDataTextDetail}>Get started by adding your first employee.</Text>
                    <TouchableOpacity onPress={handleOpenAddForm}>
                        <LinearGradient
                            colors={paletteV2.gradientPrimaryButton}
                            style={styles.addNewFromEmptyStateButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={paletteV2.textPrimaryOnDark}/>
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

            {employees.length > 0 && (
                <Animated.View style={[styles.addEmployeeFabTouchable, { transform: [{ scale: fabScale }] }]}>
                <TouchableOpacity onPress={handleOpenAddForm}>
                    <LinearGradient
                        colors={paletteV2.gradientAccentButton}
                        style={styles.addEmployeeFab}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                    <MaterialCommunityIcons name="plus" size={30} color={paletteV2.textPrimaryOnDark} />
                    </LinearGradient>
                </TouchableOpacity>
                </Animated.View>
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
                <MaterialIcons name="chevron-left" size={32} color={(currentPage === 1 || !!loadingAction) ? styles.iconDisabled.color : paletteV2.primaryMain} />
                </TouchableOpacity>

                <Text style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
                </Text>

                <TouchableOpacity
                    onPress={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); closeMenu();}}
                    disabled={currentPage === totalPages || !!loadingAction}
                    style={styles.paginationNavButton}
                >
                <MaterialIcons name="chevron-right" size={32} color={(currentPage === totalPages || !!loadingAction) ? styles.iconDisabled.color : paletteV2.primaryMain} />
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
                        size={26}
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

            <EmployeeForm
                isVisible={isFormVisible}
                mode={formMode}
                employeeToEdit={editingEmployee}
                onSubmit={handleEmployeeFormSubmit}
                onClose={() => setIsFormVisible(false)}
            />

            <DeactivationModal
                isVisible={isDeactivationModalVisible}
                employee={employeeToProcess}
                onConfirm={handleConfirmDeactivation}
                onCancel={handleCancelModal}
                isLoading={loadingAction?.action === MENU_ACTIONS.DELETE_USER && loadingAction?.userId === employeeToProcess?.userId}
                resignationDate={resignationDateInput}
                onResignationDateChange={setResignationDateInput}
            />

            <DeletePermanentlyModal
                isVisible={isDeletePermanentlyModalVisible}
                employee={employeeToProcess}
                onConfirm={handleConfirmPermanentDelete}
                onCancel={handleCancelModal}
                isLoading={loadingAction?.action === MENU_ACTIONS.DELETE_USER_PERMANENTLY && loadingAction?.userId === employeeToProcess?.userId}
            />

            <ProfilePictureModal
                isVisible={isProfileImageModalVisible}
                imageUrl={selectedProfileImageUrl}
                defaultImage={defaultImage}
                onClose={closeProfileImageModal}
            />
        </View>
    </Card>
  );
};

export default DashboardScreen;