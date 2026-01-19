// External Dependencies
import type React from "react";
import { BlurView } from "expo-blur";
import { FontAwesome } from "@expo/vector-icons";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { useRecommendationWishlistHandler } from "@/hooks";

export interface WishlistButtonWithCountProps {
  size?: number;
  showBlur?: boolean;
  isScrolled?: boolean;
  wishlistIds: string[];
  thumbnailUri?: string;
  recommendationSlug: string;
}

// Format wishlist count for display (no badge for 1, show actual number for 2+)
const formatWishlistCount = (count: number): string | null => {
  if (count <= 0) return null;
  if (count === 1) return null; // Don't show badge for count 1
  return String(count); // Show actual number for 2 or more
};

export const WishlistButtonWithCount: React.FC<WishlistButtonWithCountProps> = ({
  size = 18,
  showBlur = false,
  isScrolled = false,
  wishlistIds,
  thumbnailUri,
  recommendationSlug,
}) => {
  const {
    handlePress,
    isPending: isWishlistPending
  } =
    useRecommendationWishlistHandler({
      wishlistIds,
      thumbnailUri,
      recommendationSlug,
    });

  // Calculate state from wishlistIds
  const safeWishlistIds = wishlistIds ?? [];
  const isSaved = safeWishlistIds.length > 0;
  const wishlistsCount = safeWishlistIds.length;
  const wishlistCountDisplay = formatWishlistCount(wishlistsCount);

  const blurIntensity = !isScrolled ? 80 : 0;
  const useBlur = showBlur ?? !isLiquidGlassAvailable();
  const iconSize = size ?? (isLiquidGlassAvailable() ? 20 : 17);

  if (useBlur) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isWishlistPending}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[
          styles.headerButtonBlurContainer,
          isScrolled && {
            paddingVertical: 0,
            paddingHorizontal: 0,
            overflow: "visible",
          },
        ]}
      >
        <BlurView
          tint="light"
          intensity={blurIntensity}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heartIconContainer}>
          <FontAwesome
            size={iconSize}
            color={Colors.primary}
            name={isSaved ? "heart" : "heart-o"}
          />
          {wishlistCountDisplay && (
            <View style={styles.wishlistCountBadge}>
              <Text style={styles.wishlistCountText}>
                {wishlistCountDisplay}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Liquid glass available: render plain button without blur container
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isWishlistPending}
      style={{ paddingVertical: 4 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.heartIconContainer}>
        <FontAwesome
          size={iconSize}
          color={Colors.primary}
          name={isSaved ? "heart" : "heart-o"}
        />
        {wishlistCountDisplay && (
          <View style={styles.wishlistCountBadge}>
            <Text style={styles.wishlistCountText}>{wishlistCountDisplay}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  headerButtonBlurContainer: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistCountBadge: {
    top: -4,
    right: -5,
    height: 14,
    minWidth: 14,
    borderRadius: 8,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  wishlistCountText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
});
