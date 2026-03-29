import { Icons } from "@/app/constants/icons";
import { colors, spacing } from "@/app/constants/theme";
import type { ImageSourcePropType } from "react-native";
import { Image, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const cardGlow = Platform.select({
  ios: {
    shadowColor: colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
  default: {},
});

function DeviceCard({ icon, label, accessibilityLabel }: { icon: ImageSourcePropType; label: string; accessibilityLabel: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} className="items-center active:opacity-90" onPress={() => {}}>
      <View className="rounded-2xl bg-secondary p-4" style={cardGlow}>
        <Image source={icon} className="size-14" resizeMode="contain" accessibilityLabel={label} />
      </View>
      <Text className="mt-2 font-sans-semibold text-[10px] uppercase tracking-[2px] text-tertiary">{label}</Text>
    </Pressable>
  );
}

function BluetoothCenter() {
  return (
    <View className="relative h-16 w-16 items-center justify-center">
      <Image source={Icons.connectionBle} className="size-14" resizeMode="contain" accessibilityLabel="Bluetooth" />
      <View pointerEvents="none" className="absolute h-2 w-2 rounded-full bg-warning" style={{ top: "45%", left: "50%", marginLeft: -4, marginTop: -4 }} />
    </View>
  );
}

const Connect = () => {
  const { height: windowHeight } = useWindowDimensions();
  const paddingTop = Math.max(spacing[10], Math.round(windowHeight * 0.06));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: spacing[5],
          paddingTop,
          paddingBottom: spacing[4],
        }}
      >
        <View className="relative mx-auto w-full max-w-[320px]" style={{ minHeight: 280 }}>
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-[280px] w-[280px]">
              <View className="absolute inset-0 rounded-full border border-tertiary/20" />
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-[210px] w-[210px] rounded-full border border-tertiary/35" />
              </View>
            </View>
          </View>
          <View className="relative z-10 min-h-[280px] w-full flex-row items-center justify-center">
            <View className="min-w-0 flex-1 items-center">
              <DeviceCard icon={Icons.connectionPhone} label="Phone" accessibilityLabel="Conectar teléfono" />
            </View>
            <View className="w-20 shrink-0 items-center justify-center">
              <BluetoothCenter />
            </View>
            <View className="min-w-0 flex-1 items-center">
              <DeviceCard icon={Icons.connectionScanner} label="Scanner" accessibilityLabel="Conectar escáner" />
            </View>
          </View>
        </View>
        <View className="mt-10 items-center gap-3 px-2">
          <Text className="text-center font-sans-bold text-xl uppercase tracking-wide text-white">Estado: buscando…</Text>
          <Text className="max-w-sm text-center font-sans-regular text-base leading-6 text-quaternary">Asegúrese de que el encendido esté en ON</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Connect;
