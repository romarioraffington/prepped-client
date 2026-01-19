// External Dependencies
import { useRouter } from "expo-router";
import { Alert, View, StyleSheet, FlatList } from "react-native";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Internal Dependencies
import { useRecipes } from "@/api";
import type { Recipe } from "@/libs/types";
import { createShortSlug } from "@/libs/utils";

import {
  PreviewCard,
  StaggeredGrid,
  EmptyImageState,
  WithPullToRefresh,
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
  const [refreshing, setRefreshing] = useState(false);

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

  // Memoize renderItem to prevent re-creations during scroll
  // Index is passed for masonry height variation
  const renderItem = useCallback(
    (item: Recipe, index: number) => (
      <PreviewCard
        key={item.id}
        index={index}
        assetId={item.id}
        title={item.title}
        cookTime={item.cookTime}
        thumbnailUri={item.coverUri}
        caloriesPerServing={item.caloriesPerServing}
        onCardPress={() => handleCardItemPress(item)}
      />
    ),
    [handleCardItemPress],
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
        />
      </WithPullToRefresh>
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
