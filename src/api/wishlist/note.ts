// External Dependencies
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import type { WishlistNote } from "@/libs/types/Wishlists/Wishlist";
import { API_ENDPOINTS, getApiClient, QUERY_KEYS } from "@/libs/constants";

export interface CreateNoteRequest {
  note: string;
}

export interface UpdateNoteRequest {
  note: string;
}

export interface CreateNoteResponse {
  data: WishlistNote;
}

export interface UpdateNoteResponse {
  data: WishlistNote;
}

export interface GetNoteResponse {
  data: {
    text: string;
  };
}

/**
 * Transform API note response to WishlistNote format
 */
const transformNote = (note: {
  id: string;
  userId: string;
  name: string;
  profilePictureUri?: string | null;
  text?: string | null;
  vote: "up" | "down" | null;
  timestamp: number;
}): WishlistNote => ({
  id: note.id,
  userId: note.userId,
  name: note.name,
  vote: note.vote,
  timestamp: note.timestamp,
  text: note.text || undefined,
  profilePictureUri: note.profilePictureUri || undefined,
});

/**
 * Create a note for a recommendation in a wishlist
 */
export const createNote = async (
  wishlistSlug: string,
  recommendationSlug: string,
  request: CreateNoteRequest,
): Promise<CreateNoteResponse> => {
  try {
    const client = getApiClient();

    // The backend accepts slugs or IDs for the wishlist and recommendation.
    const endpoint = API_ENDPOINTS.WISHLIST_NOTE_V1.replace(
      "{wishlistId}",
      wishlistSlug,
    ).replace("{recommendationId}", recommendationSlug);

    const result: { data: WishlistNote } = await client.post(endpoint, request);
    if (!result?.data) {
      throw new Error("No data returned from note creation");
    }

    return {
      data: transformNote(result.data),
    };
  } catch (error) {
    reportError(error, {
      component: "NoteCreate",
      action: "Create Note",
      extra: { wishlistSlug, recommendationSlug, note: request.note },
    });

    let errorMessage = "Failed to create note";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Get a single note by ID
 */
export const getNote = async (noteId: string): Promise<GetNoteResponse> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.NOTES_V1}/${noteId}`;

    const result: { data: { text: string } } = await client.get(endpoint);

    if (!result?.data) {
      throw new Error("No data returned from note fetch");
    }

    return {
      data: result.data,
    };
  } catch (error) {
    reportError(error, {
      component: "NoteGet",
      action: "Get Note",
      extra: { noteId },
    });

    let errorMessage = "Failed to fetch note";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Update a note for a recommendation in a wishlist
 */
export const updateNote = async (
  noteId: string,
  request: UpdateNoteRequest,
): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.NOTES_V1}/${noteId}`;

    await client.put(endpoint, request);
  } catch (error) {
    reportError(error, {
      component: "NoteUpdate",
      action: "Update Note",
      extra: { noteId, note: request.note },
    });

    let errorMessage = "Failed to update note";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Delete a note for a recommendation in a wishlist
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const client = getApiClient();
    const endpoint = `${API_ENDPOINTS.NOTES_V1}/${noteId}`;

    await client.delete(endpoint);
  } catch (error) {
    reportError(error, {
      component: "NoteDelete",
      action: "Delete Note",
      extra: { noteId },
    });

    let errorMessage = "Failed to delete note";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for creating notes
 */
export const useCreateNoteMutation = () => {
  return useMutation({
    mutationFn: ({
      noteText,
      wishlistSlug,
      recommendationSlug,
    }: {
      noteText: string;
      wishlistSlug: string;
      recommendationSlug: string;
    }) => {
      return createNote(wishlistSlug, recommendationSlug, { note: noteText });
    },
    onError: (error) => {
      reportError(error, {
        component: "NoteCreate",
        action: "Create Note Mutation",
      });
    },
  });
};

/**
 * React Query hook for fetching a single note
 */
export const useNoteDetails = (noteId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.NOTES_DETAIL(noteId),
    queryFn: () => getNote(noteId),
    enabled: enabled && !!noteId,
  });
};

/**
 * React Query mutation hook for updating notes
 */
export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      noteText,
    }: {
      noteId: string;
      noteText: string;
    }) => {
      return updateNote(noteId, { note: noteText });
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTES_DETAIL(variables.noteId),
      });

      // Note:Wishlist queries are always refetched when navigated to.
    },
    onError: (error) => {
      reportError(error, {
        component: "NoteUpdate",
        action: "Update Note Mutation",
      });
    },
  });
};

/**
 * React Query mutation hook for deleting notes
 */
export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
    }: {
      noteId: string;
    }) => {
      return deleteNote(noteId);
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTES_DETAIL(variables.noteId),
      });

      // Note:Wishlist queries are always refetched when navigated to.
    },
    onError: (error) => {
      reportError(error, {
        component: "NoteDelete",
        action: "Delete Note Mutation",
      });
    },
  });
};
