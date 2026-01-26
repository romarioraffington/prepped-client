import { useQuery, useQueryClient } from "@tanstack/react-query";
// External Dependencies
import type { Region } from "react-native-maps";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";
import { calculateRegion, reportError } from "@/libs/utils";

interface ImportRecommendationsResponse {
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
      hours?: {
        isOpen: boolean;
        opensAt: string;
        closedAt: string;
        is24Hours: boolean;
      };
      images: string[];
      reviews?: {
        rating: number;
        count: number;
      };
      wishlistIds?: string[];
    }>;
  };
}

interface ImportRecommendationsResult {
  name: string;
  recommendations: RecommendationListItem[];
  region?: Region | null;
}

const fetchImportRecommendations = async (
  importId: string,
): Promise<ImportRecommendationsResult> => {
  try {
    const client = getApiClient();
    const result: ImportRecommendationsResponse = await client.get(
      `${API_ENDPOINTS.RECIPES_LIST_V1}/${importId}/recommendations`,
    );
    const data = result?.data;

    if (!data?.recommendations?.length) {
      return {
        region: null,
        recommendations: [],
        name: data?.name,
      };
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
        hours: item.hours
          ? {
              isOpen: item.hours?.isOpen,
              opensAt: item.hours?.opensAt,
              closedAt: item.hours?.closedAt,
              is24Hours: item.hours?.is24Hours,
            }
          : undefined,
        reviews: item.reviews
          ? {
              rating: item.reviews.rating,
              count: item.reviews.count,
            }
          : undefined,
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
      component: "ImportRecommendations",
      action: "Fetch Import Recommendations",
      extra: { importId },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useImportRecommendations = (recipeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RECIPE_RECOMMENDATIONS(recipeId),
    queryFn: () => fetchImportRecommendations(recipeId),
    enabled: !!recipeId,
  });
};

// Hook to replace invalidateCache
export const useInvalidateImportRecommendations = () => {
  const queryClient = useQueryClient();

  return (recipeId: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.RECIPE_RECOMMENDATIONS(recipeId),
    });
  };
};
