import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
// External Dependencies
import { useCallback } from "react";
import { Alert, Text, View } from "react-native";

import { useDeleteRecommendationMutation } from "@/api";
import { useActionToast } from "@/contexts";
import { useImageErrorFilter } from "@/hooks";
import { QUERY_KEYS } from "@/libs/constants";
// Internal Dependencies
import { parseSlug } from "@/libs/utils";

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
  const { mutateAsync: deleteRecommendationAsync, isPending } =
    useDeleteRecommendationMutation();

  // Parse slug to extract ID for API call and cache key
  const { id: recommendationId } = parseSlug(recommendationSlug);

  // Validate thumbnailUri using useImageErrorFilter
  const imageUrls = thumbnailUri ? [thumbnailUri] : [];
  const { validImages } = useImageErrorFilter(imageUrls);
  const validThumbnailUri = validImages.length > 0 ? validImages[0] : null;

  const handleDelete = useCallback(() => {
    if (isPending || !recommendationId) return;

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
            deleteRecommendationAsync(recommendationId)
              .then(async () => {
                // Haptic feedback
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

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
                    queryKey:
                      QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationId),
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.RECIPE_RECOMMENDATIONS_BASE],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.COOKBOOK_RECOMMENDATIONS_BASE],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.RECIPE_DETAILS_BASE],
                  }),
                ]);
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message ||
                    "Failed to delete recommendation. Please try again.",
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
    recommendationId,
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
