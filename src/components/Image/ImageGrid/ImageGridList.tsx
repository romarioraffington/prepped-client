import { type ReactElement, forwardRef, useCallback, useMemo } from "react";
// External Dependencies
import Animated from "react-native-reanimated";

import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  type RefreshControlProps,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ImageGridItem as ImageGridItemType } from "@/libs/types";
import { formatRelativeTime } from "@/libs/utils/date";
// Internal Imports
import { ImageGridItem } from "./ImageGridItem";
import { LoadingImageGridList } from "./LoadingImageGridList";

interface ImageGridListProps {
  isLoading?: boolean;
  isLoadingMore?: boolean;
  loadingRows?: number;
  items: ImageGridItemType[];
  scrollEventThrottle?: number;
  onEndReachedThreshold?: number;
  contentContainerStyle?: ViewStyle;
  ListHeaderComponent?: ReactElement;
  refreshControl?: ReactElement<RefreshControlProps>;
  onItemPress: (item: ImageGridItemType) => void;
  onItemOptionsPress?: (item: ImageGridItemType) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  animatedScrollHandler?: ReturnType<
    typeof import("react-native-reanimated").useAnimatedScrollHandler
  >;
  onEndReached?: () => void;
}

export const ImageGridList = forwardRef<
  FlatList<ImageGridItemType> | null,
  ImageGridListProps
>(
  (
    {
      items,
      isLoading,
      isLoadingMore,
      loadingRows,
      refreshControl,
      scrollEventThrottle,
      onEndReachedThreshold,
      contentContainerStyle,
      ListHeaderComponent,
      onScroll,
      onItemPress,
      onEndReached,
      onItemOptionsPress,
      animatedScrollHandler,
    },
    ref,
  ) => {
    // Stable keyExtractor to avoid re-renders
    const keyExtractor = useCallback(
      (item: ImageGridItemType) => item.id.toString(),
      [],
    );

    // Memoize renderItem to avoid re-creations and VirtualizedList churn
    const renderItem = useCallback(
      ({ item }: { item: ImageGridItemType }) => {
        // Generate metadata showing recipe count and last updated timestamp
        const recipeCount =
          item.count > 0 ? (
            <Text style={styles.recipeCountText}>
              {item.count} {item.count === 1 ? "Recipe" : "Recipes"}
            </Text>
          ) : null;

        const timestamp = item.lastUpdatedTimestamp
          ? formatRelativeTime(item.lastUpdatedTimestamp)
          : null;

        const timestampText = timestamp ? (
          <Text style={styles.timestampText}>{timestamp}</Text>
        ) : null;

        const metadata =
          recipeCount || timestampText ? (
            <View style={styles.metadataRow}>
              {recipeCount}
              {recipeCount && timestampText && (
                <Text style={styles.metadataSeparator}> </Text>
              )}
              {timestampText}
            </View>
          ) : null;

        return (
          <ImageGridItem
            item={item}
            heading={item.name}
            metadata={metadata}
            onItemPress={onItemPress}
            onOptionsPress={
              onItemOptionsPress ? () => onItemOptionsPress(item) : undefined
            }
          />
        );
      },
      [onItemPress, onItemOptionsPress],
    );

    // Always render footer to prevent layout shifts - use empty view when not loading
    // This prevents FlatList from recalculating layouts when footer appears/disappears
    const ListFooterComponent = useMemo(
      () =>
        isLoadingMore ? (
          <LoadingImageGridList rows={4} />
        ) : (
          <View style={{ height: 0 }} />
        ),
      [isLoadingMore],
    );

    // Show full loading screen only when there are no items and it's initial loading
    if (isLoading && items.length === 0) {
      return (
        <View style={contentContainerStyle}>
          {ListHeaderComponent}
          <LoadingImageGridList rows={loadingRows} />
        </View>
      );
    }

    // Use Animated.FlatList when animatedScrollHandler is provided
    // Prefer onScroll if provided (from WithPullToRefresh), otherwise use animatedScrollHandler
    if (animatedScrollHandler || onScroll) {
      const scrollHandler = onScroll || animatedScrollHandler;
      return (
        <Animated.FlatList
          ref={ref as React.Ref<FlatList<ImageGridItemType>>}
          data={items}
          numColumns={2}
          scrollEventThrottle={16}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          onScroll={scrollHandler}
          refreshControl={refreshControl}
          columnWrapperStyle={styles.itemRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          onEndReachedThreshold={onEndReachedThreshold}
          contentContainerStyle={contentContainerStyle}
          // Performance optimizations
          windowSize={7}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          removeClippedSubviews
        />
      );
    }

    return (
      <FlatList
        ref={ref}
        data={items}
        numColumns={2}
        onScroll={onScroll}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        refreshControl={refreshControl}
        columnWrapperStyle={styles.itemRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        onEndReachedThreshold={onEndReachedThreshold}
        contentContainerStyle={contentContainerStyle}
        // Performance optimizations
        windowSize={7}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        removeClippedSubviews
      />
    );
  },
);

const styles = StyleSheet.create({
  itemRow: {
    marginBottom: 10,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeCountText: {
    fontFamily: Platform.select({
      android: "Manrope_500Medium",
      ios: "Manrope-Medium",
    }),
    color: "#666",
    fontSize: 14,
  },
  timestampText: {
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
    color: "#999",
    fontSize: 14,
  },
  metadataSeparator: {
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
    color: "#999",
    fontSize: 14,
  },
});
