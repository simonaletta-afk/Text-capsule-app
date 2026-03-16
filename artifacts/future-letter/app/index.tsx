import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { fetchMessages, type Message } from "@/lib/api";
import Colors from "@/constants/colors";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    const absDays = Math.abs(days);
    if (absDays === 0) return "Today";
    if (absDays === 1) return "Yesterday";
    if (absDays < 30) return `${absDays}d ago`;
    const months = Math.floor(absDays / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  }

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 30) return `In ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `In ${months}mo`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `In ${years}y`;
  return `In ${years}y ${remainingMonths}mo`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DeliveredMessageBubble({ message }: { message: Message }) {
  const isUnread = !message.isRead;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/message/[id]", params: { id: message.id.toString() } })}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, styles.bubbleSent]}>
          <Text style={styles.bubbleText}>{message.content}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{formatTime(message.createdAt)}</Text>
            <Feather name="check-circle" size={12} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      </View>

      <View style={styles.deliveredRow}>
        <View style={[styles.bubble, styles.bubbleReceived]}>
          {isUnread ? (
            <View style={styles.unreadIndicator}>
              <View style={styles.unreadDot} />
              <Text style={styles.deliveredLabel}>New message from past you</Text>
            </View>
          ) : (
            <Text style={styles.deliveredLabel}>Delivered {formatRelativeDate(message.deliverAt)}</Text>
          )}
          <Text style={styles.bubbleTextReceived} numberOfLines={isUnread ? 2 : 3}>{message.content}</Text>
          <View style={styles.bubbleMetaReceived}>
            <Text style={styles.bubbleTimeReceived}>{formatRelativeDate(message.deliverAt)}</Text>
            {isUnread && (
              <View style={styles.tapToRead}>
                <Text style={styles.tapToReadText}>Tap to read</Text>
                <Feather name="chevron-right" size={12} color={Colors.light.tint} />
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function PendingMessageBubble({ message }: { message: Message }) {
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.bubble, styles.bubbleSent]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{formatTime(message.createdAt)}</Text>
          <Feather name="clock" size={12} color="rgba(255,255,255,0.6)" />
        </View>
      </View>
      <View style={styles.pendingBadge}>
        <Feather name="clock" size={11} color={Colors.light.accent} />
        <Text style={styles.pendingBadgeText}>
          Opens {formatRelativeDate(message.deliverAt)}
        </Text>
      </View>
    </View>
  );
}

function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="message-circle" size={32} color={Colors.light.tint} />
          </View>
        </View>
        <Text style={styles.loginTitle}>Text Capsule</Text>
        <Text style={styles.loginSubtitle}>
          Send a message to your future self. Get it back in 6 months or a year.
        </Text>
        <Pressable
          onPress={async () => {
            await login();
          }}
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const hasCheckedPhone = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.phoneNumber && !hasCheckedPhone.current) {
      hasCheckedPhone.current = true;
      router.push("/phone-setup");
    }
  }, [isAuthenticated, user]);

  const { data: messages, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["messages"],
    queryFn: fetchMessages,
    enabled: isAuthenticated,
  });

  const { delivered, pending } = useMemo(() => {
    if (!messages) return { delivered: [], pending: [] };
    const d: Message[] = [];
    const p: Message[] = [];
    for (const m of messages) {
      if (m.isDelivered) d.push(m);
      else p.push(m);
    }
    d.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    p.sort((a, b) => new Date(a.deliverAt).getTime() - new Date(b.deliverAt).getTime());
    return { delivered: d, pending: p };
  }, [messages]);

  const unreadCount = delivered.filter((m) => !m.isRead).length;

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const hasMessages = (messages?.length ?? 0) > 0;

  const sections: { key: string; title: string; data: Message[] }[] = [];
  if (delivered.length > 0) {
    sections.push({ key: "delivered", title: unreadCount > 0 ? `${unreadCount} new` : "Delivered", data: delivered });
  }
  if (pending.length > 0) {
    sections.push({ key: "pending", title: "Scheduled", data: pending });
  }

  const flatData: { type: "header" | "item"; key: string; title?: string; message?: Message; section?: string }[] = [];
  for (const section of sections) {
    flatData.push({ type: "header", key: `header-${section.key}`, title: section.title });
    for (const item of section.data) {
      flatData.push({ type: "item", key: `item-${item.id}`, message: item, section: section.key });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Text Capsule</Text>
          <Text style={styles.headerSub}>
            {hasMessages
              ? `${messages?.length} message${(messages?.length ?? 0) > 1 ? "s" : ""}`
              : "No messages yet"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/compose")}
          style={({ pressed }) => [
            styles.composeButton,
            pressed && styles.composeButtonPressed,
          ]}
        >
          <Feather name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : !hasMessages ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyBubbles}>
            <View style={[styles.emptyBubble, styles.emptyBubbleLeft]}>
              <Text style={styles.emptyBubbleText}>Hey future me...</Text>
            </View>
            <View style={[styles.emptyBubble, styles.emptyBubbleRight]}>
              <Text style={styles.emptyBubbleTextRight}>
                <Feather name="clock" size={13} color={Colors.light.textTertiary} /> Opens in 1 year
              </Text>
            </View>
          </View>
          <Text style={styles.emptyTitle}>Send your first text</Text>
          <Text style={styles.emptySubtitle}>
            Write a message to your future self. You'll get it back later.
          </Text>
          <Pressable
            onPress={() => router.push("/compose")}
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather name="message-circle" size={16} color={Colors.light.tint} />
            <Text style={styles.emptyButtonText}>New Message</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.light.tint}
            />
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
              );
            }
            if (item.message && item.section === "delivered") {
              return <DeliveredMessageBubble message={item.message} />;
            }
            if (item.message && item.section === "pending") {
              return <PendingMessageBubble message={item.message} />;
            }
            return null;
          }}
        />
      )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  composeButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bubbleRow: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  deliveredRow: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    lineHeight: 21,
  },
  bubbleTextReceived: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 21,
    marginTop: 4,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  bubbleMetaReceived: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  bubbleTimeReceived: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  unreadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
  },
  deliveredLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  tapToRead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  tapToReadText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textTertiary,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  loginSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
  },
  loginButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  loginButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyBubbles: {
    width: "100%",
    marginBottom: 32,
    gap: 8,
  },
  emptyBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "75%",
  },
  emptyBubbleLeft: {
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 6,
    alignSelf: "flex-end",
    opacity: 0.15,
  },
  emptyBubbleRight: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomLeftRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.light.border,
    opacity: 0.6,
  },
  emptyBubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
  },
  emptyBubbleTextRight: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tintLight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
});
