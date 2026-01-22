// External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  ImageGridItem,
  PaginationLinks,
  PaginationMeta,
} from "@/libs/types";

interface CookbookItem {
  id: string;
  name: string;
  imageUris: string[];
  recipesCount: number;
  lastUpdatedTimestamp: number;
}

interface CookbookListResponse {
  data: CookbookItem[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

interface CookbookPageResult {
  data: ImageGridItem[];
  meta: PaginationMeta;
}

const fetchCookbooks = async (cursor?: string): Promise<CookbookPageResult> => {
  try {
    const client = getApiClient();
    const url = cursor
      ? `${API_ENDPOINTS.COOKBOOKS_V1}?cursor=${encodeURIComponent(cursor)}`
      : API_ENDPOINTS.COOKBOOKS_V1;

    const response = (await client.get(url)) as
      | CookbookListResponse
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(
        new Error("Invalid response structure when fetching cookbooks"),
        {
          component: "CookbookList",
          action: "Fetch Cookbooks",
          extra: {
            response,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
          },
        },
      );
      throw new Error(
        "Invalid response format: expected paginated cookbooks response",
      );
    }

    // Transform the API response to match our ImageGridItem interface
    const cookbooks: ImageGridItem[] = response?.data?.map((item) => ({
      id: item?.id,
      name: item?.name,
      imageUris: item?.imageUris || [],
      count: item?.recipesCount || 0,
      lastUpdatedTimestamp: item?.lastUpdatedTimestamp || 0,
    }));

    return {
      data: cookbooks,
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "CookbookList",
      action: "Fetch Cookbooks",
    });
    throw new Error("An unexpected error occurred");
  }
};

export const useCookbooks = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.COOKBOOKS],
    queryFn: ({ pageParam }) => fetchCookbooks(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
  });
};

// Hook to replace invalidateCache
export const useInvalidateCookbooks = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COOKBOOKS] });
  };
};
