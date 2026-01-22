// External Dependencies
import { useMutation } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants";

/**
 * Delete a recommendation
 */
export const deleteRecommendation = async (id: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.RECOMMENDATIONS_V1}/${id}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "RecommendationDelete",
      action: "Delete Recommendation",
      extra: { recommendationId: id },
    });

    let errorMessage = "Failed to delete recommendation";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for deleting recommendations
 */
export const useDeleteRecommendationMutation = () => {
  return useMutation({
    mutationFn: (id: string) => deleteRecommendation(id),
  });
};
