import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  // Home Screen
  return (
    <View className="p-0">
      <Text className="text-xl font-bold text-blue-500">Welcome to Nativewind!</Text>
      <Link href={{ pathname: "/subscription/[id]", params: { id: "1" } }}>Subscription 1</Link>
      <Link href="/insights">Insights</Link>
      <Link href="/(auth)/log-in">LogIn</Link>
      <Link href="/(auth)/sign-in">SignIn</Link>
    </View>
  );
}
