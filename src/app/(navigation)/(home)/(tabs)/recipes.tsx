// External Dependencies
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import type { Recipe } from "@/libs/types";
import { createShortSlug } from "@/libs/utils";
import { useRecipes, useBulkDeleteRecipesMutation } from "@/api";

import {
  BulkEditFooter,
  EmptyImageState,
  LoadingStaggeredGrid,
  PinterestRefreshIndicator,
  RecipeCard,
  RecipeOptionsSheet,
  StaggeredGrid,
  WithPullToRefresh,
} from "@/components";

type ScrollableRef = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
};

export interface RecipesProps {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  listRef?: React.RefObject<ScrollableRef | null>;
  isBulkEditMode?: boolean;
  selectedRecipeIds?: Set<string>;
  onRecipeSelect?: (recipeId: string) => void;
  onBulkEditDone?: () => void;
  onRecipesCountChange?: (hasRecipes: boolean) => void;
}

// Footer height for bulk edit mode padding
const BULK_EDIT_FOOTER_HEIGHT = 80;

export default function Recipes({
  scrollHandler,
  headerHeight,
  listRef,
  isBulkEditMode = false,
  selectedRecipeIds = new Set(),
  onRecipeSelect,
  onBulkEditDone,
  onRecipesCountChange,
}: RecipesProps) {
  const router = useRouter();
  const { showToast } = useActionToast();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Bulk delete mutation
  const { isPending: isDeletePending, mutateAsync: bulkDeleteRecipesAsync } =
    useBulkDeleteRecipesMutation();

  // Calculate bottom padding: tab bar height (75) + safe area bottom + extra space
  // Add extra padding when in bulk edit mode for the footer
  const bulkEditBottomPadding = isBulkEditMode ? BULK_EDIT_FOOTER_HEIGHT : 0;
  const contentBottomPadding = 75 + insets.bottom + 20 + bulkEditBottomPadding;

  const {
    error,
    data,
    isLoading,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecipes();

  // Memoize flattened pages data to avoid recreating array every render
  const recipes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data?.pages],
  );

  // Notify parent about recipes count changes
  useEffect(() => {
    onRecipesCountChange?.(recipes.length > 0);
  }, [recipes.length, onRecipesCountChange]);

  useEffect(() => {
    if (error) {
      Alert.alert("Oops.. 🤔", error.message, [
        {
          text: "Try Again",
          onPress: () => refetch(),
        },
        {
          text: "Ok",
        },
      ]);
    }
  }, [error, refetch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Memoize handlers to prevent re-renders in StaggeredGrid
  const handleCardItemPress = useCallback(
    (item: Recipe) => {
      router.push({
        pathname: "/recipes/[slug]",
        params: {
          slug: createShortSlug(item.title, item.id),
        },
      });
    },
    [router],
  );

  // Handle menu press - open options sheet for the selected recipe
  const handleMenuPress = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  // Open bottom sheet when recipe is selected
  useEffect(() => {
    if (selectedRecipe) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [selectedRecipe]);

  // Handle bulk copy - navigate to add-to-cookbook modal
  const handleBulkCopy = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only copy up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    // Exit bulk edit mode
    onBulkEditDone?.();

    // Navigate to add-to-cookbook modal
    router.push({
      pathname: "/(modal)/add-to-cookbook",
      params: {
        selectedRecipeIds: Array.from(selectedRecipeIds).join(","),
        selectedCookbookIds: "",
      },
    });
  }, [selectedRecipeIds, router, onBulkEditDone]);

  // Handle bulk delete - show confirmation and delete recipes
  const handleBulkDelete = useCallback(async () => {
    if (selectedRecipeIds.size === 0 || isDeletePending) return;

    const recipeCount = selectedRecipeIds.size;
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    Alert.alert(
      "Delete Recipes",
      `Are you sure you want to delete ${recipeCount} ${recipeText}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDeleteRecipesAsync(Array.from(selectedRecipeIds));

              // Success
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Show success toast
              showToast({
                text: `Deleted ${recipeCount} ${recipeText}`,
              });

              // Exit bulk edit mode
              onBulkEditDone?.();
            } catch (deleteError) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

              Alert.alert(
                "Oops!",
                deleteError instanceof Error
                  ? deleteError.message
                  : "Failed to delete recipes. Please try again.",
                [{ text: "OK" }],
              );
              // Keep bulk edit mode open so user can retry
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    selectedRecipeIds,
    isDeletePending,
    bulkDeleteRecipesAsync,
    showToast,
    onBulkEditDone,
  ]);

  // Memoize renderItem to prevent re-creations during scroll
  // Index is passed for masonry height variation
  const renderItem = useCallback(
    (item: Recipe, index: number) => (
      <RecipeCard
        key={item.id}
        recipe={item}
        index={index}
        selectable={isBulkEditMode}
        isSelected={selectedRecipeIds.has(item.id)}
        onSelect={() => onRecipeSelect?.(item.id)}
        onCardPress={isBulkEditMode ? undefined : handleCardItemPress}
        onMenuPress={isBulkEditMode ? undefined : handleMenuPress}
      />
    ),
    [
      isBulkEditMode,
      selectedRecipeIds,
      onRecipeSelect,
      handleCardItemPress,
      handleMenuPress,
    ],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <LoadingStaggeredGrid />
      </View>
    );
  }

  if (!recipes.length) {
    return (
      <View style={styles.container}>
        <WithPullToRefresh
          refreshing={refreshing}
          onRefresh={onRefresh}
          backAnimationDuration={700}
          refreshViewBaseHeight={400}
          hapticFeedbackDirection="to-bottom"
          refreshComponent={<PinterestRefreshIndicator />}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View
                style={[
                  styles.emptyStateContainer,
                  { paddingTop: headerHeight },
                ]}
              >
                <EmptyImageState
                  title="No Recipes"
                  showPlayIcons={true}
                  description={`Your saved recipes will appear here.`}
                />
              </View>
            }
            scrollEventThrottle={16}
            contentContainerStyle={styles.emptyStateContainer}
          />
        </WithPullToRefresh>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WithPullToRefresh
        refreshing={refreshing}
        onRefresh={onRefresh}
        backAnimationDuration={700}
        refreshViewBaseHeight={400}
        hapticFeedbackDirection="to-bottom"
        refreshComponent={<PinterestRefreshIndicator />}
      >
        <StaggeredGrid
          ref={listRef as React.Ref<any>}
          items={recipes}
          renderItem={renderItem}
          headerHeight={headerHeight}
          onEndReachedThreshold={0.8}
          isLoading={isFetchingNextPage}
          onEndReached={handleEndReached}
          animatedScrollHandler={scrollHandler}
          contentBottomPadding={contentBottomPadding}
        />
      </WithPullToRefresh>

      {/* Recipe Options Bottom Sheet */}
      {selectedRecipe && (
        <RecipeOptionsSheet
          variant="recipes"
          bottomSheetRef={bottomSheetRef}
          recipeData={selectedRecipe}
          onAnimationCompleted={() => {
            // Clear selected recipe when sheet closes
            setSelectedRecipe(null);
          }}
        />
      )}

      {/* Bulk Edit Footer */}
      <BulkEditFooter
        variant="recipes"
        isVisible={isBulkEditMode}
        isPending={isDeletePending}
        onCopy={handleBulkCopy}
        onDelete={handleBulkDelete}
        selectedCount={selectedRecipeIds.size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyStateContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
