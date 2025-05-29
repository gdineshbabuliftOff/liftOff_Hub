import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deleteUser,
  deleteUserPermanently,
  disableEditRights,
  enableEditRights,
  fetchEmployeesData,
  sendReminder
} from '../Api/adminApi';
import Card from '../Layouts/Card';

import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Toast from 'react-native-toast-message';

const defaultImage = require('../../assets/images/newUser.png');
const noEmployeeImage = require('../../assets/images/noemployee.png');

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
}

interface EmployeesApiResponse {
  data: Employee[];
  total: number;
}

const SORTABLE_FIELDS = [
  { key: 'userId', label: 'User ID' },
  { key: 'email', label: 'Email' },
  { key: 'firstName', label: 'First Name' },
];

const DEFAULT_LIMIT = 100;
const ITEMS_PER_PAGE_OPTIONS = [100, 200, 500];

const MENU_ACTIONS = {
  REMINDER_EMAIL: 'Send Reminder',
  ENABLE_EDIT: 'Enable Edit',
  DISABLE_EDIT: 'Disable Edit',
  DOWNLOAD_DETAILS: 'Download Details',
  DOWNLOAD_DOCUMENTS: 'Download Documents',
  EDIT_USER: 'Edit User',
  DELETE_USER: 'Delete User',
  DELETE_USER_PERMANENTLY: 'Delete User Permanently',
};

// Ordered list of all menu items for rendering
const ALL_MENU_ITEMS_ORDERED = [
  MENU_ACTIONS.REMINDER_EMAIL,
  MENU_ACTIONS.ENABLE_EDIT,
  MENU_ACTIONS.DISABLE_EDIT,
  MENU_ACTIONS.DOWNLOAD_DETAILS,
  MENU_ACTIONS.DOWNLOAD_DOCUMENTS,
  MENU_ACTIONS.EDIT_USER, // Grouping related actions
  MENU_ACTIONS.DELETE_USER,
  MENU_ACTIONS.DELETE_USER_PERMANENTLY,
];


