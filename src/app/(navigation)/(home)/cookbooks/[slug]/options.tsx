// External Dependencies
import React from "react";
import * as Haptics from "expo-haptics";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import type { ImageGridItem } from "@/libs/types";
import { useDeleteCookbookMutation } from "@/api";
import { Colors, QUERY_KEYS } from "@/libs/constants";
import { parseSlug, capitalizeWords } from "@/libs/utils";

type OptionsParams = {
  slug: string;
};

export default function CookbookOptions() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { slug } = useLocalSearchParams<OptionsParams>();

  const {
    mutateAsync: deleteCookbookAsync,
    isPending: isDeletePending
  } = useDeleteCookbookMutation();

  // Parse the slug to get ID and name
  const { id: cookbookId, name: slugName } = parseSlug(slug);
  const displayName = capitalizeWords(slugName);

  // Helper function to get cookbook image from cache
  const getCookbookImage = (): string | null => {
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
  };

  const handleClose = () => {
    router.back();
  };

  const handleEditTitlePress = () => {
    // Close this screen first, then navigate to recommendations
    router.back();

    // Small delay to ensure clean navigation
    setTimeout(() => {
      // router.push({
      //   pathname: "/cookbooks/[slug]/recommendations",
      //   params: {
      //     slug,
      //     previousTitle: displayName,
      //   },
      // });
    }, 100);
  };

  const handleEditRecipesPress = () => {
    // Close this screen first
    router.back();

    // Small delay to ensure clean navigation
    setTimeout(() => {
      router.push({
        pathname: "/cookbooks/[slug]/edit" as any,
        params: {
          slug,
        },
      });
    }, 100);
  };

  const handleDeletePress = () => {
    if (isDeletePending || !slug) return;

    Alert.alert(
      "Delete Cookbook?",
      `"${displayName}" and all its Recipes will be deleted.`,
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

            deleteCookbookAsync(slug)
              .then(() => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast with green checkmark
                showToast({
                  text: `Deleted ${displayName}`,
                  thumbnailUri: cookbookImage || null,
                });

                // Invalidate cookbooks list to refetch and remove deleted cookbook
                queryClient.invalidateQueries({
                  queryKey: [QUERY_KEYS.COOKBOOKS],
                });

                // Navigate back - closes this options modal and detail page
                router.back();
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete cookbook. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Options
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {/* Edit Title Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleEditTitlePress}>
          <Feather name="edit-2" size={18} color="#667" />
          <Text style={styles.optionText}>Edit Title</Text>
        </TouchableOpacity>

        {/* Edit Recipes Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleEditRecipesPress}>
          <MaterialCommunityIcons name="circle-edit-outline" size={24} color="#667" />
          <Text style={styles.optionText}>Edit Recipes</Text>
        </TouchableOpacity>

        {/* Delete Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={18} color={Colors.destructive} />
          <Text style={[styles.optionText, styles.optionTextDestructive]}>
            Delete Cookbook
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    top: 20,
    left: 20,
    opacity: 0.5,
    position: "absolute",
  },
  optionsContainer: {
    gap: 25,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 17,
    color: "#000",
    marginLeft: 8,
    fontWeight: "500",
  },
  optionTextDestructive: {
    color: Colors.destructive,
  },
});

