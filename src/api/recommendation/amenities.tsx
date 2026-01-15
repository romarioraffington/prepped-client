import { useQuery } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface AmenitiesResponse {
  data: string[];
}

const fetchAmenities = async (slug: string): Promise<string[]> => {
  try {
    if (!slug) {
      throw new Error("Recommendation slug is required");
    }

    const client = getApiClient();
    const result: AmenitiesResponse = await client.get(
      API_ENDPOINTS.RECOMMENDATIONS_V1_AMENITIES.replace("{slug}", slug)
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
      extra: { slug },
    });
    throw new Error("An unexpected error occurred while fetching amenities");
  }
};

export const useAmenities = (slug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.AMENITIES(slug),
    queryFn: () => fetchAmenities(slug),
    enabled: !!slug,
  });
};
