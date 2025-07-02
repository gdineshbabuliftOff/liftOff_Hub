import React from 'react';
import { Image, Modal, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { paletteV2, styles } from '../Styles/DashBoardStyles';

interface ProfilePictureModalProps {
  isVisible: boolean;
  imageUrl: string | null;
  defaultImage: any;
  onClose: () => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isVisible,
  imageUrl,
  defaultImage,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.profileImageModalOverlay}>
        <View style={styles.profileImageModalContent}>
          <Image source={imageUrl ? { uri: imageUrl } : defaultImage} style={styles.profileImageModalImage} resizeMode="contain" />
          <TouchableOpacity style={styles.profileImageModalCloseButton} onPress={onClose}>
            <MaterialCommunityIcons name="close-circle" size={36} color={paletteV2.neutralWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProfilePictureModal;