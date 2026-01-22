// External Dependencies
import { useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { useActionToast } from "@/contexts";
import { SingleInputForm } from "@/components";
import { useCreateCookbookMutation } from "@/api";

export default function CreateCookbook() {
  const { showToast } = useActionToast();
  const { mutate: createCookbook, isPending } = useCreateCookbookMutation();
  const { recipeSlug } = useLocalSearchParams<{ recipeSlug?: string; }>();

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
        ...(recipeSlug && { recipe_id: recipeSlug }),
      };

      createCookbook(requestBody, {
        onSuccess: async (response) => {
          // Show toast with API response data only if recipeSlug exists
          // Hide CTA button since this is a newly created cookbook (no change option)
          if (recipeSlug) {
            showToast({
              text: `Saved to ${response?.data?.name ?? 'cookbook'}`,
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
    [isPending, recipeSlug, createCookbook, showToast],
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
