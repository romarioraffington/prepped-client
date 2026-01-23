// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";

/**
 * Bulk remove recipes from a cookbook
 * @param cookbookId - The ID of the cookbook
 * @param recipeIds - Array of recipe IDs to remove
 */
export const bulkRemoveRecipesFromCookbook = async (
  cookbookId: string,
  recipeIds: string[],
): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/${cookbookId}/recipes`;
    await client.delete(endpoint, {
      body: JSON.stringify({ recipe_ids: recipeIds }),
    });
  } catch (error) {
    reportError(error, {
      component: "CookbookBulkRemoveRecipes",
      action: "Bulk Remove Recipes From Cookbook",
      extra: { cookbookId, recipeCount: recipeIds.length },
    });

    let errorMessage = "Failed to remove recipes from cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for bulk removing recipes from a cookbook
 */
export const useBulkRemoveRecipesFromCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cookbookId,
      recipeIds,
    }: {
      cookbookId: string;
      recipeIds: string[];
    }) => bulkRemoveRecipesFromCookbook(cookbookId, recipeIds),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(variables.cookbookId),
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });
    },
  });
};
