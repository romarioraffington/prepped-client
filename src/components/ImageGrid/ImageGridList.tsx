// External Dependencies
import Animated from "react-native-reanimated";
import { forwardRef, useCallback, useMemo, type ReactElement } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  type ViewStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
} from "react-native";

// Internal Imports
import { ImageGridItem } from "./ImageGridItem";
import { LoadingImageGridList } from "./LoadingImageGridList";
import type { ImageGridItem as ImageGridItemType } from "@/libs/types";

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

export const ImageGridList = forwardRef<FlatList<ImageGridItemType> | null, ImageGridListProps>(
  (
    {
      items,
      isLoading,
      isLoadingMore,
      loadingRows,
      refreshControl,
      scrollEventThrottle,
      ListHeaderComponent,
      onScroll,
      animatedScrollHandler,
      onItemPress,
      onItemOptionsPress,
      onEndReached,
      onEndReachedThreshold,
      contentContainerStyle,
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
        // Generate metadata showing cities and recommendations count
        const metadataParts: string[] = [];
        if (item.citiesCount && item.citiesCount > 0) {
          metadataParts.push(`${item.citiesCount} ${item.citiesCount === 1 ? 'city' : 'cities'}`);
        }
        if (item.recommendationsCount > 0) {
          metadataParts.push(`${item.recommendationsCount} ${item.recommendationsCount === 1 ? 'place' : 'places'}`);
        }
        const metadata = metadataParts.length > 0 ? (
          <Text style={styles.metadataText}>{metadataParts.join(' • ')}</Text>
        ) : null;

        return (
          <ImageGridItem
            item={item}
            heading={item.name}
            metadata={metadata}
            onItemPress={onItemPress}
            onOptionsPress={onItemOptionsPress ? () => onItemOptionsPress(item) : undefined}
          />
        );
      },
      [onItemPress, onItemOptionsPress],
    );

    // Always render footer to prevent layout shifts - use empty view when not loading
    // This prevents FlatList from recalculating layouts when footer appears/disappears
    const ListFooterComponent = useMemo(
      () => isLoadingMore ? <LoadingImageGridList rows={4} /> : <View style={{ height: 0 }} />,
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
    if (animatedScrollHandler) {
      return (
        <Animated.FlatList
          ref={ref as React.Ref<FlatList<ImageGridItemType>>}
          data={items}
          numColumns={2}
          scrollEventThrottle={16}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          onScroll={animatedScrollHandler}
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
  metadataText: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
});
