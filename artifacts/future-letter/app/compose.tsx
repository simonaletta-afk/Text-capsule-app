import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
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

  const deliveryDate = new Date();
  if (frequency === "biannual") {
    deliveryDate.setMonth(deliveryDate.getMonth() + 6);
  } else {
    deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
  }
  const formattedDelivery = deliveryDate.toLocaleDateString("en-US", {
    month: "short",
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
        <Text style={styles.topBarTitle}>New Message</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.frequencyRow}>
        <Pressable
          onPress={() => {
            setFrequency("biannual");
            if (Platform.OS !== "web") Haptics.selectionAsync();
          }}
          style={[
            styles.freqChip,
            frequency === "biannual" && styles.freqChipSelected,
          ]}
        >
          <Text
            style={[
              styles.freqChipText,
              frequency === "biannual" && styles.freqChipTextSelected,
            ]}
          >
            6 months
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setFrequency("yearly");
            if (Platform.OS !== "web") Haptics.selectionAsync();
          }}
          style={[
            styles.freqChip,
            frequency === "yearly" && styles.freqChipSelected,
          ]}
        >
          <Text
            style={[
              styles.freqChipText,
              frequency === "yearly" && styles.freqChipTextSelected,
            ]}
          >
            1 year
          </Text>
        </Pressable>
        <Text style={styles.deliveryLabel}>
          <Feather name="clock" size={12} color={Colors.light.textTertiary} /> {formattedDelivery}
        </Text>
      </View>

      <View style={styles.chatArea}>
        <View style={styles.previewBubble}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message to future you..."
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={5000}
            value={content}
            onChangeText={setContent}
            autoFocus
          />
        </View>
        {content.length > 0 && (
          <Text style={styles.charCount}>{content.length} / 5,000</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={Colors.light.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12) }]}>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && { transform: [{ scale: 0.92 }] },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={20} color={canSend ? "#fff" : Colors.light.textTertiary} />
          )}
        </Pressable>
      </View>
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
  frequencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  freqChipSelected: {
    backgroundColor: Colors.light.tintLight,
  },
  freqChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  freqChipTextSelected: {
    color: Colors.light.tint,
    fontFamily: "Inter_600SemiBold",
  },
  deliveryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    marginLeft: "auto" as const,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  previewBubble: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    padding: 14,
    alignSelf: "flex-end",
    maxWidth: "88%",
    minWidth: "60%",
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    lineHeight: 24,
    minHeight: 100,
    paddingTop: 0,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "right",
    marginTop: 8,
    paddingRight: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.danger,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
});
