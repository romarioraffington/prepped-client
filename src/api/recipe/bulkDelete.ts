// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import { reportError } from "@/libs/utils";

/**
 * Bulk delete recipes
 * @param recipeIds - Array of recipe IDs to delete
 */
export const bulkDeleteRecipes = async (recipeIds: string[]): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = API_ENDPOINTS.RECIPES_BULK_DELETE_V1;
    await client.delete(endpoint, {
      body: JSON.stringify({ recipe_ids: recipeIds }),
    });
  } catch (error) {
    reportError(error, {
      component: "RecipeBulkDelete",
      action: "Bulk Delete Recipes",
      extra: { recipeCount: recipeIds.length },
    });

    let errorMessage = "Failed to delete recipes";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for bulk deleting recipes
 */
export const useBulkDeleteRecipesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeIds: string[]) => bulkDeleteRecipes(recipeIds),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECIPES],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOK_DETAILS_BASE],
        exact: false,
      });
    },
  });
};
