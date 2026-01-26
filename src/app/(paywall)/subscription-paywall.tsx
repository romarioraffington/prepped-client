import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
// External Dependencies
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "~/src/contexts/SubscriptionContext";

import { Confetti, ProBadge } from "@/components";
// Internal Dependencies
import { LEGAL_ROUTES } from "@/libs/constants";
import { isIPad, reportError } from "@/libs/utils";

// Hero Constants
const HERO_RATIO = isIPad() ? 0.35 : 0.53;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * HERO_RATIO;

// Gradient Constants
const GRADIENT_HEIGHT = 140;
const CIRCULAR_BORDER_RADIUS = 9999;
const HERO_CONTENT_OVERLAP = isIPad() ? -50 : -100;

// Color Constants
const WHITE = "#FFFFFF";
const BLACK = "#000";
const GRAY_TEXT = "#667";
const DARK_TEXT = "#1a1a1a";
const LIGHT_GRAY = "#8B8B8B";
const BORDER_GRAY = "#E5E5E5";
const PRIMARY_PURPLE = "#8a49b4";
const SECONDARY_PURPLE = "#7C3AED";
const VERY_LIGHT_PURPLE = "#F5F3FF";
const LIGHT_PURPLE_BG = "rgba(229, 210, 255, 0.44)";

// Gradient Colors
const HERO_GRADIENT_COLORS = ["#FFFFF300", "#FFFFFFCC", "#FFFFFF"] as const;

// Plan Types
const PLAN_MONTHLY = "monthly" as const;
const PLAN_WEEKLY = "weekly" as const;

