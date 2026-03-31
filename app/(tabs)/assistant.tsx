import { ChatComposer } from "@/src/components/chat/chat-composer";
import { ChatMessageBubble } from "@/src/components/chat/chat-message-bubble";
import { ChatTypingIndicator } from "@/src/components/chat/chat-typing-indicator";
import { colors, spacing } from "@/src/constants/theme";
import { useAssistantChat } from "@/src/hooks/use-assistant-chat";
import { useGarageApiJson } from "@/src/hooks/use-garage-api-json";
import type { ChatMessage } from "@/src/services/assistant/assistant-message";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconRing}>
        <Feather name="cpu" size={32} color={colors.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>Mecánico IA</Text>
      <Text style={styles.emptySubtitle}>Preguntá sobre síntomas, lecturas OBD, mantenimiento o cualquier duda sobre tu vehículo.</Text>
      <View style={styles.emptySuggestions}>
        {["¿Qué significa el código P0300?", "Mi motor tiembla al arrancar en frío", "¿Cuándo debo cambiar el aceite?"].map((suggestion) => (
          <View key={suggestion} style={styles.emptySuggestionChip}>
            <Text style={styles.emptySuggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

// iOS 0, Android 5
const COMPOSER_GAP = Platform.OS === "ios" ? -25 : 10;

const Assistant = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const { responseJson: garageResponse } = useGarageApiJson();
  const activeVehicleId = garageResponse?.items.find((v) => v.isPrimary)?.id ?? garageResponse?.items[0]?.id ?? undefined;

  const { messages, isStreaming, isLoading, chatId, errorMessage, executeSendMessage, executeSelectChat, executeNewChat } = useAssistantChat(activeVehicleId);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Si se navega desde el drawer con un chatId específico, lo seleccionamos
  useEffect(() => {
    if (params.chatId && params.chatId !== chatId) {
      void executeSelectChat(params.chatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.chatId]);

  // Scroll al último mensaje cuando llega un chunk nuevo
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // keyboardHeight se mide desde el borde inferior del dispositivo.
  // El screen content termina en la parte superior de la tab bar,
  // por lo que hay que restar tabBarHeight para saber cuánto el teclado
  // realmente cubre el contenido del screen.
  const composerKeyboardOffset = keyboardHeight > 0 ? Math.max(0, keyboardHeight - tabBarHeight - insets.bottom) + COMPOSER_GAP : 0;

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isLastAssistant = item.role === "ASSISTANT" && index === messages.length - 1 && isStreaming;
    return <ChatMessageBubble message={item} isStreaming={isLastAssistant} />;
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Asistente IA</Text>
          {chatId && <View style={styles.activeDot} />}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Nueva conversación" onPress={() => void executeNewChat()} style={styles.newChatButton} hitSlop={8}>
          <Feather name="edit-2" size={18} color={colors.quaternary} />
        </Pressable>
      </View>

      {/* Error */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Lista de mensajes */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.tertiary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={isStreaming && messages[messages.length - 1]?.role !== "ASSISTANT" ? <ChatTypingIndicator /> : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {/* Compositor */}
      <ChatComposer isStreaming={isStreaming} onSend={(t) => void executeSendMessage(t)} bottomInset={insets.bottom} keyboardOffset={composerKeyboardOffset} />
    </View>
  );
};

export default Assistant;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: "sans-bold",
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: "rgba(147, 0, 10, 0.12)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(147, 0, 10, 0.3)",
  },
  errorText: {
    flex: 1,
    fontFamily: "sans-regular",
    fontSize: 13,
    color: colors.destructive,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(0, 218, 243, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 218, 243, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontFamily: "sans-bold",
    fontSize: 20,
    color: colors.white,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontFamily: "sans-regular",
    fontSize: 14,
    color: colors.quaternary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing[5],
  },
  emptySuggestions: {
    gap: spacing[2],
    alignSelf: "stretch",
  },
  emptySuggestionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySuggestionText: {
    fontFamily: "sans-regular",
    fontSize: 13,
    color: colors.quaternary,
  },
});
