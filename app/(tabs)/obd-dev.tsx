import { useObdSession } from "@/src/hooks/use-obd-session"
import type { ObdPidSnapshot } from "@/src/hooks/use-obd-session"
import { colors, spacing } from "@/src/constants/theme"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useCallback } from "react"
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// ─── Componentes ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    not_connected: { color: colors.mutedForeground, label: "Desconectado" },
    initializing: { color: colors.warning, label: "Inicializando..." },
    connected: { color: colors.success, label: "Conectado" },
    error: { color: colors.destructive, label: "Error" },
  }
  const { color, label } = config[status] ?? config.not_connected
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontFamily: "sans-semibold", fontSize: 11, color, letterSpacing: 0.8, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  )
}

function Elm327Info({ version, protocol, voltage }: { version?: string; protocol?: string | null; voltage?: string | null }) {
  if (!version) return null
  return (
    <View style={{ backgroundColor: colors.secondary, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontFamily: "sans-semibold", fontSize: 11, color: colors.tertiary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
        Adaptador ELM327
      </Text>
      <Text style={{ fontFamily: "sans-regular", fontSize: 12, color: colors.quaternary }}>
        {version}
      </Text>
      {protocol ? (
        <Text style={{ fontFamily: "sans-regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
          Protocolo: {protocol}
        </Text>
      ) : null}
      {voltage ? (
        <Text style={{ fontFamily: "sans-regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
          Voltaje: {voltage}
        </Text>
      ) : null}
    </View>
  )
}

function DtcBadges({ codes }: { codes: Array<{ code: string }> }) {
  if (codes.length === 0) return null
  return (
    <View style={{ backgroundColor: `${colors.destructive}22`, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: `${colors.destructive}55` }}>
      <Text style={{ fontFamily: "sans-semibold", fontSize: 11, color: colors.destructive, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
        Códigos de falla activos ({codes.length})
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {codes.map((dtc) => (
          <View key={dtc.code} style={{ backgroundColor: `${colors.destructive}33`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: "sans-bold", fontSize: 12, color: colors.destructive }}>{dtc.code}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function PidRow({ item }: { item: ObdPidSnapshot }) {
  const hasValue = !item.isNull && item.value !== null
  const valueText = hasValue ? String(item.value) : "—"
  const unitText = hasValue && item.unit !== "none" && item.unit !== "bitfield" ? ` ${item.unit}` : ""
  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: hasValue ? `${colors.tertiary}22` : colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontFamily: "sans-semibold", fontSize: 12, color: colors.quaternary, letterSpacing: 0.3 }} numberOfLines={1}>
          {item.key}
        </Text>
        <Text style={{ fontFamily: "sans-regular", fontSize: 10, color: colors.mutedForeground, marginTop: 1 }} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontFamily: "sans-bold", fontSize: 14, color: hasValue ? colors.tertiary : colors.mutedForeground }}>
          {valueText}
          <Text style={{ fontFamily: "sans-regular", fontSize: 11, color: colors.mutedForeground }}>{unitText}</Text>
        </Text>
      </View>
    </View>
  )
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

const ObdDev = () => {
  const {
    connectionStatus,
    elm327Info,
    pidSnapshots,
    dtcs,
    error,
    startSession,
    stopSession,
  } = useObdSession()

  const isConnected = connectionStatus === "connected"
  const isInitializing = connectionStatus === "initializing"

  const onPrimaryPress = useCallback(() => {
    if (isConnected) {
      stopSession()
    } else {
      void startSession()
    }
  }, [isConnected, startSession, stopSession])

  const renderPid: ListRenderItem<ObdPidSnapshot> = useCallback(
    ({ item }) => <PidRow item={item} />,
    []
  )

  const keyExtractor = useCallback((item: ObdPidSnapshot) => item.key, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["left", "right"]}>
      <View style={{ flex: 1, paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[3] }}>
          <View>
            <Text style={{ fontFamily: "sans-bold", fontSize: 16, color: colors.white, letterSpacing: 0.8, textTransform: "uppercase" }}>
              OBD Dev
            </Text>
            <Text style={{ fontFamily: "sans-regular", fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
              SAE J1979 · Mode 01 / Mode 03
            </Text>
          </View>
          <StatusBadge status={connectionStatus} />
        </View>

        {/* Info ELM327 */}
        <Elm327Info
          version={elm327Info?.version}
          protocol={elm327Info?.protocol}
          voltage={elm327Info?.voltage}
        />

        {/* DTCs */}
        <DtcBadges codes={dtcs} />

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: `${colors.destructive}22`, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: `${colors.destructive}55` }}>
            <Text style={{ fontFamily: "sans-regular", fontSize: 12, color: colors.destructive }}>{error}</Text>
          </View>
        ) : null}

        {/* Lista de PIDs */}
        {pidSnapshots.length > 0 ? (
          <FlatList
            data={pidSnapshots}
            keyExtractor={keyExtractor}
            renderItem={renderPid}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing[4] }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              {isInitializing ? (
                <>
                  <ActivityIndicator color={colors.tertiary} size="large" />
                  <Text style={{ fontFamily: "sans-regular", fontSize: 13, color: colors.quaternary, marginTop: 16, textAlign: "center" }}>
                    Inicializando ELM327...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="gauge-empty" size={52} color={colors.mutedForeground} />
                  <Text style={{ fontFamily: "sans-regular", fontSize: 13, color: colors.quaternary, marginTop: 16, textAlign: "center" }}>
                    Pulsa "Iniciar sesión OBD" para{"\n"}comenzar a leer datos del vehículo.
                  </Text>
                </>
              )}
            </View>
          </ScrollView>
        )}

        {/* Botón de acción */}
        <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing[4], paddingBottom: spacing[2] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isConnected ? "Detener sesión OBD" : "Iniciar sesión OBD"}
            onPress={onPrimaryPress}
            disabled={isInitializing}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 16,
              backgroundColor: isConnected ? `${colors.destructive}33` : colors.tertiary,
              borderWidth: isConnected ? 1 : 0,
              borderColor: isConnected ? `${colors.destructive}88` : "transparent",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isInitializing || pressed ? 0.5 : 1,
            })}
          >
            {isInitializing ? (
              <ActivityIndicator color={isConnected ? colors.destructive : colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name={isConnected ? "stop-circle-outline" : "play-circle-outline"}
                size={22}
                color={isConnected ? colors.destructive : colors.primary}
              />
            )}
            <Text style={{
              fontFamily: "sans-bold",
              fontSize: 14,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: isConnected ? colors.destructive : colors.primary,
            }}>
              {isInitializing ? "Inicializando..." : isConnected ? "Detener sesión OBD" : "Iniciar sesión OBD"}
            </Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  )
}

export default ObdDev
