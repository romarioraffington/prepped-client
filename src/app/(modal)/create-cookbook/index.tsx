// External Dependencies
import { useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { SingleInputForm } from "@/components";
import { useCreateCookbookMutation } from "@/api";
import { parseSlug, reportError } from "@/libs/utils";

type RouteParams = {
  recipeSlug?: string;
  selectedRecipeIds?: string;
  currentCookbookId?: string;
  selectedCookbookIds?: string;
};

export default function CreateCookbook() {
  const { showToast } = useActionToast();
  const { mutate: createCookbook, isPending } = useCreateCookbookMutation();

  const {
    recipeSlug,
    currentCookbookId,
    selectedRecipeIds,
    selectedCookbookIds,
  } = useLocalSearchParams<RouteParams>();

  // Parse slug to extract recipe ID if recipeSlug exists.
  // When this is provided, the cookbook will be created with the recipe.
  const recipeId = recipeSlug ? parseSlug(recipeSlug).id : undefined;

  const handleGoBack = () => {
    // If we came from add-to-cookbook, navigate back to it
    // selectedRecipeIds is always present when coming from add-to-cookbook
    if (selectedRecipeIds) {
      router.replace({
        pathname: "/(modal)/add-to-cookbook",
        params: {
          selectedRecipeIds,
          ...(currentCookbookId && { currentCookbookId }),
          selectedCookbookIds: selectedCookbookIds || "",
        },
      });
    } else {
      router.back();
    }
  };

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

          // If we came from add-to-cookbook route, navigate back with newCookbookId
          // so the add-to-cookbook route can pre-select the new cookbook
          // selectedRecipeIds is always present when coming from add-to-cookbook
          if (newCookbookId && selectedRecipeIds) {
            router.replace({
              pathname: "/(modal)/add-to-cookbook",
              params: {
                newCookbookId,
                selectedRecipeIds,
                ...(currentCookbookId && { currentCookbookId }),
                selectedCookbookIds: selectedCookbookIds || "",
              },
            });
          } else {
            router.back();
          }
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
    [
      isPending,
      recipeId,
      showToast,
      recipeSlug,
      createCookbook,
      selectedRecipeIds,
      currentCookbookId,
      selectedCookbookIds,
    ],
  );

  return (
    <SingleInputForm
      title="Create cookbook"
      saveButtonText="Create"
      onSave={handleSave}
      isLoading={isPending}
      onBack={handleGoBack}
      onCancel={handleGoBack}
    />
  );
}
