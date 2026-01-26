import Constants from "expo-constants";
// External Dependencies
import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import Purchases from "react-native-purchases";

import { reportError } from "@/libs/utils";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import type {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
// Internal Dependencies
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  // State
  isPremium: boolean;
  error: string | null;
  isInitialized: boolean; // Whether the subscription system has been successfully initialized
  isOperationInProgress: boolean; // Whether an async operation (purchase, restore, etc.) is currently running
  offerings: PurchasesOffering[] | null;
  currentEntitlements: { [key: string]: any } | null;

  // Actions
  clearError: () => void;
  clearCache: () => void;
  restorePurchases: () => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const listenerAddedRef = useRef(false);
  const removeListenerRef = useRef<((customerInfo: any) => void) | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  const {
    // State
    error,
    isPremium,
    offerings,
    isInitialized,
    isOperationInProgress,
    currentEntitlements,

    // Actions
    setError,
    clearError,
    clearCache,
    setOfferings,
    setCustomerInfo,
    initializePurchases,
    purchasePackage: storePurchasePackage,
    restorePurchases: storeRestorePurchases,
  } = useSubscriptionStore();

  // Configure RevenueCat (runs once on app start)
  useEffect(() => {
    const configureRevenueCat = async () => {
      try {
        const { REVENUECAT_API_KEY_IOS } = Constants.expoConfig?.extra || {};

        if (!REVENUECAT_API_KEY_IOS) {
          console.warn(
            "RevenueCat iOS API key not configured. Subscription features will be disabled.",
          );
          setError("RevenueCat iOS API key not configured");
          return;
        }

        /**
         * Configure RevenueCat (safe to call multiple times)
         */
        try {
          // Set the appropriate log level based on the environment
          Purchases.setLogLevel(
            __DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN,
          );

          await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
        } catch (error: any) {
          // If already configured, that's fine
          if (!error.message?.includes("singleton instance")) {
            throw error;
          }
        }
      } catch (error: any) {
        reportError(error, {
          component: "SubscriptionContext",
          action: "Configure RevenueCat",
        });
        setError(error.message || "Failed to configure RevenueCat");
      }
    };

    configureRevenueCat();
  }, [setError]);

  // Initialize subscription data when user is authenticated
  useEffect(() => {
    const initSubscriptionData = async () => {
      if (!isAuthenticated) {
        // Debug log - not an error, just skipping initialization
        return;
      }

      try {
        // Set up customer info listener (only once)
        if (!listenerAddedRef.current) {
          const listener = (customerInfo: any) => {
            setCustomerInfo(customerInfo);
          };

          Purchases.addCustomerInfoUpdateListener(listener);
          removeListenerRef.current = listener;
          listenerAddedRef.current = true;
        }

        // Initialize subscription data
        await initializePurchases();
      } catch (error: any) {
        reportError(error, {
          component: "SubscriptionContext",
          action: "Initialize Subscription Data",
        });
        setError(error.message || "Failed to initialize subscriptions");
      }
    };

    initSubscriptionData();

    // Cleanup listener on unmount
    return () => {
      if (listenerAddedRef.current && removeListenerRef.current) {
        try {
          Purchases.removeCustomerInfoUpdateListener(removeListenerRef.current);
          removeListenerRef.current = null;
          listenerAddedRef.current = false;
        } catch (error) {
          reportError(error, {
            component: "SubscriptionContext",
            action: "Remove Customer Info Listener",
          });
        }
      }
    };
  }, [isAuthenticated, initializePurchases, setCustomerInfo, setError]);

  const refreshSubscriptionStatus = async () => {
    // Only fetch subscription data if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);
    } catch (error: any) {
      reportError(error, {
        component: "SubscriptionContext",
        action: "Refresh Subscription Status",
      });
      if (error.message?.includes("singleton instance")) {
        setError("RevenueCat not configured. Please configure API keys first.");
      } else {
        setError(error.message || "Failed to refresh subscription status");
      }
    }
  };

  useEffect(() => {
    const setUserId = async () => {
      if (isAuthenticated && user?.id) {
        try {
          // Only log in if we're not already logged in with this user
          if (lastUserIdRef.current !== user.id) {
            await Purchases.logIn(user.id);
            lastUserIdRef.current = user.id;

            /**
             * Set user email and displayName in RevenueCat
             */
            if (user.email) {
              try {
                await Purchases.setEmail(user.email);

                if (user.firstName || user.lastName) {
                  await Purchases.setDisplayName(
                    `${user.firstName} ${user.lastName}`,
                  );
                }
              } catch (error: any) {
                reportError(error, {
                  component: "SubscriptionContext",
                  action: "Set RevenueCat Email/DisplayName",
                  extra: { userId: user.id },
                });
                // Don't throw here as email setting shouldn't break the app
              }
            }

            // Force fetch subscription status after login
            await refreshSubscriptionStatus();
          }
        } catch (error: any) {
          reportError(error, {
            component: "SubscriptionContext",
            action: "Set RevenueCat User ID",
            extra: { userId: user.id },
          });
          // Don't throw here as this shouldn't break the app
        }
      } else if (!isAuthenticated && lastUserIdRef.current) {
        try {
          await Purchases.logOut();
          lastUserIdRef.current = null;

          clearCache();
        } catch (error: any) {
          reportError(error, {
            component: "SubscriptionContext",
            action: "Log Out RevenueCat User",
          });
          lastUserIdRef.current = null; // Reset state even if logout failed
        }
      }
    };

    setUserId();
  }, [isAuthenticated, user?.id, user?.email]);

  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      await storePurchasePackage(packageToPurchase);
    } catch (error: any) {
      reportError(error, {
        component: "SubscriptionContext",
        action: "Purchase Package",
        extra: { packageId: packageToPurchase.identifier },
      });
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      await storeRestorePurchases();
    } catch (error: any) {
      reportError(error, {
        component: "SubscriptionContext",
        action: "Restore Purchases",
      });
      throw error;
    }
  };

  const setUserId = async (userId: string) => {
    try {
      await Purchases.logIn(userId);
    } catch (error: any) {
      reportError(error, {
        component: "SubscriptionContext",
        action: "Set User ID",
        extra: { userId },
      });
      setError(error.message || "Failed to set user ID");
      throw error;
    }
  };

  const value: SubscriptionContextType = {
    // State
    error,
    offerings,
    isPremium,
    isInitialized,
    currentEntitlements,
    isOperationInProgress,

    // Actions
    clearError,
    clearCache,
    setUserId,
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
