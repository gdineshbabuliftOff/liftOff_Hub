// src/theme/fonts.ts
import { useFonts as useLato, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { useFonts as useWorkSans, WorkSans_400Regular, WorkSans_600SemiBold } from '@expo-google-fonts/work-sans';

export function useCustomFonts() {
  const [latoLoaded] = useLato({
    Lato_400Regular,
    Lato_700Bold,
  });

  const [workSansLoaded] = useWorkSans({
    WorkSans_400Regular,
    WorkSans_600SemiBold,
  });

  return latoLoaded && workSansLoaded;
}

// Optional: export font names as constants to avoid typos
export const Fonts = {
  LatoRegular: 'Lato_400Regular',
  LatoBold: 'Lato_700Bold',
  WorkSansRegular: 'WorkSans_400Regular',
  WorkSansSemiBold: 'WorkSans_600SemiBold',
};
