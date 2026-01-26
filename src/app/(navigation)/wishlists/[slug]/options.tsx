import { Ionicons } from "@expo/vector-icons";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
// External Dependencies
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDeleteWishlistMutation } from "@/api/wishlist/delete";
import type { WishlistDetailPageResult } from "@/api/wishlist/detail";
// Internal Dependencies
import { useActionToast } from "@/contexts";
import { Colors, QUERY_KEYS } from "@/libs/constants";
import type { WishlistPageResult } from "@/libs/types";
import { parseSlug, truncate } from "@/libs/utils";

type OptionsParams = {
  slug: string;
};

export default function WishlistOptions() {
  const { showToast } = useActionToast();
  const queryClient = useQueryClient();
  const { slug } = useLocalSearchParams<OptionsParams>();

  const { mutateAsync: deleteWishlistAsync, isPending: isDeletePending } =
    useDeleteWishlistMutation();

  // Parse slug to get ID and name
  const parsedSlug = parseSlug(slug ?? "");
  const wishlistId = parsedSlug.id;

  // Try to get name from cached detail data, fallback to parsed slug name
  const cachedDetailData = queryClient.getQueryData<
    InfiniteData<WishlistDetailPageResult>
  >([QUERY_KEYS.WISHLISTS, wishlistId]);
  const wishlistName =
    cachedDetailData?.pages[0]?.metadata?.name ?? parsedSlug.name;

  // Handle InfiniteData (paginated) format
  const wishlistListData = queryClient.getQueryData<
    InfiniteData<WishlistPageResult>
  >([QUERY_KEYS.WISHLISTS]);

  // Flatten paginated data
  const flattenedWishlists = wishlistListData
    ? wishlistListData.pages.flatMap((page) => page.data)
    : [];

  // Get coverImageUri from wishlist list cache
  const wishlistFromCache = flattenedWishlists.find((w) => w.id === wishlistId);
  const coverImageUri = wishlistFromCache?.coverImageUri || null;

  const handleClose = () => {
    router.back();
  };

  const handleSharePress = () => {
    Alert.alert("Not Yet Implemented", "Share functionality is coming soon!");
  };

  const handleSendLinkPress = () => {
    Alert.alert(
      "Not Yet Implemented",
      "Send as view-only link is coming soon!",
    );
  };

  const handleRenamePress = () => {
    // Close this screen first, then navigate to edit
    router.back();

    // Small delay to ensure clean navigation
    setTimeout(() => {
      router.push({
        pathname: "/wishlists/[slug]/edit-wishlist",
        params: { slug },
      });
    }, 100);
  };

  const handleDeletePress = () => {
    if (isDeletePending || !wishlistId) return;

    // Dismiss options screen first
    router.back();

    // Show alert after a short delay to allow screen dismissal animation
    setTimeout(() => {
      Alert.alert(
        "Delete Wishlist?",
        `"${wishlistName}" will be permanently deleted.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteWishlistAsync(wishlistId)
                .then(() => {
                  // Note: Haptics already handled by mutation's onSuccess

                  // Show success toast (FIX: component still mounted, toast will show)
                  showToast({
                    text: (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text>
                          Deleted{" "}
                          <Text style={{ fontWeight: "600" }}>
                            {truncate(wishlistName, 20)}
                          </Text>
                        </Text>
                      </View>
                    ),
                    thumbnailUri: coverImageUri || null,
                  });

                  // Navigate to list after delay to ensure toast is visible
                  // Use a longer delay (1000ms) to give toast time to fully render and be visible
                  setTimeout(() => {
                    router.replace("/(navigation)/wishlists");
                  }, 500);
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
                      "Failed to delete wishlist. Please try again.",
                    [{ text: "OK" }],
                  );
                });
            },
          },
        ],
        { cancelable: true },
      );
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Settings
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {/* Share Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleSharePress}>
          <Ionicons name="share-outline" size={20} color="#667" />
          <Text style={styles.optionText}>Share wishlist</Text>
        </TouchableOpacity>

        {/* Send Link Option */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={handleSendLinkPress}
        >
          <Ionicons name="eye-outline" size={20} color="#667" />
          <Text style={styles.optionText}>Send as view-only link</Text>
        </TouchableOpacity>

        {/* Rename Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleRenamePress}>
          <Ionicons name="pencil-outline" size={20} color="#667" />
          <Text style={styles.optionText}>Rename</Text>
        </TouchableOpacity>

        {/* Delete Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
          <Text style={[styles.optionText, styles.optionTextDestructive]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
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
    paddingHorizontal: 40,
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
