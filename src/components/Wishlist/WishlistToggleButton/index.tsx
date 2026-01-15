// External Dependencies
import type React from "react";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { Colors } from "@/libs/constants";
import { useActionToast } from "@/contexts";
import { useImageErrorFilter } from "@/hooks";

import {
  useSaveRecommendationToWishlistMutation,
  useDeleteRecommendationFromWishlistMutation,
} from "@/api/wishlist";

export interface WishlistToggleButtonProps {
  size?: number;
  isSaved: boolean;
  wishlistId: string;
  wishlistName?: string;
  thumbnailUri?: string;
  recommendationSlug: string;
  // Called when action starts
  onActionStart?: () => void;
  // Called when undo is pressed
  onUndo?: () => void;
}

export const WishlistToggleButton: React.FC<WishlistToggleButtonProps> = ({
  size = 18,
  isSaved,
  wishlistId,
  wishlistName,
  thumbnailUri,
  recommendationSlug,
  onActionStart,
  onUndo,
}) => {
  const { showToast } = useActionToast();

  // Validate thumbnailUri using useImageErrorFilter
  const imageUrls = thumbnailUri ? [thumbnailUri] : [];
  const { validImages } = useImageErrorFilter(imageUrls);
  const validThumbnailUri = validImages.length > 0 ? validImages[0] : null;

  const {
    isPending: isSaving,
    mutateAsync: saveToWishlistAsync,
  } = useSaveRecommendationToWishlistMutation();

  const {
    isPending: isDeleting,
    mutateAsync: deleteFromWishlistAsync,
  } = useDeleteRecommendationFromWishlistMutation();

  const isPending = isSaving || isDeleting;
  const wishlistNameText = wishlistName ?? 'wishlist';

  const onPress = useCallback(async () => {
    if (isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Notify parent that action is starting (for pending state tracking)
      onActionStart?.();

      if (isSaved) {
        // Removal with undo
        const confirmDelete = () => {
          deleteFromWishlistAsync({
            wishlistId,
            recommendationSlug,
          }).catch((error) => {
            reportError(error, {
              component: "WishlistToggleButton",
              action: "Delete Recommendation",
              extra: { wishlistId, recommendationSlug },
            });
          });
        };

        showToast({
          onDismiss: confirmDelete,
          thumbnailUri: validThumbnailUri,
          text: `Removing from ${wishlistNameText}`,
          cta: onUndo ? { text: "Undo", onPress: onUndo } : undefined,
        });
      } else {
        // Addition with undo
        const confirmAdd = () => {
          saveToWishlistAsync({
            wishlistId,
            recommendationSlug,
          }).catch((error) => {
            reportError(error, {
              component: "WishlistToggleButton",
              action: "Save Recommendation",
              extra: { wishlistId, recommendationSlug },
            });
          });
        };

        showToast({
          onDismiss: confirmAdd,
          thumbnailUri: validThumbnailUri,
          text: `Adding to ${wishlistNameText}`,
          cta: onUndo ? { text: "Undo", onPress: onUndo } : undefined,
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      reportError(error, {
        component: "WishlistToggleButton",
        action: "Toggle Wishlist",
        extra: { wishlistId, recommendationSlug, isSaved },
      });
    }
  }, [
    isSaved,
    isPending,
    wishlistId,
    wishlistName,
    validThumbnailUri,
    recommendationSlug,
    onUndo,
    showToast,
    onActionStart,
    saveToWishlistAsync,
    deleteFromWishlistAsync,
  ]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isPending}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome
        size={size}
        color={Colors.primaryPurple}
        name={isSaved ? "heart" : "heart-o"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
