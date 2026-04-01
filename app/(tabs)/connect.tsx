import { colors, spacing } from "@/src/constants/theme";
import { useBluetoothScanner, type ScannerDeviceRow } from "@/src/hooks/use-bluetooth-scanner";
import { useDrivingRecord } from "@/src/hooks/use-driving-record";
import { useGarageApiJson } from "@/src/hooks/use-garage-api-json";
import { useObdSession } from "@/src/hooks/use-obd-session";
import type { GarageVehicle } from "@/src/services/garage/garage-vehicle";
import type { LiveTelemetry, ObdConnectionStatus } from "@/src/obd/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, Switch, Text, View, type ListRenderItem } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatVehicleLabel(vehicle: GarageVehicle): string {
  const label = vehicle.label?.trim();
  if (label) {
    return label;
  }
  const plate = vehicle.plate?.trim();
  if (plate) {
    return plate;
  }
  return "Vehículo";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Misma heurística que el icono "gauge": nombres típicos de adaptadores OBD por Bluetooth. */
function isLikelyObdScannerName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.includes("obd") || n.includes("elm") || n.includes("vlinker") || n.includes("icar") || n.includes("vgate") || n.includes("veepeak");
}

function pickDeviceGlyph(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const n = name.toLowerCase();
  if (isLikelyObdScannerName(name)) return "gauge";
  if (n.includes("iphone") || n.includes("phone")) return "cellphone";
  if (n.includes("car") || n.includes("auto")) return "car";
  return "bluetooth";
}

