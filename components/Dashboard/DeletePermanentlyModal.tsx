import { Employee } from '@/constants/interface';
import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { paletteV2, styles } from '../Styles/DashBoardStyles';

interface DeletePermanentlyModalProps {
  isVisible: boolean;
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const DeletePermanentlyModal: React.FC<DeletePermanentlyModalProps> = ({
  isVisible,
  employee,
  onConfirm,
  onCancel,
  isLoading,
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
              name="alert-octagon"
              size={48}
              color={paletteV2.errorMain}
            />
          </View>
          <Text style={styles.confirmModalTitle}>Confirm Permanent Deletion</Text>
          <Text style={styles.confirmModalMessage}>
            Are you sure you want to permanently delete <Text style={{ fontWeight: 'bold' }}>{employee.firstName} {employee.lastName}</Text>?
            {"\n"}This action cannot be undone and is irreversible.
          </Text>

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
                styles.confirmModalDeleteButtonDestructive,
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

export default DeletePermanentlyModal;