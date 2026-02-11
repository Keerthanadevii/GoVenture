import { ThemeProvider } from "@/src/context/ThemeContext";
import { UserProvider } from "@/src/context/UserContext";
import 'expo-keep-awake';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {


      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReady(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Public screens */}
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />

            {/* Protected screens */}
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
