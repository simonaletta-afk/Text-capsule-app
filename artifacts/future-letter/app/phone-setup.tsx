import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { savePhoneNumber } from "@/lib/api";
import Colors from "@/constants/colors";

type Channel = "whatsapp" | "sms";

export default function PhoneSetupScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 10) {
      setPhone(formatPhone(digits));
    }
  };

  const rawDigits = phone.replace(/\D/g, "");
  const canSave = rawDigits.length === 10 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    try {
      await savePhoneNumber(`+1${rawDigits}`, channel);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Feather name="smartphone" size={28} color={Colors.light.tint} />
          </View>
        </View>

        <Text style={styles.title}>Get texts delivered</Text>
        <Text style={styles.subtitle}>
          Add your phone number so your future messages arrive as real messages.
        </Text>

        <View style={styles.channelRow}>
          <Pressable
            onPress={() => setChannel("whatsapp")}
            style={[styles.channelOption, channel === "whatsapp" && styles.channelOptionSelected]}
          >
            <Text style={[styles.channelIcon, channel === "whatsapp" && styles.channelTextSelected]}>
              WhatsApp
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setChannel("sms")}
            style={[styles.channelOption, channel === "sms" && styles.channelOptionSelected]}
          >
            <Text style={[styles.channelIcon, channel === "sms" && styles.channelTextSelected]}>
              iMessage / SMS
            </Text>
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+1</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="(555) 123-4567"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handleChange}
            autoFocus
            maxLength={14}
          />
        </View>

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color={Colors.light.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          {channel === "whatsapp"
            ? "We'll send your future messages via WhatsApp. Make sure WhatsApp is installed."
            : "We'll send your future messages as SMS texts. Standard rates may apply."}
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === "web" ? 34 : 0) }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && { transform: [{ scale: 0.96 }] },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                Continue
              </Text>
              <Feather name="arrow-right" size={16} color={canSave ? "#fff" : Colors.light.textTertiary} />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 24,
  },
  channelRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  channelOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  channelOptionSelected: {
    backgroundColor: Colors.light.tintLight,
    borderColor: Colors.light.tint,
  },
  channelIcon: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  channelTextSelected: {
    color: Colors.light.tint,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryCode: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.danger,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  saveText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  saveTextDisabled: {
    color: Colors.light.textTertiary,
  },
});
