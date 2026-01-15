// External Dependencies
import * as Haptics from "expo-haptics";
import { AntDesign } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { useActionToast } from "@/contexts";
import { useImageErrorFilter } from "@/hooks";
import type { WishlistCardData } from "@/libs/types";
import { DotsLoader, EmptyImageState, SelectableWishlistCard } from "@/components";

import {
  useWishlists,
  useRecommendationDetails,
  useDeleteRecommendationFromWishlistMutation,
} from "@/api";

type Wishlist = WishlistCardData;

export default function DeleteFromWishlist() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { recommendationId } = useLocalSearchParams<{ recommendationId?: string }>();
  const { data: recommendation } = useRecommendationDetails(recommendationId || "");
  const { mutate: deleteFromWishlist, isPending } = useDeleteRecommendationFromWishlistMutation();

  // Track selected wishlist (single selection)
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);

  // Fetch wishlists that include this recommendation
  const {
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: wishlistsData,
  } = useWishlists({
    includeRecommendationId: recommendationId,
  });

  // Flatten paginated data
  const wishlists = useMemo(
    () => wishlistsData?.pages.flatMap((page) => page.data) ?? [],
    [wishlistsData?.pages],
  );

  // Get success thumbnail from recommendation data and validate it
  const recommendationImageUrls = recommendation?.images?.[0] ? [recommendation.images[0]] : [];
  const { validImages: validRecommendationImages } = useImageErrorFilter(recommendationImageUrls);
  const successThumbnailUri = validRecommendationImages.length > 0 ? validRecommendationImages[0] : null;

  // Find the selected wishlist object
  const selectedWishlist = wishlists?.find((w) => w.id === selectedWishlistId);

  const handleWishlistSelect = useCallback(
    (wishlistId: string) => {
      if (isPending) return;
      setSelectedWishlistId((prev) => (prev === wishlistId ? null : wishlistId));
    },
    [isPending],
  );

  const handleRemove = useCallback(() => {
    if (!recommendationId || !selectedWishlist || isPending) {
      return;
    }

    // Create callback function that will execute the delete API call
    // The mutation will handle optimistic updates in onMutate
    const confirmDelete = () => {
      deleteFromWishlist(
        {
          wishlistId: selectedWishlist.id,
          recommendationSlug: recommendationId,
        },
        {
          onSuccess: () => {
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: (error) => {
            // Haptic feedback for error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            reportError(error, {
              component: "DeleteFromWishlist",
              action: "Remove Recommendation From Wishlist",
              extra: {
                wishlistId: selectedWishlist?.id,
                recommendationSlug: recommendationId,
              },
            });
            Alert.alert(
              "Oops!",
              "Failed to remove from wishlist. Please try again.",
              [{ text: "OK" }],
            );
          },
        },
      );
    };

    // Show toast with callbacks
    showToast({
      text: `Removing from ${selectedWishlist.name}`,
      thumbnailUri: successThumbnailUri || selectedWishlist.coverImageUri || null,
      cta: {
        text: "Undo",
        onPress: () => {
          router.push({
            pathname: "/(modal)/delete-from-wishlist",
            params: { recommendationId },
          });
        },
      },
      onDismiss: confirmDelete,
    });

    // Close modal immediately
    router.back();
  }, [
    showToast,
    isPending,
    queryClient,
    selectedWishlist,
    recommendationId,
    deleteFromWishlist,
    successThumbnailUri,
  ]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const renderWishlistCard = useCallback(
    ({ item }: { item: Wishlist }) => (
      <SelectableWishlistCard
        item={item}
        disabled={isPending}
        isSelected={selectedWishlistId === item.id}
        onSelect={() => handleWishlistSelect(item.id)}
      />
    ),
    [selectedWishlistId, handleWishlistSelect, isPending],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Remove from wishlist</Text>
        </View>
        <DotsLoader fullHeight={true} />
      </SafeAreaView>
    );
  }

  // Check if there are no wishlists containing this recommendation
  const hasNoWishlists = (wishlists?.length ?? 0) === 0;

  // Button is disabled until a wishlist is selected
  const isButtonDisabled = !selectedWishlistId || isPending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Remove from wishlist</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <AntDesign name="close" size={14} color="#000" />
        </TouchableOpacity>
      </View>

      {hasNoWishlists ? (
        <View style={styles.emptyStateContainer}>
          <EmptyImageState
            title="Oops! 👀"
            description={`${recommendation?.name} is not saved to any of your wishlists.`}
          />
        </View>
      ) : (
        <FlatList
          numColumns={2}
          data={wishlists ?? []}
          onEndReachedThreshold={0.5}
          renderItem={renderWishlistCard}
          onEndReached={handleEndReached}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.subtextContainer}>
              Select a wishlist to remove{" "}
              <Text style={styles.subtextBold}>{recommendation?.name}</Text>
            </Text>
          }
          ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isButtonDisabled}
          onPress={handleRemove}
          style={[styles.removeButton, isButtonDisabled && styles.removeButtonDisabled]}
        >
          <Text style={[styles.removeButtonText, isButtonDisabled && styles.removeButtonTextDisabled]}>
            Remove
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
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: "#000",
    fontWeight: "500",
    textAlign: "center",
  },
  closeButton: {
    top: 22,
    right: 0,
    width: 40,
    height: 40,
    position: "absolute",
  },
  subtextContainer: {
    fontSize: 14,
    color: "#667",
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subtextBold: {
    fontWeight: "600",
    color: "#000",
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    borderTopColor: "#E5E5E5",
  },
  removeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
  },
  removeButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  removeButtonTextDisabled: {
    color: "#999",
  },
});

