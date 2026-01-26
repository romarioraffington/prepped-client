// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
// Internal Dependencies
import { reportError } from "@/libs/utils";

/**
 * Maximum number of items (recipes or cookbooks) that can be processed
 * in a single bulk operation request.
 *
 * This limit is enforced client-side for consistency with bulk remove operations
 * and to prevent overly large requests that could impact performance.
 */
const MAX_BULK_OPERATION_SIZE = 20;

/**
 * Request body for bulk adding recipes to cookbooks
 */
interface BulkAddRecipesRequest {
  recipeIds: string[];
  cookbookIds: string[];
}

/**
 * Bulk add recipes to cookbooks (Cartesian product)
 *
 * API Endpoint: POST /api/v1/cookbooks/recipes/bulk
 *
 * This will add all recipes to all specified cookbooks.
 * For example, if recipeIds = [A, B] and cookbookIds = [1, 2],
 * the endpoint will create 4 associations: A->1, A->2, B->1, B->2
 *
 * @param recipeIds - Array of recipe UUIDs (1-20 recipes)
 * @param cookbookIds - Array of cookbook UUIDs (1-20 cookbooks)
 */
export const bulkAddRecipesToCookbooks = async (
  recipeIds: string[],
  cookbookIds: string[],
): Promise<void> => {
  // Client-side validation: max recipes per request
  if (recipeIds.length > MAX_BULK_OPERATION_SIZE) {
    throw new Error(
      `You can only add up to ${MAX_BULK_OPERATION_SIZE} recipes at a time.`,
    );
  }

  // Client-side validation: max cookbooks per request
  if (cookbookIds.length > MAX_BULK_OPERATION_SIZE) {
    throw new Error(
      `You can only add to up to ${MAX_BULK_OPERATION_SIZE} cookbooks at a time.`,
    );
  }

  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/recipes/bulk`;
    await client.post(endpoint, {
      recipe_ids: recipeIds,
      cookbook_ids: cookbookIds,
    });
  } catch (error) {
    reportError(error, {
      component: "CookbookBulkAddRecipes",
      action: "Bulk Add Recipes To Cookbooks",
      extra: {
        recipeCount: recipeIds.length,
        cookbookCount: cookbookIds.length,
      },
    });

    let errorMessage = "Failed to add recipes to cookbooks";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for bulk adding recipes to cookbooks
 *
 * Usage:
 *   - For single cookbook: pass `cookbookIds: [cookbookId]`
 *   - For multiple cookbooks: pass `cookbookIds: [id1, id2, ...]`
 *
 * Validation is enforced in bulkAddRecipesToCookbooks function
 */
export const useBulkAddRecipesToCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeIds, cookbookIds }: BulkAddRecipesRequest) => {
      return bulkAddRecipesToCookbooks(recipeIds, cookbookIds);
    },

    onSuccess: (_data, variables) => {
      // Invalidate cookbook details for all affected cookbooks
      for (const cookbookId of variables.cookbookIds) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.COOKBOOK_DETAILS(cookbookId),
        });
      }

      // Invalidate cookbooks list to refresh counts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });
    },
  });
};
