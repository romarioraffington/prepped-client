// External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import type { PaginationLinks, PaginationMeta, Recipe } from "@/libs/types";

interface RecipePageResult {
  data: Recipe[];
  meta: PaginationMeta;
}

interface FetchRecipesOptions {
  excludeCookbookId?: string;
}

const fetchRecipes = async (
  cursor?: string,
  options?: FetchRecipesOptions,
): Promise<RecipePageResult> => {
  try {
    const client = getApiClient();

    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) {
      params.append("cursor", cursor);
    }
    if (options?.excludeCookbookId) {
      params.append("exclude_cookbook_id", options.excludeCookbookId);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.RECIPES_LIST_V1}?${queryString}`
      : API_ENDPOINTS.RECIPES_LIST_V1;

    const response = (await client.get(url)) as
      | {
          data: Recipe[];
          links: PaginationLinks;
          meta: PaginationMeta;
        }
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching recipes"),
        {
          component: "RecipeList",
          action: "Fetch Recipes",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated recipes response",
      );
    }

    return {
      data: response.data,
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "RecipeList",
      action: "Fetch Recipes",
    });
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Options for the useRecipes hook
 */
interface UseRecipesOptions {
  excludeCookbookId?: string;
}

/**
 * React Query hook for fetching recipes with optional filtering
 *
 * @param options - Optional filtering options
 * @param options.excludeCookbookId - Exclude recipes that are already in this cookbook
 */
export const useRecipes = (options?: UseRecipesOptions) => {
  // Build query key with optional filters
  const queryKey = [
    QUERY_KEYS.RECIPES,
    ...(options?.excludeCookbookId
      ? [{ excludeCookbookId: options.excludeCookbookId }]
      : []),
  ];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchRecipes(pageParam, options),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,

    // Optimize for faster pagination
    staleTime: 5 * 60 * 1000, // 5 minutes - matches global config
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep pages in cache longer
    refetchOnWindowFocus: false, // Don't refetch when app regains focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });
};

// Hook to invalidate recipe cache
export const useInvalidateRecipes = () => {
  const queryClient = useQueryClient();

  return () => {
    // Use refetchQueries for infinite queries to force immediate refetch
    queryClient.refetchQueries({ queryKey: [QUERY_KEYS.RECIPES] });
  };
};
