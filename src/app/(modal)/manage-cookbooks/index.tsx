// External Dependencies
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Text,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { CookbookCard, DotsLoader, EmptyImageState } from "@/components";
// Internal Dependencies
import { useActionToast } from "@/contexts";
import { Colors } from "@/libs/constants";
import type { CookbookCardData } from "@/libs/types";
import { parseSlug, reportError } from "@/libs/utils";

import {
  useCookbooksForCards,
  useRemoveRecipeFromCookbookMutation,
  useSaveRecipeToCookbookMutation,
} from "@/api";

type Cookbook = CookbookCardData;

export default function ManageCookbooks() {
  const { showToast } = useActionToast();
  const { recipeSlug } = useLocalSearchParams<{ recipeSlug: string }>();

  // Parse slug to extract ID and name
  const { id: recipeId, name: recipeName } = parseSlug(recipeSlug);

  const {
    mutate: saveToCookbook,
    isPending: isSaving
  } = useSaveRecipeToCookbookMutation();

  const {
    mutate: removeFromCookbook,
    isPending: isDeleting,
  } = useRemoveRecipeFromCookbookMutation();

  const isPending = isSaving || isDeleting;

  // Track selected cookbook (for removal flow)
  const [
    selectedCookbookId,
    setSelectedCookbookId,
  ] = useState<string | null>(
    null,
  );

  // Fetch all cookbooks and use the includeStatusForRecipeId
  // option to get the status of the recipe in the cookbooks
  // This helps us to highlight whether each cookbook already contains
  // the recipe or not being managed
  const {
    refetch,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: cookbooksData,
  } = useCookbooksForCards({
    includeStatusForRecipeId: recipeId,
  });

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = useRef(false);

  useEffect(() => {
    if (cookbooksData && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [cookbooksData, isLoading]);

  // Refetch when modal gains focus (after initial load)
  // This ensures data is fresh when navigating back to this modal
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we've already loaded initial data
      // (avoids refetching during initial load)
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [refetch]),
  );

  // Flatten paginated data
  const cookbooks = useMemo(
    () => cookbooksData?.pages.flatMap((page) => page.data) ?? [],
    [cookbooksData?.pages],
  );

  // Sort cookbooks: those with recipe first, then others
  const sortedCookbooks = useMemo(() => {
    if (!cookbooks) return [];
    const withRecipe = cookbooks.filter((c) => c.containsRecipe === true);
    const withoutRecipe = cookbooks.filter((c) => c.containsRecipe !== true);
    return [...withRecipe, ...withoutRecipe];
  }, [cookbooks]);

  // Find the selected cookbook object (for removal - only if it contains recipe)
  const selectedCookbookForRemoval = sortedCookbooks.find(
    (c) => c.id === selectedCookbookId && c.containsRecipe === true,
  );
  // Find the selected cookbook object (for addition - only if it doesn't contain recipe)
  const selectedCookbookForAddition = sortedCookbooks.find(
    (c) => c.id === selectedCookbookId && c.containsRecipe !== true,
  );

  const handleCookbookSelect = useCallback(
    (cookbook: Cookbook) => {
      if (!recipeSlug || isPending) {
        return;
      }

      // Set as selected (for addition or removal)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedCookbookId((prev) =>
        prev === cookbook.id ? null : cookbook.id,
      );
    },
    [recipeSlug, isPending],
  );

  const handleAdd = useCallback(() => {
    if (!recipeSlug || !selectedCookbookForAddition || isPending) {
      return;
    }

    // Create callback function that will execute the save API call
    const confirmAdd = () => {
      saveToCookbook(
        {
          recipeSlug,
          cookbookId: selectedCookbookForAddition.id,
          cookbookName: selectedCookbookForAddition.name,
        },
        {
          onError: (error) => {
            // Haptic feedback for error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            reportError(error, {
              component: "ManageCookbooks",
              action: "Add Recipe To Cookbook",
              extra: {
                cookbookId: selectedCookbookForAddition?.id,
                recipeSlug,
              },
            });
            Alert.alert(
              "Oops!",
              "Failed to add to cookbook. Please try again.",
              [{ text: "OK" }],
            );
          },
        },
      );
    };

    // Show toast with callbacks
    showToast({
      text: `Adding to ${selectedCookbookForAddition?.name ?? "cookbook"}`,
      thumbnailUri: selectedCookbookForAddition.coverImageUri || null,
      cta: {
        text: "Undo",
        onPress: () => {
          router.push({
            pathname: "/(modal)/manage-cookbooks",
            params: { recipeSlug },
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
    recipeSlug,
    saveToCookbook,
    selectedCookbookForAddition,
  ]);

  const handleRemove = useCallback(() => {
    if (!recipeSlug || !selectedCookbookForRemoval || isPending) {
      return;
    }

    // Parse slug to get recipe ID for the API call
    const { id: recipeIdForRemoval } = parseSlug(recipeSlug);

    // Create callback function that will execute the delete API call
    const confirmDelete = () => {
      removeFromCookbook(
        {
          cookbookId: selectedCookbookForRemoval.id,
          recipeId: recipeIdForRemoval,
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
              component: "ManageCookbooks",
              action: "Remove Recipe From Cookbook",
              extra: {
                cookbookId: selectedCookbookForRemoval?.id,
                recipeSlug,
              },
            });
            Alert.alert(
              "Oops!",
              "Failed to remove from cookbook. Please try again.",
              [{ text: "OK" }],
            );
          },
        },
      );
    };

    // Show toast with callbacks
    showToast({
      text: `Removing from ${selectedCookbookForRemoval?.name ?? "cookbook"}`,
      thumbnailUri: selectedCookbookForRemoval.coverImageUri || null,
      cta: {
        text: "Undo",
        onPress: () => {
          router.push({
            pathname: "/(modal)/manage-cookbooks",
            params: { recipeSlug },
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
    recipeSlug,
    removeFromCookbook,
    selectedCookbookForRemoval,
  ]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleCreateCookbook = useCallback(() => {
    router.back();
    // Small delay to ensure the modal
    // closes before opening the new one
    setTimeout(() => {
      router.push({
        pathname: "/(modal)/create-cookbook",
        params: {
          recipeSlug,
        },
      });
    }, 100);
  }, [recipeSlug]);

  const renderCookbookCard = useCallback(
    ({ item }: { item: Cookbook }) => {
      const isSelected = selectedCookbookId === item.id;
      const isSelectedForRemoval = isSelected && item.containsRecipe === true;
      const isSelectedForAddition = isSelected && item.containsRecipe !== true;
      return (
        <View style={[isPending && styles.disabledCard]}>
          <CookbookCard
            item={item}
            showRecentlyViewed={false}
            isSelectedForRemoval={isSelectedForRemoval}
            isSelectedForAddition={isSelectedForAddition}
            onPress={isPending ? () => { } : () => handleCookbookSelect(item)}
          />
        </View>
      );
    },
    [handleCookbookSelect, selectedCookbookId, isPending],
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
            <Text style={styles.headerTitle}>Manage Cookbooks</Text>
            <Text style={styles.headerSubtitle}>
              {/* Managing the <Text style={styles.subtextBold}>{recipeName}</Text> recipe */}
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

  // Check if there are no cookbooks available
  const hasNoCookbooks = (sortedCookbooks?.length ?? 0) === 0;

  // Determine action type based on selected cookbook
  const isSelectedForRemoval = selectedCookbookForRemoval !== undefined;

  // Button is disabled until a cookbook is selected
  const isActionButtonDisabled = !selectedCookbookId || isPending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cookbooks</Text>
          <Text style={styles.headerSubtitle}>
            Manage the <Text style={styles.subtextBold}>{recipeName}</Text>{" "}
            Recipe
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <AntDesign name="close" size={14} color="#000" />
        </TouchableOpacity>
      </View>

      {hasNoCookbooks ? (
        <View style={styles.emptyStateContainer}>
          <EmptyImageState
            title="No cookbooks yet!"
            description={`Create your first cookbook to save ${recipeName}.`}
          />
        </View>
      ) : (
        <FlatList
          numColumns={2}
          data={sortedCookbooks}
          onEndReachedThreshold={0.5}
          renderItem={renderCookbookCard}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          onEndReached={handleEndReached}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
        />
      )}

      <View style={styles.footer}>
        {selectedCookbookId ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isActionButtonDisabled}
            onPress={isSelectedForRemoval ? handleRemove : handleAdd}
            style={[
              styles.actionButton,
              isActionButtonDisabled && styles.actionButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.actionButtonText,
                isActionButtonDisabled && styles.actionButtonTextDisabled,
              ]}
            >
              {isSelectedForRemoval ? "Remove" : "Save"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.createButton}
            onPress={handleCreateCookbook}
          >
            <Text style={styles.createButtonText}>Create cookbook</Text>
          </TouchableOpacity>
        )}
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
