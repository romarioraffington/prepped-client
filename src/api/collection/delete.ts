// External Dependencies
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { ImageGridItem } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

/**
 * Delete a collection
 * This will also delete all subcollections and recommendations within
 */
export const deleteCollection = async (id: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.COLLECTIONS_V1}/${id}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "CollectionDelete",
      action: "Delete Collection",
      extra: { collectionId: id },
    });

    let errorMessage = "Failed to delete collection";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

interface CollectionPageResult {
  data: ImageGridItem[];
  meta: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}

interface MutationContext {
  previousCollectionsData: InfiniteData<CollectionPageResult> | undefined;
}

/**
 * React Query mutation hook for deleting collections with optimistic updates
 */
export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),

    // Optimistically remove item from cache immediately
    onMutate: async (id: string): Promise<MutationContext> => {
      const queryKey = [QUERY_KEYS.COLLECTIONS];

      // Cancel any ongoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Helper to match deleted collection queries (handles both "id" and "slug--id" formats)
      const matchesDeletedCollection = (keyValue: unknown): boolean =>
        typeof keyValue === "string" &&
        (keyValue === id || keyValue.endsWith(`--${id}`));

      // Remove queries for the deleted collection to prevent 404s on refetch
      queryClient.removeQueries({
        predicate: (query) => {
          const qKey = query.queryKey;
          return (
            Array.isArray(qKey) &&
            qKey[0] === QUERY_KEYS.COLLECTION_DETAILS_BASE &&
            qKey.length >= 2 &&
            matchesDeletedCollection(qKey[1])
          );
        },
      });

      queryClient.removeQueries({
        predicate: (query) => {
          const qKey = query.queryKey;
          return (
            Array.isArray(qKey) &&
            qKey[0] === QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE &&
            qKey.length >= 2 &&
            matchesDeletedCollection(qKey[1])
          );
        },
      });

      // Snapshot the previous value for rollback
      const previousCollectionsData =
        queryClient.getQueryData<InfiniteData<CollectionPageResult>>(queryKey);

      // Optimistically remove the item from all pages
      if (previousCollectionsData) {
        queryClient.setQueryData<InfiniteData<CollectionPageResult>>(
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

      // Also remove the deleted collection from any parent collection's details cache
      // This handles the case where a city collection is deleted from within a country collection
      queryClient.setQueriesData(
        {
          queryKey: [QUERY_KEYS.COLLECTION_DETAILS_BASE],
        },
        (old: { collections: ImageGridItem[] } | undefined) => {
          if (!old || !old.collections) return old;
          // Filter out the deleted collection from the subcollections array
          const filteredCollections = old.collections.filter(
            (item) => item.id !== id,
          );
          // Only update if something was actually removed
          if (filteredCollections.length !== old.collections.length) {
            return {
              ...old,
              collections: filteredCollections,
            };
          }
          return old;
        },
      );

      return { previousCollectionsData };
    },

    // On error, rollback to previous state
    onError: (_error, _id, context) => {
      if (context?.previousCollectionsData) {
        queryClient.setQueryData(
          [QUERY_KEYS.COLLECTIONS],
          context.previousCollectionsData,
        );
      }
    },
  });
};
