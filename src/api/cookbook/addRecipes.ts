// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";

// Internal Dependencies
import { reportError } from "@/libs/utils";

/**
 * Maximum number of recipes that can be added in a single request
 */
const MAX_RECIPES_PER_REQUEST = 20;

/**
 * Minimum number of recipes required in a request
 */
const MIN_RECIPES_PER_REQUEST = 1;

/**
 * Request body for adding recipes to a cookbook
 */
interface AddRecipesToCookbookRequest {
  cookbookId: string;
  recipeIds: string[];
}

/**
 * Add recipes to a single cookbook
 *
 * API Endpoint: POST /api/v1/cookbooks/{cookbookId}/recipes
 *
 * @param cookbookId - UUID of the cookbook
 * @param recipeIds - Array of recipe UUIDs (1-20 recipes)
 */
export const addRecipesToCookbook = async (
  cookbookId: string,
  recipeIds: string[],
): Promise<void> => {
  // Client-side validation: minimum recipes
  if (recipeIds.length < MIN_RECIPES_PER_REQUEST) {
    throw new Error(`You must add at least ${MIN_RECIPES_PER_REQUEST} recipe.`);
  }

  // Client-side validation: max recipes per request
  if (recipeIds.length > MAX_RECIPES_PER_REQUEST) {
    throw new Error(
      `You can only add up to ${MAX_RECIPES_PER_REQUEST} recipes at a time.`,
    );
  }

  // Client-side validation: check for duplicates
  const uniqueIds = new Set(recipeIds);
  if (uniqueIds.size !== recipeIds.length) {
    throw new Error("Duplicate recipe IDs are not allowed.");
  }

  try {
    const client = getApiClient();
    const endpoint = API_ENDPOINTS.COOKBOOK_RECIPES_V1.replace(
      "{cookbookId}",
      cookbookId,
    );
    await client.post(endpoint, {
      recipe_ids: recipeIds,
    });
  } catch (error) {
    reportError(error, {
      component: "CookbookAddRecipes",
      action: "Add Recipes To Cookbook",
      extra: {
        cookbookId,
        recipeCount: recipeIds.length,
      },
    });

    let errorMessage = "Failed to add recipes to cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for adding recipes to a cookbook
 *
 * Usage:
 *   addRecipesAsync({
 *     cookbookId: "uuid",
 *     recipeIds: ["uuid1", "uuid2"]
 *   })
 *
 * Validation is enforced in addRecipesToCookbook function
 */
export const useAddRecipesToCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cookbookId, recipeIds }: AddRecipesToCookbookRequest) => {
      return addRecipesToCookbook(cookbookId, recipeIds);
    },

    onSuccess: (_data, variables) => {
      // Invalidate cookbook details to refresh the cookbook
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(variables.cookbookId),
      });

      // Invalidate cookbooks list to refresh counts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });
    },
  });
};
