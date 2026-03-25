import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, { PurchasesStoreProduct } from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

const FREE_MESSAGE_LIMIT = 2;

const PRODUCT_IDS = ["capsule_pro_monthly", "capsule_pro_yearly"];

export function initializeRevenueCat() {
  if (Platform.OS === "web") return;
  if (!REVENUECAT_IOS_API_KEY) {
    console.warn("[RC] API key not found");
    return;
  }

  try {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
    console.log("[RC] Configured successfully");
  } catch (e) {
    console.error("[RC] Configure failed:", e);
  }
}

function useSubscriptionContext() {
  const isNative = Platform.OS !== "web";
  const queryClient = useQueryClient();
  const [rcReady, setRcReady] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    if (!REVENUECAT_IOS_API_KEY) return;

    const timer = setTimeout(() => {
      setRcReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isNative]);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        console.log("[RC] Customer info loaded");
        return info;
      } catch (e: any) {
        console.error("[RC] Customer info error:", e?.message || e);
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: 2,
    enabled: isNative && rcReady,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const pkgCount = offerings?.current?.availablePackages?.length ?? 0;
        console.log("[RC] Offerings loaded:", pkgCount, "packages");
        return offerings;
      } catch (e: any) {
        console.error("[RC] Offerings error:", e?.message || e);
        return null;
      }
    },
    staleTime: 300 * 1000,
    retry: 2,
    enabled: isNative && rcReady,
  });

  const productsQuery = useQuery({
    queryKey: ["revenuecat", "products"],
    queryFn: async () => {
      try {
        const products = await Purchases.getProducts(PRODUCT_IDS);
        console.log("[RC] Products loaded:", products.length, products.map(p => `${p.identifier}:${p.priceString}`));
        return products;
      } catch (e: any) {
        console.error("[RC] Products error:", e?.message || e);
        return [];
      }
    },
    staleTime: 300 * 1000,
    retry: 3,
    enabled: isNative && rcReady,
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
    isLoading: (customerInfoQuery.isLoading || offeringsQuery.isLoading || productsQuery.isLoading) && rcReady,
    purchase: purchaseMutation.mutateAsync,
    purchaseProduct: purchaseProductMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending || purchaseProductMutation.isPending,
    isRestoring: restoreMutation.isPending,
    freeMessageLimit: FREE_MESSAGE_LIMIT,
    debugInfo: {
      rcReady,
      hasApiKey: !!REVENUECAT_IOS_API_KEY,
      isNative,
      offeringsLoaded: !!offeringsQuery.data?.current,
      packagesCount: offeringsQuery.data?.current?.availablePackages?.length ?? 0,
      productsCount: productsQuery.data?.length ?? 0,
      offeringsError: offeringsQuery.error?.message ?? null,
      productsError: productsQuery.error?.message ?? null,
    },
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
