// External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { useAuthStore } from "@/stores/authStore";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  ImageGridItem,
  CookbookCardData,
  CookbookListItem,
  CookbookPageResult,
  ImageGridPageResult,
  CookbookListResponse,
} from "@/libs/types";

/**
 * Transform API response item to CookbookCardData format
 */
const transformToCookbookCardData = (
  item: CookbookListItem,
): CookbookCardData => {
  return {
    id: item.id,
    name: item.name,
    coverImageUri: item.imageUris?.[0] || null,
    savedCount: item.recipesCount,
    members: [],
    containsRecipe: item.containsRecipe,
  };
};

/**
 * Options for fetching cookbooks
 */
interface FetchCookbooksOptions {
  includeStatusForRecipeId?: string;
}

/**
 * Fetch cookbooks from the backend API with cursor-based pagination
 */
const fetchCookbooksForCards = async (
  cursor: string | undefined,
  options?: FetchCookbooksOptions,
): Promise<CookbookPageResult> => {
  try {
    const client = getApiClient();

    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) {
      params.append("cursor", cursor);
    }
    if (options?.includeStatusForRecipeId) {
      params.append(
        "include_status_for_recipe_id",
        options.includeStatusForRecipeId,
      );
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.COOKBOOKS_V1}?${queryString}`
      : API_ENDPOINTS.COOKBOOKS_V1;

    const response = (await client.get(url)) as
      | CookbookListResponse
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching cookbooks"),
        {
          component: "CookbookList",
          action: "Fetch Cookbooks",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated cookbooks response",
      );
    }

    return {
      data: response.data.map(transformToCookbookCardData),
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "CookbookList",
      action: "Fetch Cookbooks",
    });
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Fetch cookbooks for ImageGrid display (without card transformation)
 */
const fetchCookbooksForGrid = async (
  cursor?: string,
): Promise<ImageGridPageResult> => {
  try {
    const client = getApiClient();
    const url = cursor
      ? `${API_ENDPOINTS.COOKBOOKS_V1}?cursor=${encodeURIComponent(cursor)}`
      : API_ENDPOINTS.COOKBOOKS_V1;

    const response = (await client.get(url)) as
      | CookbookListResponse
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching cookbooks"),
        {
          component: "CookbookList",
          action: "Fetch Cookbooks",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated cookbooks response",
      );
    }

    // Transform the API response to match our ImageGridItem interface
    const cookbooks: ImageGridItem[] = response?.data?.map((item) => ({
      id: item?.id,
      name: item?.name,
      imageUris: item?.imageUris || [],
      count: item?.recipesCount || 0,
      lastUpdatedTimestamp: item?.lastUpdatedTimestamp || 0,
      type: item?.type ?? 0,
    }));

    const result: ImageGridPageResult = {
      data: cookbooks,
      meta: response.meta,
    };
    return result;
  } catch (error) {
    reportError(error, {
      component: "CookbookList",
      action: "Fetch Cookbooks",
    });
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Options for the useCookbooksForCards hook
 */
interface UseCookbooksForCardsOptions {
  includeStatusForRecipeId?: string;
}

/**
 * React Query hook for fetching cookbooks with CookbookCardData transformation
 * Use this hook when displaying cookbooks in card format (e.g., manage-cookbooks modal)
 */
export const useCookbooksForCards = (options?: UseCookbooksForCardsOptions) => {
  const { isAuthenticated } = useAuthStore();

  // Build query key with optional filters
  const queryKey = [
    QUERY_KEYS.COOKBOOKS,
    ...(options?.includeStatusForRecipeId
      ? [{ includeStatusForRecipeId: options.includeStatusForRecipeId }]
      : []),
  ];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchCookbooksForCards(pageParam, options),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.next_cursor ?? undefined,
    enabled: isAuthenticated,
  });
};

/**
 * React Query hook for fetching cookbooks for ImageGrid display
 * Use this hook when displaying cookbooks in grid format (e.g., cookbooks tab)
 */
export const useCookbooks = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.COOKBOOKS],
    queryFn: ({ pageParam }) => fetchCookbooksForGrid(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.next_cursor ?? undefined,
  });
};

// Hook to replace invalidateCache
export const useInvalidateCookbooks = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COOKBOOKS] });
  };
};
