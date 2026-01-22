// External Dependencies
import type { Region } from "react-native-maps";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";
import { calculateRegion, parseSlug, reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface WishlistRecommendationsResponse {
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

interface WishlistRecommendationsResult {
  name: string;
  recommendations: RecommendationListItem[];
  region?: Region | null;
}

const fetchWishlistRecommendations = async (
  wishlistId: string,
): Promise<WishlistRecommendationsResult> => {
  try {
    const client = getApiClient();
    const result: WishlistRecommendationsResponse = await client.get(
      `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}/recommendations`,
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
      component: "WishlistRecommendations",
      action: "Fetch Wishlist Recommendations",
      extra: { wishlistId },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useWishlistRecommendations = (wishlistSlug: string) => {
  // Parse slug to extract ID for API call and cache key
  const { id: wishlistId } = parseSlug(wishlistSlug);

  return useQuery({
    queryKey: QUERY_KEYS.WISHLIST_RECOMMENDATIONS(wishlistId),
    queryFn: () => fetchWishlistRecommendations(wishlistId),
    enabled: !!wishlistId,
    staleTime: 0, // Always consider data stale - others can add items at any time
    gcTime: 0, // Immediately remove from cache when inactive - memory optimization
  });
};

// Hook to invalidate wishlist recommendations cache
export const useInvalidateWishlistRecommendations = () => {
  const queryClient = useQueryClient();

  return (wishlistId: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.WISHLIST_RECOMMENDATIONS(wishlistId),
    });
  };
};
