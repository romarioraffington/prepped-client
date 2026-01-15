// External Dependencies
import { useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { useActionToast } from "@/contexts";
import { SingleInputForm } from "@/components";
import { useCreateWishlistMutation, cacheWishlistId } from "@/api";

export default function CreateWishlist() {
  const { showToast } = useActionToast();
  const { mutate: createWishlist, isPending } = useCreateWishlistMutation();
  const { recommendationSlug } = useLocalSearchParams<{ recommendationSlug?: string; }>();

  // Common function to handle going back - reopens
  // save-to-wishlist modal if we came from there
  const handleGoBack = useCallback(() => {
    if (recommendationSlug) {
      router.back();
      setTimeout(() => {
        router.push({
          pathname: "/(modal)/manage-wishlists",
          params: {
            recommendationSlug,
          },
        });
      }, 100);
    } else {
      router.back();
    }
  }, [recommendationSlug]);

  const handleSave = useCallback(
    (name: string) => {
      if (isPending) return;

      // Build request body conditionally
      const requestBody = {
        name,
        ...(recommendationSlug && { recommendation_id: recommendationSlug }),
      };

      createWishlist(requestBody, {
        onSuccess: async (response) => {
          // Cache the newly created wishlist ID and name if created with a recommendation
          if (recommendationSlug && response.data) {
            await cacheWishlistId(response.data.id, response.data.name);
          }

          // Show toast with API response data only if recommendationSlug exists
          // Hide CTA button since this is a newly created wishlist (no change option)
          if (recommendationSlug) {
            showToast({
              text: `Saved to ${response?.data?.name ?? 'wishlist'}`,
              thumbnailUri: response.data.coverImageUri || null,
            });
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Navigate back
          router.back();
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reportError(error, {
            component: "CreateWishlist",
            action: "Create Wishlist",
            extra: { name },
          });
          Alert.alert("Oops!", "Failed to create wishlist. Please try again.", [
            { text: "OK" },
          ]);
        },
      });
    },
    [isPending, recommendationSlug, createWishlist, showToast],
  );

  const handleCancel = useCallback(() => {
    handleGoBack();
  }, [handleGoBack]);

  return (
    <SingleInputForm
      title="Create wishlist"
      saveButtonText="Create"
      onSave={handleSave}
      isLoading={isPending}
      onBack={handleGoBack}
      onCancel={handleCancel}
    />
  );
}
