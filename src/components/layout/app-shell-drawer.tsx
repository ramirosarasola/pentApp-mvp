import { colors, spacing } from "@/src/constants/theme"
import type { AssistantChatSummary } from "@/src/services/assistant/assistant-message"
import { Feather } from "@expo/vector-icons"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface DrawerItem {
  readonly label: string
  readonly iconName: keyof typeof Feather.glyphMap
  readonly onPress: () => void
}

interface ChatHistorySection {
  readonly chats: AssistantChatSummary[]
  readonly onSelectChat: (chatId: string) => void
  readonly onNewChat: () => void
}

interface AppShellDrawerProps {
  readonly isVisible: boolean
  readonly topInset: number
  readonly drawerItems: DrawerItem[]
  readonly onClose: () => void
  readonly chatHistorySection?: ChatHistorySection
}

function formatRelativeDate(isoDate: string): string {
  const now = Date.now()
  const date = new Date(isoDate).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Hace ${diffDays} d`
  return new Date(isoDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

export default function AppShellDrawer(props: AppShellDrawerProps) {
  if (!props.isVisible) return null

  const hasChatHistory =
    props.chatHistorySection && props.chatHistorySection.chats.length > 0

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <SafeAreaView style={[styles.panel, { paddingTop: props.topInset + spacing[4] }]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Menu</Text>

          {/* Navegación principal */}
          <View style={styles.section}>
            {props.drawerItems.map((item) => (
              <Pressable key={item.label} style={styles.navItem} onPress={item.onPress}>
                <View style={styles.navIconWrap}>
                  <Feather name={item.iconName} size={16} color={colors.tertiary} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>

          {/* Sección de historial de chats */}
          {props.chatHistorySection && (
            <View style={styles.chatSection}>
              <View style={styles.chatSectionHeader}>
                <Text style={styles.chatSectionTitle}>Conversaciones</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nueva conversación"
                  onPress={() => {
                    props.onClose()
                    props.chatHistorySection?.onNewChat()
                  }}
                  style={styles.newChatBtn}
                  hitSlop={8}
                >
                  <Feather name="plus" size={14} color={colors.tertiary} />
                </Pressable>
              </View>

              {hasChatHistory ? (
                <View style={styles.chatList}>
                  {props.chatHistorySection.chats.slice(0, 8).map((chat) => (
                    <Pressable
                      key={chat.id}
                      style={styles.chatItem}
                      onPress={() => {
                        props.onClose()
                        props.chatHistorySection?.onSelectChat(chat.id)
                      }}
                    >
                      <View style={styles.chatItemLeft}>
                        <Feather name="message-square" size={13} color={colors.mutedForeground} />
                      </View>
                      <View style={styles.chatItemBody}>
                        <Text style={styles.chatPreview} numberOfLines={1}>
                          {chat.preview}
                        </Text>
                        <Text style={styles.chatDate}>{formatRelativeDate(chat.updatedAt)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>Sin conversaciones previas</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  panel: {
    width: 280,
    backgroundColor: colors.secondary,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  title: {
    color: colors.tertiary,
    fontFamily: "sans-bold",
    fontSize: 22,
    marginBottom: spacing[4],
  },
  section: {
    gap: spacing[1],
    marginBottom: spacing[4],
  },
  navItem: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  navIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0, 218, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    color: colors.white,
    fontFamily: "sans-semibold",
    fontSize: 14,
  },
  chatSection: {
    paddingBottom: spacing[6],
  },
  chatSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  chatSectionTitle: {
    fontFamily: "sans-semibold",
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  newChatBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(0, 218, 243, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 218, 243, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatList: {
    gap: spacing[1],
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: 10,
    gap: spacing[2],
  },
  chatItemLeft: {
    width: 22,
    alignItems: "center",
    flexShrink: 0,
  },
  chatItemBody: {
    flex: 1,
    gap: 2,
  },
  chatPreview: {
    fontFamily: "sans-regular",
    fontSize: 13,
    color: colors.quaternary,
    lineHeight: 18,
  },
  chatDate: {
    fontFamily: "sans-regular",
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 0.3,
  },
  chatEmpty: {
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  chatEmptyText: {
    fontFamily: "sans-regular",
    fontSize: 12,
    color: colors.mutedForeground,
  },
})
