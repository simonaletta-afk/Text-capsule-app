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

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>

        <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
        <Text style={styles.body}>
          Text Capsule is built with your privacy in mind. We collect only the minimum information needed to deliver your future messages.
        </Text>

        <Text style={styles.sectionTitle}>What We Collect</Text>
        <Text style={styles.body}>
          {"\u2022"} Your email address (for account login){"\n"}
          {"\u2022"} Your phone number (to deliver messages via SMS or WhatsApp){"\n"}
          {"\u2022"} The messages you write (stored securely until delivery){"\n"}
          {"\u2022"} Your delivery preferences (SMS or WhatsApp)
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Data</Text>
        <Text style={styles.body}>
          Your data is used solely to provide the Text Capsule service. We use your phone number to deliver your messages at the scheduled time via Twilio (our messaging provider). We do not sell, share, or use your data for advertising.
        </Text>

        <Text style={styles.sectionTitle}>Message Storage</Text>
        <Text style={styles.body}>
          Your messages are stored securely in our database until they are delivered. After delivery, messages remain in your account history so you can look back on them. You can delete any message at any time.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.body}>
          We use Twilio to send SMS and WhatsApp messages. When a message is delivered, your phone number and message content are shared with Twilio for the purpose of delivery only. Please refer to Twilio's privacy policy for more information on how they handle data.
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.body}>
          Your password is securely hashed and never stored in plain text. All communication between the app and our servers is encrypted. We take reasonable measures to protect your personal information.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          You can:{"\n"}
          {"\u2022"} View all your stored messages at any time{"\n"}
          {"\u2022"} Delete any message before or after delivery{"\n"}
          {"\u2022"} Update your phone number and delivery preferences{"\n"}
          {"\u2022"} Request deletion of your account by contacting support
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions about this privacy policy or how we handle your data, please reach out through our support page in the app.
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
