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
 * - COLLECTION_RECOMMENDATIONS
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
  const { id: recommendationItemId } = parseSlug(recommendationSlug);

  /*
   * 1. Update RECOMMENDATION_DETAILS cache
   */
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug);

  const recommendationDetails = queryClient.getQueryData<RecommendationDetail>(
    recommendationDetailsKey,
  );

  if (recommendationDetails) {
    queryClient.setQueryData<RecommendationDetail>(recommendationDetailsKey, {
      ...recommendationDetails,
      wishlistIds,
    });
  }

  // 2. Update IMPORT_DETAILS cache
  const importDetailQueries = queryClient.getQueriesData<ImportDetail>({
    queryKey: [QUERY_KEYS.IMPORT_DETAILS_BASE],
  });
  for (const [queryKey, importDetail] of importDetailQueries) {
    if (!importDetail?.recommendations) continue;
    const recommendationIndex = importDetail.recommendations.findIndex(
      (rec) => rec.id === recommendationItemId,
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

  // 3. Update IMPORT_RECOMMENDATIONS cache
  const importRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.IMPORT_RECOMMENDATIONS_BASE],
  });
  for (const [queryKey, data] of importRecommendationQueries) {
    if (data && typeof data === "object" && "recommendations" in data) {
      const listData = data as { recommendations: RecommendationListItem[] };
      const updatedRecommendations = listData.recommendations.map((item) => {
        if (item.id === recommendationItemId) {
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

  // 4. Update COLLECTION_RECOMMENDATIONS cache
  const collectionRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE],
  });
  for (const [queryKey, data] of collectionRecommendationQueries) {
    if (data && typeof data === "object" && "recommendations" in data) {
      const listData = data as { recommendations: RecommendationListItem[] };
      const updatedRecommendations = listData.recommendations.map((item) => {
        if (item.id === recommendationItemId) {
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
        if (item.id === recommendationItemId) {
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
  previousCollectionRecommendations: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
  previousWishlistRecommendations: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
} => {
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug);
  const previousRecommendationDetails =
    queryClient.getQueryData<RecommendationDetail>(recommendationDetailsKey);

  const importDetailQueries = queryClient.getQueriesData<ImportDetail>({
    queryKey: [QUERY_KEYS.IMPORT_DETAILS_BASE],
  });
  const previousImportDetails = Array.from(importDetailQueries)
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  const importRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.IMPORT_RECOMMENDATIONS_BASE],
  });
  const previousImportRecommendations = Array.from(importRecommendationQueries)
    .filter(([, data]) => data !== undefined)
    .map(([queryKey, data]) => ({
      queryKey,
      data: JSON.parse(JSON.stringify(data)),
    }));

  const collectionRecommendationQueries = queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE],
  });
  const previousCollectionRecommendations = Array.from(
    collectionRecommendationQueries,
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
    previousCollectionRecommendations,
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
  const recommendationDetailsKey =
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug);
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
  } of snapshots.previousCollectionRecommendations) {
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
  await Promise.all([
    // Invalidate recommendation details if slug provided
    ...(recommendationSlug
      ? [
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug),
            refetchType: "active",
          }),
        ]
      : []),
    // Invalidate queries - only refetch active queries
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.IMPORT_DETAILS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.IMPORT_RECOMMENDATIONS_BASE],
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE],
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
