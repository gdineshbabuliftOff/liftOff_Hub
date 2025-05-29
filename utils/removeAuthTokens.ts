import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('token');
    Toast.show({
      type: 'info',
      text1: 'Logged Out',
      text2: 'You have been successfully logged out.',
    });
    router.replace('/login');
  } catch (error) {
    console.error('Error clearing user data:', error);
    Toast.show({
      type: 'error',
      text1: 'Logout Failed',
      text2: 'Could not clear user session.',
    });
  }
};
