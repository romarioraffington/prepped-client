// External Dependencies
import { useRouter } from "expo-router";
import { Alert, View, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";

// Internal Dependencies
import { useRecipes } from "@/api";
import type { Recipe } from "@/libs/types";
import { createShortSlug } from "@/libs/utils";

import {
  RecipeCard,
  StaggeredGrid,
  EmptyImageState,
  WithPullToRefresh,
  RecipeOptionsSheet,
  LoadingStaggeredGrid,
  PinterestRefreshIndicator,
} from "@/components";

type ScrollableRef = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
};

interface RecipesProps {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  listRef?: React.RefObject<ScrollableRef | null>;
}

export default function Recipes({
  scrollHandler,
  headerHeight,
  listRef,
}: RecipesProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Calculate bottom padding: tab bar height (75) + safe area bottom + extra space
  const contentBottomPadding = 75 + insets.bottom + 20;

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
  const handleMenuPress = useCallback(
    (recipe: Recipe) => {
      setSelectedRecipe(recipe);
    },
    [],
  );

  // Open bottom sheet when recipe is selected
  useEffect(() => {
    if (selectedRecipe) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [selectedRecipe]);

  // Memoize renderItem to prevent re-creations during scroll
  // Index is passed for masonry height variation
  const renderItem = useCallback(
    (item: Recipe, index: number) => (
      <RecipeCard
        key={item.id}
        recipe={item}
        index={index}
        onCardPress={handleCardItemPress}
        onMenuPress={handleMenuPress}
      />
    ),
    [handleCardItemPress, handleMenuPress],
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
              <View style={[
                styles.emptyStateContainer,
                { paddingTop: headerHeight },
              ]}>
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
