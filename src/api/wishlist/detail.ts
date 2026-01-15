// External Dependencies
import { useInfiniteQuery } from "@tanstack/react-query";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";
import type { PaginationLinks, PaginationMeta } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

import type {
  Vote,
  WishlistNote,
  WishlistMember,
  WishlistRecommendation,
} from "@/libs/types/Wishlists/Wishlist";

/**
 * Wishlist metadata (id, name, members)
 */
export interface WishlistMetadata {
  id: string;
  name: string;
  members: WishlistMember[];
}

/**
 * API response interface for wishlist detail with pagination
 */
interface WishlistDetailApiResponse {
  data: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      profilePictureUri: string | null;
    }>;
    recommendations: Array<{
      id: string;
      name: string;
      description: string | null;
      imageUris: string[];
      rating: number;
      wishlistIds?: string[];
      votes: {
        totalUpVotes: number;
        totalDownVotes: number;
        userVote?: Vote;
      };
      notes: Array<{
        id: string;
        userId: string;
        name: string;
        profilePictureUri?: string | null;
        text?: string | null;
        vote: Vote;
        timestamp: number;
      }>;
    }>;
    links?: PaginationLinks;
    meta?: PaginationMeta;
  };
}

/**
 * Page result for infinite query
 */
export interface WishlistDetailPageResult {
  metadata: WishlistMetadata;
  recommendations: WishlistRecommendation[];
  meta?: PaginationMeta;
}

/**
 * Transform API response members to WishlistMember format
 */
const transformMembers = (
  members: WishlistDetailApiResponse["data"]["members"],
): WishlistMember[] => {
  return members
    .filter((member) => member.id)
    .map((member) => ({
      id: member.id,
      name: member.name,
      profilePictureUri: member.profilePictureUri || "",
    }));
};

/**
 * Transform API response recommendation to WishlistRecommendation format
 */
const transformRecommendation = (
  rec: WishlistDetailApiResponse["data"]["recommendations"][0],
): WishlistRecommendation => ({
  id: rec.id,
  name: rec.name,
  rating: rec.rating,
  imageUris: rec.imageUris,
  description: rec.description ?? "",
  wishlistIds: rec.wishlistIds ?? [],
  votes: {
    totalUpVotes: rec.votes.totalUpVotes,
    totalDownVotes: rec.votes.totalDownVotes,
    userVote: rec.votes.userVote,
  },
  notes: rec.notes.map(
    (note): WishlistNote => ({
      id: note.id,
      name: note.name,
      vote: note.vote,
      userId: note.userId,
      timestamp: note.timestamp,
      text: note.text || undefined,
      profilePictureUri: note.profilePictureUri || undefined,
    }),
  ),
});

/**
 * Fetch wishlist details by ID from the backend API with cursor-based pagination
 */
const fetchWishlistDetails = async (
  wishlistId: string,
  cursor: string | undefined,
): Promise<WishlistDetailPageResult> => {
  try {
    if (!wishlistId) {
      throw new Error("Wishlist ID is required");
    }

    const client = getApiClient();
    const params = new URLSearchParams();
    if (cursor) {
      params.append("cursor", cursor);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}?${queryString}`
      : `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}`;

    const result: WishlistDetailApiResponse = await client.get(url);

    if (!result?.data) {
      throw new Error("Invalid response format: expected data object");
    }

    const { data } = result;

    return {
      metadata: {
        id: data?.id,
        name: data?.name,
        members: transformMembers(data?.members),
      },
      recommendations: data?.recommendations?.map(transformRecommendation),
      meta: data?.meta,
    };
  } catch (error) {
    reportError(error, {
      component: "WishlistDetail",
      action: "Fetch Wishlist Details",
      extra: { wishlistId },
    });

    let errorMessage = "Failed to fetch wishlist details";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query hook for fetching wishlist details with cursor-based pagination
 * @param slug - The wishlist slug (e.g., "my-wishlist--123") or ID
 * @param options - Optional query options
 * @returns Infinite query result with wishlist details
 */
export const useWishlistDetails = (
  slug: string,
  options?: { enabled?: boolean },
) => {
  // Parse slug to extract ID for API call and cache key
  // (API expects ID, and we use ID in cache key for consistency)
  const { id: wishlistId } = parseSlug(slug);

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.WISHLISTS, wishlistId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchWishlistDetails(wishlistId, pageParam),
    getNextPageParam: (lastPage) => lastPage.meta?.next_cursor ?? undefined,
    enabled: options?.enabled !== false && !!wishlistId,
    staleTime: 0, // Always consider data stale - others can add items at any time
    gcTime: 0, // Immediately remove from cache when inactive - memory optimization
    refetchOnMount: true, // Refetch when component mounts if data is stale
  });
};
