// External Dependencies
import type { Region } from "react-native-maps";

// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";
import { calculateRegion, reportError } from "@/libs/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface CollectionRecommendationsResponse {
  data: {
    name: string;
    recommendations: Array<{
      id: string;
      name: string;
      isAccessible: boolean;
      category: string;
      priceRange: string;
      editorialSummary: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      hours: {
        isOpen: boolean;
        opensAt: string;
        closedAt: string;
        is24Hours: boolean;
      };
      images: string[];
      reviews: {
        rating: number;
        count: number;
      };
      wishlistIds?: string[];
    }>;
  };
}

interface CollectionRecommendationsResult {
  name: string;
  region?: Region | null;
  recommendations: RecommendationListItem[];
}

const fetchCollectionRecommendations = async (
  collectionId: string,
  category?: string,
): Promise<CollectionRecommendationsResult> => {
  try {
    const client = getApiClient();
    const url = category
      ? `${API_ENDPOINTS.COLLECTIONS_V1}/${collectionId}/recommendations?category=${category}`
      : `${API_ENDPOINTS.COLLECTIONS_V1}/${collectionId}/recommendations`;

    const result: CollectionRecommendationsResponse = await client.get(url);
    const data = result?.data;

    if (!data?.recommendations?.length) {
      throw new Error("No recommendations found");
    }

    // Transform the API response to match our RecommendationListItem interface
    const recommendations: RecommendationListItem[] = data.recommendations.map(
      (item) => ({
        id: item.id,
        name: item.name,
        images: item.images,
        category: item.category,
        priceRange: item.priceRange,
        coordinates: item.coordinates,
        isAccessible: item.isAccessible,
        editorialSummary: item.editorialSummary,
        hours: {
          isOpen: item.hours.isOpen,
          opensAt: item.hours.opensAt,
          closedAt: item.hours.closedAt,
          is24Hours: item.hours.is24Hours,
        },
        reviews: {
          rating: item.reviews.rating,
          count: item.reviews.count,
        },
        wishlistIds: item.wishlistIds ?? [],
      }),
    );

    // Calculate the region for the map
    const region = calculateRegion(recommendations);

    return {
      region,
      recommendations,
      name: data?.name,
    };
  } catch (error) {
    reportError(error, {
      component: "CollectionRecommendations",
      action: "Fetch Collection Recommendations",
      extra: { collectionId },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useCollectionRecommendations = (
  collectionId: string,
  category?: string,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTION_RECOMMENDATIONS(collectionId, category),
    queryFn: () => fetchCollectionRecommendations(collectionId, category),
    enabled: !!collectionId,
  });
};

// Hook to replace invalidateCache
export const useInvalidateCollectionRecommendations = () => {
  const queryClient = useQueryClient();

  return (collectionId?: string, category?: string) => {
    if (collectionId) {
      // Invalidate specific collection recommendations
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTION_RECOMMENDATIONS(collectionId, category),
      });
    } else {
      // Invalidate all collection recommendations
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE],
      });
    }
  };
};
