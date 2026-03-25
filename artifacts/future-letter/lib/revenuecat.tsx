import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { PurchasesStoreProduct } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";

const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

const FREE_MESSAGE_LIMIT = 2;

const PRODUCT_IDS = ["capsule_pro_monthly", "capsule_pro_yearly"];

let revenueCatConfigured = false;

function getRevenueCatApiKey() {
  if (!REVENUECAT_IOS_API_KEY) {
    console.warn("RevenueCat API key not found, subscription features disabled");
    return null;
  }
  return REVENUECAT_IOS_API_KEY;
}

export function initializeRevenueCat() {
  if (Platform.OS === "web") return;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  try {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    revenueCatConfigured = true;
    console.log("Configured RevenueCat");
  } catch (e) {
    console.error("Failed to configure RevenueCat:", e);
  }
}

function useSubscriptionContext() {
  const isNative = Platform.OS !== "web";

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      if (!revenueCatConfigured) return null;
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
    retry: 2,
    enabled: isNative,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      if (!revenueCatConfigured) return null;
      const offerings = await Purchases.getOfferings();
      console.log("Offerings loaded:", JSON.stringify(offerings?.current?.availablePackages?.length ?? 0), "packages");
      return offerings;
    },
    staleTime: 300 * 1000,
    retry: 2,
    enabled: isNative,
  });

  const productsQuery = useQuery({
    queryKey: ["revenuecat", "products"],
    queryFn: async () => {
      if (!revenueCatConfigured) return [];
      try {
        const products = await Purchases.getProducts(
          PRODUCT_IDS,
          Purchases.PRODUCT_CATEGORY.SUBSCRIPTION
        );
        console.log("Products loaded directly:", products.length, products.map(p => p.identifier));
        return products;
      } catch (e) {
        console.error("Failed to fetch products directly:", e);
        return [];
      }
    },
    staleTime: 300 * 1000,
    retry: 3,
    enabled: isNative,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const purchaseProductMutation = useMutation({
    mutationFn: async (product: PurchasesStoreProduct) => {
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const isSubscribed =
    customerInfoQuery.data?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    products: productsQuery.data ?? [],
    isSubscribed,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading || productsQuery.isLoading,
    purchase: purchaseMutation.mutateAsync,
    purchaseProduct: purchaseProductMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending || purchaseProductMutation.isPending,
    isRestoring: restoreMutation.isPending,
    freeMessageLimit: FREE_MESSAGE_LIMIT,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
