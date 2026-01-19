// External Dependencies
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "~/src/contexts/SubscriptionContext";
import { Text, View, Pressable, Dimensions, StyleSheet, Alert, ActivityIndicator } from "react-native";

// Internal Dependencies
import { ProBadge, Confetti } from "@/components";
import { isIPad, reportError } from "@/libs/utils";
import { LEGAL_ROUTES, QUERY_KEYS } from "@/libs/constants";

// Hero Constants
const HERO_RATIO = isIPad() ? 0.35 : 0.49
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * HERO_RATIO;

// Gradient Constants
const GRADIENT_HEIGHT = 140;
const HERO_CONTENT_OVERLAP = -80;
const CIRCULAR_BORDER_RADIUS = 9999;

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

// Package Identifiers
const CREDIT_PACK_20 = "credit_pack_5" as const;
const CREDIT_PACK_10 = "credit_pack_10" as const;

export default function CreditsPaywall() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { offerings, purchasePackage, restorePurchases } = useSubscription();

  /**
   * Extract credits offering from offerings
   */
  const creditsOffering = offerings?.find((offering) => offering.identifier === "credits");

  /**
   * Get all available credit packages
   */
  const creditPackages = creditsOffering?.availablePackages || [];

  /**
   * Set default selected package (first package if available)
   */
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(
    creditPackages[0] || null
  );

  // Update selected package when packages are loaded
  useEffect(() => {
    if (creditPackages.length > 0 && !selectedPackage) {
      setSelectedPackage(creditPackages[0]);
    }
  }, [creditPackages]);

  const closeModal = () => {
    router.back();
  };

  const handlePackagePress = (pkg: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(pkg);
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
        component: "CreditsPaywall",
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

      // Invalidate quota to refresh after credit purchase
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPE_QUOTA] });

      // Purchase successful
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Wait for confetti animation, then navigate
      setTimeout(() => {
        setShowConfetti(false);
        router.replace('/account');
      }, 2500);
    } catch (error: any) {
      // User cancelled - don't show error
      if (error.message?.includes("cancelled") || error.message?.includes("canceled")) {
        return;
      }

      // Other errors - show alert
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reportError(error, {
        component: "CreditsPaywall",
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
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reportError(error, {
        component: "CreditsPaywall",
        action: "Restore Failed",
      });
      Alert.alert(
        "Restore Failed",
        error.message || "Unable to restore purchases. Please try again."
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
          source={require("~/assets/images/suitcase/suitcase-with-coins.webp")}
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
        <ProBadge text="Credits" animated />

        {/* Headline & Description */}
        <Text style={styles.title}>
          Top up your {"\n"}import credits
        </Text>

        <Text style={styles.subtitle}>
          Purchase credits to import and organize your travel discoveries — one-time purchase, no expiration.
        </Text>

        {/* Bottom Actions Container */}
        <View
          style={[styles.bottomContainer, { paddingBottom: insets.bottom + 4 }]}
        >
          {/* Credit Packages Selection */}
          {creditPackages.length > 0 ? (
            <View style={styles.packagesContainer}>
              {creditPackages.map((pkg) => {
                const isBestValue = pkg.identifier === CREDIT_PACK_10;
                const isSelected = selectedPackage?.identifier === pkg.identifier;

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => handlePackagePress(pkg)}
                    style={[
                      styles.packageButton,
                      isSelected && styles.packageButtonSelected,
                    ]}
                  >
                    {isBestValue && (
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueBadgeText}>Best Value</Text>
                      </View>
                    )}
                    <View style={styles.packageButtonContent}>
                      <View style={styles.packageButtonLeft}>
                        <View
                          style={[
                            styles.radioIndicator,
                            isSelected && styles.radioIndicatorSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check size={14} color={PRIMARY_PURPLE} strokeWidth={3} />
                          )}
                        </View>
                        <View style={styles.packageButtonTextContainer}>
                          <Text style={styles.packageButtonTitle}>
                            {pkg.product.title || "Credit Package"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.packageButtonPrice}>
                        {pkg.product.priceString}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.noPackagesContainer}>
              <Text style={styles.noPackagesText}>
                No credit packages available at this time.
              </Text>
            </View>
          )}

          {/* Continue Button */}
          <Pressable
            onPress={handlePurchase}
            style={[
              styles.continueButton,
              (isPurchasing || !selectedPackage) && styles.continueButtonDisabled,
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

  // Package Selection
  packagesContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 30,
  },
  packageButton: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 12,
    position: "relative",
    overflow: "visible",
  },
  packageButtonSelected: {
    borderColor: PRIMARY_PURPLE,
  },
  packageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packageButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  packageButtonTextContainer: {
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  packageButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BLACK,
    marginBottom: 2,
    lineHeight: 20,
  },
  packageButtonSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: GRAY_TEXT,
    lineHeight: 16,
  },
  packageButtonPrice: {
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
  noPackagesContainer: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  noPackagesText: {
    fontSize: 16,
    color: GRAY_TEXT,
    textAlign: "center",
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

