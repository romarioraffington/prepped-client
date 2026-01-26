// External Dependencies
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWishlistRecommendations } from "@/api/wishlist";
import { WishlistToggleButton } from "@/components/Wishlist";
import { RecommendationsScreen } from "@/components/screens/RecommendationScreen";
import { Colors } from "@/libs/constants";
import type { RecommendationListItem } from "@/libs/types";
// Internal Dependencies
import { parseSlug } from "@/libs/utils";

type RecommendationsParams = {
  slug: string;
};

export default function WishlistRecommendations() {
  const { slug } = useLocalSearchParams<RecommendationsParams>();

  // Parse the slug to get ID and name
  const { name: slugName, id: wishlistId } = parseSlug(slug);

  // Fetch wishlist recommendations
  const { data, isLoading, refetch } = useWishlistRecommendations(slug);

  const region = data?.region;
  const wishlistName = data?.name ?? slugName;

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = useRef(false);

  useEffect(() => {
    if (data && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [data, isLoading]);

  // Always refetch when screen gains focus (after initial load)
  // This ensures removed items disappear when navigating back
  // to this screen
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we've already loaded initial
      // data (avoids refetching during initial load)
      // React Query will handle deduplication if a
      // fetch is already in progress
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [slug, refetch]),
  );

  // Pending deletions and additions state for undo pattern
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set(),
  );
  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(
    new Set(),
  );

  // Filter out pending deletions from recommendations
  const recommendations = useMemo(
    () =>
      (data?.recommendations || []).filter(
        (rec) => !pendingDeletions.has(rec.id),
      ),
    [data?.recommendations, pendingDeletions],
  );

  // Clear pending deletions and additions for items
  // that are no longer in the data (after refetch)
  useEffect(() => {
    if (
      data?.recommendations &&
      (pendingDeletions.size > 0 || pendingAdditions.size > 0)
    ) {
      const allRecommendationIds = new Set(
        data.recommendations.map((rec) => rec.id),
      );

      // Remove any pending deletions for items that are back in the data
      // (this happens after a refetch when the item was actually deleted on the server)
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        for (const id of prev) {
          if (!allRecommendationIds.has(id)) {
            // Item is not in the data, so it was successfully deleted - remove from pending set
            next.delete(id);
          }
        }
        return next;
      });

      setPendingAdditions((prev) => {
        const next = new Set(prev);
        for (const id of prev) {
          if (!allRecommendationIds.has(id)) {
            // Item is not in the data, so it was successfully added - remove from pending set
            next.delete(id);
          }
        }
        return next;
      });
    }
  }, [data?.recommendations, pendingDeletions.size, pendingAdditions.size]);

  const renderItemActions = useCallback(
    ({ item, slug }: { item: RecommendationListItem; slug: string }) => {
      const isSaved = (item.wishlistIds ?? []).includes(wishlistId);

      // Track when action starts (add to pending sets)
      const handleActionStart = () => {
        if (isSaved) {
          // Currently saved, so we're removing
          setPendingDeletions((prev) => new Set(prev).add(item.id));
        } else {
          // Currently not saved, so we're adding
          setPendingAdditions((prev) => new Set(prev).add(item.id));
        }
      };

      // Handle undo - remove from pending sets
      const handleUndo = () => {
        if (isSaved) {
          // Currently saved, so undo would be for removal
          setPendingDeletions((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        } else {
          // Currently not saved, so undo would be for addition
          setPendingAdditions((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }
      };

      return (
        <View style={styles.itemActionsContainer}>
          <WishlistToggleButton
            size={18}
            isSaved={isSaved}
            onUndo={handleUndo}
            wishlistId={wishlistId}
            recommendationSlug={slug}
            wishlistName={wishlistName}
            onActionStart={handleActionStart}
            thumbnailUri={item.images?.[0]}
          />
        </View>
      );
    },
    [wishlistId, wishlistName, setPendingDeletions, setPendingAdditions],
  );

  // Create subtitle component with wishlist icon
  function WishlistSubtitle() {
    return (
      <View style={styles.subtitleContainer}>
        <FontAwesome
          size={14}
          name="heart"
          color={Colors.primary}
          style={styles.subtitleIcon}
        />
        <Text style={styles.subtitleText}>Wishlist</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RecommendationsScreen
        region={region}
        name={wishlistName}
        isLoading={isLoading}
        subtitle={WishlistSubtitle}
        recommendations={recommendations}
        renderItemActions={renderItemActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  subtitleIcon: {
    marginRight: 6,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  itemActionsContainer: {
    marginRight: 10,
  },
});
