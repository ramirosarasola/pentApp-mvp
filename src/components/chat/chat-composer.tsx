import { colors, spacing } from "@/src/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

const MAX_COMPOSER_LINES = 5;
const MIN_COMPOSER_HEIGHT = 44;
const INPUT_LINE_HEIGHT = 22;
const COMPOSER_VERTICAL_PADDING = spacing[3] * 2;
const MAX_COMPOSER_HEIGHT = INPUT_LINE_HEIGHT * MAX_COMPOSER_LINES + COMPOSER_VERTICAL_PADDING;

interface ChatComposerProps {
  readonly isStreaming: boolean;
  readonly onSend: (text: string) => void;
  readonly bottomInset: number;
  readonly keyboardOffset: number;
}

/**
 * Renders a multiline chat input with a send button and adaptive bottom spacing.
 *
 * The composer disables sending and shows a loading indicator while streaming; when a message is sent the input is cleared and reset.
 *
 * @param isStreaming - When `true`, disables the send action and shows a streaming/loading indicator.
 * @param onSend - Called with the current message text when the user sends a message.
 * @param bottomInset - Extra bottom padding (e.g., safe-area or overlay inset) applied to the composer container.
 * @param keyboardOffset - Additional bottom margin applied when the keyboard is open; when `keyboardOffset` is not positive an OS-specific fallback gap is used.
 * @returns The chat composer React element.
 */
export function ChatComposer({ isStreaming, onSend, bottomInset, keyboardOffset }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(MIN_COMPOSER_HEIGHT);
  const inputRef = useRef<TextInput>(null);
  const previousHeightRef = useRef<number>(MIN_COMPOSER_HEIGHT);
  const osPlatformGap = Platform.OS === "ios" ? -25 : -40;

  const canSend = text.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    const toSend = text;
    setText("");
    setInputHeight(MIN_COMPOSER_HEIGHT);
    onSend(toSend);
  };

  return (
    <View style={[styles.container, { marginBottom: keyboardOffset > 0 ? keyboardOffset : osPlatformGap, paddingBottom: bottomInset }]}>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { height: Math.max(MIN_COMPOSER_HEIGHT, inputHeight) }]}
          value={text}
          onChangeText={setText}
          placeholder="Consultá tu mecánico IA…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={4000}
          onContentSizeChange={(e) => {
            const measuredContentHeight = e.nativeEvent.contentSize.height;
            const nextHeight = Math.max(MIN_COMPOSER_HEIGHT, Math.min(Math.ceil(measuredContentHeight), MAX_COMPOSER_HEIGHT));
            // Evita oscilaciones por diferencias sub-pixel al recalcular layout.
            if (Math.abs(nextHeight - previousHeightRef.current) < 2) return;
            previousHeightRef.current = nextHeight;
            setInputHeight(nextHeight);
          }}
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={false}
          scrollEnabled={inputHeight >= MAX_COMPOSER_HEIGHT}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={isStreaming ? "Generando respuesta…" : "Enviar mensaje"} onPress={handleSend} disabled={!canSend} style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonIdle]}>
          {isStreaming ? <ActivityIndicator size={18} color={colors.primary} /> : <Feather name="send" size={18} color={canSend ? colors.primary : colors.mutedForeground} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  input: {
    flex: 1,
    fontFamily: "sans-regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
    paddingTop: Platform.OS === "ios" ? spacing[2] : spacing[1],
    paddingBottom: Platform.OS === "ios" ? spacing[2] : spacing[1],
    maxHeight: MAX_COMPOSER_HEIGHT,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    flexShrink: 0,
  },
  sendButtonActive: {
    backgroundColor: colors.tertiary,
  },
  sendButtonIdle: {
    backgroundColor: "transparent",
  },
});
