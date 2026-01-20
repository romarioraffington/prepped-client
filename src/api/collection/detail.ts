// External Dependencies
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { Recipe, PaginationMeta } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

interface CollectionDetailsResponse {
  data: {
    name: string;
    recipesCount: number;
    recipes: Recipe[];
  };
  meta: PaginationMeta;
}

const fetchCollectionDetails = async (
  id: string,
): Promise<{
  name: string;
  recipesCount: number;
  recipes: Recipe[];
  meta: PaginationMeta;
}> => {
  try {
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const client = getApiClient();
    const url = `${API_ENDPOINTS.COLLECTIONS_V1}/${id}`;

    const result: CollectionDetailsResponse = await client.get(url);
    const data = result?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }

    return {
      name: data.name,
      recipes: data.recipes,
      recipesCount: data.recipesCount,
      meta: result.meta,
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

export const useCollectionDetails = (slug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTION_DETAILS(slug),
    queryFn: () => fetchCollectionDetails(slug),
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