const DashboardScreen = () => {
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

  const paginationOpacity = useRef(new Animated.Value(0)).current;
  const paginationTranslateY = useRef(new Animated.Value(20)).current;

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
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
      Toast.show({type: 'error', text1: 'Fetch Failed', text2: 'Could not load employee data.'})
    } finally {
      if (showLoader) setIsLoading(false);
      if (isRefreshing) setIsRefreshing(false);
    }
  }, [currentPage, searchTerm, limit, sort, direction, isRefreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (totalEmployees > limit) {
      Animated.parallel([
        Animated.timing(paginationOpacity, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(paginationTranslateY, { toValue: 0, duration: 300, easing: Easing.ease, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(paginationOpacity, { toValue: 0, duration: 200, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(paginationTranslateY, { toValue: 20, duration: 200, easing: Easing.ease, useNativeDriver: true }),
      ]).start();
    }
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
    setMenuVisibleFor(null);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput.trim());
    setShowSortOptions(false);
    setMenuVisibleFor(null);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    setShowPerPageDropdown(false);
    setMenuVisibleFor(null);
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setMenuVisibleFor(null);
  }, []);

   useEffect(() => {
    if (isRefreshing) {
      fetchData(false);
    }
  }, [isRefreshing, fetchData]);

  const handleMenuToggle = (userId: number) => {
    if (loadingAction && loadingAction.userId === userId) return;
    setMenuVisibleFor((prev) => (prev === userId ? null : userId));
  };

  const handleMenuAction = async (action: string, employee: Employee) => {
    const ASYNC_ACTIONS_WITH_LOADER = [
      MENU_ACTIONS.REMINDER_EMAIL,
      MENU_ACTIONS.ENABLE_EDIT,
      MENU_ACTIONS.DISABLE_EDIT,
      MENU_ACTIONS.DELETE_USER,
      MENU_ACTIONS.DELETE_USER_PERMANENTLY,
    ];

    if (ASYNC_ACTIONS_WITH_LOADER.includes(action)) {
      if (loadingAction?.userId === employee.userId && loadingAction?.action === action) return;
      
      if (action === MENU_ACTIONS.DELETE_USER || action === MENU_ACTIONS.DELETE_USER_PERMANENTLY) {
        Alert.alert(
          action === MENU_ACTIONS.DELETE_USER ? "Confirm Deactivation" : "Confirm Permanent Deletion",
          `Are you sure you want to ${action.toLowerCase().replace('_', ' ')} for ${employee.firstName} ${employee.lastName}?` +
          (action === MENU_ACTIONS.DELETE_USER_PERMANENTLY ? "\nThis action cannot be undone." : ""),
          [
            { text: "Cancel", style: "cancel", onPress: () => { /* Optionally keep menu open or close: setMenuVisibleFor(null) */ } },
            { text: "Confirm", style: action === MENU_ACTIONS.DELETE_USER_PERMANENTLY ? "destructive" : "default", onPress: async () => {
                setLoadingAction({ userId: employee.userId, action });
                await executeAsyncAction(action, employee);
              }
            }
          ],
          { cancelable: true }
        );
      } else {
        setLoadingAction({ userId: employee.userId, action });
        await executeAsyncAction(action, employee);
      }
    } else {
      console.log(`Synchronous/Unhandled action: ${action} for User ID: ${employee.userId}`);
      if (action === MENU_ACTIONS.EDIT_USER) {
        console.log("Navigate to Edit User Screen for:", employee.userId);
      } else if (action === MENU_ACTIONS.DOWNLOAD_DETAILS) {
        console.log("Download details for:", employee.userId);
      } else if (action === MENU_ACTIONS.DOWNLOAD_DOCUMENTS) {
        console.log("Download documents for:", employee.userId);
      }
      setMenuVisibleFor(null);
    }
  };

  const executeAsyncAction = async (action: string, employee: Employee) => {
    try {
      let successMessage = '';
      let shouldRefetch = false;

      switch (action) {
        case MENU_ACTIONS.REMINDER_EMAIL:
          await sendReminder({ email: employee.email, name: `${employee.firstName} ${employee.lastName}` });
          successMessage = 'Reminder Sent Successfully';
          break;
        case MENU_ACTIONS.ENABLE_EDIT:
          await enableEditRights(employee.userId.toString());
          successMessage = 'Edit Rights Enabled Successfully';
          shouldRefetch = true;
          break;
        case MENU_ACTIONS.DISABLE_EDIT:
          await disableEditRights(employee.userId.toString());
          successMessage = 'Edit Rights Disabled Successfully';
          shouldRefetch = true;
          break;
        case MENU_ACTIONS.DELETE_USER:
          await deleteUser({ userId: employee.userId.toString() });
          successMessage = 'User Deactivated Successfully';
          shouldRefetch = true;
          break;
        case MENU_ACTIONS.DELETE_USER_PERMANENTLY:
          await deleteUserPermanently({ userId: employee.userId.toString() });
          successMessage = 'User Permanently Deleted Successfully';
          shouldRefetch = true;
          break;
      }

      Toast.show({ type: 'success', text1: successMessage, text2: `Action completed for ${employee.firstName}.` });
      if (shouldRefetch) {
        fetchData(false);
      }

    } catch (error: any) {
      console.error(`Failed to ${action} for user ${employee.userId}:`, error);
      const actionText = action.replace(/([A-Z])/g, ' $1').trim();
      Toast.show({
        type: 'error',
        text1: `${actionText} Failed`,
        text2: error.message || `Could not perform ${actionText.toLowerCase()}. Please try again.`,
      });
    } finally {
      setLoadingAction(null);
      setMenuVisibleFor(null);
    }
  }

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const isActionLoading = (action: string) => loadingAction?.userId === item.userId && loadingAction?.action === action;

    return (
      <View style={[styles.employeeCard, menuVisibleFor === item.userId && styles.employeeCardActive]}>
        <View style={styles.cardHeader}>
          <Image
            source={item.photoUrl ? { uri: item.photoUrl } : defaultImage}
            style={styles.employeeImage}
          />
          <View style={styles.employeeMainInfo}>
            <Text style={styles.employeeName}>{`${item.firstName} ${item.lastName}`}</Text>
            <Text style={styles.employeeEmail}>{item.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleMenuToggle(item.userId)}
            style={styles.menuButton}
            disabled={loadingAction?.userId === item.userId}
          >
            <MaterialCommunityIcons name="dots-vertical" size={28} color={loadingAction?.userId === item.userId ? "#ccc" : "#666"} />
          </TouchableOpacity>
        </View>

        {menuVisibleFor === item.userId && (
          <View style={styles.menuDropdown}>
            {ALL_MENU_ITEMS_ORDERED.map((actionName, index) => (
              <React.Fragment key={actionName}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(actionName, item)}
                  disabled={isActionLoading(actionName)}
                >
                  {isActionLoading(actionName) ? (
                    <ActivityIndicator size="small" color={
                      (actionName === MENU_ACTIONS.DELETE_USER || actionName === MENU_ACTIONS.DELETE_USER_PERMANENTLY) ? styles.menuItemTextDestructive.color : "#007BFF"
                    } />
                  ) : (
                    <Text style={[
                      styles.menuItemText,
                      actionName === MENU_ACTIONS.DELETE_USER && styles.menuItemTextDestructiveSimple,
                      actionName === MENU_ACTIONS.DELETE_USER_PERMANENTLY && styles.menuItemTextDestructive,
                    ]}>
                      {actionName}
                    </Text>
                  )}
                </TouchableOpacity>
                {index < ALL_MENU_ITEMS_ORDERED.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Employee Code:</Text> {item.employeeCode}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Status:</Text> {item.status}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Designation:</Text> {item.designation || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Date of Joining:</Text> {item.dateOfJoining || 'N/A'}
          </Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={() => console.log("View details for:", item.userId)}>
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <Card
      topNavBackgroundColor="#2A2A2A"
      topNavContent={
        <View>
          {!showSortOptions ? (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Search employees..."
                  placeholderTextColor="#999"
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchIconContainer}>
                  <Icon name="search" size={18} color="#555" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => { setShowSortOptions(true); setMenuVisibleFor(null); }}
                style={styles.toggleOptionsButton}
              >
                <MaterialIcons name="sort" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sortOptionsContainer}>
              <Text style={styles.sortByLabel}>Sort by:</Text>
              {SORTABLE_FIELDS.map((field) => (
                <TouchableOpacity
                  key={field.key}
                  onPress={() => handleSortToggle(field.key)}
                  style={[
                    styles.sortOptionButton,
                    sort === field.key && styles.sortOptionButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortOptionButtonText,
                      sort === field.key && styles.sortOptionButtonTextActive,
                    ]}
                  >
                    {field.label} {sort === field.key && (direction === 'asc' ? '↑' : '↓')}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => { setShowSortOptions(false); setMenuVisibleFor(null);}}
                style={styles.toggleOptionsButton}
              >
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
    >
      {isLoading && !isRefreshing && !loadingAction ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />
      ) : employees.length === 0 && searchTerm !== '' ? (
        <View style={styles.noDataContainer}>
          <Image source={noEmployeeImage} style={styles.noEmployeeImage} />
          <Text style={styles.noDataTitle}>No Employees Found</Text>
          <Text style={styles.noDataTextDetail}>
            No employees match your search criteria. Try a different term.
          </Text>
        </View>
      ) : employees.length === 0 && searchTerm === '' ? (
        <View style={styles.noDataContainer}>
          <Image source={noEmployeeImage} style={styles.noEmployeeImage} />
          <Text style={styles.noDataTitle}>No Employees Yet!</Text>
          <Text style={styles.noDataTextDetail}>Add your first team member to get started.</Text>
          <TouchableOpacity style={styles.addNewFromEmptyStateButton} onPress={() => { console.log("Add first employee"); setMenuVisibleFor(null);}}>
            <Text style={styles.addNewFromEmptyStateButtonText}>Add First Employee</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderEmployeeCard}
          contentContainerStyle={styles.listContainer}
          onScrollBeginDrag={() => {
            if (!loadingAction) {
                setMenuVisibleFor(null);
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#007BFF"
              colors={['#007BFF']}
            />
          }
        />
      )}

      <TouchableOpacity style={styles.addEmployeeButtonBottom} onPress={() => { console.log('Add new employee clicked!'); setMenuVisibleFor(null);}}>
        <Text style={styles.addEmployeeButtonBottomText}>+ Add New Employee</Text>
      </TouchableOpacity>

      {totalEmployees > limit && (
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
            onPress={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); setMenuVisibleFor(null); }}
            disabled={currentPage === 1 || !!loadingAction}
            style={styles.paginationButton}
          >
            <Text style={[styles.paginationButtonText, (currentPage === 1 || !!loadingAction) && styles.disabledPaginationText]}>
              Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            onPress={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); setMenuVisibleFor(null);}}
            disabled={currentPage === totalPages || !!loadingAction}
            style={styles.paginationButton}
          >
            <Text style={[styles.paginationButtonText, (currentPage === totalPages || !!loadingAction) && styles.disabledPaginationText]}>
              Next
            </Text>
          </TouchableOpacity>

          <View style={styles.itemsPerPageDropdownContainer}>
            <TouchableOpacity
              onPress={() => { setShowPerPageDropdown(!showPerPageDropdown); setMenuVisibleFor(null);}}
              style={styles.itemsPerPageDropdownTrigger}
              disabled={!!loadingAction}
            >
              <Text style={styles.itemsPerPageLabel}>Items:</Text>
              <Text style={styles.itemsPerPageCurrentText}>{limit}</Text>
              <MaterialIcons
                name={showPerPageDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color={!!loadingAction ? "#ccc" : "#333"}
              />
            </TouchableOpacity>
            {showPerPageDropdown && (
              <View style={styles.itemsPerPageDropdownOptions}>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleLimitChange(option)}
                    style={styles.itemsPerPageDropdownOption}
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
    </Card>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  searchIconContainer: {
    padding: 8,
  },
  toggleOptionsButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#555',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortByLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  sortOptionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  sortOptionButtonActive: {
    backgroundColor: '#007BFF',
  },
  sortOptionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sortOptionButtonTextActive: {
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  employeeCardActive: { // Added for active card
    zIndex: 10, // Ensure active card is above others for dropdown visibility
    elevation: 5, // Higher elevation for Android
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  employeeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  employeeMainInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuButton: {
    paddingLeft: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    top: 50,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: '#DDD',
    borderWidth: StyleSheet.hairlineWidth,
    // paddingVertical: 5, // Padding will be handled by items + dividers
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8, // Higher than card's default elevation
    zIndex: 1000, // High zIndex within the card
    minWidth: 220,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center', // Center loader if it's alone
  },
  menuItemText: {
    fontSize: 15,
    color: '#333333',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    // marginVertical: 0, // No vertical margin, divider is between items
    marginHorizontal: 10, // Optional horizontal margin for the divider line
  },
  menuItemTextDestructive: { // For permanently delete (bold red)
    color: '#D9534F',
    fontWeight: 'bold',
  },
  menuItemTextDestructiveSimple: { // For simple delete (red, not bold)
     color: '#D9534F',
  },
  cardDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#222',
  },
  viewDetailsButton: {
    marginTop: 15,
    backgroundColor: '#E0F2F7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noEmployeeImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataTextDetail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  addNewFromEmptyStateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  addNewFromEmptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addEmployeeButtonBottom: {
    backgroundColor: '#00C853',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addEmployeeButtonBottomText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  paginationButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
  },
  paginationButtonText: {
    color: '#007BFF',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledPaginationText: {
    color: '#B0B0B0',
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 5,
  },
  itemsPerPageDropdownContainer: {
    position: 'relative',
    marginLeft: 10,
  },
  itemsPerPageDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E9E9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  itemsPerPageLabel: {
    fontSize: 12,
    color: '#555',
    marginRight: 5,
  },
  itemsPerPageCurrentText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 5,
  },
  itemsPerPageDropdownOptions: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 5,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#CCC',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
    minWidth: 80,
    paddingVertical: 5,
    zIndex: 2000,
  },
  itemsPerPageDropdownOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  itemsPerPageDropdownOptionText: {
    fontSize: 13,
    color: '#333',
  },
  itemsPerPageOptionTextActive: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});