import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { PurchasesStoreProduct } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";

const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

const FREE_MESSAGE_LIMIT = 2;

const PRODUCT_IDS = ["capsule_pro_monthly", "capsule_pro_yearly"];

function getRevenueCatApiKey() {
  if (!REVENUECAT_IOS_API_KEY) {
    console.warn("RevenueCat API key not found, subscription features disabled");
    return null;
  }
  return REVENUECAT_IOS_API_KEY;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  console.log("Configured RevenueCat");
}

function useSubscriptionContext() {
  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    staleTime: 300 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["revenuecat", "products"],
    queryFn: async () => {
      const products = await Purchases.getProducts(PRODUCT_IDS);
      return products;
    },
    staleTime: 300 * 1000,
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
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    products: productsQuery.data ?? [],
    isSubscribed,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
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
