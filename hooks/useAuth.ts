import { useEffect, useState } from 'react';
import { isLoggedIn } from '@/utils/auth';

export function useAuthStatus() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const check = async () => {
      const ok = await isLoggedIn();
      setStatus(ok ? 'authenticated' : 'unauthenticated');
    };

    check();
  }, []);

  return status;
}
