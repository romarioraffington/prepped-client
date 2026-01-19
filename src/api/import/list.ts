//External Dependencies
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

//Internal Dependencies
import { reportError } from "@/libs/utils";
import { useAuthStore } from "@/stores/authStore";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";
import type { Import, PaginationLinks, PaginationMeta, Platform } from "@/libs/types";

interface ImportPageResult {
  data: Import[];
  meta: PaginationMeta;
}

const fetchImports = async (cursor?: string): Promise<ImportPageResult> => {
  try {
    const client = getApiClient();
    const url = cursor
      ? `${API_ENDPOINTS.RECIPES_LIST_V1}?cursor=${encodeURIComponent(cursor)}`
      : API_ENDPOINTS.RECIPES_LIST_V1;

    const response = (await client.get(url)) as
      | {
          data: any[];
          links: PaginationLinks;
          meta: PaginationMeta;
        }
      | undefined;

    if (!response || !Array.isArray(response.data)) {
      reportError(new Error("Invalid response structure when fetching imports"), {
        component: "ImportList",
        action: "Fetch Imports",
        extra: {
          response,
          hasData: !!response?.data,
          isArray: Array.isArray(response?.data),
        },
      });
      throw new Error(
        "Invalid response format: expected paginated imports response",
      );
    }

    // Transform the API response to match our Import interface
    const imports = response.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      platform: getPlatform(item.platform),
      status: item.status,
      asset: {
        type: item.asset?.type || "unknown",
        thumbnailUri: item?.asset?.thumbnailUri || "",
        contentUri: item?.asset?.contentUri || "",
      },
      metrics: {
        views: item?.metrics?.viewCount || 0,
        likes: item?.metrics?.likeCount || 0,
      },
      channel: {
        name: item?.channel?.name || "",
      },
      creator: {
        username: item?.creator?.username || "",
        profileUri: item.creator?.profileUri || "",
        photoUri: item.creator?.photoUri || "",
      },
    }));

    return {
      data: imports,
      meta: response.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "ImportList",
      action: "Fetch Imports",
    });
    throw new Error("An unexpected error occurred");
  }
};

const getPlatform = (platform: string): Platform => {
  const lowerPlatform = platform?.toLowerCase() || "";

  if (lowerPlatform.includes("tiktok")) return "tiktok";
  if (lowerPlatform.includes("instagram")) return "instagram";
  if (lowerPlatform.includes("youtube")) return "youtube";
  return "unknown";
};

// Hook to replace useImportsStore
export const useImports = () => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.RECIPES],
    queryFn: ({ pageParam }) => fetchImports(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
    // Optimize for faster pagination
    staleTime: 5 * 60 * 1000, // 5 minutes - matches global config
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep pages in cache longer
    refetchOnWindowFocus: false, // Don't refetch when app regains focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });
};

// Hook to replace invalidateCache
export const useInvalidateImports = () => {
  const queryClient = useQueryClient();

  return () => {
    // Use refetchQueries for infinite queries to force immediate refetch
    queryClient.refetchQueries({ queryKey: [QUERY_KEYS.RECIPES] });
  };
};
