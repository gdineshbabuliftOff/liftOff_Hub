import { getLocalData } from '@/utils/localData';
import { useEffect, useState } from 'react';

export function useAuthStatus() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const check = async() => {
      const localdata = await getLocalData();
      const token = localdata?.token;
      if (token) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    };

    check();
  }, []);

  return status;
}
