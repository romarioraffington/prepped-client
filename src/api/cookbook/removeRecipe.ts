// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { Recipe } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

/**
 * Remove a recipe from a cookbook
 */
export const removeRecipeFromCookbook = async (
  cookbookId: string,
  recipeId: string,
): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/${cookbookId}/recipes/${recipeId}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "CookbookRemoveRecipe",
      action: "Remove Recipe From Cookbook",
      extra: { cookbookId, recipeId },
    });

    let errorMessage = "Failed to remove recipe from cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for removing recipes from cookbooks
 */
export const useRemoveRecipeFromCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cookbookId,
      recipeId,
    }: {
      cookbookId: string;
      recipeId: string;
    }) => removeRecipeFromCookbook(cookbookId, recipeId),

    // On success, refetch the cookbook details and cookbooks list
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(variables.cookbookId),
      });
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
      });
    },
  });
};
