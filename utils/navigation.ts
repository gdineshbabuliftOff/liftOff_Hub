import { Routes } from '@/constants/enums';
import { useRouter, type Href } from 'expo-router';

export const openURL = (path: Routes | string) => {
  const router = useRouter();
  router.navigate(path as unknown as Href);
};
