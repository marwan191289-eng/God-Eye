import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

type Mode = "signin" | "signup" | "verify" | "forgot" | "reset";

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function SignInPage() {
  useWarmUpBrowser();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, errors: signInErrors, fetchStatus: signInFetch } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetch } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = (url: string) => {
    router.replace(url.startsWith("http") ? ("/(tabs)" as any) : ("/(tabs)" as any));
  };

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => navigate(decorateUrl("/")),
      });
    }
  };

  const handleSignUp = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
    setMode("verify");
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => navigate(decorateUrl("/")),
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!signIn) return;
    setResetError(null);
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email });
      const emailFactor = attempt.supportedFirstFactors?.find(
        (f: any) => f.strategy === "reset_password_email_code"
      ) as any;
      if (!emailFactor) {
        setResetError("Password reset is not available for this account.");
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      setMode("reset");
    } catch (err: any) {
      setResetError(err?.errors?.[0]?.longMessage ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!signIn) return;
    setResetError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      } as any);
      if (result.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => navigate(decorateUrl("/")),
        });
      }
    } catch (err: any) {
      setResetError(err?.errors?.[0]?.longMessage ?? "Invalid code or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => navigate(decorateUrl("/")),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  const isFetching = signInFetch === "fetching" || signUpFetch === "fetching" || loading;
  const errors = mode === "signin" ? signInErrors : signUpErrors;

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.brand}>WAR ROOM</Text>
        <Text style={styles.subtitle}>CRYPTO INTELLIGENCE</Text>
      </View>

      {mode === "verify" ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Verify Your Email</Text>
          <Text style={styles.hint}>Enter the code sent to {email}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            autoFocus
          />
          {errors?.fields?.code && (
            <Text style={styles.error}>{errors.fields.code.message}</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, isFetching && styles.disabled]}
            onPress={handleVerify}
            disabled={isFetching || !code}
          >
            {isFetching ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Verify</Text>}
          </Pressable>
          <Pressable onPress={() => signUp.verifications.sendEmailCode()} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Resend code</Text>
          </Pressable>
          <View nativeID="clerk-captcha" />
        </View>
      ) : mode === "forgot" ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Reset Password</Text>
          <Text style={styles.hint}>Enter your email and we'll send you a reset code.</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {resetError && <Text style={styles.error}>{resetError}</Text>}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, (isFetching || !email) && styles.disabled]}
            onPress={handleForgotPassword}
            disabled={isFetching || !email}
          >
            {isFetching ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Send Reset Code</Text>}
          </Pressable>
          <Pressable onPress={() => setMode("signin")} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
          </Pressable>
        </View>
      ) : mode === "reset" ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Set New Password</Text>
          <Text style={styles.hint}>Enter the code sent to {email} and choose a new password.</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Reset code"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          {resetError && <Text style={styles.error}>{resetError}</Text>}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, (isFetching || !code || !newPassword) && styles.disabled]}
            onPress={handleResetPassword}
            disabled={isFetching || !code || !newPassword}
          >
            {isFetching ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
          </Pressable>
          <Pressable onPress={() => setMode("forgot")} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Resend code</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.modeSwitcher}>
            <Pressable
              style={[styles.modeTab, mode === "signin" && styles.modeTabActive]}
              onPress={() => setMode("signin")}
            >
              <Text style={[styles.modeTabText, mode === "signin" && styles.modeTabTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === "signup" && styles.modeTabActive]}
              onPress={() => setMode("signup")}
            >
              <Text style={[styles.modeTabText, mode === "signup" && styles.modeTabTextActive]}>Sign Up</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors?.fields?.emailAddress && (
            <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
          )}

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          {errors?.fields?.password && (
            <Text style={styles.error}>{errors.fields.password.message}</Text>
          )}

          {mode === "signin" && (
            <Pressable onPress={() => setMode("forgot")} style={styles.forgotBtn}>
              <Text style={[styles.forgotBtnText, { color: colors.mutedForeground }]}>Forgot password?</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, isFetching && styles.disabled]}
            onPress={mode === "signin" ? handleSignIn : handleSignUp}
            disabled={isFetching || !email || !password}
          >
            {isFetching ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.8 }]}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Feather name="globe" size={18} color={colors.foreground} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>

          {mode === "signup" && <View nativeID="clerk-captcha" />}
        </View>
      )}

      <Text style={styles.footer}>
        WAR ROOM — Probability-driven crypto intelligence
      </Text>
    </ScrollView>
  );
}

// @ts-ignore
function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      paddingTop: 48,
      paddingBottom: 40,
    },
    brand: {
      fontFamily: "Inter_700Bold",
      fontSize: 32,
      letterSpacing: 6,
      color: colors.primary,
    },
    subtitle: {
      fontFamily: "Inter_500Medium",
      fontSize: 10,
      letterSpacing: 4,
      color: colors.mutedForeground,
      marginTop: 6,
    },
    form: {
      flex: 1,
      gap: 12,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 20,
      color: colors.foreground,
      marginBottom: 4,
    },
    hint: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    modeSwitcher: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 4,
      marginBottom: 8,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    modeTabActive: {
      backgroundColor: colors.primary,
    },
    modeTabText: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      color: colors.mutedForeground,
    },
    modeTabTextActive: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
    },
    input: {
      backgroundColor: colors.input,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.foreground,
    },
    error: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.destructive,
      marginTop: -6,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
    primaryBtnText: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      color: colors.primaryForeground,
    },
    disabled: {
      opacity: 0.5,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.mutedForeground,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 15,
    },
    googleBtnText: {
      fontFamily: "Inter_500Medium",
      fontSize: 15,
      color: colors.foreground,
    },
    secondaryBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    secondaryBtnText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.primary,
    },
    forgotBtn: {
      alignSelf: "flex-end",
      paddingVertical: 4,
    },
    forgotBtnText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
    },
    footer: {
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 40,
      letterSpacing: 0.5,
    },
  });
}
