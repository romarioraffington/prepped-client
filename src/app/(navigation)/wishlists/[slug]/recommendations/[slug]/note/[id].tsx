import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
// External Dependencies
import { Alert } from "react-native";

// Internal Dependencies
import { NoteForm } from "@/components/Notes";
import { reportError } from "@/libs/utils/errorReporting";

import {
  useDeleteNoteMutation,
  useNoteDetails,
  useUpdateNoteMutation,
} from "@/api/wishlist/note";

type EditNoteParams = {
  id: string;
  noteText?: string;
};

export default function EditNote() {
  const { id, noteText } = useLocalSearchParams<EditNoteParams>();

  const { mutate: updateNote, isPending: isUpdating } = useUpdateNoteMutation();

  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNoteMutation();

  // Use query param first, then fetch if not available
  const shouldFetchNote = !noteText && !!id;
  const { data: noteData, isLoading: isLoadingNote } = useNoteDetails(
    id,
    shouldFetchNote,
  );

  // Determine the default value: query param first, then fetched note, then empty
  const defaultValue = noteText ?? noteData?.data?.text ?? "";

  // Show loading state while updating, deleting, or fetching note
  const isLoading =
    isUpdating || isDeleting || (shouldFetchNote && isLoadingNote);

  const handleSave = async (note: string) => {
    if (!id || isLoading) return;

    return new Promise<void>((resolve, reject) => {
      updateNote(
        {
          noteId: id,
          noteText: note,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
            resolve();
          },
          onError: (error) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            reportError(error, {
              component: "EditNote",
              action: "Update Note",
              extra: { noteId: id },
            });
            Alert.alert("Oops!", "Failed to update note. Please try again.", [
              { text: "OK" },
            ]);
            reject(error);
          },
        },
      );
    });
  };

  const handleDelete = async () => {
    if (!id || isLoading) return;

    return new Promise<void>((resolve, reject) => {
      Alert.alert("Delete this note?", "You can add a new note later.", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => reject(new Error("Cancelled")),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteNote(
              {
                noteId: id,
              },
              {
                onSuccess: () => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  router.back();
                  resolve();
                },
                onError: (error) => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error,
                  );
                  reportError(error, {
                    component: "EditNote",
                    action: "Delete Note",
                    extra: { noteId: id },
                  });
                  Alert.alert(
                    "Oops!",
                    "Failed to delete note. Please try again.",
                    [{ text: "OK" }],
                  );
                  reject(error);
                },
              },
            );
          },
        },
      ]);
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <NoteForm
      isEditing={true}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={handleCancel}
      isLoading={isLoading}
      defaultValue={defaultValue}
    />
  );
}
