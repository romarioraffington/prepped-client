// External Dependencies
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";
import { clearCachedWishlistId } from "./storage";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";
import type { RecommendationDetail, WishlistPageResult } from "@/libs/types";

import {
  updateAllWishlistCaches,
  snapshotAllWishlistCaches,
  rollbackAllWishlistCaches,
  invalidateAllWishlistQueries,
} from "./cache";

export interface DeleteRecommendationFromWishlistResponse {
  wishlistIds: string[];
}

/**
 * Delete a recommendation from an existing wishlist
 */
export const deleteRecommendationFromWishlist = async (
  wishlistId: string,
  recommendationId: string,
): Promise<DeleteRecommendationFromWishlistResponse> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}/recommendations/${recommendationId}`;

    // Delete the recommendation from the wishlist
    const result: DeleteRecommendationFromWishlistResponse =
      await client.delete(endpoint);

    return result;
  } catch (error) {
    reportError(error, {
      component: "WishlistDelete",
      action: "Delete Recommendation From Wishlist",
      extra: { wishlistId, recommendationId },
    });

    let errorMessage = "Failed to delete recommendation from wishlist";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for deleting recommendations from wishlists
 */
export const useDeleteRecommendationFromWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wishlistId,
      recommendationSlug,
    }: {
      wishlistId: string;
      recommendationSlug: string;
    }) => {
      // Parse slug to extract ID for API call
      const { id: recommendationId } = parseSlug(recommendationSlug);
      return deleteRecommendationFromWishlist(wishlistId, recommendationId);
    },

    onMutate: async ({ recommendationSlug, wishlistId }) => {
      // Parse slug to extract ID for cache key
      const { id: recommendationId } = parseSlug(recommendationSlug);
      const queryKey = QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);

      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.WISHLISTS] });

      // Snapshot all caches before optimistic update
      const snapshots = snapshotAllWishlistCaches({
        queryClient,
        recommendationSlug,
      });

      // Get current wishlistIds to remove the one being deleted
      const current = queryClient.getQueryData<RecommendationDetail>(queryKey);
      const currentWishlistIds = current?.wishlistIds ?? [];

      // Only update if wishlistId is present
      if (currentWishlistIds.includes(wishlistId)) {
        const newWishlistIds = currentWishlistIds.filter(
          (id) => id !== wishlistId,
        );
        // Optimistically update all caches
        updateAllWishlistCaches({
          queryClient,
          recommendationSlug,
          wishlistIds: newWishlistIds,
        });

        // Optimistically update ALL wishlist queries (base and filtered)
        // Only set containsRecommendation for filtered queries (used in manage-wishlists modal)
        // Base query should only update savedCount to avoid showing badge on /wishlists route
        const allWishlistQueries = queryClient.getQueriesData({
          queryKey: [QUERY_KEYS.WISHLISTS],
        });

        for (const [queryKey, data] of allWishlistQueries) {
          if (data && typeof data === "object" && "pages" in data) {
            const infiniteData = data as InfiniteData<WishlistPageResult>;
            // Check if this is a filtered query (has more than just [QUERY_KEYS.WISHLISTS])
            const isFilteredQuery = queryKey.length > 1;

            queryClient.setQueryData<InfiniteData<WishlistPageResult>>(
              queryKey,
              {
                ...infiniteData,
                pages: infiniteData.pages.map((page) => ({
                  ...page,
                  data: page.data.map((wishlist) =>
                    wishlist.id === wishlistId
                      ? {
                          ...wishlist,
                          savedCount: Math.max(0, wishlist.savedCount - 1),
                          // Only set containsRecommendation for filtered queries
                          ...(isFilteredQuery && {
                            containsRecommendation: false,
                          }),
                        }
                      : wishlist,
                  ),
                })),
              },
            );
          }
        }
      }

      return {
        snapshots,
        wishlistId,
        recommendationSlug,
      };
    },

    onSuccess: async (response, variables, context) => {
      /**
       * Update source of truth with server response
       */
      if (context?.recommendationSlug) {
        // Update all caches with wishlistIds from server response
        updateAllWishlistCaches({
          queryClient,
          wishlistIds: response.wishlistIds,
          recommendationSlug: context.recommendationSlug,
        });
      }

      // Invalidate all wishlist-related queries
      invalidateAllWishlistQueries({
        queryClient,
        recommendationSlug: context?.recommendationSlug,
      });
    },

    onError: (error, _variables, context) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reportError(error, {
        component: "WishlistDelete",
        action: "Delete Recommendation Mutation",
        extra: {
          wishlistId: _variables.wishlistId,
          recommendationSlug: _variables.recommendationSlug,
        },
      });

      // Rollback all optimistic updates on error
      if (context?.snapshots && context?.recommendationSlug) {
        rollbackAllWishlistCaches({
          queryClient,
          snapshots: context.snapshots,
          recommendationSlug: context.recommendationSlug,
        });
      }
    },
  });
};

/**
 * Delete a wishlist
 */
export const deleteWishlist = async (id: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.WISHLISTS_V1}/${id}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "WishlistDelete",
      action: "Delete Wishlist",
      extra: { wishlistId: id },
    });

    let errorMessage = "Failed to delete wishlist";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

interface DeleteWishlistMutationContext {
  previousWishlistsData: InfiniteData<WishlistPageResult> | undefined;
}

/**
 * React Query mutation hook for deleting wishlists with optimistic updates
 */
export const useDeleteWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWishlist(id),

    // Optimistically remove item from cache immediately
    onMutate: async (id: string): Promise<DeleteWishlistMutationContext> => {
      const queryKey = [QUERY_KEYS.WISHLISTS];

      // Cancel any ongoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousWishlistsData =
        queryClient.getQueryData<InfiniteData<WishlistPageResult>>(queryKey);

      // Optimistically remove the item from all pages
      if (previousWishlistsData) {
        queryClient.setQueryData<InfiniteData<WishlistPageResult>>(
          queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter((wishlist) => wishlist.id !== id),
              })),
            };
          },
        );
      }

      return { previousWishlistsData };
    },

    onSuccess: async (_data, id) => {
      // Check if deleted wishlist matches cached wishlist and clear cache if so
      const { getCachedWishlist } = await import("./storage");
      const cachedWishlist = await getCachedWishlist();
      if (cachedWishlist && cachedWishlist.wishlistId === id) {
        await clearCachedWishlistId();
      }
    },

    // On error, rollback to previous state
    onError: (_error, _id, context) => {
      if (context?.previousWishlistsData) {
        queryClient.setQueryData(
          [QUERY_KEYS.WISHLISTS],
          context.previousWishlistsData,
        );
      }
    },
  });
};
