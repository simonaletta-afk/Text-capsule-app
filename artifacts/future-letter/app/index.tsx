import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useMemo } from "react";
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
    if (absDays < 30) return `${absDays} days ago`;
    const months = Math.floor(absDays / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 30) return `In ${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `In ${months} month${months > 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `In ${years} year${years > 1 ? "s" : ""}`;
  return `In ${years}y ${remainingMonths}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeliveredMessageCard({ message }: { message: Message }) {
  const isUnread = !message.isRead;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/message/[id]", params: { id: message.id.toString() } })}
      style={({ pressed }) => [
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, isUnread ? styles.statusDotUnread : styles.statusDotRead]} />
        <Text style={[styles.cardDate, isUnread && styles.cardDateUnread]}>
          {formatDate(message.createdAt)}
        </Text>
        {isUnread && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>
        {message.content}
      </Text>
      <View style={styles.cardFooter}>
        <Feather name="clock" size={13} color={Colors.light.textTertiary} />
        <Text style={styles.cardFooterText}>
          Sent {formatRelativeDate(message.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function PendingMessageCard({ message }: { message: Message }) {
  return (
    <View style={[styles.card, styles.cardPending]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, styles.statusDotPending]} />
        <Text style={styles.cardDate}>
          {message.frequency === "biannual" ? "6 months" : "1 year"}
        </Text>
      </View>
      <View style={styles.pendingContent}>
        <Feather name="lock" size={16} color={Colors.light.textTertiary} />
        <Text style={styles.pendingText}>
          Opens {formatRelativeDate(message.deliverAt)}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Feather name="send" size={13} color={Colors.light.textTertiary} />
        <Text style={styles.cardFooterText}>
          Written {formatDate(message.createdAt)}
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
            <Feather name="mail" size={32} color={Colors.light.tint} />
          </View>
        </View>
        <Text style={styles.loginTitle}>Future Letter</Text>
        <Text style={styles.loginSubtitle}>
          Write a message to your future self. Open it in 6 months or a year.
        </Text>
        <Pressable
          onPress={login}
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

  const renderItem = ({ item, section }: { item: Message; section: string }) => {
    if (section === "delivered") {
      return <DeliveredMessageCard message={item} />;
    }
    return <PendingMessageCard message={item} />;
  };

  const sections: { key: string; title: string; data: Message[] }[] = [];
  if (delivered.length > 0) {
    sections.push({ key: "delivered", title: unreadCount > 0 ? `Delivered (${unreadCount} new)` : "Delivered", data: delivered });
  }
  if (pending.length > 0) {
    sections.push({ key: "pending", title: "Waiting to be opened", data: pending });
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
          <Text style={styles.greeting}>
            {user?.firstName ? `Hi, ${user.firstName}` : "Hi there"}
          </Text>
          <Text style={styles.headerTitle}>Your Letters</Text>
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
          <View style={styles.emptyIcon}>
            <Feather name="inbox" size={40} color={Colors.light.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No letters yet</Text>
          <Text style={styles.emptySubtitle}>
            Write your first message to your future self
          </Text>
          <Pressable
            onPress={() => router.push("/compose")}
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather name="edit" size={16} color={Colors.light.tint} />
            <Text style={styles.emptyButtonText}>Write a Letter</Text>
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
            if (item.message && item.section) {
              return renderItem({ item: item.message, section: item.section });
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
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  composeButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardUnread: {
    borderColor: Colors.light.tint,
    borderWidth: 1.5,
    backgroundColor: "#FAFAFF",
  },
  cardPending: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderColor: Colors.light.borderLight,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotUnread: {
    backgroundColor: Colors.light.tint,
  },
  statusDotRead: {
    backgroundColor: Colors.light.success,
  },
  statusDotPending: {
    backgroundColor: Colors.light.accent,
  },
  cardDate: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    flex: 1,
  },
  cardDateUnread: {
    color: Colors.light.tint,
    fontFamily: "Inter_600SemiBold",
  },
  newBadge: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
    letterSpacing: 0.5,
  },
  cardContent: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardFooterText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  pendingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
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
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
