// External Dependencies
import { AntDesign } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import * as Haptics from "expo-haptics";
import { useActionToast } from "@/contexts";
import { reportError } from "@/libs/utils";
import { QUERY_KEYS } from "@/libs/constants";
import { useImageErrorFilter } from "@/hooks";
import { DotsLoader, EmptyImageState, WishlistCard } from "@/components";
import type { WishlistCardData, RecommendationDetail } from "@/libs/types";

import {
  useWishlists,
  useRecommendationDetails,
  useSaveRecommendationToWishlistMutation,
} from "@/api";

type Wishlist = WishlistCardData;

export default function SaveToWishlist() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { recommendationId } = useLocalSearchParams<{ recommendationId?: string }>();
  const { data: recommendation } = useRecommendationDetails(recommendationId || "");
  const { mutate: saveToWishlist, isPending } = useSaveRecommendationToWishlistMutation();

  // Track if mutation should be ignored (when user clicks Change)
  const shouldIgnoreMutationRef = useRef<boolean>(false);

  // Fetch wishlists excluding those that already contain this recommendation
  const {
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: wishlistsData,
  } = useWishlists({
    excludeRecommendationId: recommendationId,
  });

  // Flatten paginated data
  const wishlists = useMemo(
    () => wishlistsData?.pages.flatMap((page) => page.data) ?? [],
    [wishlistsData?.pages],
  );

  // Get success thumbnail from recommendation data and validate it
  const recommendationImageUrls = recommendation?.images?.[0] ? [recommendation.images[0]] : [];
  const { validImages: validRecommendationImages } = useImageErrorFilter(recommendationImageUrls);
  const successThumbnailUri = validRecommendationImages.length > 0 ? validRecommendationImages[0] : null;

  const handleWishlistSelect = useCallback(
    (wishlist: Wishlist) => {
      if (!recommendationId || isPending) {
        return;
      }

      // Haptic feedback when wishlist is selected
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Get current recommendation data from cache for rollback (only needed for "Change" button)
      const queryKey = QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);
      const currentData = queryClient.getQueryData<RecommendationDetail>(queryKey);
      const previousWishlistIds = currentData?.wishlistIds ?? [];

      // Reset the ignore flag for this new selection
      shouldIgnoreMutationRef.current = false;

      // ROLLBACK function: Restore previous wishlistIds if user clicks "Change" button
      // Note: The mutation's onMutate will handle the optimistic update when mutation is called
      // This rollback only handles the case where user clicks "Change" before mutation is called
      const rollback = () => {
        // Mark that any pending mutation should be ignored
        shouldIgnoreMutationRef.current = true;
        // Note: We don't need to rollback here because mutation hasn't been called yet
        // The optimistic update will happen in mutation's onMutate
      };

      // Create callback function that will execute the save API call
      const confirmSave = () => {
        // Don't execute mutation if user clicked Change
        if (shouldIgnoreMutationRef.current) {
          return;
        }

        // Haptic feedback when save is triggered
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        saveToWishlist(
          {
            wishlistId: wishlist.id,
            wishlistName: wishlist.name,
            recommendationSlug: recommendationId,
          },
          {
            onSuccess: () => {
              // Only proceed if mutation wasn't canceled
              if (shouldIgnoreMutationRef.current) {
                return;
              }

              // Haptic feedback - only once when save completes
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
            onError: (error) => {
              // Only handle error if mutation wasn't canceled
              if (shouldIgnoreMutationRef.current) {
                return;
              }

              // Mutation's onError will handle rollback of optimistic updates
              // Haptic feedback for error
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              reportError(error, {
                component: "SaveToWishlist",
                action: "Save Recommendation To Wishlist",
                extra: {
                  wishlistId: wishlist?.id,
                  recommendationSlug: recommendationId,
                },
              });
              Alert.alert(
                "Oops! 🥲",
                "Failed to save to wishlist. Please try again.",
                [{ text: "OK" }],
              );
            },
          },
        );
      };

      // Show toast with callbacks
      // (rollback is called if user presses Undo)
      showToast({
        text: `Saving to ${wishlist?.name ?? 'wishlist'}`,
        thumbnailUri: successThumbnailUri || wishlist.coverImageUri || null,
        cta: {
          text: "Undo",
          onPress: () => {
            rollback();
            router.push({
              pathname: "/(modal)/save-to-wishlist",
              params: { recommendationId },
            });
          },
        },
        onDismiss: confirmSave,
      });

      // Close modal immediately
      router.back();
    },
    [
      showToast,
      isPending,
      queryClient,
      saveToWishlist,
      recommendationId,
      successThumbnailUri,
    ],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleCreateWishlist = useCallback(() => {
    router.back();
    // Small delay to ensure the modal
    // closes before opening the new one
    setTimeout(() => {
      router.push({
        pathname: "/(modal)/create-wishlist",
        params: {
          recommendationId,
        },
      });
    }, 100);
  }, [recommendationId]);

  const renderWishlistCard = useCallback(
    ({ item }: { item: Wishlist }) => (
      <WishlistCard
        item={item}
        showRecentlyViewed={false}
        onPress={() => handleWishlistSelect(item)}
      />
    ),
    [handleWishlistSelect],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Save to wishlist</Text>
        </View>
        <DotsLoader fullHeight={true} />
      </SafeAreaView>
    );
  }

  // Check if there are no wishlists available
  const hasNoWishlists = (wishlists?.length ?? 0) === 0;

  // Determine if recommendation is in any wishlists (indicates user has wishlists)
  const recommendationIsInWishlists = (recommendation?.wishlistIds?.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Save to wishlist</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <AntDesign name="close" size={14} color="#000" />
        </TouchableOpacity>
      </View>

      {hasNoWishlists ? (
        <View style={styles.emptyStateContainer}>
          <EmptyImageState
            title={
              recommendationIsInWishlists
                ? "Already in all wishlists"
                : "No wishlists yet!"
            }
            description={
              recommendationIsInWishlists
                ? `${recommendation?.name} is already included in all your wishlists.`
                : `Create your first wishlist to save ${recommendation?.name}.`
            }
          />
        </View>
      ) : (
        <FlatList
          numColumns={2}
          data={wishlists ?? []}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          renderItem={renderWishlistCard}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.subtextContainer}>
              These wishlists don't include{" "}
              <Text style={styles.subtextBold}>{recommendation?.name}</Text> yet.
            </Text>
          }
          ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.createButton}
          onPress={handleCreateWishlist}
        >
          <Text style={styles.createButtonText}>Create wishlist</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: "#000",
    fontWeight: 500,
    textAlign: "center",
  },
  closeButton: {
    top: 22,
    right: 0,
    width: 40,
    height: 40,
    position: "absolute",
  },
  subtextContainer: {
    fontSize: 14,
    color: "#667",
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subtextBold: {
    fontWeight: "600",
    color: "#000",
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    borderTopColor: "#E5E5E5",
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
