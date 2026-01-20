// External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";
import type { Recipe, PaginationLinks, PaginationMeta } from "@/libs/types";

interface RecipePageResult {
  data: Recipe[];
  meta: PaginationMeta;
}

const fetchRecipes = async (cursor?: string): Promise<RecipePageResult> => {
  try {
    const client = getApiClient();
    const url = cursor
      ? `${API_ENDPOINTS.RECIPES_LIST_V1}?cursor=${encodeURIComponent(cursor)}`
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

export const useRecipes = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.RECIPES],
    queryFn: ({ pageParam }) => fetchRecipes(pageParam),
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
