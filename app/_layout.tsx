import { Stack, usePathname, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStatus } from '@/hooks/useAuth';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function RootLayout() {
  const pathname = usePathname();
  const authStatus = useAuthStatus();

  useEffect(() => {
    if (authStatus === 'loading') return;

    const isPublic = publicRoutes.includes(pathname);
    const isAuthenticated = authStatus === 'authenticated';

    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
    }

    if (isAuthenticated && isPublic) {
      router.replace('/home');
    }
  }, [authStatus, pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
