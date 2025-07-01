import { useAuthStatus } from '@/hooks/useAuth';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Redirect, Slot, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const publicRoutes = ['/login', '/signUp', '/reset-password', '/forgot-password'];

export default function RootLayout() {
  const pathname = usePathname();
  const { status: authStatus } = useAuthStatus();

  const handlePermissions = async () => {
    const notificationStatus = await Notifications.getPermissionsAsync();
    if (notificationStatus.status !== 'granted' && notificationStatus.status !== 'denied') {
      await Notifications.requestPermissionsAsync();
    }

    const mediaStatus = await MediaLibrary.getPermissionsAsync();
    if (mediaStatus.status !== 'granted' && mediaStatus.status !== 'denied') {
      await MediaLibrary.requestPermissionsAsync();
    }
  };

  useEffect(() => {
    handlePermissions();
  }, []);

  if (authStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isPublic = publicRoutes.includes(pathname);
  const isAuthenticated = authStatus === 'authenticated';

  if (!isAuthenticated && !isPublic) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && pathname === '/') {
    return <Redirect href="/profile" />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Toast />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
