import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (token: string) => {
  await AsyncStorage.setItem('userToken', token);
};

export const logout = async () => {
  await AsyncStorage.removeItem('userToken');
};

export const isLoggedIn = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('userToken');
  return !!token;
};
