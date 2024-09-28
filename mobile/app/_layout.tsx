import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from 'react-native-toast-notifications';
import { AuthProvider } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { RecoilRoot } from 'recoil';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PeachMelon: require('../assets/fonts/PeachMelon-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ToastProvider>
      <RecoilRoot>
        <ThemeProvider value={DefaultTheme}>
          <AuthProvider>
            <GestureHandlerRootView>
              <Stack
              >
                <Stack.Screen
                  name='index'
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name='(auth)' options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </GestureHandlerRootView>
          </AuthProvider>
        </ThemeProvider>
      </RecoilRoot>
    </ToastProvider>
  );
}