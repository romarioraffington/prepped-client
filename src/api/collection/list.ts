//External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

//Internal Dependencies
import { reportError } from "@/libs/utils";
import { useAuthStore } from "@/stores/authStore";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  ImageGridItem,
  PaginationLinks,
  PaginationMeta,
} from "@/libs/types";

interface CollectionItem {
  id: string;
  name: string;
  imageUris: string[];
  citiesCount: number;
  recommendationsCount: number;
  lastUpdatedTimestamp: string;
}

interface CollectionListResponse {
  data: CollectionItem[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

interface CollectionPageResult {
  data: ImageGridItem[];
  meta: PaginationMeta;
}

const fetchCollections = async (
  cursor?: string,
): Promise<CollectionPageResult> => {
  try {
    const client = getApiClient();
    const url = cursor
      ? `${API_ENDPOINTS.COLLECTIONS_V1}?cursor=${encodeURIComponent(cursor)}`
      : API_ENDPOINTS.COLLECTIONS_V1;

    const response = (await client.get(url)) as
      | CollectionListResponse
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching collections"),
        {
          component: "CollectionList",
          action: "Fetch Collections",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated collections response",
      );
    }

    // Transform the API response to match our ImageGridItem interface
    const collections = response.data.map((item) => {
      const timestamp = new Date(item.lastUpdatedTimestamp).getTime();
      return {
        id: item.id,
        name: item.name,
        imageUris: item.imageUris || [],
        citiesCount: item.citiesCount || 0,
        recommendationsCount: item.recommendationsCount || 0,
        lastUpdatedTimestamp: Number.isNaN(timestamp) ? undefined : timestamp,
      };
    });

    return {
      data: collections,
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "CollectionList",
      action: "Fetch Collections",
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useCollections = () => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.COLLECTIONS],
    queryFn: ({ pageParam }) => fetchCollections(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });
};

// Hook to replace invalidateCache
export const useInvalidateCollections = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLECTIONS] });
  };
};
