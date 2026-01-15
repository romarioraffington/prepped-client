// External Dependencies
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { RecommendationDetail } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface RecommendationDetailsResponse {
  data: RecommendationDetail;
}

const fetchRecommendationDetails = async (
  slug: string,
): Promise<RecommendationDetail> => {
  try {
    if (!slug) {
      throw new Error("Recommendation slug is required");
    }

    const client = getApiClient();
    const result: RecommendationDetailsResponse = await client.get(
      `${API_ENDPOINTS.RECOMMENDATIONS_V1}/${slug}`,
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
      extra: { slug },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useRecommendationDetails = (
  slug: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(slug),
    queryFn: () => fetchRecommendationDetails(slug),
    enabled: options?.enabled !== undefined ? options.enabled : !!slug,
  });
};

// Hook to replace invalidateCache
export const useInvalidateRecommendationDetails = () => {
  const queryClient = useQueryClient();

  return (slug?: string) => {
    if (slug) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(slug),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECOMMENDATION_DETAILS_BASE],
      });
    }
  };
};
