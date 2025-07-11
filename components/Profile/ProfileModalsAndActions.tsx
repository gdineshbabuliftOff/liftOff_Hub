import { MENU_ACTIONS } from '@/constants/common';
import { Roles } from '@/constants/enums';
import { Employee, EmployeeFormData } from '@/constants/interface'; // Assuming these are defined elsewhere
import React from 'react';
import { Modal as ReactNativeModal, TouchableOpacity, View } from 'react-native';
import DeactivationModal from '../Dashboard/DeactivationModal';
import DeletePermanentlyModal from '../Dashboard/DeletePermanentlyModal';
import EmployeeActionMenu from '../Dashboard/EmployeeActions';
import EmployeeForm from '../Dashboard/EmployeeForm';
import ProfilePictureModal from '../Dashboard/ProfilePictureModal';
import { styles } from '../Styles/ProfileStyles';

const paletteV2 = {
    textPrimaryOnDark: '#FFFFFF',
    errorMain: '#E53935',
};

interface ProfileModalsAndActionsProps {
  loggedInUserRole: Roles | null;
  employeeForMenu: Employee | null;
  isAdminMenuVisible: boolean;
  setIsAdminMenuVisible: (visible: boolean) => void;
  loadingActionProfile: { userId: string; action: string } | null;
  isDeactivationModalVisibleProfile: boolean;
  setIsDeactivationModalVisibleProfile: (visible: boolean) => void;
  isDeletePermanentlyModalVisibleProfile: boolean;
  setIsDeletePermanentlyModalVisibleProfile: (visible: boolean) => void;
  resignationDateInputProfile: string;
  setResignationDateInputProfile: (date: string) => void;
  employeeToProcessForAction: Employee | null;
  handleAdminProfileMenuAction: (action: string, employeeDataForAction: Employee | null) => void;
  handleConfirmDeactivationProfile: () => Promise<void>;
  handleConfirmPermanentDeleteProfile: () => Promise<void>;
  handleCancelModalProfile: () => void;
  isProfileFormVisible: boolean;
  setIsProfileFormVisible: (visible: boolean) => void;
  editingProfileForForm: Employee | null;
  setEditingProfileForForm: (employee: Employee | null) => void;
  handleProfileFormSubmit: (formData: EmployeeFormData, formMode: 'add' | 'edit', employeeIdToEdit?: string) => Promise<void>;
  isProfilePicModalVisible: boolean;
  setIsProfilePicModalVisible: (visible: boolean) => void;
  profilePhotoUrl: string | null | undefined;
  defaultImage: any;
  targetUserId: string | null;
}

const ProfileModalsAndActions: React.FC<ProfileModalsAndActionsProps> = ({
  loggedInUserRole,
  employeeForMenu,
  isAdminMenuVisible,
  setIsAdminMenuVisible,
  loadingActionProfile,
  isDeactivationModalVisibleProfile,
  setIsDeactivationModalVisibleProfile,
  isDeletePermanentlyModalVisibleProfile,
  setIsDeletePermanentlyModalVisibleProfile,
  resignationDateInputProfile,
  setResignationDateInputProfile,
  employeeToProcessForAction,
  handleAdminProfileMenuAction,
  handleConfirmDeactivationProfile,
  handleConfirmPermanentDeleteProfile,
  handleCancelModalProfile,
  isProfileFormVisible,
  setIsProfileFormVisible,
  editingProfileForForm,
  setEditingProfileForForm,
  handleProfileFormSubmit,
  isProfilePicModalVisible,
  setIsProfilePicModalVisible,
  profilePhotoUrl,
  defaultImage,
  targetUserId,
}) => {
  return (
    <>
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
        imageUrl={profilePhotoUrl || null}
        defaultImage={defaultImage}
        onClose={() => setIsProfilePicModalVisible(false)}
      />
    </>
  );
};

export default ProfileModalsAndActions;