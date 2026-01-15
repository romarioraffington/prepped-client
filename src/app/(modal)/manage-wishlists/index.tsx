// External Dependencies
import * as Haptics from "expo-haptics";
import { AntDesign } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Text,
  View,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { QUERY_KEYS } from "@/libs/constants";
import { useImageErrorFilter } from "@/hooks";
import { parseSlug, reportError } from "@/libs/utils";
import { DotsLoader, EmptyImageState, WishlistCard } from "@/components";
import type { RecommendationDetail, WishlistCardData } from "@/libs/types";

import {
  useWishlists,
  useSaveRecommendationToWishlistMutation,
  useDeleteRecommendationFromWishlistMutation,
} from "@/api";

type Wishlist = WishlistCardData;

export default function ManageWishlists() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { recommendationSlug } = useLocalSearchParams<{ recommendationSlug: string }>();

  // Get cached data
  const recommendation = queryClient.getQueryData<RecommendationDetail>(
    QUERY_KEYS.RECOMMENDATION_DETAILS(recommendationSlug),
  );

  // Get the recommendation name from the slug or the cached data
  const recommendationName = recommendation?.name || parseSlug(recommendationSlug)?.name || "This recommendation";

  const { mutate: saveToWishlist, isPending: isSaving } = useSaveRecommendationToWishlistMutation();
  const { mutate: deleteFromWishlist, isPending: isDeleting } = useDeleteRecommendationFromWishlistMutation();

  const isPending = isSaving || isDeleting;

  // Track selected wishlist (for removal flow)
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);

  // Extract ID from slug for API call (backend expects ID, not slug)
  const recommendationId = parseSlug(recommendationSlug).id;

  // Fetch all wishlists and use the includeStatusForRecommendationId
  // option to get the status of the recommendation in the wishlists
  // This helps us to hightlight whether each wishlist already contains
  // the recommendation or not being managed
  const {
    refetch,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: wishlistsData,
  } = useWishlists({
    includeStatusForRecommendationId: recommendationId,
  });

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = useRef(false);

  useEffect(() => {
    if (wishlistsData && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [wishlistsData, isLoading]);

  // Refetch when modal gains focus (after initial load)
  // This ensures data is fresh when navigating back to this modal
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we've already loaded initial data
      // (avoids refetching during initial load)
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [refetch])
  );

  // Flatten paginated data
  const wishlists = useMemo(
    () => wishlistsData?.pages.flatMap((page) => page.data) ?? [],
    [wishlistsData?.pages],
  );

  // Get success thumbnail from recommendation data and validate it
  const recommendationImageUrls = recommendation?.images?.[0] ? [recommendation.images[0]] : [];
  const { validImages: validRecommendationImages } = useImageErrorFilter(recommendationImageUrls);
  const successThumbnailUri = validRecommendationImages.length > 0 ? validRecommendationImages[0] : null;

  // Sort wishlists: those with recommendation first, then others
  const sortedWishlists = useMemo(() => {
    if (!wishlists) return [];
    const withRecommendation = wishlists.filter((w) => w.containsRecommendation === true);
    const withoutRecommendation = wishlists.filter((w) => w.containsRecommendation !== true);
    return [...withRecommendation, ...withoutRecommendation];
  }, [wishlists]);

  // Find the selected wishlist object (for removal - only if it contains recommendation)
  const selectedWishlistForRemoval = sortedWishlists.find(
    (w) => w.id === selectedWishlistId && w.containsRecommendation === true,
  );
  // Find the selected wishlist object (for addition - only if it doesn't contain recommendation)
  const selectedWishlistForAddition = sortedWishlists.find(
    (w) => w.id === selectedWishlistId && w.containsRecommendation !== true,
  );

  const handleWishlistSelect = useCallback(
    (wishlist: Wishlist) => {
      if (!recommendationSlug || isPending) {
        return;
      }

      // Set as selected (for addition or removal)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedWishlistId((prev) => (prev === wishlist.id ? null : wishlist.id));
    },
    [
      showToast,
      isPending,
      queryClient,
      recommendationSlug,
      successThumbnailUri,
      saveToWishlist,
    ],
  );

  const handleAdd = useCallback(() => {
    if (!recommendationSlug || !selectedWishlistForAddition || isPending) {
      return;
    }

    // Create callback function that will execute the save API call
    // The mutation will handle optimistic updates in onMutate
    const confirmAdd = () => {
      saveToWishlist(
        {
          recommendationSlug,
          wishlistId: selectedWishlistForAddition.id,
          wishlistName: selectedWishlistForAddition.name,
        },
        {
          onError: (error) => {
            // Haptic feedback for error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            reportError(error, {
              component: "ManageWishlists",
              action: "Add Recommendation To Wishlist",
              extra: {
                wishlistId: selectedWishlistForAddition?.id,
                recommendationSlug,
              },
            });
            Alert.alert(
              "Oops! 🥲",
              "Failed to add to wishlist. Please try again.",
              [{ text: "OK" }],
            );
          },
        },
      );
    };

    // Show toast with callbacks
    // Note: The mutation handles optimistic updates, so we don't need manual rollback
    // Note: selectedWishlistForAddition.coverImageUri is validated by WishlistCard component using useImageErrorFilter
    showToast({
      text: `Adding to ${selectedWishlistForAddition?.name ?? 'wishlist'}`,
      thumbnailUri: successThumbnailUri || selectedWishlistForAddition.coverImageUri || null,
      cta: {
        text: "Undo",
        onPress: () => {
          router.push({
            pathname: "/(modal)/manage-wishlists",
            params: { recommendationSlug },
          });
        },
      },
      onDismiss: confirmAdd,
    });

    // Close modal immediately
    router.back();
  }, [
    showToast,
    isPending,
    queryClient,
    saveToWishlist,
    recommendationSlug,
    successThumbnailUri,
    selectedWishlistForAddition,
  ]);

  const handleRemove = useCallback(() => {
    if (!recommendationSlug || !selectedWishlistForRemoval || isPending) {
      return;
    }

    // Create callback function that will execute the delete API call
    // The mutation will handle optimistic updates in onMutate
    const confirmDelete = () => {
      deleteFromWishlist(
        {
          wishlistId: selectedWishlistForRemoval.id,
          recommendationSlug,
        },
        {
          onSuccess: () => {
            // Query invalidation is handled by the mutation's onSuccess handler

            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: (error) => {
            // Haptic feedback for error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            reportError(error, {
              component: "ManageWishlists",
              action: "Remove Recommendation From Wishlist",
              extra: {
                wishlistId: selectedWishlistForRemoval?.id,
                recommendationSlug,
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
    // Note: The mutation handles optimistic updates, so we don't need manual rollback
    // Note: selectedWishlistForRemoval.coverImageUri is validated by WishlistCard component using useImageErrorFilter
    showToast({
      text: `Removing from ${selectedWishlistForRemoval?.name ?? 'wishlist'}`,
      thumbnailUri: successThumbnailUri || selectedWishlistForRemoval.coverImageUri || null,
      cta: {
        text: "Undo",
        onPress: () => {
          router.push({
            pathname: "/(modal)/manage-wishlists",
            params: { recommendationSlug },
          });
        },
      },
      onDismiss: confirmDelete,
    });

    // Close modal immediately
    router.back();
  }, [
    isPending,
    showToast,
    queryClient,
    recommendationSlug,
    deleteFromWishlist,
    successThumbnailUri,
    selectedWishlistForRemoval,
  ]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleCreateWishlist = useCallback(() => {
    router.back();
    // Small delay to ensure the modal
    // closes before opening the new one
    setTimeout(() => {
      router.push({
        pathname: "/(modal)/create-wishlist",
        params: {
          recommendationSlug,
        },
      });
    }, 100);
  }, [recommendationSlug]);

  const renderWishlistCard = useCallback(
    ({ item }: { item: Wishlist }) => {
      const isSelected = selectedWishlistId === item.id;
      const isSelectedForRemoval = isSelected && item.containsRecommendation === true;
      const isSelectedForAddition = isSelected && item.containsRecommendation !== true;
      return (
        <View style={[isPending && styles.disabledCard]}>
          <WishlistCard
            item={item}
            showRecentlyViewed={false}
            isSelectedForRemoval={isSelectedForRemoval}
            isSelectedForAddition={isSelectedForAddition}
            onPress={isPending ? () => { } : () => handleWishlistSelect(item)}
          />
        </View>
      );
    },
    [handleWishlistSelect, selectedWishlistId, isPending],
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Manage Wishlists</Text>
            <Text style={styles.headerSubtitle}>
              Add or remove <Text style={styles.subtextBold}>{recommendationName}</Text> from a wishlist
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <AntDesign name="close" size={14} color="#000" />
          </TouchableOpacity>
        </View>
        <DotsLoader fullHeight={true} />
      </SafeAreaView>
    );
  }

  // Check if there are no wishlists available
  const hasNoWishlists = (sortedWishlists?.length ?? 0) === 0;

  // Determine action type based on selected wishlist
  const isSelectedForRemoval = selectedWishlistForRemoval !== undefined;

  // Button is disabled until a wishlist is selected
  const isActionButtonDisabled = !selectedWishlistId || isPending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manage Wishlists</Text>
          <Text style={styles.headerSubtitle}>
            Add or remove <Text style={styles.subtextBold}>{recommendationName}</Text> from a wishlist
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <AntDesign name="close" size={14} color="#000" />
        </TouchableOpacity>
      </View>

      {hasNoWishlists ? (
        <View style={styles.emptyStateContainer}>
          <EmptyImageState
            title="No wishlists yet!"
            description={`Create your first wishlist to save ${recommendationName}.`}
          />
        </View>
      ) : (
        <FlatList
          numColumns={2}
          data={sortedWishlists}
          onEndReachedThreshold={0.5}
          renderItem={renderWishlistCard}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          onEndReached={handleEndReached}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
        />
      )}

      <View style={styles.footer}>
        {selectedWishlistId ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isActionButtonDisabled}
            onPress={isSelectedForRemoval ? handleRemove : handleAdd}
            style={[styles.actionButton, isActionButtonDisabled && styles.actionButtonDisabled]}
          >
            <Text style={[styles.actionButtonText, isActionButtonDisabled && styles.actionButtonTextDisabled]}>
              {isSelectedForRemoval ? "Remove" : "Save"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.createButton}
            onPress={handleCreateWishlist}
          >
            <Text style={styles.createButtonText}>Create wishlist</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    color: "#000",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#667",
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    top: 22,
    right: 0,
    width: 40,
    height: 40,
    position: "absolute",
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
  disabledCard: {
    opacity: 0.5,
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
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonTextDisabled: {
    color: "#999",
  },
});

