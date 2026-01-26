import type {
  PurchasesEntitlementInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

export interface SubscriptionState {
  isPremium: boolean;
  error: string | null;
  customerInfo: any | null;
  offerings: PurchasesOffering[] | null;
  isInitialized: boolean; // Whether the subscription system has been successfully initialized
  isOperationInProgress: boolean; // Whether an async operation (purchase, restore, etc.) is currently running
  currentEntitlements: { [key: string]: PurchasesEntitlementInfo } | null;
}

export interface SubscriptionStore extends SubscriptionState {
  // Actions
  clearError: () => void;
  clearCache: () => void;
  setError: (error: string | null) => void;
  setCustomerInfo: (customerInfo: any) => void;
  setOfferings: (offerings: PurchasesOffering[]) => void;
  setOperationInProgress: (inProgress: boolean) => void;
  setCurrentEntitlements: (entitlements: {
    [key: string]: PurchasesEntitlementInfo;
  }) => void;
  updateSubscriptionStatus: () => void;
  initializePurchases: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PREMIUM: "premium",
} as const;

export type SubscriptionTier = "free" | "premium";

// Entitlement identifiers (these should match your RevenueCat dashboard)
export const ENTITLEMENTS = {
  PREMIUM: "Premium",
} as const;

export type Entitlement = "premium";

// Product identifiers (these should match your App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "app.tripspire.tripspire.Monthly", // Auto-renewable subscription
} as const;

export type ProductId = string;
