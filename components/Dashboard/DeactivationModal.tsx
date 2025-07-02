import { Employee } from '@/constants/interface';
import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { paletteV2, styles } from '../Styles/DashBoardStyles';

interface DeactivationModalProps {
  isVisible: boolean;
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  resignationDate: string;
  onResignationDateChange: (date: string) => void;
}

const DeactivationModal: React.FC<DeactivationModalProps> = ({
  isVisible,
  employee,
  onConfirm,
  onCancel,
  isLoading,
  resignationDate,
  onResignationDateChange,
}) => {
  if (!employee) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalIconContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color={paletteV2.warningMain}
            />
          </View>
          <Text style={styles.confirmModalTitle}>Confirm Deactivation</Text>
          <Text style={styles.confirmModalMessage}>
            Are you sure you want to deactivate <Text style={{ fontWeight: 'bold' }}>{employee.firstName} {employee.lastName}</Text>?
          </Text>

          <View style={styles.resignationDateContainer}>
            <Text style={styles.formLabel}>Resignation Date <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={styles.formInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={paletteV2.textPlaceholderOnLight}
              value={resignationDate}
              onChangeText={onResignationDateChange}
              maxLength={10}
              editable={!isLoading}
            />
          </View>

          <View style={styles.confirmModalActions}>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.confirmModalButtonText, styles.confirmModalCancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                styles.confirmModalDeleteButtonWarn,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={paletteV2.textPrimaryOnDark} />
              ) : (
                <Text style={styles.confirmModalButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeactivationModal;