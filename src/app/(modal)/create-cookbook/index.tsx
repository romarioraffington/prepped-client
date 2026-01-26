import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
// External Dependencies
import { useCallback } from "react";
import { Alert } from "react-native";

import { useCreateCookbookMutation } from "@/api";
import { SingleInputForm } from "@/components";
import { useActionToast } from "@/contexts";

// Internal Dependencies
import { parseSlug, reportError } from "@/libs/utils";

export default function CreateCookbook() {
  const { showToast } = useActionToast();
  const { recipeSlug } = useLocalSearchParams<{ recipeSlug?: string }>();
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
          // Show toast with API response data only if recipeId exists
          // Hide CTA button since this is a newly created cookbook (no change option)
          if (recipeId) {
            showToast({
              text: `Saved to ${response?.data?.name ?? "cookbook"}`,
              thumbnailUri: response.data.imageUris?.[0] || null,
            });
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
    [isPending, recipeId, createCookbook, showToast],
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
