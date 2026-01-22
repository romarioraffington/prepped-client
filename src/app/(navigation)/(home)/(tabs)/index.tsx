// External Components
import { useRouter } from "expo-router";
import { Alert, View, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useCallback, useEffect, useState, useMemo } from "react";

// Internal Components
import { createFullSlug } from "@/libs/utils";
import type { ImageGridItem } from "@/libs/types";

import {
  ImageGridList,
  EmptyImageState,
  WithPullToRefresh,
  LoadingImageGridList,
  PinterestRefreshIndicator
} from "@/components";

// API
import { useCookbooks } from "@/api";

interface CookbooksProps {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  listRef?: React.RefObject<FlatList<ImageGridItem> | null>;
}

export default function Cookbooks({
  scrollHandler,
  headerHeight,
  listRef,
}: CookbooksProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Add small extra top padding so content clears
  // the translucent header without overlap
  const contentTopPadding = headerHeight + 20;
  // Calculate bottom padding: tab bar height (75) + safe area bottom + extra space
  const contentBottomPadding = 75 + insets.bottom + 20;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    error,
    refetch,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCookbooks();

  // Flatten pages data for display
  const cookbooks = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data?.pages]);

  // Auto-open create modal for users with no cookbooks
  useEffect(() => {
    if (!isLoading && !cookbooks.length) {
      // Add a delay to allow the screen to render first
      const timer = setTimeout(() => {
        router.push("/(modal)/create");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, cookbooks.length, router]);

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

  // Memoize to prevent re-renders in ImageGridList
  const handleBoardItemPress = useCallback((cookbookItem: ImageGridItem) => {
    const slug = createFullSlug(cookbookItem.name, cookbookItem.id);

    router.push({
      pathname: "/cookbooks/[slug]",
      params: {
        slug,
      },
    });
  }, [router]);

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Memoize contentContainerStyle to prevent unnecessary re-renders
  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: contentTopPadding,
      paddingBottom: contentBottomPadding,
    }),
    [contentTopPadding, contentBottomPadding]
  );

  if (!cookbooks.length && !isLoading) {
    return (
      <View style={styles.container}>
        <WithPullToRefresh
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshViewBaseHeight={400}
          backAnimationDuration={700}
          hapticFeedbackDirection="to-bottom"
          refreshComponent={<PinterestRefreshIndicator />}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View style={[styles.emptyStateContainer, { paddingTop: contentTopPadding }]}>
                <EmptyImageState
                  title="Create a cookbook ✨"
                  description={`Share recipes from other apps to start building your cookbook.`}
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

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: contentTopPadding }]}>
        <LoadingImageGridList rows={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WithPullToRefresh
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshViewBaseHeight={400}
        backAnimationDuration={700}
        hapticFeedbackDirection="to-bottom"
        refreshComponent={<PinterestRefreshIndicator />}
      >
        <ImageGridList
          ref={listRef}
          items={cookbooks}
          isLoading={isLoading}
          onEndReachedThreshold={0.5}
          onEndReached={handleEndReached}
          isLoadingMore={isFetchingNextPage}
          onItemPress={handleBoardItemPress}
          animatedScrollHandler={scrollHandler}
          contentContainerStyle={contentContainerStyle}
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
    justifyContent: "center",
    alignItems: "center",
  },
});