function formatTelemetryValue(value: number | null, decimals = 0): string {
  if (value === null) return "—";
  return value.toFixed(decimals);
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function DeviceRow({ item, isSelected, isConnected, onSelect }: { item: ScannerDeviceRow; isSelected: boolean; isConnected: boolean; onSelect: (id: string) => void }) {
  const glyph = pickDeviceGlyph(item.name);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: isSelected }} onPress={() => onSelect(item.id)} className={`mb-3 flex-row items-center rounded-2xl px-3 py-3 active:opacity-90 ${isSelected ? "border border-tertiary bg-secondary" : "border border-transparent bg-card"}`}>
      <View className="size-12 items-center justify-center rounded-xl bg-primary">
        <MaterialCommunityIcons name={glyph} size={26} color={colors.tertiary} />
      </View>
      <View className="min-w-0 flex-1 pl-3">
        <Text className="font-sans-bold text-base text-white" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-0.5 font-sans-regular text-xs uppercase tracking-wide" style={{ color: isConnected ? colors.success : colors.mutedForeground }} numberOfLines={1}>
          {isConnected ? "Vinculado" : item.subtitle}
        </Text>
      </View>
      <View className="pl-2">
        {isSelected ? (
          <View
            className="size-9 items-center justify-center rounded-full"
            style={{
              backgroundColor: isConnected ? "rgba(47, 248, 1, 0.2)" : "rgba(0, 218, 243, 0.15)",
            }}
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

function ObdStatusChip({ status }: { status: ObdConnectionStatus }) {
  const config: Record<ObdConnectionStatus, { label: string; color: string; bg: string }> = {
    not_connected: { label: "Sin señal OBD", color: colors.mutedForeground, bg: "rgba(255,255,255,0.06)" },
    initializing: { label: "Inicializando ELM327…", color: colors.tertiary, bg: "rgba(0, 218, 243, 0.12)" },
    connected: { label: "OBD en vivo", color: colors.success, bg: "rgba(47, 248, 1, 0.12)" },
    error: { label: "Error OBD", color: colors.destructive, bg: "rgba(255,80,80,0.12)" },
  };
  const { label, color, bg } = config[status];
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5" style={{ backgroundColor: bg }}>
      {status === "initializing" ? <ActivityIndicator size={10} color={color} /> : <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      <Text className="font-sans-semibold text-[11px] uppercase tracking-wider" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function TelemetryGrid({ telemetry }: { telemetry: LiveTelemetry }) {
  const items = [
    { label: "RPM", value: formatTelemetryValue(telemetry.rpm), unit: "" },
    { label: "Velocidad", value: formatTelemetryValue(telemetry.speed), unit: "km/h" },
    { label: "Temp. motor", value: formatTelemetryValue(telemetry.engineTemp), unit: "°C" },
    { label: "Carga motor", value: formatTelemetryValue(telemetry.engineLoad, 1), unit: "%" },
    { label: "Throttle", value: formatTelemetryValue(telemetry.throttle, 1), unit: "%" },
    { label: "MAF", value: formatTelemetryValue(telemetry.maf, 1), unit: "g/s" },
    { label: "Temp. adm.", value: formatTelemetryValue(telemetry.intakeTemp), unit: "°C" },
    { label: "Voltaje", value: formatTelemetryValue(telemetry.voltage, 1), unit: "V" },
  ];
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View key={item.label} className="w-[47.5%] rounded-xl bg-card px-3 py-3">
          <Text className="font-sans-regular text-[10px] uppercase tracking-widest text-quaternary">{item.label}</Text>
          <Text className="mt-1 font-sans-bold text-xl text-white">
            {item.value}
            {item.unit ? <Text className="font-sans-regular text-sm text-quaternary"> {item.unit}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RecordButton({ isRecording, isSubmitting, isDisabled, sampleCount, onPress }: { isRecording: boolean; isSubmitting: boolean; isDisabled: boolean; sampleCount: number; onPress: () => void }) {
  if (isSubmitting) {
    return (
      <View className="h-16 w-full flex-row items-center justify-center gap-3 rounded-2xl bg-secondary">
        <ActivityIndicator color={colors.tertiary} />
        <Text className="font-sans-semibold text-sm uppercase tracking-wider text-quaternary">Enviando grabación…</Text>
      </View>
    );
  }

  if (isRecording) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Detener grabación" onPress={onPress} className="h-16 w-full flex-row items-center justify-center gap-3 rounded-2xl active:opacity-85" style={{ backgroundColor: "rgba(255, 59, 48, 0.15)", borderWidth: 1, borderColor: "rgba(255,59,48,0.5)" }}>
        <View className="h-4 w-4 rounded-sm" style={{ backgroundColor: colors.destructive }} />
        <View>
          <Text className="font-sans-bold text-base uppercase tracking-wide" style={{ color: colors.destructive }}>
            Detener grabación
          </Text>
          <Text className="font-sans-regular text-[11px] text-quaternary">
            {sampleCount} {sampleCount === 1 ? "muestra" : "muestras"} acumuladas
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Iniciar grabación" onPress={onPress} disabled={isDisabled} className="h-16 w-full flex-row items-center justify-center gap-3 rounded-2xl active:opacity-85 disabled:opacity-40" style={{ backgroundColor: colors.destructive }}>
      <View className="h-4 w-4 rounded-full border-2 border-white bg-white opacity-90" />
      <Text className="font-sans-bold text-base uppercase tracking-wide text-white">Iniciar grabación</Text>
    </Pressable>
  );
}

function GarageVehicleRow({
  vehicle,
  isSelected,
  onSelect,
}: {
  vehicle: GarageVehicle;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(vehicle.id)}
      className={`mb-2 flex-row items-center rounded-2xl border px-3 py-3 active:opacity-90 ${isSelected ? "border-tertiary bg-secondary" : "border-border bg-primary"}`}
    >
      <View className="size-10 items-center justify-center rounded-xl bg-card">
        <MaterialCommunityIcons name="car" size={22} color={colors.tertiary} />
      </View>
      <View className="min-w-0 flex-1 pl-3">
        <Text className="font-sans-bold text-base text-white" numberOfLines={1}>
          {formatVehicleLabel(vehicle)}
        </Text>
        {vehicle.plate ? (
          <Text className="mt-0.5 font-sans-regular text-xs text-quaternary" numberOfLines={1}>
            {vehicle.plate}
          </Text>
        ) : null}
      </View>
      {vehicle.isPrimary ? (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "rgba(0, 218, 243, 0.15)" }}>
          <Text className="font-sans-semibold text-[10px] uppercase tracking-wide text-tertiary">Principal</Text>
        </View>
      ) : null}
      <View className="pl-2">
        {isSelected ? (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.tertiary} />
        ) : (
          <View className="size-6 rounded-full border border-quaternary/40" />
        )}
      </View>
    </Pressable>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

const Connect = () => {
  const router = useRouter();
  const { isNativeAvailable, devices, selectedId, setSelectedId, isScanning, isConnecting, connectedId, error: btError, refreshBonded, startScan, connectSelected, disconnectScanner } = useBluetoothScanner();

  const [showOnlyScanners, setShowOnlyScanners] = useState(true);
  const filteredDevices = useMemo(() => {
    if (!showOnlyScanners) {
      return devices;
    }
    return devices.filter((d) => isLikelyObdScannerName(d.name));
  }, [devices, showOnlyScanners]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    if (!filteredDevices.some((d) => d.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredDevices, selectedId, setSelectedId]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [modalVehicleId, setModalVehicleId] = useState<string | null>(null);

  const { connectionStatus: obdStatus, telemetry, dtcs, error: obdError, startSession: startObdSession, stopSession: stopObdSession } = useObdSession();

  const { isLoading: isGarageLoading, errorMessage: garageError, responseJson: garageResponse, executeRefresh: executeRefreshGarage } = useGarageApiJson();
  const garageItems = useMemo(() => garageResponse?.items ?? [], [garageResponse]);
  const hasGarageVehicles = garageItems.length > 0;

  const { isServerSessionReady, isRecording, isSubmitting, submitError, sampleCount, executeStartRecording, executeStopRecording } = useDrivingRecord({
    obdConnectionStatus: obdStatus,
    telemetry,
    dtcs,
    vehicleId: selectedVehicleId,
  });

  useEffect(() => {
    if (!vehicleModalVisible) {
      return;
    }
    const list = garageResponse?.items ?? [];
    if (list.length === 0) {
      setModalVehicleId(null);
      return;
    }
    setModalVehicleId((prev) => {
      if (prev && list.some((i) => i.id === prev)) {
        return prev;
      }
      return selectedVehicleId ?? list.find((v) => v.isPrimary)?.id ?? list[0]!.id;
    });
  }, [vehicleModalVisible, garageResponse, selectedVehicleId]);

  // Auto-start OBD session cuando el scanner BT se conecta
  const prevConnectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevConnectedIdRef.current;
    prevConnectedIdRef.current = connectedId;
    if (connectedId && connectedId !== prev) {
      void startObdSession();
    }
    if (!connectedId && prev) {
      stopObdSession();
    }
  }, [connectedId, startObdSession, stopObdSession]);

  useFocusEffect(
    useCallback(() => {
      void refreshBonded();
    }, [refreshBonded]),
  );

  const handleRecordPress = () => {
    if (isRecording) {
      void executeStopRecording();
    } else {
      executeStartRecording();
    }
  };

  const openVehicleModalForConnect = useCallback(() => {
    void executeRefreshGarage();
    setVehicleModalVisible(true);
  }, [executeRefreshGarage]);

  const handleConfirmVehicleAndConnect = useCallback(async () => {
    if (!modalVehicleId) {
      return;
    }
    setSelectedVehicleId(modalVehicleId);
    setVehicleModalVisible(false);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await connectSelected();
  }, [modalVehicleId, connectSelected]);

  const handlePrimaryPress = () => {
    if (connectedId) {
      void disconnectScanner();
      return;
    }
    if (selectedId) {
      openVehicleModalForConnect();
      return;
    }
    void startScan();
  };

  const primaryLabel = (() => {
    if (connectedId) return "Desconectar escáner";
    if (selectedId) return "Conectar escáner";
    return "Sincronizar escáner";
  })();

  const isConnectBlockedByEmptyGarage = Boolean(selectedId) && !connectedId && !isGarageLoading && !hasGarageVehicles;

  const selectedVehicleSummary = useMemo(() => {
    if (!selectedVehicleId) {
      return null;
    }
    return garageItems.find((v) => v.id === selectedVehicleId) ?? null;
  }, [garageItems, selectedVehicleId]);

  const renderItem: ListRenderItem<ScannerDeviceRow> = ({ item }) => <DeviceRow item={item} isSelected={selectedId === item.id} isConnected={connectedId === item.id} onSelect={setSelectedId} />;

  const renderGarageVehicle: ListRenderItem<GarageVehicle> = ({ item }) => (
    <GarageVehicleRow vehicle={item} isSelected={modalVehicleId === item.id} onSelect={setModalVehicleId} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["left", "right"]}>
      <View className="flex-1 px-5 pt-2">
        {/* ── Panel OBD: visible cuando hay scanner conectado ── */}
        {connectedId ? (
          <View style={{ flex: 1 }}>
            {/* Header status */}
            <View className="mb-4 flex-row items-center justify-between">
              <ObdStatusChip status={obdStatus} />
              {obdStatus === "connected" && isServerSessionReady && (
                <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: "rgba(0, 218, 243, 0.08)" }}>
                  <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.tertiary }} />
                  <Text className="font-sans-regular text-[10px] uppercase tracking-widest text-tertiary">Sesión activa</Text>
                </View>
              )}
            </View>

            {/* Error OBD */}
            {obdError ? (
              <View className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3">
                <Text className="font-sans-regular text-sm" style={{ color: colors.destructive }}>
                  {obdError}
                </Text>
              </View>
            ) : null}

            {/* Error de grabación */}
            {submitError ? (
              <View className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3">
                <Text className="font-sans-regular text-sm" style={{ color: colors.destructive }}>
                  {submitError}
                </Text>
              </View>
            ) : null}

            {/* Grid de telemetría */}
            {obdStatus === "connected" ? (
              <View style={{ flex: 1 }}>
                <TelemetryGrid telemetry={telemetry} />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.tertiary} />
                <Text className="mt-4 font-sans-regular text-sm text-quaternary">Inicializando adaptador…</Text>
              </View>
            )}

            {/* Footer: botón RECORD + desconectar */}
            <View className="border-t border-border pt-4" style={{ paddingBottom: spacing[2] }}>
              {obdStatus === "connected" && (
                <View className="mb-3">
                  <RecordButton isRecording={isRecording} isSubmitting={isSubmitting} isDisabled={!isServerSessionReady} sampleCount={sampleCount} onPress={handleRecordPress} />
                  {!isServerSessionReady && !submitError && obdStatus === "connected" && <Text className="mt-2 text-center font-sans-regular text-[11px] text-quaternary">Conectando con el servidor…</Text>}
                </View>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel="Desconectar escáner" onPress={handlePrimaryPress} disabled={isConnecting} className="h-12 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card active:opacity-80 disabled:opacity-50">
                {isConnecting ? <ActivityIndicator color={colors.mutedForeground} /> : <MaterialCommunityIcons name="bluetooth-off" size={18} color={colors.mutedForeground} />}
                <Text className="font-sans-semibold text-sm uppercase tracking-wide text-quaternary">Desconectar escáner</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── Panel BT: visible cuando no hay scanner conectado ── */
          <>
            {selectedVehicleSummary ? (
              <View className="mb-3 rounded-2xl border border-border bg-card px-3 py-3">
                <Text className="font-sans-regular text-[10px] uppercase tracking-widest text-quaternary">Vehículo para la sesión OBD</Text>
                <Text className="mt-1 font-sans-bold text-base text-white" numberOfLines={1}>
                  {formatVehicleLabel(selectedVehicleSummary)}
                </Text>
              </View>
            ) : null}

            <View className="mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="max-w-[220px] font-sans-bold text-lg uppercase tracking-wide text-white">Dispositivos cercanos</Text>
                {isScanning ? (
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-tertiary" />
                    <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-tertiary">Live sensing</Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-border bg-card px-3 py-3">
                <View className="min-w-0 flex-1 pr-3">
                  <Text className="font-sans-semibold text-sm text-white">Solo escáners OBD</Text>
                  <Text className="mt-1 font-sans-regular text-[11px] leading-4 text-quaternary">Oculta el resto según el nombre Bluetooth (OBD, ELM327, Vlinker, etc.).</Text>
                </View>
                <Switch accessibilityLabel="Mostrar solo escáners OBD" accessibilityState={{ checked: showOnlyScanners }} value={showOnlyScanners} onValueChange={setShowOnlyScanners} trackColor={{ false: colors.border, true: "rgba(0, 218, 243, 0.35)" }} thumbColor={showOnlyScanners ? colors.tertiary : colors.mutedForeground} ios_backgroundColor={colors.border} />
              </View>
            </View>

            {!isNativeAvailable ? (
              <View className="mb-4 rounded-xl border border-tertiary/30 bg-secondary/80 px-3 py-3">
                <Text className="font-sans-regular text-sm leading-5 text-quaternary">{Platform.OS === "web" ? "Bluetooth Classic (SPP) no está disponible en web. Usa Android o iOS con un development build." : "Genera un development build para usar Bluetooth: npx expo prebuild && npx expo run:android."}</Text>
              </View>
            ) : null}

            {btError ? <Text className="mb-3 font-sans-regular text-sm text-destructive">{btError}</Text> : null}

            {isConnectBlockedByEmptyGarage ? (
              <View className="mb-3 rounded-xl border border-warning/40 bg-warning/10 px-3 py-3">
                <Text className="font-sans-regular text-sm leading-5" style={{ color: colors.warning }}>
                  Añade al menos un vehículo en Garage antes de conectar el adaptador.
                </Text>
              </View>
            ) : null}

            <FlatList
              data={filteredDevices}
              keyExtractor={(d) => d.id}
              renderItem={renderItem}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: spacing[4],
                flexGrow: filteredDevices.length === 0 ? 1 : undefined,
              }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center px-2 py-16">
                  <MaterialCommunityIcons name="bluetooth-off" size={48} color={colors.mutedForeground} />
                  <Text className="mt-4 text-center font-sans-regular text-sm text-quaternary">
                    {!isNativeAvailable ? "Conecta un adaptador OBD y usa un build nativo." : devices.length === 0 ? "Sin dispositivos aún. Pulsa sincronizar para buscar." : showOnlyScanners ? "Ningún dispositivo coincide con un escáner OBD. Desactiva «Solo escáners OBD» para ver la lista completa." : "Sin dispositivos aún. Pulsa sincronizar para buscar."}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />

            <View className="border-t border-border pt-4" style={{ paddingBottom: spacing[2] }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                onPress={handlePrimaryPress}
                disabled={isConnecting || isScanning || isConnectBlockedByEmptyGarage}
                className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-tertiary active:opacity-90 disabled:opacity-50"
              >
                {isConnecting || isScanning ? <ActivityIndicator color={colors.primary} /> : <MaterialCommunityIcons name="sync" size={22} color={colors.primary} />}
                <Text className="font-sans-bold text-base uppercase tracking-wide text-primary">{primaryLabel}</Text>
              </Pressable>
              <Text className="mt-3 text-center font-sans-regular text-[10px] uppercase tracking-widest text-muted-foreground">Protocolo SAE J1979 · ISO 15031-5 · perfil SPP</Text>
            </View>
          </>
        )}
      </View>

      <Modal visible={vehicleModalVisible} transparent animationType="slide" onRequestClose={() => setVehicleModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/65">
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector de vehículo" className="flex-1" onPress={() => setVehicleModalVisible(false)} />
          <View className="max-h-[78%] rounded-t-3xl border-t border-border bg-card px-4 pb-6 pt-4">
            <View className="mb-1 h-1 w-10 self-center rounded-full bg-quaternary/35" />
            <Text className="mt-2 font-sans-bold text-lg text-white">Elige un vehículo</Text>
            <Text className="mt-1 font-sans-regular text-sm leading-5 text-quaternary">
              La sesión OBD y la grabación quedarán asociadas a este coche. Luego se iniciará el emparejamiento Bluetooth.
            </Text>

            {garageError ? (
              <View className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text className="font-sans-regular text-sm text-destructive">{garageError}</Text>
              </View>
            ) : null}

            {isGarageLoading && garageItems.length === 0 ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={colors.tertiary} />
                <Text className="mt-3 font-sans-regular text-sm text-quaternary">Cargando tu garage…</Text>
              </View>
            ) : null}

            {!isGarageLoading && garageItems.length === 0 ? (
              <View className="mt-4 items-center py-6">
                <MaterialCommunityIcons name="car-off" size={40} color={colors.mutedForeground} />
                <Text className="mt-3 text-center font-sans-regular text-sm text-quaternary">No hay vehículos en tu garage.</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ir al garage"
                  onPress={() => {
                    setVehicleModalVisible(false);
                    router.push("/(tabs)/garage");
                  }}
                  className="mt-4 rounded-2xl border border-tertiary px-5 py-3 active:opacity-90"
                >
                  <Text className="font-sans-semibold text-sm text-tertiary">Ir al garage</Text>
                </Pressable>
              </View>
            ) : null}

            {garageItems.length > 0 ? (
              <FlatList
                data={garageItems}
                keyExtractor={(v) => v.id}
                renderItem={renderGarageVehicle}
                style={{ maxHeight: 320, marginTop: 12 }}
                showsVerticalScrollIndicator={false}
              />
            ) : null}

            {garageItems.length > 0 ? (
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                  onPress={() => setVehicleModalVisible(false)}
                  className="h-12 flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-primary active:opacity-90"
                >
                  <Text className="font-sans-semibold text-sm text-quaternary">Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar vehículo y conectar"
                  onPress={() => void handleConfirmVehicleAndConnect()}
                  disabled={!modalVehicleId || isConnecting}
                  className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-tertiary active:opacity-90 disabled:opacity-50"
                >
                  {isConnecting ? <ActivityIndicator color={colors.primary} /> : <Text className="font-sans-bold text-sm uppercase tracking-wide text-primary">Conectar</Text>}
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Connect;
