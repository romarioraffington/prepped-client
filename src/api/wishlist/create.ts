// External Dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { invalidateAllWishlistQueries } from "./cache";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants";

import type {
  WishlistMember,
  WishlistCardData,
  CreateWishlistRequest,
  CreateWishlistResponse,
  CreateWishlistResponseData,
} from "@/libs/types";

/**
 * Transform API response to WishlistCardData format
 */
export const transformToWishlistCardData = (
  response: CreateWishlistResponseData,
): WishlistCardData => {
  const members: WishlistMember[] = response.membersPreview.map((member) => ({
    id: member.userId,
    profilePictureUri: member.profilePictureUri || "",
  }));

  return {
    id: response.id,
    name: response.name,
    coverImageUri: response.coverImageUri,
    savedCount: response.recommendationsCount,
    members,
  };
};

/**
 * Create a new wishlist
 */
export const createWishlist = async (
  request: CreateWishlistRequest,
): Promise<CreateWishlistResponse> => {
  try {
    const client = getApiClient();
    const result: CreateWishlistResponse = await client.post(
      API_ENDPOINTS.WISHLISTS_V1,
      request,
    );

    if (!result?.data) {
      throw new Error("No data returned from wishlist creation");
    }

    return result;
  } catch (error) {
    reportError(error, {
      component: "WishlistCreate",
      action: "Create Wishlist",
      extra: { name: request.name },
    });

    let errorMessage = "Failed to create wishlist";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for creating wishlists
 */
export const useCreateWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateWishlistRequest) => createWishlist(request),
    onSuccess: async (response, variables) => {
      if (!response?.data) return;

      // Note: We pass the slug to variables.recommendation_id as
      // the backend can accept a slug or id. The slug helps us
      // to easily identify the recommendation is logged and most
      // maches rely on the slug to identify the recommendation.
      const recommendationSlug = variables.recommendation_id;

      // If a recommendation was saved to the wishlist,
      // invalidate and refetch all recommendation-related queries
      if (recommendationSlug) {
        await invalidateAllWishlistQueries({
          queryClient,
          recommendationSlug,
        });
      }
    },
    onError: (error) => {
      reportError(error, {
        component: "WishlistCreate",
        action: "Create Wishlist Mutation",
      });
    },
  });
};
