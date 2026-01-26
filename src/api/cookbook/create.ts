// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
// Internal Dependencies
import { reportError } from "@/libs/utils";

import type {
  CookbookCardData,
  CreateCookbookRequest,
  CreateCookbookResponse,
  CreateCookbookResponseData,
} from "@/libs/types";

/**
 * Transform API response to CookbookCardData format
 */
export const transformToCookbookCardData = (
  response: CreateCookbookResponseData,
): CookbookCardData => {
  return {
    id: response.id,
    name: response.name,
    coverImageUri: response.imageUris?.[0] || null,
    savedCount: response.recipesCount,
  };
};

/**
 * Create a new cookbook
 */
export const createCookbook = async (
  request: CreateCookbookRequest,
): Promise<CreateCookbookResponse> => {
  try {
    const client = getApiClient();
    const result: CreateCookbookResponse = await client.post(
      API_ENDPOINTS.COOKBOOKS_V1,
      request,
    );

    if (!result?.data) {
      throw new Error("No data returned from cookbook creation");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "CookbookCreate",
      action: "Create Cookbook",
      extra: { name: request.name },
    });

    let errorMessage = "Failed to create cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for creating cookbooks
 */
export const useCreateCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCookbookRequest) => createCookbook(request),
    onSuccess: async (response, variables) => {
      if (!response?.data) return;

      // Invalidate cookbooks list to show the new cookbook
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
      });

      // If a recipe was saved to the cookbook, invalidate recipe details
      if (variables.recipe_id) {
        // Invalidate recipe details if we saved a recipe to the cookbook
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
          exact: false,
        });
      }
    },
    onError: (error) => {
      reportError(error, {
        component: "CookbookCreate",
        action: "Create Cookbook Mutation",
      });
    },
  });
};
