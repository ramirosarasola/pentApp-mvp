import { colors, spacing } from "@/app/constants/theme";
import { useAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SocialAuthButtons from "./social-auth-buttons";

export default function SignUpScreen() {
  const { signUp, setActive, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const isSubmitting: boolean = fetchStatus === "fetching";
  const isDisabled: boolean = !emailAddress || !password || isSubmitting;

  const executeSignUp = async (): Promise<void> => {
    const { error } = await signUp.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    await signUp.verifications.sendEmailCode();
  };

  const executeEmailVerification = async (): Promise<void> => {
    const { createdSessionId } = await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      if (!createdSessionId || !setActive) {
        console.error("Sign-up verification completed without an active session.");
        return;
      }
      await setActive({ session: createdSessionId });
      router.replace("/(tabs)");
      return;
    }
    console.error("Sign-up attempt not complete:", signUp.status);
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify your account</Text>
          <Text style={styles.subtitle}>Enter the code we sent to your email address.</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter your verification code"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            onChangeText={setCode}
          />
          {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
          <Pressable style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]} onPress={executeEmailVerification} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>Verify</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => signUp.verifications.sendEmailCode()}>
            <Text style={styles.ghostButtonText}>Send a new code</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>AUTO LIBRE AI</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your profile to start using diagnostics features.</Text>
        <Text style={styles.label}>Email address</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email address"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="email-address"
        onChangeText={setEmailAddress}
      />
      {errors.fields.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Password"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        onChangeText={setPassword}
      />
      {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}
      <Pressable style={[styles.primaryButton, isDisabled && styles.buttonDisabled]} onPress={executeSignUp} disabled={isDisabled}>
        <Text style={styles.primaryButtonText}>Create account</Text>
      </Pressable>
      <SocialAuthButtons mode="sign-up" />
      <View style={styles.linkContainer}>
        <Text style={styles.linkBaseText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in">
          <Text style={styles.linkText}>Sign in</Text>
        </Link>
      </View>
      <View nativeID="clerk-captcha" />
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
  label: {
    color: colors.quaternary,
    fontFamily: "sans-semibold",
    fontSize: 14,
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
