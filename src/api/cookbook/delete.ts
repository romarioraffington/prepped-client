// External Dependencies
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import type { ImageGridItem } from "@/libs/types";
// Internal Dependencies
import { reportError } from "@/libs/utils";

/**
 * Delete a cookbook
 * This will also delete all subcookbooks and recommendations within
 */
export const deleteCookbook = async (id: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COOKBOOKS_V1}/${id}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "CookbookDelete",
      action: "Delete Cookbook",
      extra: { cookbookId: id },
    });

    let errorMessage = "Failed to delete cookbook";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

interface CookbookPageResult {
  data: ImageGridItem[];
  meta: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}

interface MutationContext {
  previousCookbooksData: InfiniteData<CookbookPageResult> | undefined;
}

/**
 * React Query mutation hook for deleting cookbooks with optimistic updates
 */
export const useDeleteCookbookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCookbook(id),

    // Optimistically remove item from cache immediately
    onMutate: async (id: string): Promise<MutationContext> => {
      const queryKey = [QUERY_KEYS.COOKBOOKS];

      // Cancel any ongoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Helper to match deleted cookbook queries (handles both "id" and "slug--id" formats)
      const matchesDeletedCookbook = (keyValue: unknown): boolean =>
        typeof keyValue === "string" &&
        (keyValue === id || keyValue.endsWith(`--${id}`));

      // Remove queries for the deleted cookbook to prevent 404s on refetch
      queryClient.removeQueries({
        predicate: (query) => {
          const qKey = query.queryKey;
          return (
            Array.isArray(qKey) &&
            qKey[0] === QUERY_KEYS.COOKBOOK_DETAILS_BASE &&
            qKey.length >= 2 &&
            matchesDeletedCookbook(qKey[1])
          );
        },
      });

      queryClient.removeQueries({
        predicate: (query) => {
          const qKey = query.queryKey;
          return (
            Array.isArray(qKey) &&
            qKey[0] === QUERY_KEYS.COOKBOOK_RECOMMENDATIONS_BASE &&
            qKey.length >= 2 &&
            matchesDeletedCookbook(qKey[1])
          );
        },
      });

      // Snapshot the previous value for rollback
      const previousCookbooksData =
        queryClient.getQueryData<InfiniteData<CookbookPageResult>>(queryKey);

      // Optimistically remove the item from all pages
      if (previousCookbooksData) {
        queryClient.setQueryData<InfiniteData<CookbookPageResult>>(
          queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter((item) => item.id !== id),
              })),
            };
          },
        );
      }

      // Also remove the deleted cookbook from any parent cookbook's details cache
      // This handles the case where a city cookbook is deleted from within a country cookbook
      queryClient.setQueriesData(
        {
          queryKey: [QUERY_KEYS.COOKBOOK_DETAILS_BASE],
        },
        (old: { cookbooks: ImageGridItem[] } | undefined) => {
          if (!old || !old.cookbooks) return old;
          // Filter out the deleted cookbook from the subcookbooks array
          const filteredCookbooks = old.cookbooks.filter(
            (item) => item.id !== id,
          );
          // Only update if something was actually removed
          if (filteredCookbooks.length !== old.cookbooks.length) {
            return {
              ...old,
              cookbooks: filteredCookbooks,
            };
          }
          return old;
        },
      );

      return { previousCookbooksData };
    },

    // On error, rollback to previous state
    onError: (_error, _id, context) => {
      if (context?.previousCookbooksData) {
        queryClient.setQueryData(
          [QUERY_KEYS.COOKBOOKS],
          context.previousCookbooksData,
        );
      }
    },
  });
};
