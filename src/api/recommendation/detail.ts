// External Dependencies
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import type { RecommendationDetail } from "@/libs/types";
// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";

interface RecommendationDetailsResponse {
  data: RecommendationDetail;
}

const fetchRecommendationDetails = async (
  id: string,
): Promise<RecommendationDetail> => {
  try {
    if (!id) {
      throw new Error("Recommendation ID is required");
    }

    const client = getApiClient();
    const result: RecommendationDetailsResponse = await client.get(
      `${API_ENDPOINTS.RECOMMENDATIONS_V1}/${id}`,
    );
    const data = result?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }

    return data;
  } catch (error) {
    reportError(error, {
      component: "RecommendationDetail",
      action: "Fetch Recommendation Details",
      extra: { recommendationId: id },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useRecommendationDetails = (
  slug: string,
  options?: { enabled?: boolean },
) => {
  // Parse slug to extract ID for API call and cache key
  const { id: recommendationId } = parseSlug(slug);

  return useQuery({
    queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId),
    queryFn: () => fetchRecommendationDetails(recommendationId),
    enabled:
      options?.enabled !== undefined ? options.enabled : !!recommendationId,
  });
};

// Hook to replace invalidateCache
export const useInvalidateRecommendationDetails = () => {
  const queryClient = useQueryClient();

  return (id?: string) => {
    if (id) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(id),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECOMMENDATION_DETAILS_BASE],
      });
    }
  };
};
