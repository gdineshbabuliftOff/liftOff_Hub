import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStatus } from '@/hooks/useAuth';
import { View, StyleSheet } from 'react-native';
import { openURL } from '@/utils/navigation';
import { Routes } from '@/constants/enums';

const publicRoutes = [
  '/login',
  '/signUp',
  '/forgot-password',
  '/reset-password',
];

export default function RootLayout() {
  const pathname = usePathname();
  const authStatus = useAuthStatus();

  useEffect(() => {
    if (authStatus === 'loading') return;

    const isPublic = publicRoutes.includes(pathname);
    const isAuthenticated = authStatus === 'authenticated';

    if (!isAuthenticated && !isPublic) {
      openURL(Routes.LOGIN);
    }

    if (isAuthenticated && isPublic) {
      openURL(Routes.HOME);
    }
  }, [authStatus, pathname]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
});
