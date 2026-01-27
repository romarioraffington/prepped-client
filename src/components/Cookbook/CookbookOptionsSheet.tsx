import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
// External Dependencies
import { useCallback, useMemo } from "react";
import { Alert, Text } from "react-native";

import { useDeleteCookbookMutation } from "@/api";
import {
  ActionBottomSheet,
  type ActionBottomSheetMenuItem,
} from "@/components/ActionBottomSheet";
// Internal Dependencies
import { useActionToast } from "@/contexts";
import { Colors, QUERY_KEYS } from "@/libs/constants";
import type { ImageGridItem } from "@/libs/types";

export interface CookbookOptionsSheetProps {
  cookbookId: string;
  cookbookSlug: string;
  cookbookName: string;
  hasRecipes?: boolean;
  onBulkEditPress?: () => void;
  onEditTitlePress?: () => void;
  onAnimationCompleted?: () => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export function CookbookOptionsSheet({
  cookbookId,
  cookbookSlug,
  cookbookName,
  hasRecipes = true,
  onBulkEditPress,
  onEditTitlePress,
  onAnimationCompleted,
  bottomSheetRef,
}: CookbookOptionsSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();

  const {
    isPending: isDeletePending,
    mutateAsync: deleteCookbookAsync
  } = useDeleteCookbookMutation();

  // Calculate snap points (2 items if no recipes, 3 items if has recipes)
  const snapPoints = useMemo(() => [hasRecipes ? "32%" : "28%"], [hasRecipes]);

  // Helper function to get cookbook image from cache
  const getCookbookImage = useCallback((): string | null => {
    if (!cookbookId) return null;

    // Find in cookbooks list cache
    const cookbooksData = queryClient.getQueryData<
      InfiniteData<{ data: ImageGridItem[]; meta: unknown }>
    >([QUERY_KEYS.COOKBOOKS]);

    if (cookbooksData) {
      for (const page of cookbooksData.pages) {
        const cookbook = page.data.find((item) => item.id === cookbookId);
        if (cookbook?.imageUris && cookbook.imageUris.length > 0) {
          return cookbook.imageUris[0];
        }
      }
    }

    return null;
  }, [cookbookId, queryClient]);

  // Handle Edit Title press
  const handleEditTitlePress = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      router.push({
        pathname: "/cookbooks/[slug]/edit",
        params: { slug: cookbookSlug },
      });
    }, 100);
  }, [bottomSheetRef, router, cookbookSlug]);

  // Handle Bulk Edit Recipes press
  const handleBulkEditPress = useCallback(() => {
    bottomSheetRef.current?.close();
    if (onBulkEditPress) {
      setTimeout(() => {
        onBulkEditPress();
      }, 100);
    }
  }, [bottomSheetRef, onBulkEditPress]);

  // Handle Delete Cookbook press
  const handleDeletePress = useCallback(() => {
    if (isDeletePending || !cookbookSlug) return;

    Alert.alert(
      "Delete Cookbook?",
      `Are you sure you want to delete "${cookbookName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Get cookbook image before deletion
            const cookbookImage = getCookbookImage();

            deleteCookbookAsync(cookbookSlug)
              .then(() => {
                // Close bottom sheet
                bottomSheetRef.current?.close();

                // Haptic feedback
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

                // Show success toast
                showToast({
                  text: (
                    <Text>
                      Deleted{" "}
                      <Text style={{ fontWeight: "600" }}>{cookbookName}</Text>
                    </Text>
                  ),
                  thumbnailUri: cookbookImage,
                });

                // Invalidate cookbooks list to refetch
                queryClient.invalidateQueries({
                  queryKey: [QUERY_KEYS.COOKBOOKS],
                });

                // Navigate back to cookbooks list
                router.back();
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
                  "Failed to delete cookbook. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    router,
    showToast,
    cookbookSlug,
    cookbookName,
    queryClient,
    bottomSheetRef,
    isDeletePending,
    getCookbookImage,
    deleteCookbookAsync,
  ]);

  // Build menu items
  const menuItems = useMemo<ActionBottomSheetMenuItem[]>(() => {
    const items: ActionBottomSheetMenuItem[] = [
      // Edit Title
      {
        label: "Edit Title",
        onPress: handleEditTitlePress,
        renderIcon: () => (
          <MaterialCommunityIcons name="format-title" size={24} color="#000" />
        ),
      },
      // Bulk Edit Recipes (only if there are recipes)
      ...(hasRecipes
        ? [
          {
            label: "Bulk Edit Recipes",
            onPress: handleBulkEditPress,
            renderIcon: () => (
              <MaterialCommunityIcons name="view-dashboard-edit-outline" size={24} color="#000" />
            ),
          },
        ]
        : []),
      // Delete Cookbook (destructive, always last)
      {
        destructive: true,
        label: "Delete Cookbook",
        onPress: handleDeletePress,
        renderIcon: () => (
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
        ),
      },
    ];

    return items;
  }, [
    hasRecipes,
    handleEditTitlePress,
    handleBulkEditPress,
    handleDeletePress,
  ]);

  return (
    <ActionBottomSheet
      index={-1}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      menuItems={menuItems}
      headerTitle="Cookbook Options"
      onAnimationCompleted={onAnimationCompleted}
    />
  );
}
