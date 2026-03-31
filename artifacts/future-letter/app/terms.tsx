import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Terms of Use</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>

        <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        <Text style={styles.body}>
          By downloading, installing, or using Text Capsule ("the App"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>Description of Service</Text>
        <Text style={styles.body}>
          Text Capsule allows you to write messages to yourself that are delivered via SMS at a future date you choose (6 months or 1 year). The App stores your messages securely and delivers them at the scheduled time.
        </Text>

        <Text style={styles.sectionTitle}>Account Registration</Text>
        <Text style={styles.body}>
          You must create an account with a valid email address and phone number to use the App. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
        </Text>

        <Text style={styles.sectionTitle}>Subscriptions & Payments</Text>
        <Text style={styles.body}>
          {"\u2022"} Text Capsule offers a free tier (up to 2 messages) and a premium subscription called "Capsule Pro" for unlimited messages.{"\n"}
          {"\u2022"} Capsule Pro is available as a monthly subscription ($1.99/month) or yearly subscription ($12.99/year).{"\n"}
          {"\u2022"} Payment is charged to your Apple ID account at confirmation of purchase.{"\n"}
          {"\u2022"} Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period.{"\n"}
          {"\u2022"} You can manage or cancel your subscription at any time through your Apple ID account settings.{"\n"}
          {"\u2022"} No refunds will be provided for any unused portion of a subscription period.
        </Text>

        <Text style={styles.sectionTitle}>Acceptable Use</Text>
        <Text style={styles.body}>
          You agree not to use the App to:{"\n"}
          {"\u2022"} Send messages that are illegal, threatening, or harassing{"\n"}
          {"\u2022"} Attempt to interfere with or disrupt the service{"\n"}
          {"\u2022"} Use the service for commercial spam or unsolicited messages{"\n"}
          {"\u2022"} Create multiple accounts for the purpose of abusing the free tier
        </Text>

        <Text style={styles.sectionTitle}>Message Delivery</Text>
        <Text style={styles.body}>
          We make reasonable efforts to deliver your messages at the scheduled time. However, delivery depends on third-party SMS services and network availability. We do not guarantee exact delivery times and are not liable for delayed or failed deliveries.
        </Text>

        <Text style={styles.sectionTitle}>Account Deletion</Text>
        <Text style={styles.body}>
          You may delete your account at any time from the Settings screen within the App. Deleting your account permanently removes all your messages and personal data.
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.body}>
          Text Capsule is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the App, including but not limited to lost messages, delivery failures, or service interruptions.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions about these Terms, please contact us at simonaletta@hotmail.co.uk.
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  lastUpdated: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
});
