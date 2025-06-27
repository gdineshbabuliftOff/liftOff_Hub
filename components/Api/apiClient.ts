// src/utils/apiClient.ts
import env from '@/config/env';
import { removeAuthToken } from '@/utils/removeAuthTokens';
import Toast from 'react-native-toast-message';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method: Method;
  body?: any;
  token?: string;
  headers?: Record<string, string>;
}

const tryAgain = 'Something went wrong. Please try again.';

const apiClient = async <T extends object>(
  endpoint: string,
  { method, body, token, headers = {} }: RequestOptions
): Promise<T | null> => {
  const url = `${env.API_BASE_URL}${endpoint}`;

  const isFormData = headers['Content-Type'] === 'multipart/form-data';

  const config: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body
      ? isFormData
        ? { body }
        : { body: JSON.stringify(body) }
      : {}),
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || tryAgain;

      if ([401, 403].includes(response.status)) {
        await removeAuthToken();
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again.',
        });
        return null;
      }
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: message,
    //   });

      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return null;
    }

    const data: T = await response.json();
    return Object.keys(data).length ? data : null;
  } catch (err: any) {
    console.log(err);
    Toast.show({
      type: 'error',
      text1: 'Network Error',
      text2: err?.message || tryAgain,
    });
    return null;
  }
};

export default apiClient;
