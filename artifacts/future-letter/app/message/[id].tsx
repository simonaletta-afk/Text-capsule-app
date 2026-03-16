import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchMessages, markMessageRead, deleteMessage, type Message } from "@/lib/api";
import Colors from "@/constants/colors";

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  const rm = months % 12;
  if (rm === 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  return `${years} year${years > 1 ? "s" : ""} and ${rm} month${rm > 1 ? "s" : ""} ago`;
}

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: fetchMessages,
  });

  const message = messages?.find((m) => m.id === parseInt(id, 10));

  const readMutation = useMutation({
    mutationFn: () => markMessageRead(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMessage(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      router.back();
    },
  });

  React.useEffect(() => {
    if (message && message.isDelivered && !message.isRead) {
      readMutation.mutate();
    }
  }, [message?.id, message?.isRead]);

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (confirm("Delete this letter?")) {
        deleteMutation.mutate();
      }
    } else {
      Alert.alert("Delete Letter", "Are you sure you want to delete this letter?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMutation.mutate();
          },
        },
      ]);
    }
  };

  const handleWriteAnother = () => {
    router.replace("/compose");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!message) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="alert-circle" size={32} color={Colors.light.textTertiary} />
        <Text style={styles.notFoundText}>Letter not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
      <View style={[styles.modalHandle, Platform.OS === "web" && { marginTop: 8 }]}>
        <View style={styles.handleBar} />
      </View>

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={22} color={Colors.light.textSecondary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Your Letter</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={18} color={Colors.light.danger} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Feather name="edit-3" size={14} color={Colors.light.tint} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Written</Text>
              <Text style={styles.metaValue}>{formatFullDate(message.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Feather name="clock" size={14} color={Colors.light.accent} />
            </View>
            <View>
              <Text style={styles.metaLabel}>
                {message.isDelivered ? "Delivered" : "Delivers"}
              </Text>
              <Text style={styles.metaValue}>{formatFullDate(message.deliverAt)}</Text>
            </View>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Feather name="repeat" size={14} color={Colors.light.success} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Frequency</Text>
              <Text style={styles.metaValue}>
                {message.frequency === "biannual" ? "Every 6 months" : "Every year"}
              </Text>
            </View>
          </View>
        </View>

        {message.isDelivered && (
          <View style={styles.deliveredBanner}>
            <Feather name="mail" size={18} color={Colors.light.tint} />
            <Text style={styles.deliveredText}>
              You wrote this {getTimeSince(message.createdAt)}
            </Text>
          </View>
        )}

        <View style={styles.letterContainer}>
          <Text style={styles.letterGreeting}>Dear future me,</Text>
          <Text style={styles.letterContent}>{message.content}</Text>
          <Text style={styles.letterSign}>
            — Past You, {new Date(message.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        </View>

        {message.isDelivered && (
          <Pressable
            onPress={handleWriteAnother}
            style={({ pressed }) => [
              styles.writeAnotherButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Feather name="edit" size={18} color="#fff" />
            <Text style={styles.writeAnotherText}>Write Another Letter</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.dangerLight,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  metaContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textTertiary,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  metaDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 10,
    marginLeft: 44,
  },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.tintLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  deliveredText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  letterContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  letterGreeting: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  letterContent: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: 24,
  },
  letterSign: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  writeAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  writeAnotherText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
});
