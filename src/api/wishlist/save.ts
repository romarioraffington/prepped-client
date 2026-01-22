// External Dependencies
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

// Internal Dependencies
import { cacheWishlistId } from "./storage";
import { parseSlug, reportError } from "@/libs/utils";
import type { RecommendationDetail, WishlistPageResult } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import {
  updateAllWishlistCaches,
  snapshotAllWishlistCaches,
  rollbackAllWishlistCaches,
  invalidateAllWishlistQueries,
} from "./cache";

// Track mutations that should be ignored (when "Change" is clicked)
const ignoredMutations = new Map<string, boolean>();

/**
 * Mark a mutation as ignored (should not update cache)
 */
export const markMutationAsIgnored = (
  recommendationSlug: string,
  wishlistId: string,
): void => {
  const key = `${recommendationSlug}:${wishlistId}`;
  ignoredMutations.set(key, true);
};

/**
 * Check if a mutation should be ignored
 */
const shouldIgnoreMutation = (
  recommendationSlug: string,
  wishlistId: string,
): boolean => {
  const key = `${recommendationSlug}:${wishlistId}`;
  const shouldIgnore = ignoredMutations.get(key) ?? false;
  // Clean up after checking
  if (shouldIgnore) {
    ignoredMutations.delete(key);
  }
  return shouldIgnore;
};

export interface SaveRecommendationToWishlistResponse {
  wishlistIds: string[];
}

/**
 * Save a recommendation to an existing wishlist
 */
export const saveRecommendationToWishlist = async (
  wishlistId: string,
  recommendationId: string,
): Promise<SaveRecommendationToWishlistResponse> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}/recommendations/${recommendationId}`;
    const result: SaveRecommendationToWishlistResponse = await client.post(
      endpoint,
      {},
    );

    return result;
  } catch (error) {
    reportError(error, {
      component: "WishlistSave",
      action: "Save Recommendation To Wishlist",
      extra: { wishlistId, recommendationId },
    });

    let errorMessage = "Failed to save recommendation to wishlist";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Context type for optimistic update rollback
 */
interface MutationContext {
  snapshots: ReturnType<typeof snapshotAllWishlistCaches>;
  recommendationSlug: string;
  recommendationItemId: string;
  wishlistId: string;
  wishlistName: string | undefined;
  previousWishlistsData: InfiniteData<WishlistPageResult> | undefined;
}

/**
 * React Query mutation hook for saving recommendations to wishlists
 */
export const useSaveRecommendationToWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wishlistId,
      recommendationSlug,
    }: {
      wishlistId: string;
      recommendationSlug: string;
      wishlistName?: string;
    }) => {
      // Parse slug to extract ID for API call
      const { id: recommendationId } = parseSlug(recommendationSlug);
      return saveRecommendationToWishlist(wishlistId, recommendationId);
    },

    // Store previous state for automatic rollback on error
    onMutate: async ({
      wishlistId,
      wishlistName,
      recommendationSlug,
    }): Promise<MutationContext> => {
      // Parse slug to extract ID for cache key
      const { id: recommendationItemId } = parseSlug(recommendationSlug);
      const queryKey = QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationItemId);

      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.WISHLISTS] });

      // Snapshot all caches before optimistic update
      const snapshots = snapshotAllWishlistCaches({
        queryClient,
        recommendationSlug,
      });

      // Snapshot wishlists cache for rollback (WISHLISTS is an infinite query)
      const previousWishlistsData = queryClient.getQueryData<
        InfiniteData<WishlistPageResult>
      >([QUERY_KEYS.WISHLISTS]);

      // Get current wishlistIds to add the new one
      const currentRecommendationData =
        queryClient.getQueryData<RecommendationDetail>(queryKey);
      const currentWishlistIds = currentRecommendationData?.wishlistIds ?? [];

      // Only update if wishlistId is not already present
      if (!currentWishlistIds.includes(wishlistId)) {
        const newWishlistIds = [...currentWishlistIds, wishlistId];
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
                          savedCount: wishlist.savedCount + 1,
                          // Only set containsRecommendation for filtered queries
                          ...(isFilteredQuery && {
                            containsRecommendation: true,
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
        wishlistName,
        recommendationSlug,
        recommendationItemId,
        previousWishlistsData,
      };
    },

    onSuccess: async (response, variables, context) => {
      // Check if this mutation should be ignored (when "Change" is clicked)
      if (context?.recommendationSlug && context?.wishlistId) {
        if (
          shouldIgnoreMutation(context.recommendationSlug, context.wishlistId)
        ) {
          // Don't update cache if mutation should be ignored
          return;
        }
      }

      // Cache the wishlist ID and name for easy future saves
      if (context?.wishlistId && context?.wishlistName) {
        await cacheWishlistId(context.wishlistId, context.wishlistName);
      }

      // Update all caches with wishlistIds from server response
      if (context?.recommendationSlug && response.wishlistIds !== undefined) {
        updateAllWishlistCaches({
          queryClient,
          recommendationSlug: context.recommendationSlug,
          wishlistIds: response.wishlistIds,
        });
      }

      // Invalidate all wishlist-related queries
      await invalidateAllWishlistQueries({
        queryClient,
        recommendationSlug: context?.recommendationSlug,
      });
    },

    onError: (error, _variables, context) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reportError(error, {
        component: "WishlistSave",
        action: "Save Recommendation Mutation",
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

      // Rollback wishlist count update
      if (context?.previousWishlistsData) {
        queryClient.setQueryData<InfiniteData<WishlistPageResult>>(
          [QUERY_KEYS.WISHLISTS],
          context.previousWishlistsData,
        );
      }
    },
  });
};
