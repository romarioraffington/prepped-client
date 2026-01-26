import { useQuery } from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import { parseSlug, reportError } from "@/libs/utils";

interface AmenitiesResponse {
  data: string[];
}

const fetchAmenities = async (id: string): Promise<string[]> => {
  try {
    if (!id) {
      throw new Error("Recommendation ID is required");
    }

    const client = getApiClient();
    const result: AmenitiesResponse = await client.get(
      API_ENDPOINTS.RECOMMENDATIONS_V1_AMENITIES.replace("{id}", id),
    );
    const data = result?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data array");
    }

    return data;
  } catch (error) {
    reportError(error, {
      component: "RecommendationAmenities",
      action: "Fetch Amenities",
      extra: { recommendationId: id },
    });
    throw new Error("An unexpected error occurred while fetching amenities");
  }
};

export const useAmenities = (slug: string) => {
  // Parse slug to extract ID for API call and cache key
  const { id: recommendationId } = parseSlug(slug);

  return useQuery({
    queryKey: QUERY_KEYS.AMENITIES(recommendationId),
    queryFn: () => fetchAmenities(recommendationId),
    enabled: !!recommendationId,
  });
};
