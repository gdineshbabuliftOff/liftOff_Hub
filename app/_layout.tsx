import { getLocalData } from '@/utils/localData';
import { Redirect, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const publicRoutes = ['/login', '/signUp', '/reset-password', '/forgot-password'];

export default function RootLayout() {
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const check = async () => {
      const localdata = await getLocalData();
      const token = localdata?.token;
      if (token) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    };

    check();
  }, [pathname]);

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

  if (isAuthenticated && isPublic) {
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
