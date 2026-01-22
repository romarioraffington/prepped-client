// External Dependencies
import type { QueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { parseSlug } from "@/libs/utils";
import { QUERY_KEYS } from "@/libs/constants";
import type {
  RecommendationDetail,
  RecommendationListItem,
  ImportDetail,
} from "@/libs/types";

/**
 * Updates all caches with new wishlistIds for a recommendation
 * This ensures consistent state across:
 * - RECOMMENDATION_DETAILS
 * - IMPORT_DETAILS
 * - IMPORT_RECOMMENDATIONS
 * - COOKBOOK_RECOMMENDATIONS
 * - WISHLIST_RECOMMENDATIONS
 */
export const updateAllWishlistCaches = ({
  queryClient,
  wishlistIds,
  recommendationSlug,
}: {
  queryClient: QueryClient;
  recommendationSlug: string;
  wishlistIds: string[];
}): void => {
  // Parse slug to extract ID for cache key
  const { id: recommendationId } = parseSlug(recommendationSlug);

  /*
   * 1. Update RECOMMENDATION_DETAILS cache
   */
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);

  const recommendationDetails = queryClient.getQueryData<RecommendationDetail>(
    recommendationDetailsKey,
  );

  if (recommendationDetails) {
    queryClient.setQueryData<RecommendationDetail>(recommendationDetailsKey, {
      ...recommendationDetails,
      wishlistIds,
    });
  }

  // 2. Update RECIPE_DETAILS cache
  const importDetailQueries = queryClient.getQueriesData<ImportDetail>({
    queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
  });
  for (const [queryKey, importDetail] of importDetailQueries) {
    if (!importDetail?.recommendations) continue;
    const recommendationIndex = importDetail.recommendations.findIndex(
      (rec) => rec.id === recommendationId,
    );
    if (recommendationIndex !== -1) {
      const updatedRecommendations = [...importDetail.recommendations];
      updatedRecommendations[recommendationIndex] = {
        ...updatedRecommendations[recommendationIndex],
        wishlistIds,
      };
      queryClient.setQueryData<ImportDetail>(queryKey, {
        ...importDetail,
        recommendations: updatedRecommendations,
      });
    }
  }

  // 3. Update RECIPE_RECOMMENDATIONS cache
  const importRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.RECIPE_RECOMMENDATIONS_BASE],
  });
  for (const [queryKey, data] of importRecommendationQueries) {
    if (data && typeof data === "object" && "recommendations" in data) {
      const listData = data as { recommendations: RecommendationListItem[] };
      const updatedRecommendations = listData.recommendations.map((item) => {
        if (item.id === recommendationId) {
          return {
            ...item,
            wishlistIds,
          };
        }
        return item;
      });
      queryClient.setQueryData(queryKey, {
        ...listData,
        recommendations: updatedRecommendations,
      });
    }
  }

  // 4. Update COOKBOOK_RECOMMENDATIONS cache
  const cookbookRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.COOKBOOK_RECOMMENDATIONS_BASE],
  });
  for (const [queryKey, data] of cookbookRecommendationQueries) {
    if (data && typeof data === "object" && "recommendations" in data) {
      const listData = data as { recommendations: RecommendationListItem[] };
      const updatedRecommendations = listData.recommendations.map((item) => {
        if (item.id === recommendationId) {
          return {
            ...item,
            wishlistIds,
          };
        }
        return item;
      });
      queryClient.setQueryData(queryKey, {
        ...listData,
        recommendations: updatedRecommendations,
      });
    }
  }

  // 5. Update WISHLIST_RECOMMENDATIONS cache
  const wishlistRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.WISHLIST_RECOMMENDATIONS_BASE],
  });
  for (const [queryKey, data] of wishlistRecommendationQueries) {
    if (data && typeof data === "object" && "recommendations" in data) {
      const listData = data as { recommendations: RecommendationListItem[] };
      const updatedRecommendations = listData.recommendations.map((item) => {
        if (item.id === recommendationId) {
          return {
            ...item,
            wishlistIds,
          };
        }
        return item;
      });
      queryClient.setQueryData(queryKey, {
        ...listData,
        recommendations: updatedRecommendations,
      });
    }
  }
};

