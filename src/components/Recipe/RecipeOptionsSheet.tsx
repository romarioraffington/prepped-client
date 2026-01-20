// External Dependencies
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useMemo, useCallback } from "react";
import { Alert, Linking } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { reportError, createFullSlug } from "@/libs/utils";
import { useDeleteImportMutation } from "@/api";
import type { RecipeOptionsData, RecipeOptionsVariant } from "@/libs/types";
import { ActionBottomSheet, type ActionBottomSheetMenuItem } from "@/components/ActionBottomSheet";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface RecipeOptionsSheetProps {
  recipeData: RecipeOptionsData;
  variant: RecipeOptionsVariant;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onAnimationCompleted?: () => void;
  onDeleteSuccess?: () => void;
}

/**
 * Get the social platform icon based on the site name
 */
function getSocialIcon(siteName?: string | null): IoniconName {
  const lower = siteName?.toLowerCase() ?? "";
  if (lower.includes("tiktok")) return "logo-tiktok";
  if (lower.includes("instagram")) return "logo-instagram";
  if (lower.includes("youtube")) return "logo-youtube";
  return "play-outline";
}

/**
 * Get the social platform label based on the site name
 */
function getSocialLabel(siteName?: string | null): string {
  const lower = siteName?.toLowerCase() ?? "";
  if (lower.includes("tiktok")) return "View on TikTok";
  if (lower.includes("instagram")) return "View on Instagram";
  if (lower.includes("youtube")) return "View on YouTube";
  return "View Source";
}

export function RecipeOptionsSheet({
  recipeData,
  bottomSheetRef,
  variant,
  onAnimationCompleted,
  onDeleteSuccess,
}: RecipeOptionsSheetProps) {
  const router = useRouter();
  const { showToast } = useActionToast();
  const { mutateAsync: deleteRecipeAsync, isPending: isDeletePending } = useDeleteImportMutation();

  const id = recipeData.id;

  // Calculate snap points based on variant (different number of menu items)
  const snapPoints = useMemo(() => {
    if (variant === "cookbook") {
      return ["38%"]; // 4 items: View, Creator Profile, Remove from Cookbook, Delete
    }
    if (variant === "detail") {
      return ["42%"]; // 5 items: View, Creator Profile, Add to Cookbook, Report Issue, Delete
    }
    return ["38%"]; // 4 items: View, Creator Profile, Add to Cookbook, Delete
  }, [variant]);

  // Handle View on [Social Platform] press
  const handleViewPress = useCallback(async () => {
    const uri = recipeData.sourceUri;
    if (!uri) {
      reportError(new Error("No source URI found for recipe"), {
        component: "RecipeOptionsSheet",
        action: "View Recipe",
        extra: { recipeId: recipeData.id },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(uri);
    }, 100);
  }, [recipeData, bottomSheetRef]);

  // Handle Creator Profile press
  const handleCreatorProfilePress = useCallback(() => {
    const profileUri = recipeData.author?.profileUri;
    if (!profileUri) {
      reportError(new Error("No profile URI found for recipe"), {
        component: "RecipeOptionsSheet",
        action: "Open Creator Profile",
        extra: { recipeId: recipeData.id },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(profileUri);
    }, 100);
  }, [recipeData, bottomSheetRef]);

  // Handle Add to Cookbook press (placeholder)
  const handleAddToCookbookPress = useCallback(() => {
    bottomSheetRef.current?.close();
    Alert.alert("Coming Soon", "Add to Cookbook functionality is coming soon!");
  }, [bottomSheetRef]);

  // Handle Remove from Cookbook press (placeholder)
  const handleRemoveFromCookbookPress = useCallback(() => {
    bottomSheetRef.current?.close();
    Alert.alert("Coming Soon", "Remove from Cookbook functionality is coming soon!");
  }, [bottomSheetRef]);

  // Handle Report Issue press
  const handleReportIssuePress = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      const recipeSlug = createFullSlug(recipeData.title, id);
      router.push({
        pathname: "/feedback",
        params: {
          extractionId: id,
          returnTo: `/recipes/${recipeSlug}`,
        },
      });
    }, 100);
  }, [bottomSheetRef, router, id, recipeData.title]);

  // Handle Delete press
  const handleDeletePress = useCallback(() => {
    if (isDeletePending || !id) return;

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
            deleteRecipeAsync(id)
              .then(async () => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast
                showToast({
                  text: `Deleted "${displayName}"`,
                  thumbnailUri: recipeData.thumbnailUri || null,
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
    id,
    showToast,
    recipeData,
    isDeletePending,
    bottomSheetRef,
    onDeleteSuccess,
    deleteRecipeAsync,
  ]);

  // Build menu items based on variant
  const menuItems = useMemo<ActionBottomSheetMenuItem[]>(() => {
    const socialIcon = getSocialIcon(recipeData.siteName);
    const socialLabel = getSocialLabel(recipeData.siteName);

    const items: ActionBottomSheetMenuItem[] = [
      // View on [Social Platform]
      {
        icon: socialIcon,
        label: socialLabel,
        onPress: handleViewPress,
      },
      // Creator Profile
      {
        icon: "person-outline" as const,
        label: "Creator Profile",
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
    recipeData.siteName,
    handleViewPress,
    handleDeletePress,
    handleReportIssuePress,
    handleAddToCookbookPress,
    handleCreatorProfilePress,
    handleRemoveFromCookbookPress,
  ]);

  // Determine header based on variant
  const headerImageUri = variant !== "detail" ? (recipeData.thumbnailUri || undefined) : undefined;
  const headerTitle = variant === "detail" ? recipeData.title : undefined;

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
