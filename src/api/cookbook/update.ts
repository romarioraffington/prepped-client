// External Dependencies
import * as Haptics from "expo-haptics";

// Internal Dependencies

import { parseSlug, reportError } from "@/libs/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";

export interface UpdateCookbookRequest {
  name: string;
}

export interface UpdateCookbookResponseData {
  id: string;
  name: string;
}

export interface UpdateCookbookResponse {
  data: UpdateCookbookResponseData;
}

/**
 * Update a cookbook (e.g., rename)
 * @param slug - The cookbook slug or ID
 * @param data - The data to update (name)
 */
export const updateCookbook = async (
  slug: string,
  data: UpdateCookbookRequest,
): Promise<UpdateCookbookResponse> => {
  // Parse slug to extract ID for API call (API expects ID, not full slug)
  const { id: cookbookId } = parseSlug(slug);

  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/${cookbookId}`;
    const result: UpdateCookbookResponse = await client.put(endpoint, data);

    if (!result || !result.data || !result.data.name) {
      throw new Error("Invalid response: missing data or name");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "CookbookUpdate",
      action: "Update Cookbook",
      extra: { cookbookId, name: data.name },
    });

    let errorMessage = "Failed to update cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for updating cookbooks
 */
export const useUpdateCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, name }: { slug: string; name: string }) =>
      updateCookbook(slug, { name }),

    onSuccess: async (_response, variables) => {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Extract ID from slug for cache invalidation
      const { id: cookbookId } = parseSlug(variables.slug);

      // Invalidate and refetch cookbook details
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COOKBOOK_DETAILS(cookbookId),
      });

      // Invalidate and refetch cookbooks list
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
      });
    },
  });
};
