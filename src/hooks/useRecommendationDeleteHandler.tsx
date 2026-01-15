// External Dependencies
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { Text, View, Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { QUERY_KEYS } from "@/libs/constants";
import { useImageErrorFilter } from "@/hooks";
import { useDeleteRecommendationMutation } from "@/api";

interface UseRecommendationDeleteHandlerParams {
  thumbnailUri?: string;
  recommendationSlug: string;
  recommendationName: string;
  onSuccess?: () => void;
}

interface UseRecommendationDeleteHandlerReturn {
  handleDelete: () => void;
  isPending: boolean;
}

export const useRecommendationDeleteHandler = ({
  thumbnailUri,
  recommendationSlug,
  recommendationName,
  onSuccess,
}: UseRecommendationDeleteHandlerParams): UseRecommendationDeleteHandlerReturn => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { mutateAsync: deleteRecommendationAsync, isPending } = useDeleteRecommendationMutation();

  // Validate thumbnailUri using useImageErrorFilter
  const imageUrls = thumbnailUri ? [thumbnailUri] : [];
  const { validImages } = useImageErrorFilter(imageUrls);
  const validThumbnailUri = validImages.length > 0 ? validImages[0] : null;

  const handleDelete = useCallback(() => {
    if (isPending) return;

    // Show confirmation dialog
    Alert.alert(
      "Delete Recommendation?",
      `"${recommendationName}" will be deleted from everywhere it's listed except for wishlists.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRecommendationAsync(recommendationSlug)
              .then(async () => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast with green checkmark
                showToast({
                  text: `Deleted "${recommendationName}"`,
                  thumbnailUri: validThumbnailUri,
                });

                // Navigate back BEFORE invalidating queries to avoid refetch issues
                // Use custom callback if provided, otherwise use default navigation behavior
                if (onSuccess) {
                  onSuccess();
                }

                // Invalidate all related queries AFTER navigation
                // - React Query will automatically refetch active ones
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug),
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.IMPORT_RECOMMENDATIONS_BASE],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.COLLECTION_RECOMMENDATIONS_BASE],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.IMPORT_DETAILS_BASE],
                  }),
                ]);
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete recommendation. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    isPending,
    recommendationSlug,
    recommendationName,
    validThumbnailUri,
    queryClient,
    navigation,
    showToast,
    onSuccess,
    deleteRecommendationAsync,
  ]);

  return {
    handleDelete,
    isPending,
  };
};

