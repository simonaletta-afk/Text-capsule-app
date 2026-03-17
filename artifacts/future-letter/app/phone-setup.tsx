import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { savePhoneNumber } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Colors from "@/constants/colors";

type Channel = "whatsapp" | "sms";

interface CountryCode {
  code: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "GB", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "US", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "CA", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "DE", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "ES", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "IT", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "NL", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "BE", dial: "+32", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "IE", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "PT", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "SE", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "NO", dial: "+47", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "DK", dial: "+45", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "FI", dial: "+358", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "CH", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "AT", dial: "+43", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "NZ", dial: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "IN", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "PK", dial: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "BD", dial: "+880", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "NG", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "GH", dial: "+233", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "KE", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "ZA", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "AE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "SA", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "JP", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "KR", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "CN", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "HK", dial: "+852", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "SG", dial: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "MY", dial: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "PH", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "TH", dial: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "BR", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "MX", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "AR", dial: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "CO", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "PL", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "RO", dial: "+40", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "GR", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "TR", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "EG", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "IL", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
];

export default function PhoneSetupScreen() {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 15) {
      setPhone(digits);
    }
  };

  const rawDigits = phone.replace(/\D/g, "");
  const canSave = rawDigits.length >= 7 && rawDigits.length <= 15 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    try {
      await savePhoneNumber(`${selectedCountry.dial}${rawDigits}`, channel);
      await refreshUser();
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
          <Pressable onPress={() => setShowPicker(true)} style={styles.countryCodeButton}>
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCode}>{selectedCountry.dial}</Text>
            <Feather name="chevron-down" size={14} color={Colors.light.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handleChange}
            autoFocus
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

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country</Text>
              <Pressable onPress={() => setShowPicker(false)} style={styles.modalClose}>
                <Feather name="x" size={22} color={Colors.light.text} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => `${item.code}-${item.dial}`}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowPicker(false);
                  }}
                  style={[
                    styles.countryRow,
                    item.code === selectedCountry.code && item.dial === selectedCountry.dial && styles.countryRowSelected,
                  ]}
                >
                  <Text style={styles.countryRowFlag}>{item.flag}</Text>
                  <Text style={styles.countryRowCode}>{item.code}</Text>
                  <Text style={styles.countryRowDial}>{item.dial}</Text>
                  {item.code === selectedCountry.code && item.dial === selectedCountry.dial && (
                    <Feather name="check" size={18} color={Colors.light.tint} style={{ marginLeft: "auto" }} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingRight: 16,
    paddingVertical: 4,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
    marginRight: 10,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    paddingVertical: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  modalClose: {
    padding: 4,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryRowSelected: {
    backgroundColor: Colors.light.tintLight,
  },
  countryRowFlag: {
    fontSize: 22,
  },
  countryRowCode: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    width: 30,
  },
  countryRowDial: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
