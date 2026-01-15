// External Components
import { useRouter } from "expo-router";
import { Alert, View, StyleSheet, FlatList } from "react-native";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";

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
import { useCollections } from "@/api";

interface CollectionsProps {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  listRef?: React.RefObject<FlatList<ImageGridItem> | null>;
}

export default function Collections({
  scrollHandler,
  headerHeight,
  listRef,
}: CollectionsProps) {
  const router = useRouter();
  // Add small extra top padding so content clears
  // the translucent header without overlap
  const contentTopPadding = headerHeight + 20;
  const [refreshing, setRefreshing] = useState(false);

  const {
    error,
    isLoading,
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCollections();

  // Flatten pages data - append new pages in order without re-sorting
  // Use ref to maintain stable array reference and only update when items actually change
  const collectionsRef = useRef<ImageGridItem[]>([]);
  const lastPagesLengthRef = useRef(0);
  const lastFlattenedLengthRef = useRef(0);

  const collections = useMemo(() => {
    const flattened = data?.pages.flatMap((page) => page.data) ?? [];
    const currentLength = collectionsRef.current.length;
    const pagesLength = data?.pages.length ?? 0;
    const flattenedLength = flattened.length;

    // Update if new pages were added (pages length increased)
    if (pagesLength > lastPagesLengthRef.current) {
      // Append only new items to preserve reference stability
      const newItems = flattened.slice(currentLength);
      collectionsRef.current = [...collectionsRef.current, ...newItems];
      lastPagesLengthRef.current = pagesLength;
      lastFlattenedLengthRef.current = flattenedLength;
    } else if (pagesLength === 0 && collectionsRef.current.length > 0) {
      // Reset if data is cleared
      collectionsRef.current = [];
      lastPagesLengthRef.current = 0;
      lastFlattenedLengthRef.current = 0;
    } else if (pagesLength > 0 && lastPagesLengthRef.current === 0) {
      // Initial load
      collectionsRef.current = flattened;
      lastPagesLengthRef.current = pagesLength;
      lastFlattenedLengthRef.current = flattenedLength;
    } else if (flattenedLength !== lastFlattenedLengthRef.current) {
      // Items were added or removed (optimistic updates, deletions, etc.)
      // Update the entire list to reflect the current state
      collectionsRef.current = flattened;
      lastFlattenedLengthRef.current = flattenedLength;
    }

    return collectionsRef.current;
  }, [data?.pages]);

  // Auto-open create modal for users with no collections
  useEffect(() => {
    if (!isLoading && !collections.length) {
      // Add a delay to allow the screen to render first
      const timer = setTimeout(() => {
        router.push("/(modal)/create");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, collections.length, router]);

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
  const handleBoardItemPress = useCallback((collectionItem: ImageGridItem) => {
    const slug = createFullSlug(collectionItem.name, collectionItem.id);

    router.push({
      pathname: "/collections/[slug]",
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
      paddingTop: contentTopPadding
    }),
    [contentTopPadding]
  );

  if (!collections.length && !isLoading) {
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
                  title="Create a collection ✨"
                  description={`Share travel recommendations \n from other apps to start building your collection.`}
                />
              </View>
            }
            contentContainerStyle={styles.emptyStateContainer}
            scrollEventThrottle={16}
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
          items={collections}
          isLoading={isLoading}
          onEndReachedThreshold={0.5}
          onItemPress={handleBoardItemPress}
          onEndReached={handleEndReached}
          animatedScrollHandler={scrollHandler}
          isLoadingMore={isFetchingNextPage}
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
