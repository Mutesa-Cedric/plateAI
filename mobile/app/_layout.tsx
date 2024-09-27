import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from 'react-native-toast-notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  //   Rubik: require("../assets/fonts/Rubik-Regular.ttf"),
  //   RubikBold: require("../assets/fonts/Rubik-Bold.ttf"),
  //   RubikMedium: require("../assets/fonts/Rubik-Medium.ttf"),
  //   RubikSemibold: require("../assets/fonts/Rubik-SemiBold.ttf"),
  // });

  // useEffect(() => {
  //   if (loaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [loaded]);

  // if (!loaded) {
  //   return null;
  // }

  return (
    <ToastProvider>
      <ThemeProvider value={DefaultTheme}>
        <GestureHandlerRootView>
          <Stack
          >
            <Stack.Screen
              name='index'
              options={{ headerShown: false }}
            />
            <Stack.Screen name='(auth)' options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ToastProvider>
  );
}