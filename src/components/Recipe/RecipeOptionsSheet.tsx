// External Dependencies
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useMemo, useCallback } from "react";
import { Alert, Linking, Text } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { reportError, createFullSlug } from "@/libs/utils";
import type { Recipe, RecipeOptionsVariant } from "@/libs/types";
import { useDeleteImportMutation, useRemoveRecipeFromCookbookMutation } from "@/api";
import { ActionBottomSheet, type ActionBottomSheetMenuItem } from "@/components/ActionBottomSheet";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface RecipeOptionsSheetProps {
  recipeData: Recipe;
  variant: RecipeOptionsVariant;
  cookbookId?: string;
  onDeleteSuccess?: () => void;
  onAnimationCompleted?: () => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function RecipeOptionsSheet({
  recipeData,
  variant,
  cookbookId,
  bottomSheetRef,
  onAnimationCompleted,
  onDeleteSuccess,
}: RecipeOptionsSheetProps) {
  const router = useRouter();
  const { showToast } = useActionToast();
  const { mutateAsync: deleteRecipeAsync, isPending: isDeletePending } = useDeleteImportMutation();
  const { mutateAsync: removeFromCookbookAsync, isPending: isRemovePending } = useRemoveRecipeFromCookbookMutation();

  const recipeId = recipeData.id;

  /**
   * Calculate snap points based on variant (different number of menu items)
   */
  const snapPoints = useMemo(() => {
    if (variant === "cookbook") {
      return ["38%"]; // 4 items: View, Creator Profile, Remove from Cookbook, Delete
    }
    if (variant === "detail") {
      return ["42%"]; // 5 items: View, Creator Profile, Add to Cookbook, Report Issue, Delete
    }
    return ["38%"]; // 4 items: View, Creator Profile, Add to Cookbook, Delete
  }, [variant]);

  /**
 * Get the social platform icon based on platformId
 * Platform IDs: WEB = 1, TIKTOK = 2, YOUTUBE = 3, INSTAGRAM = 4, PINTEREST = 5
 */
  function getSocialIcon(platformId?: number | null): IoniconName {
    switch (platformId) {
      case 2: // TIKTOK
        return "logo-tiktok";
      case 3: // YOUTUBE
        return "logo-youtube";
      case 4: // INSTAGRAM
        return "logo-instagram";
      case 5: // PINTEREST
        return "logo-pinterest";
      default: // WEB (1) or unknown
        return "play-outline";
    }
  }

  /**
   * Get the social platform label based on platformId
   */
  function getSocialLabel(platformId?: number | null): string {
    switch (platformId) {
      case 2: // TIKTOK
        return "Watch on TikTok";
      case 3: // YOUTUBE
        return "Watch on YouTube";
      case 4: // INSTAGRAM
        return "Watch on Instagram";
      case 5: // PINTEREST
        return "Watch on Pinterest";
      default: // WEB (1) or unknown
        return "Watch on Web";
    }
  }

  /**
   * Handle Watch Content
   */
  const handleWatchContent = useCallback(async () => {
    const uri = recipeData.contentUri;
    if (!uri) {
      reportError(new Error("No source URI found for recipe"), {
        component: "RecipeOptionsSheet",
        action: "Watch Content",
        extra: { recipeId, contentUri: uri },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(uri);
    }, 100);
  }, [recipeData, bottomSheetRef]);

  /**
   * Handle Creator Profile press
   */
  const handleCreatorProfilePress = useCallback(() => {
    const profileUri = recipeData?.author?.profileUri;
    if (!profileUri) {
      reportError(new Error("No profile URI found for recipe"), {
        component: "RecipeOptionsSheet",
        action: "Open Creator Profile",
        extra: { recipeId },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(profileUri);
    }, 100);
  }, [recipeData, bottomSheetRef]);

  /**
   * Handle Add to Cookbook press
   */
  const handleAddToCookbookPress = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      const recipeSlug = createFullSlug(recipeData.title, recipeId);
      router.push({
        pathname: "/(modal)/manage-cookbooks/index" as any,
        params: {
          recipeSlug,
        },
      });
    }, 100);
  }, [bottomSheetRef, router, recipeId, recipeData.title]);

  /**
   * Handle Remove from Cookbook press
   */
  const handleRemoveFromCookbookPress = useCallback(() => {
    if (isRemovePending || !cookbookId || !recipeId) return;

    const displayName = recipeData.title || "This recipe";

    Alert.alert(
      "Remove from Cookbook?",
      `${displayName} will be removed from this cookbook.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            removeFromCookbookAsync({ cookbookId, recipeId })
              .then(() => {
                // Close bottom sheet
                bottomSheetRef.current?.close();

                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast with recipe image
                showToast({
                  text: (
                    <Text>
                      Removed <Text style={{ fontWeight: 'bold' }}>{displayName}</Text>
                    </Text>
                  ),
                  thumbnailUri: recipeData.coverUri,
                });


              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to remove recipe from cookbook. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    recipeId,
    showToast,
    recipeData,
    cookbookId,
    isRemovePending,
    bottomSheetRef,
    removeFromCookbookAsync,
  ]);

  /**
   * Handle Report Issue press
   */
  const handleReportIssuePress = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      const recipeSlug = createFullSlug(recipeData.title, recipeId);
      router.push({
        pathname: "/feedback",
        params: {
          recipeId,
          returnTo: `/recipes/${recipeSlug}`,
        },
      });
    }, 100);
  }, [bottomSheetRef, router, recipeId, recipeData.title]);

  /**
   * Handle Delete press
   */
  const handleDeletePress = useCallback(() => {
    if (isDeletePending || !recipeId) return;

    const displayName = recipeData.title || "This recipe";

    Alert.alert(
      "Delete Recipe?",
      `"${displayName}" will be permanently deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRecipeAsync(recipeId)
              .then(async () => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast
                showToast({
                  text: `Deleted "${displayName}"`,
                  thumbnailUri: recipeData.coverUri
                });

                // Close bottom sheet
                bottomSheetRef.current?.close();

                // Call optional success callback
                if (onDeleteSuccess) {
                  onDeleteSuccess();
                }
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete recipe. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    recipeId,
    showToast,
    recipeData,
    isDeletePending,
    bottomSheetRef,
    onDeleteSuccess,
    deleteRecipeAsync,
  ]);

  /**
   * Build menu items based on variant
   */
  const author = recipeData.author;
  const platformId = recipeData.platformId;

  const menuItems = useMemo<ActionBottomSheetMenuItem[]>(() => {
    const socialIcon = getSocialIcon(platformId);
    const socialLabel = getSocialLabel(platformId);
    const trimmedName = author?.name?.trim();
    const firstName = trimmedName && trimmedName !== "" ? trimmedName.split(" ")[0] : null;
    const creatorLabel = firstName ? `${firstName}'s Profile` : "Creator Profile";

    const items: ActionBottomSheetMenuItem[] = [
      // Watch on [Social Platform]
      {
        icon: socialIcon,
        label: socialLabel,
        onPress: handleWatchContent,
      },
      // Creator Profile with avatar
      {
        iconUri: recipeData.author.avatarUri,
        label: creatorLabel,
        onPress: handleCreatorProfilePress,
      },
    ];

    // Add variant-specific options
    if (variant === "recipes" || variant === "detail") {
      items.push({
        icon: "book-outline" as const,
        label: "Add to Cookbook",
        onPress: handleAddToCookbookPress,
      });
    }

    if (variant === "cookbook") {
      items.push({
        icon: "remove-circle-outline" as const,
        label: "Remove from Cookbook",
        onPress: handleRemoveFromCookbookPress,
      });
    }

    // Report Issue (only on detail page)
    if (variant === "detail") {
      items.push({
        icon: "flag-outline" as const,
        label: "Report Issue",
        onPress: handleReportIssuePress,
      });
    }

    // Delete (always last, destructive)
    items.push({
      icon: "trash-outline" as const,
      label: "Delete Recipe",
      onPress: handleDeletePress,
      destructive: true,
    });

    return items;
  }, [
    variant,
    platformId,
    author.name,
    author.avatarUri,
    handleWatchContent,
    handleDeletePress,
    handleReportIssuePress,
    handleAddToCookbookPress,
    handleCreatorProfilePress,
    handleRemoveFromCookbookPress,
  ]);

  // Determine header based on variant
  // Always pass headerTitle as a fallback in case the image fails to load
  const headerTitle = recipeData.title;
  const headerImageUri = variant !== "detail" ? recipeData.coverUri : undefined;

  return (
    <ActionBottomSheet
      index={-1}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      menuItems={menuItems}
      headerTitle={headerTitle}
      headerImageUri={headerImageUri}
      onAnimationCompleted={onAnimationCompleted}
    />
  );
}
