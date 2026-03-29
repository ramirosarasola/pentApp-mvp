import { Icons } from "@/app/constants/icons";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FLEET_HEALTH_PERCENT = 92;

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 flex-col gap-8 px-5 pt-4">
        <View className="w-full overflow-hidden rounded-[20px] border-l-4 border-tertiary bg-secondary p-6 h-30">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text className="font-sans-regular text-[11px] uppercase tracking-[1.5px] text-quaternary">Global fleet health</Text>
              <View className="mt-2 flex-row items-baseline">
                <Text className="font-sans-bold text-5xl leading-none text-tertiary">{FLEET_HEALTH_PERCENT}</Text>
                <Text className="ml-0.5 font-sans-bold text-2xl leading-none text-tertiary">%</Text>
              </View>
            </View>
            <View className="size-[52px] items-center justify-center rounded-2xl bg-primary">
              <Image source={Icons.fleetHealth} className="size-9" resizeMode="contain" accessibilityLabel="Fleet health indicator" />
            </View>
          </View>
          <View className="mt-6 flex-row items-center gap-3">
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-quaternary/15">
              <View className="h-full rounded-full bg-tertiary" style={{ width: `${FLEET_HEALTH_PERCENT}%` }} />
            </View>
            <Text className="font-sans-regular text-[11px] uppercase tracking-wide text-quaternary">Optimal</Text>
          </View>
        </View>
        <View className="h-[100px] max-h-[100px] w-full flex-row gap-3">
          <View className="min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg bg-card px-1 py-2">
            <Text className="font-sans-bold text-2xl text-tertiary">10</Text>
            <Text className="mt-1 font-sans-regular text-[10px] uppercase tracking-wide text-quaternary">Good</Text>
          </View>
          <View className="min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg bg-card px-1 py-2">
            <Text className="font-sans-bold text-2xl text-tertiary">10</Text>
            <Text className="mt-1 font-sans-regular text-[10px] uppercase tracking-wide text-quaternary">Attention</Text>
          </View>
          <View className="min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg bg-card px-1 py-2">
            <Text className="font-sans-bold text-2xl text-tertiary">10</Text>
            <Text className="mt-1 font-sans-regular text-[10px] uppercase tracking-wide text-quaternary">Critical</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear ahora"
          className="h-16 w-full items-center justify-center rounded-md bg-tertiary active:opacity-90"
          onPress={() => {}}
        >
          <Text className="text-center font-sans-bold text-lg uppercase leading-none tracking-wide text-primary">
            Escanear ahora
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
