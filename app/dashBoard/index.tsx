import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openURL } from '@/utils/navigation';
import { getLocalData } from '@/utils/localData';
import { logoutUser } from '@/components/Api/authentication';
import { Routes } from '@/constants/enums';

export default function Dashboard() {
  const handleLogout = async () => {
    try {
      const localdata = await getLocalData();
      const token = localdata?.token;
      await logoutUser(token);
      await AsyncStorage.clear();
      openURL(Routes.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Welcome to the Dashboard!</Text>
      <Pressable
        onPress={handleLogout}
        style={{ marginTop: 20, padding: 10, backgroundColor: '#000', borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>Logout</Text>
      </Pressable>
    </View>
  );
}
