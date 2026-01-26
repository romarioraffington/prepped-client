// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
// Internal Dependencies
import { reportError } from "@/libs/utils";

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
