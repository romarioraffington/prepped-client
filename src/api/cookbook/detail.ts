// External Dependencies
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { Recipe, PaginationMeta } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface CookbookDetailsResponse {
  data: {
    name: string;
    type: number;
    recipesCount: number;
    recipes: Recipe[];
  };
  meta: PaginationMeta;
}

const fetchCookbookDetails = async (
  id: string,
): Promise<{
  name: string;
  type: number;
  recipesCount: number;
  recipes: Recipe[];
  meta: PaginationMeta;
}> => {
  try {
    if (!id) {
      throw new Error("Cookbook ID is required");
    }

    const client = getApiClient();
    const url = `${API_ENDPOINTS.COOKBOOKS_V1}/${id}`;

    const result: CookbookDetailsResponse = await client.get(url);
    const data = result?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }

    return {
      name: data.name,
      type: data.type,
      recipes: data.recipes,
      recipesCount: data.recipesCount,
      meta: result.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "CookbookDetail",
      action: "Fetch Cookbook Details",
      extra: { cookbookId: id },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useCookbookDetails = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.COOKBOOK_DETAILS(id),
    queryFn: () => fetchCookbookDetails(id),
    enabled: !!id,
  });
};

// Hook to replace invalidateCache
export const useInvalidateCookbookDetails = () => {
  const queryClient = useQueryClient();

  return (id?: string) => {
    if (id) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(id),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOK_DETAILS_BASE],
      });
    }
  };
};
