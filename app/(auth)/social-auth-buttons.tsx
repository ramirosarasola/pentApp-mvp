import { colors, spacing } from "@/src/constants/theme";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type SocialStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

type SocialAuthButtonsProps = {
  readonly mode: "sign-in" | "sign-up";
};

const APP_SCHEME = "autolibreai" as const;

const providerLabels: Record<SocialStrategy, string> = {
  oauth_google: "Google",
  oauth_facebook: "Facebook",
  oauth_apple: "Apple",
} as const;

WebBrowser.maybeCompleteAuthSession();

/**
 * Renders a separator and a set of social OAuth buttons that initiate the corresponding SSO flows.
 *
 * @param mode - Determines the action label shown on each button; use `"sign-in"` or `"sign-up"`.
 * @returns The React element for the social-auth section containing the separator and provider buttons.
 */
export default function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [activeStrategy, setActiveStrategy] = useState<SocialStrategy | null>(null);
  const socialStrategies: SocialStrategy[] =
    Platform.OS === "ios" ? ["oauth_google", "oauth_facebook", "oauth_apple"] : ["oauth_google", "oauth_facebook"];
  const actionLabel: string = mode === "sign-in" ? "Sign in" : "Sign up";

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const executeSocialAuth = async (strategy: SocialStrategy): Promise<void> => {
    try {
      setActiveStrategy(strategy);
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: APP_SCHEME });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });
      if (!createdSessionId || !setActive) {
        console.warn("[SocialAuth] No session created for", strategy);
        return;
      }
      await setActive({
        session: createdSessionId,
        navigate: ({ session, decorateUrl }: { session: { currentTask?: unknown } | null; decorateUrl: (path: string) => string }) => {
          if (session?.currentTask) {
            console.warn("[SocialAuth] Pending session task:", session.currentTask);
            return;
          }
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            return;
          }
          router.replace(url as Href);
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SocialAuth] Failed for ${strategy}:`, message);
      Alert.alert("Authentication Error", `Could not sign in with ${providerLabels[strategy]}. Please try again.`);
    } finally {
      setActiveStrategy(null);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OR CONTINUE WITH</Text>
        <View style={styles.separatorLine} />
      </View>
      {socialStrategies.map((strategy) => {
        const isLoading: boolean = activeStrategy === strategy;
        const buttonText: string = isLoading ? "Connecting..." : `${actionLabel} with ${providerLabels[strategy]}`;
        return (
          <Pressable key={strategy} style={[styles.providerButton, isLoading && styles.providerButtonDisabled]} onPress={() => executeSocialAuth(strategy)} disabled={activeStrategy !== null}>
            <Text style={styles.providerButtonText}>{buttonText}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    marginTop: spacing[3],
    gap: spacing[3],
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    color: colors.mutedForeground,
    fontFamily: "sans-regular",
    fontSize: 11,
    letterSpacing: 0.9,
  },
  providerButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  providerButtonDisabled: {
    opacity: 0.6,
  },
  providerButtonText: {
    color: colors.white,
    fontFamily: "sans-semibold",
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
