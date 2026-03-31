import "@/src/polyfills/navigator-online";
import "@/global.css";
import { colors } from "@/src/constants/theme";
import { ClerkProvider } from "@clerk/expo";
import { resourceCache } from "@clerk/expo/resource-cache";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://d3c2441f4802733e0c7cb0015d418bb8@o4511089744740352.ingest.us.sentry.io/4511141008834560',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

void SplashScreen.preventAutoHideAsync();

const spaceGroteskBold = require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-Bold.ttf");
const publishableKey: string = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-light": require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-Light.ttf"),
    "sans-regular": require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-Regular.ttf"),
    "sans-medium": require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-Medium.ttf"),
    "sans-semibold": require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-SemiBold.ttf"),
    "sans-bold": spaceGroteskBold,
    "sans-extrabold": spaceGroteskBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#000000" />;
  }
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_resourceCache={resourceCache}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.tertiary,
          headerTitleStyle: { fontFamily: "sans-semibold", color: colors.quaternary },
          headerBackTitleStyle: { fontFamily: "sans-regular" },
          headerLargeTitleStyle: { fontFamily: "sans-bold" },
        }}
      />
    </ClerkProvider>
  );
});
