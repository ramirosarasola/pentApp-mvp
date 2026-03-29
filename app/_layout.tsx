import "@/global.css";
import { colors } from "@/app/constants/theme";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";

void SplashScreen.preventAutoHideAsync();

const spaceGroteskBold = require("@/assets/fonts/Space_Grotesk/SpaceGrotesk-Bold.ttf");

export default function RootLayout() {
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
  );
}
