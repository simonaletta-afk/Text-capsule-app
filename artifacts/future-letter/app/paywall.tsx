import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useSubscription } from "@/lib/revenuecat";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const currentOffering = offerings?.current;
  const packages = currentOffering?.availablePackages ?? [];

  const monthlyPkg = packages.find((p) => p.packageType === "MONTHLY");
  const annualPkg = packages.find((p) => p.packageType === "ANNUAL");
  const displayPackages = [monthlyPkg, annualPkg].filter(Boolean);

  const handlePurchase = async () => {
    const pkg = displayPackages[selectedIndex];
    if (!pkg) return;
    setError(null);
    try {
      await purchase(pkg);
      router.back();
    } catch (e: any) {
      if (e.userCancelled) return;
      setError(e.message || "Purchase failed. Please try again.");
    }
  };

  const handleRestore = async () => {
    setError(null);
    try {
      await restore();
      router.back();
    } catch (e: any) {
      setError("Could not restore purchases.");
    }
  };

  const features = [
    { icon: "infinity" as const, text: "Unlimited text capsules" },
    { icon: "calendar" as const, text: "Custom delivery dates" },
    { icon: "star" as const, text: "Priority SMS delivery" },
    { icon: "heart" as const, text: "Support indie development" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={22} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <Feather name="unlock" size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Upgrade to Capsule Pro</Text>
        <Text style={styles.subtitle}>
          Unlock unlimited messages to your future self
        </Text>

        <View style={styles.featuresCard}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon} size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.packagesRow}>
          {displayPackages.map((pkg, i) => {
            if (!pkg) return null;
            const isSelected = i === selectedIndex;
            const isAnnual = pkg.packageType === "ANNUAL";
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelectedIndex(i)}
                style={[styles.packageCard, isSelected && styles.packageCardSelected]}
              >
                {isAnnual && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>BEST VALUE</Text>
                  </View>
                )}
                <Text style={[styles.packageLabel, isSelected && styles.packageLabelSelected]}>
                  {isAnnual ? "Yearly" : "Monthly"}
                </Text>
                <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                  {pkg.product.priceString}
                </Text>
                <Text style={[styles.packagePeriod, isSelected && styles.packagePeriodSelected]}>
                  {isAnnual ? "/year" : "/month"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color={Colors.light.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || displayPackages.length === 0}
          style={({ pressed }) => [
            styles.purchaseButton,
            pressed && { opacity: 0.85 },
            isPurchasing && { opacity: 0.7 },
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
          <Text style={styles.restoreText}>
            {isRestoring ? "Restoring..." : "Restore Purchases"}
          </Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
    paddingBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 26,
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
    marginBottom: 28,
    lineHeight: 22,
  },
  featuresCard: {
    width: "100%",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    flex: 1,
  },
  packagesRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  packageCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  packageCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  packageLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  packageLabelSelected: {
    color: Colors.light.tint,
  },
  packagePrice: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  packagePriceSelected: {
    color: Colors.light.tint,
  },
  packagePeriod: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  packagePeriodSelected: {
    color: Colors.light.tint,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.danger,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: 12,
    alignItems: "center",
  },
  purchaseButton: {
    width: "100%",
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 26,
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  restoreButton: {
    padding: 8,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
});
