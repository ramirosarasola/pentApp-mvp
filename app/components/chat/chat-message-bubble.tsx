import { colors, spacing } from "@/app/constants/theme"
import type { ChatMessage } from "@/app/services/assistant/assistant-message"
import { StyleSheet, Text, View } from "react-native"

interface ChatMessageBubbleProps {
  readonly message: ChatMessage
  readonly isStreaming?: boolean
}

export function ChatMessageBubble({ message, isStreaming = false }: ChatMessageBubbleProps) {
  const isUser = message.role === "USER"
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>AI</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          isStreaming && !isUser && styles.bubbleStreaming,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}
          selectable
        >
          {message.content}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: spacing[1],
    paddingHorizontal: spacing[4],
    alignItems: "flex-end",
    gap: spacing[2],
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0, 218, 243, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 218, 243, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLabel: {
    fontFamily: "sans-bold",
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.tertiary,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  bubbleUser: {
    backgroundColor: colors.tertiary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleStreaming: {
    borderColor: "rgba(0, 218, 243, 0.35)",
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    fontFamily: "sans-medium",
    color: colors.primary,
  },
  textAssistant: {
    fontFamily: "sans-regular",
    color: colors.white,
  },
})