/**
 * Snapshot all caches for rollback purposes
 */
export const snapshotAllWishlistCaches = ({
  queryClient,
  recommendationSlug,
}: {
  queryClient: QueryClient;
  recommendationSlug: string;
}): {
  previousRecommendationDetails: RecommendationDetail | undefined;
  previousImportDetails: Array<{
    queryKey: readonly unknown[];
    data: ImportDetail;
  }>;
  previousImportRecommendations: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
  previousCookbookRecommendations: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
  previousWishlistRecommendations: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
} => {
  // Parse slug to extract ID for cache key
  const { id: recommendationId } = parseSlug(recommendationSlug);
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);
  const previousRecommendationDetails =
    queryClient.getQueryData<RecommendationDetail>(recommendationDetailsKey);

  const importDetailQueries = queryClient.getQueriesData<ImportDetail>({
    queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
  });
  const previousImportDetails = Array.from(importDetailQueries)
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  const importRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.RECIPE_RECOMMENDATIONS_BASE],
  });
  const previousImportRecommendations = Array.from(importRecommendationQueries)
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  const cookbookRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.COOKBOOK_RECOMMENDATIONS_BASE],
  });
  const previousCookbookRecommendations = Array.from(
    cookbookRecommendationQueries,
  )
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  const wishlistRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.WISHLIST_RECOMMENDATIONS_BASE],
  });
  const previousWishlistRecommendations = Array.from(
    wishlistRecommendationQueries,
  )
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  return {
    previousImportDetails,
    previousRecommendationDetails,
    previousImportRecommendations,
    previousWishlistRecommendations,
    previousCookbookRecommendations,
  };
};

/**
 * Rollback all caches to previous state
 */
export const rollbackAllWishlistCaches = ({
  queryClient,
  snapshots,
  recommendationSlug,
}: {
  queryClient: QueryClient;
  snapshots: ReturnType<typeof snapshotAllWishlistCaches>;
  recommendationSlug: string;
}): void => {
  // Parse slug to extract ID for cache key
  const { id: recommendationId } = parseSlug(recommendationSlug);
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId);
  if (snapshots.previousRecommendationDetails) {
    queryClient.setQueryData<RecommendationDetail>(
      recommendationDetailsKey,
      snapshots.previousRecommendationDetails,
    );
  }

  for (const { queryKey, data } of snapshots.previousImportDetails) {
    if (data) {
      queryClient.setQueryData<ImportDetail>(queryKey, data);
    }
  }

  for (const { queryKey, data } of snapshots.previousImportRecommendations) {
    if (data) {
      queryClient.setQueryData(queryKey, data);
    }
  }

  for (const {
    queryKey,
    data,
  } of snapshots.previousCookbookRecommendations) {
    if (data) {
      queryClient.setQueryData(queryKey, data);
    }
  }

  for (const { queryKey, data } of snapshots.previousWishlistRecommendations) {
    if (data) {
      queryClient.setQueryData(queryKey, data);
    }
  }
};

/**
 * Invalidates all wishlist-related queries
 * This ensures all views refresh after wishlist changes
 */
export const invalidateAllWishlistQueries = async ({
  queryClient,
  recommendationSlug,
}: {
  queryClient: QueryClient;
  recommendationSlug?: string;
}): Promise<void> => {
  // Parse slug to extract ID for cache key if provided
  const recommendationId = recommendationSlug ? parseSlug(recommendationSlug).id : undefined;

  await Promise.all([
    // Invalidate recommendation details if ID provided
    ...(recommendationId
      ? [
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId),
            refetchType: "active",
          }),
        ]
      : []),
    // Invalidate queries - only refetch active queries
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.RECIPE_RECOMMENDATIONS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.COOKBOOK_RECOMMENDATIONS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.WISHLIST_RECOMMENDATIONS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.WISHLISTS],
      refetchType: "active",
    }),
  ]);
};