export default function SubscriptionPaywall() {
  const insets = useSafeAreaInsets();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { offerings, purchasePackage, restorePurchases } = useSubscription();

  /**
   * Extract packages from offerings
   */
  const defaultOffering =
    offerings?.find((offering) => offering.identifier === "default") ||
    offerings?.[0];

  /**
   * Find monthly package
   */
  const monthlyPackage = defaultOffering?.availablePackages.find(
    (pkg) =>
      pkg.packageType === "MONTHLY" || pkg.identifier.includes("monthly"),
  );
  const weeklyPackage = defaultOffering?.availablePackages.find(
    (pkg) => pkg.packageType === "WEEKLY" || pkg.identifier.includes("weekly"),
  );

  /**
   * Get pricing and plan names from RevenueCat packages
   */
  const monthlyPrice = `${monthlyPackage?.product?.priceString}/mo`;
  const monthlyTitle = "Monthly";

  let monthlySubtitle = "";
  if (monthlyPackage?.product?.pricePerWeekString) {
    monthlySubtitle = `~${monthlyPackage?.product?.pricePerWeekString} weekly`;
  }

  const weeklyTitle = "Weekly";
  const weeklyPrice = `${weeklyPackage?.product?.priceString}/week`;

  /**
   * Set default plan and selected package
   */
  const [plan, setPlan] = useState<typeof PLAN_MONTHLY | typeof PLAN_WEEKLY>(
    PLAN_MONTHLY,
  );
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(monthlyPackage || null);

  const closeModal = () => {
    router.back();
  };

  const handleMonthlyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlan(PLAN_MONTHLY);
    setSelectedPackage(monthlyPackage || null);
  };

  const handleWeeklyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlan(PLAN_WEEKLY);
    setSelectedPackage(weeklyPackage || null);
  };

  /**
   * Handle purchase of the selected package
   */
  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert(
        "Oops a problem occurred",
        "We will investigate this issue and get back to you as soon as possible.",
      );

      reportError(new Error("No package was selected during purchase"), {
        component: "SubscriptionPaywall",
        action: "Purchase",
        extra: { offerings: offerings?.length },
      });
      return;
    }

    setIsPurchasing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await purchasePackage(selectedPackage);

      // Show confetti celebration
      setShowConfetti(true);

      // Purchase successful
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Wait for confetti animation, then navigate
      setTimeout(() => {
        setShowConfetti(false);
        router.back();
      }, 2500);
    } catch (error: any) {
      // User cancelled - don't show error
      if (
        error.message?.includes("cancelled") ||
        error.message?.includes("canceled")
      ) {
        return;
      }

      // Other errors - show alert
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reportError(error, {
        component: "SubscriptionPaywall",
        action: "Purchase Failed",
        extra: { packageId: selectedPackage?.identifier },
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Navigate to Terms of Service
   */
  const handleTermsOfServicePress = () => {
    router.push(LEGAL_ROUTES.TERMS_OF_SERVICE);
  };

  /**
   * Navigate to Privacy Policy
   */
  const handlePrivacyPolicyPress = () => {
    router.push(LEGAL_ROUTES.PRIVACY_POLICY);
  };

  /**
   * Handle restore purchases
   */
  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await restorePurchases();

      // Restore successful
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Restore Complete",
        "Your purchases have been restored successfully.",
        [
          {
            text: "OK",
          },
        ],
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reportError(error, {
        component: "SubscriptionPaywall",
        action: "Restore Failed",
      });
      Alert.alert(
        "Restore Failed",
        error.message || "Unable to restore purchases. Please try again.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          source={require("~/assets/images/suitcase/suitcase-with-location-marker.webp")}
        />

        <LinearGradient
          style={styles.heroGradient}
          colors={HERO_GRADIENT_COLORS}
        />

        <View style={styles.headerContainer}>
          <Pressable onPress={closeModal} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={PRIMARY_PURPLE} />
          </Pressable>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Pro Badge */}
        <ProBadge text="Premium" animated />

        {/* Headline & Description */}
        <Text style={styles.title}>
          Your perfect trip, {"\n"}organized in one place
        </Text>

        <Text style={styles.subtitle}>
          Save anything you discover and organize it effortlessly — without
          limits.
        </Text>

        {/* Bottom Actions Container */}
        <View
          style={[styles.bottomContainer, { paddingBottom: insets.bottom + 4 }]}
        >
          {/* Plan Selection */}
          <View style={styles.planButtonsContainer}>
            <Pressable
              onPress={handleMonthlyPress}
              style={[
                styles.planButton,
                plan === PLAN_MONTHLY && styles.planButtonSelected,
              ]}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueBadgeText}>Best Value</Text>
              </View>
              <View style={styles.planButtonContent}>
                <View style={styles.planButtonLeft}>
                  <View
                    style={[
                      styles.radioIndicator,
                      plan === PLAN_MONTHLY && styles.radioIndicatorSelected,
                    ]}
                  >
                    {plan === PLAN_MONTHLY && (
                      <Check size={14} color={PRIMARY_PURPLE} strokeWidth={3} />
                    )}
                  </View>
                  <View style={styles.planButtonTextContainer}>
                    <Text style={styles.planButtonTitle}>{monthlyTitle}</Text>
                    <Text style={styles.planButtonSubtitle}>
                      {monthlySubtitle}
                    </Text>
                  </View>
                </View>
                <Text style={styles.planButtonPrice}>{monthlyPrice}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={handleWeeklyPress}
              style={[
                styles.planButton,
                plan === PLAN_WEEKLY && styles.planButtonSelected,
              ]}
            >
              <View style={styles.planButtonContent}>
                <View style={styles.planButtonLeft}>
                  <View
                    style={[
                      styles.radioIndicator,
                      plan === PLAN_WEEKLY && styles.radioIndicatorSelected,
                    ]}
                  >
                    {plan === PLAN_WEEKLY && (
                      <Check size={14} color={PRIMARY_PURPLE} strokeWidth={3} />
                    )}
                  </View>
                  <View style={styles.planButtonTextContainer}>
                    <Text style={styles.planButtonTitle}>{weeklyTitle}</Text>
                  </View>
                </View>
                <Text style={styles.planButtonPrice}>{weeklyPrice}</Text>
              </View>
            </Pressable>
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={handlePurchase}
            style={[
              styles.continueButton,
              (isPurchasing || !selectedPackage) &&
                styles.continueButtonDisabled,
            ]}
            disabled={isPurchasing || !selectedPackage}
          >
            {isPurchasing || showConfetti ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={WHITE} />
                <Text style={styles.continueButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </Pressable>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              style={isRestoring && styles.footerLinkDisabled}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={LIGHT_GRAY} />
              ) : (
                <Text style={styles.footerLinkText}>Restore</Text>
              )}
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={handleTermsOfServicePress}>
              <Text style={styles.footerLinkText}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={handlePrivacyPolicyPress}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {showConfetti && <Confetti />}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout Containers
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  heroSection: {
    position: "relative",
    height: HERO_HEIGHT,
  },
  heroGradient: {
    bottom: 0,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    position: "absolute",
  },
  contentContainer: {
    bottom: 28,
    paddingHorizontal: 20,
    marginTop: HERO_CONTENT_OVERLAP,
  },
  bottomContainer: {
    bottom: 0,
  },

  // Header & Close Button
  headerContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    zIndex: 50,
    paddingHorizontal: 24,
  },
  closeButton: {
    padding: 4,
    right: 10,
    top: 60,
    overflow: "hidden",
    borderRadius: CIRCULAR_BORDER_RADIUS,
    backgroundColor: LIGHT_PURPLE_BG,
  },

  // Typography
  title: {
    fontSize: 32,
    color: DARK_TEXT,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 17,
    color: GRAY_TEXT,
    fontWeight: "400",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 30,
  },

  // Plan Selection
  planButtonsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 30,
  },
  planButton: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 12,
    position: "relative",
    overflow: "visible",
  },
  planButtonSelected: {
    borderColor: PRIMARY_PURPLE,
  },
  planButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  planButtonTextContainer: {
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  planButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BLACK,
    marginBottom: 2,
    lineHeight: 20,
  },
  planButtonSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: GRAY_TEXT,
    lineHeight: 16,
  },
  planButtonPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: BLACK,
    lineHeight: 20,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER_GRAY,
    alignItems: "center",
    justifyContent: "center",
  },
  radioIndicatorSelected: {
    borderColor: PRIMARY_PURPLE,
    backgroundColor: VERY_LIGHT_PURPLE,
  },
  bestValueBadge: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: PRIMARY_PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  bestValueBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Actions
  continueButton: {
    marginBottom: 16,
    padding: 16,
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: SECONDARY_PURPLE,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Footer Links
  footerLinks: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLinkText: {
    color: LIGHT_GRAY,
    fontSize: 14,
    fontWeight: "500",
  },
  footerLinkDisabled: {
    opacity: 0.6,
  },
  footerSeparator: {
    color: LIGHT_GRAY,
    fontSize: 14,
    fontWeight: "400",
  },
});
