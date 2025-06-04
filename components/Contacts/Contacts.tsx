import { formatDate } from '@/constants/common';
import { EmployeeProfile } from '@/constants/types';
import { openURL } from '@/utils/navigation';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchAllEmployees } from '../Api/adminApi';
import ProfilePictureModal from '../Dashboard/ProfilePictureModal';
import Card from '../Layouts/Card';
import { styles } from '../Styles/ContactStyles';

const defaultImage = require('../../assets/images/newUser.png');

const ContactsScreen = () => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState<boolean>(false); // State for modal visibility

  const emptyImage = require('../..//assets/images/noemployee.png');

  const { email } = useLocalSearchParams();
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : '';

  const loadEmployees = async () => {
    try {
      const data = await fetchAllEmployees({
        search: '',
        page: '1',
        limit: '200',
        sortBy: 'user.firstName',
        sortOrder: 'ASC',
      });
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (normalizedEmail && employees.length > 0) {
      const cleanedEmail = normalizedEmail.replace(/\s+/g, '+').toLowerCase();
      const match = employees.find((emp: EmployeeProfile) =>
        emp.email.toLowerCase() === cleanedEmail
      );
      if (match) {
        setSelectedEmployee(match);
      } else {
        setSelectedEmployee(null);
      }
    } else if (!normalizedEmail) {
      setSelectedEmployee(null);
    }
  }, [normalizedEmail, employees]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchText, employees]);

  const clearSearch = () => {
    setSearchText('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
  };

  const openProfileModal = () => {
    if (selectedEmployee) {
      setIsProfileModalVisible(true);
    }
  };

  const closeProfileModal = () => {
    setIsProfileModalVisible(false);
  };

  const renderEmployee = ({ item }: { item: EmployeeProfile }) => (
    <TouchableOpacity style={styles.employeeItem} onPress={() => setSelectedEmployee(item)}>
      <Image
        source={item.photoUrl ? { uri: item.photoUrl } : defaultImage}
        style={styles.avatar}
      />
      <Text style={styles.employeeName}>{item.fullName}</Text>
    </TouchableOpacity>
  );

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRowVertical}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  const renderDetail = (emp: EmployeeProfile) => (
    <ScrollView contentContainerStyle={styles.detailContainer}>
      <TouchableOpacity onPress={openProfileModal}>
        <Image
          source={emp.photoUrl ? { uri: emp.photoUrl } : defaultImage}
          style={styles.detailAvatar}
        />
      </TouchableOpacity>
      <DetailRow label="About Me" value={emp.bio || 'N/A'} />
      <DetailRow label="Employee Id" value={emp.employeeCode} />
      <DetailRow label="Email" value={emp.email} />
      <DetailRow label="Phone" value={emp.phone || 'N/A'} />
      <DetailRow label="Date Of Birth" value={formatDate(emp.dateOfBirth)} />
      <DetailRow label="Blood Group" value={emp.bloodGroup || 'N/A'} />
      <DetailRow label="Address" value={emp.currentAddress || 'N/A'} />
    </ScrollView>
  );

  return (
    <Card
      topNavBackgroundColor="#fff"
      topNavContent={
        <View style={styles.navBar}>
          <View style={styles.navLeft}>
            {selectedEmployee ? (
              <TouchableOpacity onPress={() => {
                setSelectedEmployee(null);
                openURL('/contacts'); // Assuming openURL navigates back or clears params
              }}>
                <Ionicons name="arrow-back" size={24} color="#000" style={{ marginRight: 12 }} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="people" size={22} color="#000" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.navTitle}>
              {selectedEmployee ? selectedEmployee.fullName : ''}
            </Text>
          </View>
          {!selectedEmployee && (
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search"
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 ? (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="search" size={20} color="#888" />
              )}
            </View>
          )}
        </View>
      }
    >
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : selectedEmployee ? (
        renderDetail(selectedEmployee)
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={emptyImage} style={styles.emptyImage} />
          <Text style={styles.emptyText}>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.employeeCode}
          renderItem={renderEmployee}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {selectedEmployee && ( // Render modal only if an employee is selected
        <ProfilePictureModal
          isVisible={isProfileModalVisible}
          imageUrl={selectedEmployee.photoUrl || null} // Pass the selected employee's photoUrl
          defaultImage={defaultImage}
          onClose={closeProfileModal}
        />
      )}
    </Card>
  );
};

export default ContactsScreen;