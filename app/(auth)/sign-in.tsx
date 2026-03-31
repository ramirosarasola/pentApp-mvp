import { colors, spacing } from "@/src/constants/theme";
import { useAuth, useSignIn } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SocialAuthButtons from "./social-auth-buttons";
import type { Href } from "expo-router";

/**
 * Render the sign-in screen that handles password authentication, email-code MFA, and post-auth navigation.
 *
 * The component displays inputs for email and password, shows field-level errors, supports sending and verifying
 * email-based MFA codes when required, and redirects authenticated users away from the screen.
 *
 * @returns The sign-in screen React element
 */
export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const isSubmitting: boolean = fetchStatus === "fetching";
  const isDisabled: boolean = !emailAddress || !password || isSubmitting;

  const navigateAfterAuth = ({ session, decorateUrl }: { session: { currentTask?: unknown } | null; decorateUrl: (path: string) => string }): void => {
    if (session?.currentTask) {
      console.warn("Pending session task:", session.currentTask);
      return;
    }
    const url = decorateUrl("/");
    if (url.startsWith("http")) {
      return;
    }
    router.replace(url as Href);
  };

  const executeSignIn = async (): Promise<void> => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: navigateAfterAuth });
      return;
    }
    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === "email_code");
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
      return;
    }
    if (signIn.status !== "needs_second_factor") {
      console.error("Sign-in attempt not complete:", signIn.status);
    }
  };

  const executeEmailCodeVerification = async (): Promise<void> => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: navigateAfterAuth });
      return;
    }
    console.error("Sign-in attempt not complete:", signIn.status);
  };

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify your account</Text>
          <Text style={styles.subtitle}>We sent a security code to your email.</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter your verification code"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            onChangeText={setCode}
          />
          {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
          <Pressable style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]} disabled={isSubmitting} onPress={executeEmailCodeVerification}>
            <Text style={styles.primaryButtonText}>Verify</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={styles.ghostButtonText}>Send a new code</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => signIn.reset()}>
            <Text style={styles.ghostButtonText}>Start over</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>AUTO LIBRE AI</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Access your garage and diagnostics workspace.</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email address"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          onChangeText={setEmailAddress}
        />
        {errors.fields.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          onChangeText={setPassword}
        />
        {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}
        <Pressable style={[styles.primaryButton, isDisabled && styles.buttonDisabled]} onPress={executeSignIn} disabled={isDisabled}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
        <SocialAuthButtons mode="sign-in" />
        <View style={styles.linkContainer}>
          <Text style={styles.linkBaseText}>Do not have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text style={styles.linkText}>Sign up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginHorizontal: spacing[5],
    marginTop: spacing[12],
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
    gap: spacing[3],
  },
  eyebrow: {
    color: colors.tertiary,
    fontFamily: "sans-semibold",
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontFamily: "sans-bold",
  },
  subtitle: {
    color: colors.quaternary,
    fontFamily: "sans-regular",
    fontSize: 14,
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.white,
    fontFamily: "sans-regular",
  },
  primaryButton: {
    backgroundColor: colors.tertiary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing[1],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: "sans-bold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  ghostButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.tertiary,
    fontFamily: "sans-semibold",
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: spacing[2],
    alignItems: "center",
    justifyContent: "center",
  },
  linkBaseText: {
    color: colors.quaternary,
    fontFamily: "sans-regular",
  },
  linkText: {
    color: colors.tertiary,
    fontFamily: "sans-semibold",
  },
  error: {
    color: colors.warning,
    fontSize: 12,
    marginTop: -4,
    fontFamily: "sans-regular",
  },
});