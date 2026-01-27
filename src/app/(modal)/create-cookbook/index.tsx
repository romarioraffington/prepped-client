// External Dependencies
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Alert, DeviceEventEmitter } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { SingleInputForm } from "@/components";
import { useCreateCookbookMutation } from "@/api";
import { parseSlug, reportError } from "@/libs/utils";

// Event name for cookbook creation - used to notify AddToCookbookSheet
export const COOKBOOK_CREATED_EVENT = "cookbookCreated";

// Return context identifier for AddToCookbookSheet
export const RETURN_TO_ADD_TO_COOKBOOK_SHEET = "add-to-cookbook-sheet";

export default function CreateCookbook() {
  const { showToast } = useActionToast();
  const { recipeSlug, returnTo } = useLocalSearchParams<{
    recipeSlug?: string;
    returnTo?: string;
  }>();
  const { mutate: createCookbook, isPending } = useCreateCookbookMutation();

  // Parse slug to extract recipe ID if recipeSlug exists
  const recipeId = recipeSlug ? parseSlug(recipeSlug).id : undefined;

  // Common function to handle going back - reopens
  // manage-cookbooks modal if we came from there
  const handleGoBack = useCallback(() => {
    if (recipeSlug) {
      router.back();
      setTimeout(() => {
        router.push({
          pathname: "/(modal)/manage-cookbooks",
          params: {
            recipeSlug,
          },
        });
      }, 100);
    } else {
      router.back();
    }
  }, [recipeSlug]);

  const handleSave = useCallback(
    (name: string) => {
      if (isPending) return;

      // Build request body conditionally
      const requestBody = {
        name,
        ...(recipeId && { recipe_id: recipeId }),
      };

      createCookbook(requestBody, {
        onSuccess: async (response) => {
          const newCookbookId = response?.data?.id;
          const cookbookName = response?.data?.name ?? "cookbook";

          // Show toast with API response data only if recipeId exists
          if (recipeId) {
            showToast({
              text: `Saved to ${cookbookName}`,
              thumbnailUri: response.data.imageUris?.[0] || null,
            });
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // If we came from AddToCookbookSheet, emit event with new cookbook ID
          // so the parent can reopen the sheet with the new cookbook pre-selected
          if (returnTo === RETURN_TO_ADD_TO_COOKBOOK_SHEET && newCookbookId) {
            DeviceEventEmitter.emit(COOKBOOK_CREATED_EVENT, {
              cookbookId: newCookbookId,
              cookbookName,
            });
          }

          // Navigate back
          router.back();
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reportError(error, {
            component: "CreateCookbook",
            action: "Create Cookbook",
            extra: { name },
          });
          Alert.alert("Oops!", "Failed to create cookbook. Please try again.", [
            { text: "OK" },
          ]);
        },
      });
    },
    [isPending, recipeId, returnTo, createCookbook, showToast],
  );

  const handleCancel = useCallback(() => {
    handleGoBack();
  }, [handleGoBack]);

  return (
    <SingleInputForm
      title="Create cookbook"
      saveButtonText="Create"
      onSave={handleSave}
      isLoading={isPending}
      onBack={handleGoBack}
      onCancel={handleCancel}
    />
  );
}
