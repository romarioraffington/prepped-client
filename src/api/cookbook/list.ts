// External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";

// Internal Dependencies
import { reportError } from "@/libs/utils";

import type {
  ImageGridItem,
  ImageGridPageResult,
  CookbookListResponse,
} from "@/libs/types";

/**
 * Options for fetching cookbooks
 */
interface FetchCookbooksOptions {
  includeStatusForRecipeId?: string;
}

/**
 * Fetch cookbooks from the backend API with cursor-based pagination.
 * When includeStatusForRecipeId is provided, the API returns containsRecipe per item.
 */
const fetchCookbooks = async (
  cursor: string | undefined,
  options?: FetchCookbooksOptions,
): Promise<ImageGridPageResult> => {
  try {
    const client = getApiClient();

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

    const cookbooks: ImageGridItem[] = response.data.map((item) => ({
      id: item.id,
      name: item.name,
      imageUris: item.imageUris || [],
      count: item.recipesCount || 0,
      lastUpdatedTimestamp: item.lastUpdatedTimestamp || 0,
      type: item.type ?? 0,
      ...(item.containsRecipe !== undefined && {
        containsRecipe: item.containsRecipe,
      }),
    }));

    return {
      data: cookbooks,
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
 * Options for the useCookbooks hook
 */
export interface UseCookbooksOptions {
  /** When set, API returns containsRecipe per cookbook (e.g. manage-cookbooks modal) */
  includeStatusForRecipeId?: string;
}

/**
 * React Query hook for fetching cookbooks.
 * Use includeStatusForRecipeId when you need containsRecipe per item (e.g. manage-cookbooks).
 */
export const useCookbooks = (options?: UseCookbooksOptions) => {
  const queryKey = [
    QUERY_KEYS.COOKBOOKS,
    ...(options?.includeStatusForRecipeId
      ? [{ includeStatusForRecipeId: options.includeStatusForRecipeId }]
      : []),
  ];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchCookbooks(pageParam, options),
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
