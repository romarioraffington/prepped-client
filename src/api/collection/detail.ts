import { useQuery, useQueryClient } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  ImageGridItem,
  CollectionType,
  CollectionVariant,
} from "@/libs/types";

interface CollectionDetailsResponse {
  data: {
    id: string;
    name: string;
    type: CollectionType;
    parentCollectionName: string;
    recommendationsCount: number;
    collections: Array<{
      id: string;
      name: string;
      type: CollectionType;
      recommendationsCount: number;
      lastUpdatedTimestamp: number;
      imageUris: string[];
      hasSubCollections: boolean;
      variant?: CollectionVariant;
    }>;
  };
}

const fetchCollectionDetails = async (
  id: string,
  type?: string,
): Promise<{
  name: string;
  type: string;
  parentCollectionName?: string;
  recommendationsCount: number;
  collections: ImageGridItem[];
}> => {
  try {
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const client = getApiClient();
    const url = type
      ? `${API_ENDPOINTS.COLLECTIONS_V1}/${id}?type=${type}`
      : `${API_ENDPOINTS.COLLECTIONS_V1}/${id}`;

    const result: CollectionDetailsResponse = await client.get(url);
    const data = result?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }

    // Transform the API response to match our ImageGridItem interface
    const collections: ImageGridItem[] = data.collections.map((item) => ({
      id: item.id,
      name: item.name,
      count: item.recommendationsCount || 0,
      imageUris: item.imageUris || [],
      hasSubCollections: item.hasSubCollections,
      // Validate timestamp - ensure it's a valid number (not NaN)
      lastUpdatedTimestamp: Number.isNaN(item.lastUpdatedTimestamp)
        ? 0
        : item.lastUpdatedTimestamp,
    }));

    // Sort by lastUpdatedTimestamp descending (most recently updated first)
    // Create a new array to avoid mutation issues with React Query's structural sharing
    const sortedCollections = [...collections].sort(
      (a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0),
    );

    return {
      collections: sortedCollections,
      type: data.type,
      name: data.name,
      parentCollectionName: data.parentCollectionName,
      recommendationsCount: data.recommendationsCount,
    };
  } catch (error) {
    reportError(error, {
      component: "CollectionDetail",
      action: "Fetch Collection Details",
      extra: { collectionId: id },
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useCollectionDetails = (slug: string, type?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTION_DETAILS(slug, type),
    queryFn: () => fetchCollectionDetails(slug, type),
    enabled: !!slug,
  });
};

// Hook to replace invalidateCache
export const useInvalidateCollectionDetails = () => {
  const queryClient = useQueryClient();

  return (slug?: string) => {
    if (slug) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTION_DETAILS(slug),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.COLLECTION_DETAILS_BASE],
      });
    }
  };
};
