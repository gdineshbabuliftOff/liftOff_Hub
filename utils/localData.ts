import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocalUserData {
  token: string;
  activeStep: number;
  userData: string;
}

export const getLocalData = async (): Promise<LocalUserData | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    const token = await AsyncStorage.getItem('token');
    const activeStep = await AsyncStorage.getItem('activeStep');

    if (userData && token && activeStep) {
      const parsedData: LocalUserData = {
        token: token,
        activeStep: parseInt(activeStep),
        userData: userData,
      };
      return parsedData;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving data from AsyncStorage', error);
    return null;
  }
};
