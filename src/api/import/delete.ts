// External Dependencies
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { Import } from "@/libs/types";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

/**
 * Delete an import (extraction)
 */
export const deleteImport = async (id: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.RECIPES_LIST_V1}/${id}`;
    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "ImportDelete",
      action: "Delete Import",
      extra: { id },
    });

    let errorMessage = "Failed to delete import";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

interface ImportPageResult {
  data: Import[];
  meta: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}

interface MutationContext {
  previousData: InfiniteData<ImportPageResult> | undefined;
}

/**
 * React Query mutation hook for deleting imports with optimistic updates
 */
export const useDeleteImportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteImport(id),

    // Optimistically remove item from cache immediately
    onMutate: async (id: string): Promise<MutationContext> => {
      const queryKey = [QUERY_KEYS.RECIPES];

      // Cancel any ongoing refetches to prevent them from overwriting our optimistic update
      // This prevents the shimmer from appearing during the update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousData =
        queryClient.getQueryData<InfiniteData<ImportPageResult>>(queryKey);

      // Optimistically remove the item from all pages
      // Using setQueryData with updater function to ensure smooth update without triggering refetch
      if (previousData) {
        queryClient.setQueryData<InfiniteData<ImportPageResult>>(
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

      return { previousData };
    },

    // On error, rollback to previous state
    onError: (_error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEYS.RECIPES], context.previousData);
      }
    },
    onSuccess: () => {
      // Refetch active queries that may be affected by import deletion
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.COOKBOOKS],
        exact: false,
        type: "active",
      });
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.COOKBOOK_DETAILS_BASE],
        exact: false,
        type: "active",
      });
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.RECIPES],
        exact: false,
        type: "active",
      });
    },
  });
};
