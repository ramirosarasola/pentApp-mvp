import { type ScannerDeviceRow, useBluetoothScanner } from "@/app/hooks/use-bluetooth-scanner";
import { colors, spacing } from "@/app/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function pickDeviceGlyph(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes("obd") || n.includes("elm") || n.includes("vlinker")) {
    return "gauge";
  }
  if (n.includes("iphone") || n.includes("phone")) {
    return "cellphone";
  }
  if (n.includes("car") || n.includes("auto")) {
    return "car";
  }
  return "bluetooth";
}

function DeviceRow({
  item,
  isSelected,
  isConnected,
  onSelect,
}: {
  item: ScannerDeviceRow;
  isSelected: boolean;
  isConnected: boolean;
  onSelect: (id: string) => void;
}) {
  const glyph = pickDeviceGlyph(item.name);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(item.id)}
      className={`mb-3 flex-row items-center rounded-2xl px-3 py-3 active:opacity-90 ${
        isSelected ? "border border-tertiary bg-secondary" : "border border-transparent bg-card"
      }`}
    >
      <View className="size-12 items-center justify-center rounded-xl bg-primary">
        <MaterialCommunityIcons name={glyph} size={26} color={colors.tertiary} />
      </View>
      <View className="min-w-0 flex-1 pl-3">
        <Text className="font-sans-bold text-base text-white" numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          className="mt-0.5 font-sans-regular text-xs uppercase tracking-wide"
          style={{ color: isConnected ? colors.success : colors.mutedForeground }}
          numberOfLines={1}
        >
          {isConnected ? "Vinculado" : item.subtitle}
        </Text>
      </View>
      <View className="pl-2">
        {isSelected ? (
          <View
            className="size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: isConnected ? "rgba(47, 248, 1, 0.2)" : "rgba(0, 218, 243, 0.15)" }}
          >
            <MaterialCommunityIcons name="check" size={22} color={isConnected ? colors.success : colors.tertiary} />
          </View>
        ) : (
          <View className="size-9 rounded-full border border-quaternary/35" />
        )}
      </View>
    </Pressable>
  );
}

const Connect = () => {
  const {
    isNativeAvailable,
    devices,
    selectedId,
    setSelectedId,
    isScanning,
    isConnecting,
    connectedId,
    error,
    refreshBonded,
    startScan,
    connectSelected,
    disconnectScanner,
  } = useBluetoothScanner();

  useFocusEffect(
    useCallback(() => {
      void refreshBonded();
    }, [refreshBonded]),
  );

  const primaryLabel = (() => {
    if (connectedId) {
      return "Desconectar escáner";
    }
    if (selectedId) {
      return "Conectar escáner";
    }
    return "Sincronizar escáner";
  })();

  const onPrimaryPress = () => {
    if (connectedId) {
      void disconnectScanner();
      return;
    }
    if (selectedId) {
      void connectSelected();
      return;
    }
    void startScan();
  };

  const renderItem: ListRenderItem<ScannerDeviceRow> = ({ item }) => (
    <DeviceRow
      item={item}
      isSelected={selectedId === item.id}
      isConnected={connectedId === item.id}
      onSelect={setSelectedId}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View className="flex-1 px-5 pt-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="max-w-[220px] font-sans-bold text-lg uppercase tracking-wide text-white">
            Dispositivos cercanos
          </Text>
          {isScanning ? (
            <View className="flex-row items-center gap-1">
              <View className="h-2 w-2 rounded-full bg-tertiary" />
              <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-tertiary">Live sensing</Text>
            </View>
          ) : null}
        </View>

        {!isNativeAvailable ? (
          <View className="mb-4 rounded-xl border border-tertiary/30 bg-secondary/80 px-3 py-3">
            <Text className="font-sans-regular text-sm leading-5 text-quaternary">
              {Platform.OS === "web"
                ? "Bluetooth Classic (SPP) no está disponible en web. Usa Android o iOS con un development build."
                : "Genera un development build para usar Bluetooth: npx expo prebuild && npx expo run:android. Expo Go no incluye el módulo nativo."}
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text className="mb-3 font-sans-regular text-sm text-destructive">{error}</Text>
        ) : null}

        <FlatList
          data={devices}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing[4], flexGrow: devices.length === 0 ? 1 : undefined }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <MaterialCommunityIcons name="bluetooth-off" size={48} color={colors.mutedForeground} />
              <Text className="mt-4 text-center font-sans-regular text-sm text-quaternary">
                {isNativeAvailable ? "Sin dispositivos aún. Pulsa sincronizar para buscar." : "Conecta un adaptador OBD y usa un build nativo."}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View className="border-t border-border pt-4" style={{ paddingBottom: spacing[2] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            onPress={onPrimaryPress}
            disabled={isConnecting || isScanning}
            className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-tertiary active:opacity-90 disabled:opacity-50"
          >
            {isConnecting || isScanning ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="sync" size={22} color={colors.primary} />
            )}
            <Text className="font-sans-bold text-base uppercase tracking-wide text-primary">{primaryLabel}</Text>
          </Pressable>
          <Text className="mt-3 text-center font-sans-regular text-[10px] uppercase tracking-widest text-muted-foreground">
            Protocolo SAE J1979 · ISO 15031-5 · perfil SPP
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Connect;
