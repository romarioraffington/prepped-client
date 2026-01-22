// External Dependencies
import { Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";
import { useActionToast } from "@/contexts";
import { QUERY_KEYS } from "@/libs/constants";
import { useImageErrorFilter } from "@/hooks";
import type { RecommendationDetail } from "@/libs/types";

import {
  getCachedWishlist,
  markMutationAsIgnored,
  clearCachedWishlistId,
  updateAllWishlistCaches,
  invalidateAllWishlistQueries,
  useSaveRecommendationToWishlistMutation,
  useDeleteRecommendationFromWishlistMutation,
} from "@/api";

interface UseRecommendationWishlistHandlerParams {
  recommendationSlug: string;
  wishlistIds: string[];
  thumbnailUri?: string;
}

interface UseRecommendationWishlistHandlerReturn {
  isPending: boolean;
  handlePress: () => Promise<void>;
}

export const useRecommendationWishlistHandler = ({
  wishlistIds,
  thumbnailUri,
  recommendationSlug,
}: UseRecommendationWishlistHandlerParams): UseRecommendationWishlistHandlerReturn => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();

  // Validate thumbnailUri using useImageErrorFilter
  const imageUrls = thumbnailUri ? [thumbnailUri] : [];
  const { validImages } = useImageErrorFilter(imageUrls);
  const validThumbnailUri = validImages.length > 0 ? validImages[0] : null;
  const { mutate: saveToWishlist, isPending: isSaving } = useSaveRecommendationToWishlistMutation();
  const { mutate: deleteFromWishlist, isPending: isDeleting } = useDeleteRecommendationFromWishlistMutation();

  const isPending = isSaving || isDeleting;

  // Ref to track if mutation was called to prevent duplicate calls
  const mutationCalledRef = useRef(false);
  // Ref to track if "Change" was clicked to prevent onSuccess from executing
  const changeClickedRef = useRef(false);
  // Ref to track if mutation has succeeded (so we can delete if "Change" is clicked)
  const mutationSucceededRef = useRef(false);
  // Ref to store the wishlist ID that was saved to (for deletion if "Change" is clicked)
  const savedWishlistIdRef = useRef<string | null>(null);

  // Calculate saved state from wishlistIds
  const isSaved = wishlistIds.length > 0;

  const handlePress = useCallback(async () => {
    // If already saved, open the modal to manage wishlists
    if (isSaved) {
      router.push({
        pathname: "/(modal)/manage-wishlists",
        params: {
          recommendationSlug,
        },
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    // If not saved, check for cached wishlist
    const cachedWishlist = await getCachedWishlist();

    if (cachedWishlist) {
      // Parse slug to extract ID for cache key
      const { id: recommendationId } = parseSlug(recommendationSlug);
      const queryKey = QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);
      const currentData = queryClient.getQueryData<RecommendationDetail>(queryKey);
      const previousWishlistIds = currentData?.wishlistIds ?? [];

      // Reset flags for this interaction
      mutationCalledRef.current = false;
      changeClickedRef.current = false;
      mutationSucceededRef.current = false;
      savedWishlistIdRef.current = cachedWishlist.wishlistId;

      const rollback = () => {
        // Mark that "Change" was clicked to prevent onSuccess from executing
        changeClickedRef.current = true;

        // Mark mutation as ignored in the mutation hook
        if (savedWishlistIdRef.current) {
          markMutationAsIgnored(recommendationSlug, savedWishlistIdRef.current);
        }

        // If mutation was called, rollback the optimistic update from mutation's onMutate
        // This must be done synchronously before navigation
        // Use the cache helper to restore all caches to previous state (before the mutation)
        if (mutationCalledRef.current) {
          updateAllWishlistCaches({
            queryClient,
            recommendationSlug,
            wishlistIds: previousWishlistIds,
          });
        }

        // Optimistically update wishlists cache to set containsRecommendation: false
        // for the wishlist that was being saved to
        const wishlistQueries = queryClient.getQueriesData({
          queryKey: [QUERY_KEYS.WISHLISTS],
        });

        for (const [wishlistQueryKey, data] of wishlistQueries) {
          if (data && Array.isArray(data)) {
            const wishlistsData = data as Array<{ id: string; containsRecommendation?: boolean }>;
            const updatedWishlists = wishlistsData.map((wishlist) => {
              if (wishlist.id === savedWishlistIdRef.current) {
                return {
                  ...wishlist,
                  containsRecommendation: false,
                };
              }
              return wishlist;
            });
            queryClient.setQueryData(wishlistQueryKey, updatedWishlists);
          }
        }

        // If mutation has already succeeded, we need to
        // delete the recommendation from the wishlist
        if (
          savedWishlistIdRef.current &&
          mutationSucceededRef.current
        ) {
          deleteFromWishlist(
            {
              recommendationSlug,
              wishlistId: savedWishlistIdRef.current,
            },
          );
        } else {
          // Invalidate other queries asynchronously (they'll refetch in background)
          invalidateAllWishlistQueries({
            queryClient,
            recommendationSlug,
          });
        }
      };

      // Custom CTA handler to ensure rollback happens before navigation
      const handleCTAPress = () => {
        rollback();
        // Navigate after a small delay to ensure cache updates are processed
        // This gives React time to batch and apply the state changes before the modal renders
        setTimeout(() => {
          router.push({
            pathname: "/(modal)/manage-wishlists",
            params: { recommendationSlug },
          });
        }, 50);
      };

      const confirmSave = () => {
        // Prevent calling mutation multiple times
        if (mutationCalledRef.current) {
          return;
        }

        // Don't execute mutation if "Change" was clicked
        if (changeClickedRef.current) {
          return;
        }

        mutationCalledRef.current = true;
        // The mutation's onMutate will handle the optimistic update immediately
        saveToWishlist(
          {
            recommendationSlug,
            wishlistId: cachedWishlist.wishlistId,
          },
          {
            onSuccess: async () => {
              // Mark that mutation has succeeded
              mutationSucceededRef.current = true;

              // Don't update cache if "Change" was clicked
              if (changeClickedRef.current) {
                return;
              }

              // Haptic feedback - only once when save completes
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
            onError: (error) => {
              // Don't handle error if "Change" was clicked
              if (changeClickedRef.current) {
                return;
              }

              // Mutation's onError will handle rollback of optimistic updates
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              reportError(error, {
                component: "RecommendationWishlistHandler",
                action: "Save Recommendation To Wishlist",
                extra: { recommendationSlug },
              });

              // Check if error indicates wishlist not found (404 or similar)
              const errorMessage = error instanceof Error ? error.message : String(error);
              if (errorMessage.includes("404") || errorMessage.includes("not found") || errorMessage.includes("Not Found")) {
                // Clear cache if wishlist was deleted
                clearCachedWishlistId();
              }

              // Fallback to modal on error
              router.push({
                pathname: "/(modal)/manage-wishlists",
                params: {
                  recommendationSlug,
                },
              });
            },
          },
        );
      };

      // Show toast with change option
      showToast({
        onDismiss: confirmSave,
        thumbnailUri: validThumbnailUri || null,
        text: `Saving to ${cachedWishlist.wishlistName}`,
        cta: {
          text: "Change",
          onPress: handleCTAPress,
        },
      });
    } else {
      // No cached wishlist, open modal
      router.push({
        pathname: "/(modal)/manage-wishlists",
        params: {
          recommendationSlug,
        },
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [
    router,
    isSaved,
    showToast,
    queryClient,
    validThumbnailUri,
    saveToWishlist,
    recommendationSlug,
    deleteFromWishlist,
  ]);

  return {
    handlePress,
    isPending,
  };
};

