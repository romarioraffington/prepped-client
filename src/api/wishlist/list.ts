import { useAuthStore } from "@/stores/authStore";
import { useInfiniteQuery } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  WishlistCardData,
  WishlistMember,
  WishlistListItem,
  WishlistListResponse,
  WishlistPageResult,
} from "@/libs/types";

/**
 * Transform API response item to WishlistCardData format
 */
const transformToWishlistCardData = (
  item: WishlistListItem,
): WishlistCardData => {
  const members: WishlistMember[] = item.membersPreview.map((member) => ({
    id: member.userId,
    profilePictureUri: member.profilePictureUri || "",
  }));

  return {
    members,
    id: item.id,
    name: item.name,
    coverImageUri: item.coverImageUri,
    savedCount: item.recommendationsCount,
    containsRecommendation: item.containsRecommendation,
  };
};

/**
 * Options for fetching wishlists
 */
interface FetchWishlistsOptions {
  includeRecommendationId?: string;
  excludeRecommendationId?: string;
  includeStatusForRecommendationId?: string;
}

/**
 * Fetch wishlists from the backend API with cursor-based pagination
 */
const fetchWishlists = async (
  cursor: string | undefined,
  options?: FetchWishlistsOptions,
): Promise<WishlistPageResult> => {
  try {
    const client = getApiClient();

    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) {
      params.append("cursor", cursor);
    }
    if (options?.includeRecommendationId) {
      params.append(
        "include_recommendation_id",
        options.includeRecommendationId,
      );
    }
    if (options?.excludeRecommendationId) {
      params.append(
        "exclude_recommendation_id",
        options.excludeRecommendationId,
      );
    }
    if (options?.includeStatusForRecommendationId) {
      params.append(
        "include_status_for_recommendation_id",
        options.includeStatusForRecommendationId,
      );
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.WISHLISTS_V1}?${queryString}`
      : API_ENDPOINTS.WISHLISTS_V1;

    const response = (await client.get(url)) as
      | WishlistListResponse
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching wishlists"),
        {
          component: "WishlistList",
          action: "Fetch Wishlists",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated wishlists response",
      );
    }

    return {
      data: response.data.map(transformToWishlistCardData),
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "WishlistList",
      action: "Fetch Wishlists",
    });
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Options for the useWishlists hook
 */
interface UseWishlistsOptions {
  includeRecommendationId?: string;
  excludeRecommendationId?: string;
  includeStatusForRecommendationId?: string;
}

/**
 * React Query hook for fetching wishlists with cursor-based pagination
 */
export const useWishlists = (options?: UseWishlistsOptions) => {
  const { isAuthenticated } = useAuthStore();

  // Build query key with optional filters
  const queryKey = [
    QUERY_KEYS.WISHLISTS,
    ...(options?.includeRecommendationId
      ? [{ includeRecommendationId: options.includeRecommendationId }]
      : []),
    ...(options?.excludeRecommendationId
      ? [{ excludeRecommendationId: options.excludeRecommendationId }]
      : []),
    ...(options?.includeStatusForRecommendationId
      ? [
          {
            includeStatusForRecommendationId:
              options.includeStatusForRecommendationId,
          },
        ]
      : []),
  ];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchWishlists(pageParam, options),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.next_cursor ?? undefined,
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });
};
