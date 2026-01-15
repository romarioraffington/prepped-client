// External Dependencies
import * as Haptics from "expo-haptics";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";
import type { WishlistPageResult } from "@/libs/types";
import type { WishlistDetailPageResult } from "@/api/wishlist/detail";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

export interface UpdateWishlistRequest {
  name: string;
}

export interface UpdateWishlistResponse {
  data: {
    id: string;
    name: string;
  };
}

/**
 * Update a wishlist (e.g., rename)
 * @param slug - The wishlist slug or ID
 * @param data - The data to update (name)
 */
export const updateWishlist = async (
  slug: string,
  data: UpdateWishlistRequest,
): Promise<UpdateWishlistResponse> => {
  // Parse slug to extract ID for API call (API expects ID, not full slug)
  const { id: wishlistId } = parseSlug(slug);

  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.WISHLISTS_V1}/${wishlistId}`;
    const result: UpdateWishlistResponse = await client.put(endpoint, data);

    if (!result || !result.data || !result.data.name) {
      throw new Error("Invalid response: missing data or name");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "WishlistUpdate",
      action: "Update Wishlist",
      extra: { wishlistId, name: data.name },
    });

    let errorMessage = "Failed to update wishlist";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Context type for optimistic update rollback
 */
interface UpdateWishlistMutationContext {
  previousWishlistsData: InfiniteData<WishlistPageResult> | undefined;
  previousWishlistDetailData:
    | InfiniteData<WishlistDetailPageResult>
    | undefined;
  wishlistId: string;
  slug: string;
}

/**
 * React Query mutation hook for updating wishlists with optimistic updates
 */
export const useUpdateWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, name }: { slug: string; name: string }) =>
      updateWishlist(slug, { name }),

    // Optimistically update cache immediately
    onMutate: async ({
      slug,
      name,
    }): Promise<UpdateWishlistMutationContext> => {
      // Extract ID from slug for reliable matching and cache key consistency
      const { id: wishlistId } = parseSlug(slug);

      // Cancel any ongoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.WISHLISTS] });
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.WISHLISTS, wishlistId],
      });

      // Snapshot previous values for rollback
      const previousWishlistsData = queryClient.getQueryData<
        InfiniteData<WishlistPageResult>
      >([QUERY_KEYS.WISHLISTS]);
      const previousWishlistDetailData = queryClient.getQueryData<
        InfiniteData<WishlistDetailPageResult>
      >([QUERY_KEYS.WISHLISTS, wishlistId]);

      // Optimistically update the wishlists list cache - match by ID
      if (previousWishlistsData) {
        queryClient.setQueryData<InfiniteData<WishlistPageResult>>(
          [QUERY_KEYS.WISHLISTS],
          {
            ...previousWishlistsData,
            pages: previousWishlistsData.pages.map((page) => ({
              ...page,
              data: page.data.map((wishlist) =>
                wishlist.id === wishlistId ? { ...wishlist, name } : wishlist,
              ),
            })),
          },
        );
      }

      // Optimistically update the wishlist detail cache - use ID for consistency
      if (previousWishlistDetailData) {
        queryClient.setQueryData<InfiniteData<WishlistDetailPageResult>>(
          [QUERY_KEYS.WISHLISTS, wishlistId],
          {
            ...previousWishlistDetailData,
            pages: previousWishlistDetailData.pages.map((page, index) => {
              // Update metadata.name in the first page only
              if (index === 0) {
                return {
                  ...page,
                  metadata: {
                    ...page.metadata,
                    name,
                  },
                };
              }
              return page;
            }),
          },
        );
      }

      return {
        previousWishlistsData,
        previousWishlistDetailData,
        wishlistId,
        slug,
      };
    },

    onSuccess: async (response, variables, context) => {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const wishlistId = context?.wishlistId ?? parseSlug(variables.slug).id;

      // Update wishlist detail cache with server response - use ID for consistency
      const oldCacheData = queryClient.getQueryData<
        InfiniteData<WishlistDetailPageResult>
      >([QUERY_KEYS.WISHLISTS, wishlistId]);

      if (oldCacheData && response?.data?.name) {
        queryClient.setQueryData<InfiniteData<WishlistDetailPageResult>>(
          [QUERY_KEYS.WISHLISTS, wishlistId],
          {
            ...oldCacheData,
            pages: oldCacheData.pages.map((page, index) => {
              // Update metadata.name in the first page only
              if (index === 0) {
                return {
                  ...page,
                  metadata: {
                    ...page.metadata,
                    name: response.data.name,
                  },
                };
              }
              return page;
            }),
          },
        );
      }

      // Update wishlists list cache with new name (match by ID)
      if (response?.data?.name) {
        queryClient.setQueryData<InfiniteData<WishlistPageResult>>(
          [QUERY_KEYS.WISHLISTS],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((w) =>
                  w.id === wishlistId ? { ...w, name: response.data.name } : w,
                ),
              })),
            };
          },
        );
      }
    },

    // On error, rollback to previous state
    onError: (_error, _variables, context) => {
      if (context?.previousWishlistsData) {
        queryClient.setQueryData(
          [QUERY_KEYS.WISHLISTS],
          context.previousWishlistsData,
        );
      }
      if (context?.previousWishlistDetailData && context?.wishlistId) {
        queryClient.setQueryData(
          [QUERY_KEYS.WISHLISTS, context.wishlistId],
          context.previousWishlistDetailData,
        );
      }
    },
  });
};
