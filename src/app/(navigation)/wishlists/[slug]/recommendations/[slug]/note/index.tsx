import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
// External Dependencies
import { Alert } from "react-native";

import { useCreateNoteMutation } from "@/api/wishlist/note";
// Internal Dependencies
import { NoteForm } from "@/components/Notes";
import { reportError } from "@/libs/utils/errorReporting";

type CreateNoteParams = {
  wishlistSlug: string;
  recommendationSlug: string;
};

export default function CreateNote() {
  const { mutate: createNote, isPending } = useCreateNoteMutation();
  const { wishlistSlug, recommendationSlug } =
    useLocalSearchParams<CreateNoteParams>();

  const handleSave = async (noteText: string) => {
    console.log("handleSave", noteText);
    console.log("wishlistSlug", wishlistSlug);
    console.log("recommendationSlug", recommendationSlug);
    console.log("isPending", isPending);
    if (!wishlistSlug || !recommendationSlug || isPending) return;

    return new Promise<void>((resolve, reject) => {
      createNote(
        {
          noteText,
          wishlistSlug,
          recommendationSlug,
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
              component: "CreateNote",
              action: "Create Note",
              extra: { wishlistSlug, recommendationSlug },
            });
            Alert.alert("Oops!", "Failed to create note. Please try again.", [
              { text: "OK" },
            ]);
            reject(error);
          },
        },
      );
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <NoteForm
      isEditing={false}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={isPending}
    />
  );
}
