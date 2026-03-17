import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createMessage, fetchMessages } from "@/lib/api";
import Colors from "@/constants/colors";
import { useSubscription } from "@/lib/revenuecat";

type Frequency = "yearly" | "biannual";

interface Prompt {
  icon: string;
  title: string;
  subtitle: string;
  starter: string;
}

const PROMPTS: Prompt[] = [
  {
    icon: "\u{1F3AF}",
    title: "Set yourself goals",
    subtitle: "Write down what you want to achieve and check back in a year",
    starter: "Hey future me, here are the goals I'm setting for myself right now:\n\n1. ",
  },
  {
    icon: "\u{2728}",
    title: "Send some positivity",
    subtitle: "Write yourself an encouraging message for when you need it most",
    starter: "Hey future me, I just wanted to remind you that ",
  },
  {
    icon: "\u{1F4DD}",
    title: "Life wishlist",
    subtitle: "Where do you want to be in a year? Write it down and see how far you get",
    starter: "In a year from now, I'd love to:\n\n- ",
  },
  {
    icon: "\u{1F4AA}",
    title: "Celebrate your wins",
    subtitle: "Write about what you're proud of right now so future you remembers",
    starter: "Future me, I want you to remember that right now I'm proud of myself for ",
  },
  {
    icon: "\u{1F4AC}",
    title: "Advice for future you",
    subtitle: "What wisdom would you share with yourself a year from now?",
    starter: "Dear future me, here's some advice from the person you used to be:\n\n",
  },
  {
    icon: "\u{1F30D}",
    title: "Gratitude snapshot",
    subtitle: "Capture what you're grateful for today and revisit it later",
    starter: "Right now, I'm grateful for:\n\n1. ",
  },
];

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isSubscribed, freeMessageLimit } = useSubscription();
  const [content, setContent] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("yearly");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const deliveryDate = new Date();
  if (frequency === "biannual") {
    deliveryDate.setMonth(deliveryDate.getMonth() + 6);
  } else {
    deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
  }
  const formattedDelivery = deliveryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const canSend = content.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    setError(null);

    try {
      if (!isSubscribed) {
        const existingMessages = await fetchMessages();
        if (existingMessages.length >= freeMessageLimit) {
          setIsSending(false);
          router.push("/paywall");
          return;
        }
      }
      await createMessage(content.trim(), frequency);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setShowConfirmation(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setIsSending(false);
    }
  };

  const handleDone = () => {
    router.back();
  };

  const handlePromptTap = (starter: string) => {
    setContent(starter);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const showPrompts = content.trim().length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
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

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatAreaContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {showPrompts && (
          <View style={styles.promptsSection}>
            <Text style={styles.promptsHeading}>Need inspiration?</Text>
            <Text style={styles.promptsSubheading}>
              Tap an idea to get started
            </Text>
            <View style={styles.promptsGrid}>
              {PROMPTS.map((prompt, i) => (
                <Pressable
                  key={i}
                  onPress={() => handlePromptTap(prompt.starter)}
                  style={({ pressed }) => [
                    styles.promptCard,
                    pressed && styles.promptCardPressed,
                  ]}
                >
                  <Text style={styles.promptIcon}>{prompt.icon}</Text>
                  <View style={styles.promptTextWrap}>
                    <Text style={styles.promptTitle}>{prompt.title}</Text>
                    <Text style={styles.promptSubtitle}>{prompt.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!showPrompts && (
          <>
            <View style={styles.previewBubble}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message to future you..."
                placeholderTextColor="rgba(255,255,255,0.55)"
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
          </>
        )}
      </ScrollView>

      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={Colors.light.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!showConfirmation && (
        <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? insets.bottom + 34 : Math.max(insets.bottom, 8) }]}>
          <Text style={styles.inputBarLabel}>
            Arrives {formattedDelivery}
          </Text>
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
      )}

      {showConfirmation && (
        <Animated.View style={[styles.confirmationOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.confirmationCard, { transform: [{ scale: scaleAnim }] }]}>
            <Animated.View style={[styles.checkCircle, { opacity: checkAnim }]}>
              <Feather name="check" size={36} color="#fff" />
            </Animated.View>
            <Text style={styles.confirmationTitle}>Message Sealed!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your text capsule has been saved and will be delivered to you on
            </Text>
            <View style={styles.confirmationDateBadge}>
              <Feather name="calendar" size={14} color={Colors.light.tint} />
              <Text style={styles.confirmationDate}>{formattedDelivery}</Text>
            </View>
            <Text style={styles.confirmationNote}>
              You'll receive an SMS when it's time to open it.
            </Text>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [
                styles.confirmationButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.confirmationButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
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
  },
  chatAreaContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  promptsSection: {
    paddingBottom: 16,
  },
  promptsHeading: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  promptsSubheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  promptsGrid: {
    gap: 10,
  },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  promptCardPressed: {
    backgroundColor: Colors.light.tintLight,
    borderColor: Colors.light.tint,
  },
  promptIcon: {
    fontSize: 24,
  },
  promptTextWrap: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  promptSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
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
    minHeight: 80,
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: 12,
  },
  inputBarLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    flex: 1,
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
  confirmationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(250, 250, 249, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  confirmationCard: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
    maxWidth: 340,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 10,
  },
  confirmationSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  confirmationDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  confirmationDate: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  confirmationNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginBottom: 28,
  },
  confirmationButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 26,
  },
  confirmationButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
