import { Employee } from '@/constants/interface';
import React from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { paletteV2, styles } from '../Styles/DashBoardStyles';
import EmployeeActionMenu from './EmployeeActions';

interface EmployeeDetailsCardProps {
  employee: Employee;
  isMenuOpen: boolean;
  loadingAction: { userId: number; action: string } | null;
  defaultImage: any;
  onMenuToggle: (userId: number) => void;
  onAction: (action: string, employee: Employee) => void;
  onViewProfile: (employee: Employee) => void;
  onOpenProfileImageModal: (imageUrl: string | undefined) => void;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
  employee,
  isMenuOpen,
  loadingAction,
  defaultImage,
  onMenuToggle,
  onAction,
  onViewProfile,
  onOpenProfileImageModal,
}) => {
  return (
    <Animated.View style={[styles.employeeCard, isMenuOpen && styles.employeeCardActive]}>
      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={() => onOpenProfileImageModal(employee.photoUrl)}>
          <Image
            source={employee.photoUrl ? { uri: employee.photoUrl } : defaultImage}
            style={styles.employeeImage}
          />
        </TouchableOpacity>
        <View style={styles.employeeMainInfo}>
          <Text style={styles.employeeNameText}>{`${employee.firstName} ${employee.lastName}`}</Text>
          <Text style={styles.employeeEmailText}>{employee.email}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onMenuToggle(employee.userId)}
          style={styles.menuButton}
          disabled={loadingAction?.userId === employee.userId && !!loadingAction?.action && !isMenuOpen}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name={isMenuOpen ? "close-circle-outline" : "dots-vertical"}
            size={28}
            color={(loadingAction?.userId === employee.userId && !!loadingAction?.action && !isMenuOpen) ? styles.iconDisabled.color : (isMenuOpen ? paletteV2.primaryMain : paletteV2.iconDefault)}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Emp Code:</Text>
          <Text style={styles.detailValue}>{employee.employeeCode}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={styles.detailValue}>{employee.status}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Designation:</Text>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">{employee.designation || 'N/A'}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Joined On:</Text>
          <Text style={styles.detailValue}>{employee.dateOfJoining || 'N/A'}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Edit Rights:</Text>
          <Text style={[styles.detailValue, { fontWeight: 'bold', color: employee.editRights ? paletteV2.successMain : paletteV2.warningMain }]}>{employee.editRights ? 'Enabled' : 'Disabled'}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>Profile Status:</Text>
          <Text style={[styles.detailValue, { fontWeight: 'bold', color: typeof employee.allFieldsFilled === 'boolean' ? (employee.allFieldsFilled ? paletteV2.successMain : paletteV2.errorMain) : paletteV2.neutralLight }]}>
            {typeof employee.allFieldsFilled === 'boolean' ? (employee.allFieldsFilled ? 'Complete' : 'Incomplete') : 'N/A'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.viewDetailsButton} onPress={() => onViewProfile(employee)}>
        <Text style={styles.viewDetailsButtonText}>View Full Profile</Text>
        <MaterialIcons name="arrow-forward-ios" size={16} color={paletteV2.primaryDark} style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <EmployeeActionMenu
        employee={employee}
        isVisible={isMenuOpen}
        onAction={onAction}
        loadingAction={loadingAction}
      />
    </Animated.View>
  );
};

export default EmployeeDetailsCard;