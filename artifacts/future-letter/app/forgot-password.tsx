import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { requestPasswordReset, resetPassword } from "@/lib/api";
import Colors from "@/constants/colors";

type Step = "email" | "code" | "done";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset(email.trim());
      setStep("code");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || isSubmitting) return;

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={22} color={Colors.light.textSecondary} />
            </Pressable>
          </View>

          {step === "email" && (
            <View style={styles.formContainer}>
              <View style={styles.iconCircle}>
                <Feather name="lock" size={28} color={Colors.light.tint} />
              </View>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a code to reset your password.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.light.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />

              {error && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={14} color={Colors.light.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleRequestCode}
                disabled={!email.trim() || isSubmitting}
                style={({ pressed }) => [
                  styles.button,
                  (!email.trim() || isSubmitting) && styles.buttonDisabled,
                  pressed && email.trim() && !isSubmitting && styles.buttonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Code</Text>
                )}
              </Pressable>
            </View>
          )}

          {step === "code" && (
            <View style={styles.formContainer}>
              <View style={styles.iconCircle}>
                <Feather name="mail" size={28} color={Colors.light.tint} />
              </View>
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {email.trim()}. Enter it below with your new password.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor={Colors.light.textTertiary}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={Colors.light.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.light.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              {error && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={14} color={Colors.light.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleResetPassword}
                disabled={!code.trim() || !newPassword || !confirmPassword || isSubmitting}
                style={({ pressed }) => [
                  styles.button,
                  (!code.trim() || !newPassword || !confirmPassword || isSubmitting) && styles.buttonDisabled,
                  pressed && !isSubmitting && styles.buttonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </Pressable>

              <Pressable onPress={() => { setStep("email"); setError(null); setCode(""); }}>
                <Text style={styles.linkText}>Didn't get the code? Try again</Text>
              </Pressable>
            </View>
          )}

          {step === "done" && (
            <View style={styles.formContainer}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.light.success + "15" }]}>
                <Feather name="check" size={28} color={Colors.light.success} />
              </View>
              <Text style={styles.title}>Password Reset!</Text>
              <Text style={styles.subtitle}>
                Your password has been updated. You can now log in with your new password.
              </Text>

              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </Pressable>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  inner: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    marginTop: -60,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    marginBottom: 12,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.danger,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
    textAlign: "center",
    marginTop: 16,
  },
});
