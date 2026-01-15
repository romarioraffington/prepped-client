// External Dependencies
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { persist, createJSONStorage } from "zustand/middleware";

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesEntitlementInfo,
} from "react-native-purchases";

// Internal Dependencies
import { reportError, reportWarning } from "@/libs/utils";
import { ENTITLEMENTS } from "@/libs/types/Subscription";
import type { SubscriptionStore } from "@/libs/types/Subscription";

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      reportWarning("Error reading from secure storage", {
        component: "SubscriptionStore",
        action: "Get Item",
        extra: { name, error },
      });
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      reportWarning("Error writing to secure storage", {
        component: "SubscriptionStore",
        action: "Set Item",
        extra: { name, error },
      });
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      reportWarning("Error removing from secure storage", {
        component: "SubscriptionStore",
        action: "Remove Item",
        extra: { name, error },
      });
    }
  },
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      error: null,
      isPremium: false,
      customerInfo: null,
      offerings: null,
      currentEntitlements: null,
      isInitialized: false, // Whether the subscription system has been successfully initialized
      isOperationInProgress: false, // Whether an async operation (purchase, restore, etc.) is currently running

      // Actions
      setOperationInProgress: (inProgress: boolean) =>
        set({ isOperationInProgress: inProgress }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      clearCache: () => {
        set({
          isPremium: false,
          customerInfo: null,
          currentEntitlements: null,
          offerings: null,
          isInitialized: false,
        });
        console.log("🗑️ Cache cleared. App will reinitialize on next use.");
      },

      setCustomerInfo: (customerInfo: CustomerInfo) => {
        const entitlements = customerInfo.entitlements.active;
        const allEntitlements = customerInfo.entitlements.all;
        const newIsPremium = !!entitlements[ENTITLEMENTS.PREMIUM];

        set({
          customerInfo,
          isPremium: newIsPremium,
          currentEntitlements: allEntitlements, // Use all entitlements to include expired ones
        });
      },

      setOfferings: (offerings: PurchasesOffering[]) => set({ offerings }),

      setCurrentEntitlements: (entitlements: {
        [key: string]: PurchasesEntitlementInfo;
      }) => {
        set({
          currentEntitlements: entitlements,
          isPremium: !!entitlements[ENTITLEMENTS.PREMIUM],
        });
      },

      updateSubscriptionStatus: () => {
        const { customerInfo } = get();
        if (customerInfo) {
          const entitlements = customerInfo.entitlements.active;
          set({
            currentEntitlements: entitlements,
            isPremium: !!entitlements[ENTITLEMENTS.PREMIUM],
          });
        }
      },

      initializePurchases: async () => {
        try {
          set({ isOperationInProgress: true, error: null });

          // Check if RevenueCat is configured
          try {
            // Get current customer info
            const customerInfo = await Purchases.getCustomerInfo();
            get().setCustomerInfo(customerInfo);

            // Get available offerings
            try {
              const offerings = await Purchases.getOfferings();
              // Include all offerings, not just the current one
              const allOfferings = Object.values(offerings.all || {});
              if (allOfferings.length > 0) {
                get().setOfferings(allOfferings);
              }
            } catch (offeringsError: any) {
              console.warn(
                "Failed to fetch offerings:",
                offeringsError.message,
              );
            }

            set({ isInitialized: true });
          } catch (purchasesError: any) {
            if (purchasesError.message?.includes("singleton instance")) {
              throw new Error(
                "RevenueCat not configured. Please configure API keys first.",
              );
            }
            throw purchasesError;
          }
        } catch (error: any) {
          reportError(error, {
            component: "SubscriptionStore",
            action: "Initialize RevenueCat",
          });
          set({ error: error.message || "Failed to initialize subscriptions" });
        } finally {
          set({ isOperationInProgress: false });
        }
      },

      purchasePackage: async (packageToPurchase: PurchasesPackage) => {
        try {
          set({ isOperationInProgress: true, error: null });

          const { customerInfo } =
            await Purchases.purchasePackage(packageToPurchase);

          get().setCustomerInfo(customerInfo);
        } catch (error: any) {
          if (error.message?.includes("singleton instance")) {
            set({
              error:
                "RevenueCat not configured. Please configure API keys first.",
            });
          } else {
            set({ error: error.message || "Purchase failed" });
          }
          throw error;
        } finally {
          set({ isOperationInProgress: false });
        }
      },

      restorePurchases: async () => {
        try {
          set({ isOperationInProgress: true, error: null });

          // Restore purchases - this forces sync with Apple's servers
          const customerInfo = await Purchases.restorePurchases();
          get().setCustomerInfo(customerInfo);
        } catch (error: any) {
          reportError(error, {
            component: "SubscriptionStore",
            action: "Restore Purchases",
          });
          if (error.message?.includes("singleton instance")) {
            set({
              error:
                "RevenueCat not configured. Please configure API keys first.",
            });
          } else {
            set({ error: error.message || "Failed to restore purchases" });
          }
          throw error;
        } finally {
          set({ isOperationInProgress: false });
        }
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        isInitialized: state.isInitialized,
        currentEntitlements: state.currentEntitlements,
      }),
    },
  ),
);
