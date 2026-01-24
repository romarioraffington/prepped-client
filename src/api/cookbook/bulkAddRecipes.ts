// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { QUERY_KEYS } from "@/libs/constants";

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
  // TODO: Implement POST /api/v1/cookbooks/recipes/bulk
  // Request body: { recipe_ids: string[], cookbook_ids: string[] }
  // Response: 204 No Content (success, idempotent)
  // Error responses:
  //   - 401 Unauthorized
  //   - 403 User doesn't own recipes/cookbooks
  //   - 422 Validation error (invalid UUIDs, too many items, etc.)
  //   - 429 Rate limit exceeded (>10 requests/minute)

  // Stubbed implementation - returns resolved promise
  return Promise.resolve();
};

/**
 * React Query mutation hook for bulk adding recipes to cookbooks
 *
 * Usage:
 *   - For single cookbook: pass `cookbookIds: [cookbookId]`
 *   - For multiple cookbooks: pass `cookbookIds: [id1, id2, ...]`
 *
 * Enforces client-side 20 recipe limit for consistency with bulk remove
 */
export const useBulkAddRecipesToCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeIds, cookbookIds }: BulkAddRecipesRequest) => {
      // Client-side validation: max 20 recipes per request
      if (recipeIds.length > 20) {
        return Promise.reject(
          new Error("You can only add up to 20 recipes at a time."),
        );
      }

      // Client-side validation: max 20 cookbooks per request
      if (cookbookIds.length > 20) {
        return Promise.reject(
          new Error("You can only add to up to 20 cookbooks at a time."),
        );
      }

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
