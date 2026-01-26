import { useSubscription } from "@/contexts/SubscriptionContext";
import { ENTITLEMENTS } from "@/libs/types/Subscription";

/**
 * Hook to check subscription status and provide utility functions
 *
 * @returns Object containing subscription state and utility functions
 */
export const useSubscriptionStatus = () => {
  const {
    error,
    isPremium,
    isInitialized, // Whether the subscription system has been successfully initialized
    isOperationInProgress, // Whether an async operation (purchase, restore, etc.) is currently running
    currentEntitlements,
  } = useSubscription();

  const hasActiveSubscription = isPremium;

  // Determine the current subscription tier
  const subscriptionTier = isPremium ? "premium" : "free";

  // Extract expiration date from entitlements
  const premiumEntitlement = currentEntitlements?.[ENTITLEMENTS.PREMIUM];
  const expirationDate = premiumEntitlement?.expirationDate;

  // Determine if auto-renew is enabled using the willRenew flag from the entitlement
  // Only check willRenew if the subscription is currently active (isPremium)
  // Expired entitlements may still have willRenew: true, but they're not relevant
  const isAutoRenewEnabled =
    isPremium && (premiumEntitlement?.willRenew ?? false);

  const canAccessFeature = (requiredTier: "free" | "premium") => {
    // Don't allow access to any features until the subscription system is initialized
    if (!isInitialized) return false;

    switch (requiredTier) {
      case "free":
        return true;
      case "premium":
        return isPremium;
      default:
        return false;
    }
  };

  const getUpgradeMessage = (requiredTier: "premium") => {
    return "Upgrade to Premium to access this feature";
  };

  return {
    error,
    isPremium,
    hasActiveSubscription,
    isInitialized, // Whether the subscription system has been successfully initialized
    subscriptionTier, // Current subscription tier: "free" or "premium"
    expirationDate, // Expiration date from entitlements (renewal date for active subscriptions)
    isAutoRenewEnabled, // Whether auto-renew is enabled for the subscription
    isOperationInProgress, // Whether an async operation (purchase, restore, etc.) is currently running

    // Utility Functions
    canAccessFeature,
    getUpgradeMessage,
  };
};
