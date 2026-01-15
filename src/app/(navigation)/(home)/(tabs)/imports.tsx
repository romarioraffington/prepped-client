// External Dependencies
import { useRouter } from "expo-router";
import type BottomSheet from "@gorhom/bottom-sheet";
import { Alert, View, StyleSheet, FlatList } from "react-native";
import type { useAnimatedScrollHandler } from "react-native-reanimated";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Internal Dependencies
import { useImports } from "@/api";
import type { Import } from "@/libs/types";
import { createShortSlug } from "@/libs/utils";

import {
  PreviewCard,
  StaggeredGrid,
  EmptyImageState,
  WithPullToRefresh,
  ImportOptionsSheet,
  LoadingStaggeredGrid,
  PinterestRefreshIndicator,
} from "@/components";

type ScrollableRef = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
};

interface ImportsProps {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  listRef?: React.RefObject<ScrollableRef | null>;
}

export default function Imports({
  scrollHandler,
  headerHeight,
  listRef,
}: ImportsProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedCard, setSelectedCard] = useState<Import | null>(null);

  const {
    error,
    data,
    isLoading,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useImports();

  // Memoize flattened pages data to avoid recreating array every render
  const imports = useMemo(
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
    (item: Import) => {
      router.push({
        pathname: "/imports/[slug]",
        params: {
          slug: createShortSlug(item.title, item.id),
        },
      });
    },
    [router],
  );

  const handleMenuItemPress = useCallback((item: Import) => {
    setSelectedCard(item);
    // Don't call expand() here - let useEffect handle it after component mounts
  }, []);

  // Expand sheet after selectedCard changes and component is mounted
  useEffect(() => {
    if (selectedCard) {
      // Use a small delay to ensure component is mounted and ref is attached
      const timeoutId = setTimeout(() => {
        if (bottomSheetRef.current) {
          bottomSheetRef.current.expand();
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedCard]);

  // Memoize bottom sheet handlers
  const handleBottomSheetAnimationComplete = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // Memoize optionsSheetData to avoid recreating object on every render
  const optionsSheetData = useMemo(() => {
    if (!selectedCard) return null;
    return {
      id: selectedCard.id,
      title: selectedCard.title,
      asset: {
        type: selectedCard.asset.type,
        thumbnailUri: selectedCard.asset.thumbnailUri,
        contentUri: selectedCard.asset.contentUri,
      },
      author: {
        profileUri: selectedCard.creator.profileUri,
      },
    };
  }, [selectedCard]);

  // Memoize renderItem to prevent re-creations during scroll
  // Index is passed for masonry height variation
  const renderItem = useCallback(
    (item: Import, index: number) => (
      <PreviewCard
        key={item.id}
        index={index}
        assetId={item.id}
        title={item.title}
        platform={item.platform}
        viewCount={item.metrics.views}
        authorName={item.channel.name}
        authorAvatarUri={item.creator.photoUri}
        thumbnailUri={item.asset.thumbnailUri}
        shouldRenderTitleOverlay={item.platform === "web"}
        onMenuPress={() => handleMenuItemPress(item)}
        onCardPress={() => handleCardItemPress(item)}
      />
    ),
    [handleCardItemPress, handleMenuItemPress],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <LoadingStaggeredGrid />
      </View>
    );
  }

  if (!imports.length) {
    return (
      <View style={styles.container}>
        <WithPullToRefresh
          refreshComponent={<PinterestRefreshIndicator />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshViewBaseHeight={400}
          hapticFeedbackDirection="to-bottom"
          backAnimationDuration={700}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View style={[styles.emptyStateContainer, { paddingTop: headerHeight }]}>
                <EmptyImageState
                  title="No Imports"
                  showPlayIcons={true}
                  description={`Your imported content will appear here.`}
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

  return (
    <>
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
            items={imports}
            renderItem={renderItem}
            headerHeight={headerHeight}
            onEndReachedThreshold={0.8}
            isLoading={isFetchingNextPage}
            onEndReached={handleEndReached}
            animatedScrollHandler={scrollHandler}
          />
        </WithPullToRefresh>
      </View>

      {/* Bottom Sheet */}
      {optionsSheetData && (
        <ImportOptionsSheet
          importData={optionsSheetData}
          bottomSheetRef={bottomSheetRef}
          onAnimationCompleted={handleBottomSheetAnimationComplete}
        />
      )}
    </>
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
