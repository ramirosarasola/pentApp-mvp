import "@/global.css";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function RootLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack initialRouteName="sign-in" screenOptions={{ headerShown: false }} />;
}
