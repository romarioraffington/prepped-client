import { useQuery } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
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
  slug: string,
): Promise<PhotosResponse> => {
  try {
    if (!slug) {
      throw new Error("Recommendation slug is required");
    }

    const client = getApiClient();
    const result: PhotosResponse = await client.get(
      `${API_ENDPOINTS.RECOMMENDATIONS_V1}/${slug}/photos`,
    );
    if (!result?.data) {
      throw new Error("Invalid response format: expected data array");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "RecommendationPhotos",
      action: "Fetch Recommendation Photos",
      extra: { slug },
    });
    throw new Error("An unexpected error occurred while fetching photos");
  }
};

export const useRecommendationPhotos = (slug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RECOMMENDATION_PHOTOS(slug),
    queryFn: () => fetchRecommendationPhotos(slug),
    enabled: !!slug,
  });
};
