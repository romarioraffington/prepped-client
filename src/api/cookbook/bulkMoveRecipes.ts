// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS } from "@/libs/constants";
import { QUERY_KEYS, getApiClient } from "@/libs/constants";

/**
 * Maximum number of recipes that can be moved in a single bulk operation.
 */
const MAX_BULK_OPERATION_SIZE = 20;

/**
 * Request body for bulk moving recipes between cookbooks
 */
interface BulkMoveRecipesRequest {
  recipeIds: string[];
  sourceCookbookId: string;
  destinationCookbookIds: string[];
}

/**
 * Bulk move recipes from one cookbook to multiple destination cookbooks
 *
 * API Endpoint: POST /api/v1/cookbooks/recipes/bulk-move
 *
 * This will move all specified recipes from the source cookbook to all destination cookbooks.
 * - Recipes are soft-deleted from source cookbook
 * - Recipes are added to (or restored in) all destination cookbooks
 * - All cookbook timestamps are updated
 *
 * @param recipeIds - Array of recipe UUIDs (1-20 recipes)
 * @param sourceCookbookId - UUID of the source cookbook
 * @param destinationCookbookIds - Array of UUIDs of destination cookbooks (1-20 cookbooks)
 */
export const bulkMoveRecipes = async (
  recipeIds: string[],
  sourceCookbookId: string,
  destinationCookbookIds: string[],
): Promise<void> => {
  // Client-side validation: max recipes per request
  if (recipeIds.length > MAX_BULK_OPERATION_SIZE) {
    throw new Error(
      `You can only move up to ${MAX_BULK_OPERATION_SIZE} recipes at a time.`,
    );
  }

  // Client-side validation: max cookbooks per request
  if (destinationCookbookIds.length > MAX_BULK_OPERATION_SIZE) {
    throw new Error(
      `You can only move to up to ${MAX_BULK_OPERATION_SIZE} cookbooks at a time.`,
    );
  }

  // Client-side validation: source must not be in destination list
  if (destinationCookbookIds.includes(sourceCookbookId)) {
    throw new Error("Source cookbook cannot be in the destination list.");
  }

  try {
    const client = getApiClient();
    await client.post(API_ENDPOINTS.COOKBOOKS_RECIPES_BULK_MOVE_V1, {
      recipe_ids: recipeIds,
      source_cookbook_id: sourceCookbookId,
      destination_cookbook_ids: destinationCookbookIds,
    });
    // API returns 204 No Content on success - no body to parse
  } catch (error) {
    reportError(error, {
      component: "CookbookBulkMoveRecipes",
      action: "Bulk Move Recipes Between Cookbooks",
      extra: {
        recipeCount: recipeIds.length,
        sourceCookbookId,
        destinationCookbookCount: destinationCookbookIds.length,
      },
    });

    let errorMessage = "Failed to move recipes";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for bulk moving recipes between cookbooks
 *
 * Usage:
 *   bulkMoveAsync({
 *     recipeIds: ["uuid-1", "uuid-2"],
 *     sourceCookbookId: "source-uuid",
 *     destinationCookbookIds: ["dest-uuid-1", "dest-uuid-2"]
 *   })
 *
 * On success:
 *   - Invalidates source cookbook details (recipes removed)
 *   - Invalidates all destination cookbook details (recipes added)
 *   - Invalidates cookbooks list (counts updated)
 */
export const useBulkMoveRecipesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeIds,
      sourceCookbookId,
      destinationCookbookIds,
    }: BulkMoveRecipesRequest) => {
      return bulkMoveRecipes(
        recipeIds,
        sourceCookbookId,
        destinationCookbookIds,
      );
    },

    onSuccess: (_data, variables) => {
      // Invalidate source cookbook details (recipes were removed)
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(variables.sourceCookbookId),
      });

      // Invalidate all destination cookbook details (recipes were added)
      for (const destinationCookbookId of variables.destinationCookbookIds) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.COOKBOOK_DETAILS(destinationCookbookId),
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
