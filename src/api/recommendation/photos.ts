import { useQuery } from "@tanstack/react-query";

import { parseSlug, reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

export interface PhotoAuthorAttribution {
  displayName: string;
  photoUri: string;
  profileUri: string;
}

export interface Photo {
  id: string;
  uri: string;
  authorAttribution: PhotoAuthorAttribution;
  created_at: string;
}

interface PhotosResponse {
  data: {
    name: string;
    photos: Photo[];
  };
}

const fetchRecommendationPhotos = async (
  id: string,
): Promise<PhotosResponse> => {
  try {
    if (!id) {
      throw new Error("Recommendation ID is required");
    }

    const client = getApiClient();
    const result: PhotosResponse = await client.get(
      `${API_ENDPOINTS.RECOMMENDATIONS_V1}/${id}/photos`,
    );
    if (!result?.data) {
      throw new Error("Invalid response format: expected data array");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "RecommendationPhotos",
      action: "Fetch Recommendation Photos",
      extra: { recommendationId: id },
    });
    throw new Error("An unexpected error occurred while fetching photos");
  }
};

export const useRecommendationPhotos = (slug: string) => {
  // Parse slug to extract ID for API call and cache key
  const { id: recommendationId } = parseSlug(slug);

  return useQuery({
    queryKey: QUERY_KEYS.RECOMMENDATION_PHOTOS(recommendationId),
    queryFn: () => fetchRecommendationPhotos(recommendationId),
    enabled: !!recommendationId,
  });
};
