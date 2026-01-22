// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

export interface SaveRecipeToCookbookResponse {
  cookbookIds: string[];
}

/**
 * Save a recipe to an existing cookbook
 */
export const saveRecipeToCookbook = async (
  cookbookId: string,
  recipeId: string,
): Promise<SaveRecipeToCookbookResponse> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/${cookbookId}/recipes/${recipeId}`;
    const result: SaveRecipeToCookbookResponse = await client.post(
      endpoint,
      {},
    );

    return result;
  } catch (error) {
    reportError(error, {
      component: "CookbookSave",
      action: "Save Recipe To Cookbook",
      extra: { cookbookId, recipeId },
    });

    let errorMessage = "Failed to save recipe to cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for saving recipes to cookbooks
 */
export const useSaveRecipeToCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cookbookId,
      recipeSlug,
    }: {
      cookbookId: string;
      recipeSlug: string;
      cookbookName?: string;
    }) => {
      // Parse slug to extract ID for API call
      const { id: recipeId } = parseSlug(recipeSlug);
      return saveRecipeToCookbook(cookbookId, recipeId);
    },

    // TODO: Implement optimistic updates (commented out for now)
    // onMutate: async ({ cookbookId, cookbookName, recipeSlug }) => {
    //   // Parse slug to extract ID for cache key
    //   const { id: recipeId } = parseSlug(recipeSlug);
    //   const queryKey = QUERY_KEYS.RECIPE_DETAILS(recipeId);
    //
    //   // Cancel any outgoing refetches
    //   await queryClient.cancelQueries({ queryKey });
    //   await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COOKBOOKS] });
    //
    //   // Snapshot current state for rollback
    //   // ...
    //
    //   return { recipeId, cookbookId, cookbookName, recipeSlug };
    // },

    onSuccess: (_data, variables) => {
      // Parse slug to extract ID for cache invalidation
      const { id: recipeId } = parseSlug(variables.recipeSlug);

      // Invalidate cookbook details to refresh the cookbook
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(variables.cookbookId),
      });

      // Invalidate cookbooks list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });

      // Invalidate recipe details to refresh cookbookIds on the recipe
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECIPE_DETAILS(recipeId),
      });
    },

    onError: (error, variables) => {
      reportError(error, {
        component: "CookbookSave",
        action: "Save Recipe Mutation",
        extra: {
          cookbookId: variables.cookbookId,
          recipeSlug: variables.recipeSlug,
        },
      });
    },
  });
};
