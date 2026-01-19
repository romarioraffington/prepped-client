import { useQuery, useQueryClient } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
import type { ImportDetail, ImportRecommendation } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

/**
 * API response interface for GET /v1/extractions/:id
 * The backend returns a single extraction object wrapped in { data: {...} }.
 */
interface ImportDetailsResponse {
  id: string;
  siteName?: string;
  likeCount?: number;
  viewCount?: number;
  title?: string;
  sourceUri?: string;
  asset?: {
    type?: string;
    thumbnailUri?: string;
    uri?: string;
  } | null;
  author?: {
    name?: string;
    photoUri?: string;
    profileUri?: string;
  } | null;
  recommendations?: Array<{
    id: string;
    title?: string;
    editorialSummary?: string;
    imageUris: string[];
    wishlistIds: string[];
  }> | null;
}

/**
 * Fetch import details by id.
 * - Expects response shape: { data: ImportDetailsResponse }
 * - Validates presence of `data` and maps it to the app's ImportDetail type.
 */
const fetchImportDetails = async (id: string): Promise<ImportDetail> => {
  try {
    if (!id) {
      throw new Error("Import ID is required");
    }

    const client = getApiClient();
    const responseJson = await client.get(
      `${API_ENDPOINTS.RECIPES_LIST_V1}/${id}`,
    );

    // Expecting shape: { data: { ...details } }
    const data: ImportDetailsResponse | undefined = responseJson?.data;

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format: expected data object");
    }

    return mapItemToImportDetail(data);
  } catch (error) {
    reportError(error, {
      component: "ImportDetail",
      action: "Fetch Import Details",
      extra: { id },
    });
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Map raw API object to the strongly-typed ImportDetail used across the app.
 * - Ensures required string fields are never undefined (defaults to "").
 * - Normalizes `asset.type` to a known union (falls back to "unknown").
 * - Safely transforms optional `recommendations` to a non-null array.
 */
const mapItemToImportDetail = (result: ImportDetailsResponse): ImportDetail => {
  let recommendations: ImportRecommendation[] = [];

  if (Array.isArray(result.recommendations)) {
    recommendations = result.recommendations.map((rec: any) => ({
      id: rec.id,
      title: rec.title || "",
      editorialSummary: rec.editorialSummary || "",
      imageUris: rec.imageUris || [],
      wishlistIds: rec.wishlistIds || [],
    }));
  }

  return {
    id: result.id,
    title: result.title || "",
    siteName: result.siteName || "",
    likeCount: result.likeCount,
    viewCount: result.viewCount,
    sourceUri: result.sourceUri || "",
    asset: {
      type: (result.asset?.type as any) || "unknown",
      thumbnailUri: result.asset?.thumbnailUri || "",
      uri: result.asset?.uri || "",
    },
    author: {
      name: result.author?.name || "",
      photoUri: result.author?.photoUri,
      profileUri: result.author?.profileUri,
    },
    recommendations,
  };
};

/**
 * Query hook: fetches and caches a single import's details by id.
 * - Enables only when `id` is truthy.
 * - Consumers receive a fully mapped `ImportDetail` object.
 */
export const useImportDetails = (id: string) => {
  return useQuery<ImportDetail>({
    queryKey: QUERY_KEYS.RECIPE_DETAILS(id),
    queryFn: () => fetchImportDetails(id),
    enabled: !!id,
  });
};

/**
 * Invalidate cached import details. If `id` is provided, only that query is invalidated;
 * otherwise all queries under the "import-details" key are invalidated.
 */
export const useInvalidateImportDetails = () => {
  const queryClient = useQueryClient();

  return (id?: string) => {
    if (id) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECIPE_DETAILS(id),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
      });
    }
  };
};
