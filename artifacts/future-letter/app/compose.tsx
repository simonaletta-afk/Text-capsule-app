import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createMessage } from "@/lib/api";
import Colors from "@/constants/colors";

type Frequency = "yearly" | "biannual";

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("yearly");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryLabel = frequency === "biannual" ? "6 months from now" : "1 year from now";
  const deliveryDate = new Date();
  if (frequency === "biannual") {
    deliveryDate.setMonth(deliveryDate.getMonth() + 6);
  } else {
    deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
  }
  const formattedDelivery = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const canSend = content.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    setError(null);

    try {
      await createMessage(content.trim(), frequency);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      router.back();
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
      <View style={[styles.modalHandle, Platform.OS === "web" && { marginTop: 8 }]}>
        <View style={styles.handleBar} />
      </View>

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={22} color={Colors.light.textSecondary} />
        </Pressable>
        <Text style={styles.topBarTitle}>New Letter</Text>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.sendButtonPressed,
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>
              Send
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.deliveryInfo}>
          <Feather name="calendar" size={16} color={Colors.light.tint} />
          <Text style={styles.deliveryText}>
            Opens on <Text style={styles.deliveryDate}>{formattedDelivery}</Text>
          </Text>
        </View>

        <View style={styles.frequencyContainer}>
          <Text style={styles.frequencyLabel}>Deliver in</Text>
          <View style={styles.frequencyOptions}>
            <Pressable
              onPress={() => {
                setFrequency("biannual");
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={[
                styles.frequencyOption,
                frequency === "biannual" && styles.frequencyOptionSelected,
              ]}
            >
              <Feather
                name="clock"
                size={16}
                color={frequency === "biannual" ? Colors.light.tint : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.frequencyOptionText,
                  frequency === "biannual" && styles.frequencyOptionTextSelected,
                ]}
              >
                6 Months
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setFrequency("yearly");
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={[
                styles.frequencyOption,
                frequency === "yearly" && styles.frequencyOptionSelected,
              ]}
            >
              <Feather
                name="calendar"
                size={16}
                color={frequency === "yearly" ? Colors.light.tint : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.frequencyOptionText,
                  frequency === "yearly" && styles.frequencyOptionTextSelected,
                ]}
              >
                1 Year
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.promptText}>Dear future me,</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What do you want to tell your future self?"
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={5000}
            value={content}
            onChangeText={setContent}
            autoFocus
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color={Colors.light.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.charCount}>
          {content.length} / 5,000
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHandle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  sendButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  sendButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  sendButtonTextDisabled: {
    color: Colors.light.textTertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tintLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  deliveryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  deliveryDate: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  frequencyContainer: {
    marginBottom: 24,
  },
  frequencyLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  frequencyOptions: {
    flexDirection: "row",
    gap: 10,
  },
  frequencyOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  frequencyOptionSelected: {
    backgroundColor: Colors.light.tintLight,
    borderColor: Colors.light.tint,
  },
  frequencyOptionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  frequencyOptionTextSelected: {
    color: Colors.light.tint,
    fontFamily: "Inter_600SemiBold",
  },
  inputContainer: {
    marginBottom: 16,
  },
  promptText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 26,
    minHeight: 200,
    paddingTop: 0,
  },
  errorContainer: {
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
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "right",
  },
});
