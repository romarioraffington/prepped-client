// External Dependencies
import { FlashList } from "@shopify/flash-list";
import Animated from "react-native-reanimated";
import { forwardRef, useCallback, useMemo, type ComponentRef } from "react";

import {
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
} from "react-native";

// Create animated FlashList for reanimated scroll handler support
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

// Layout constants
const COLUMN_GAP = 20;
const HORIZONTAL_PADDING = 10;
const { width } = Dimensions.get("window");
const columnWidth = (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

type FlashListInstance = ComponentRef<typeof FlashList>;

interface StaggeredGridProps {
  items?: any[];
  isLoading?: boolean;
  headerHeight?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;

  // Render function receives item and index for masonry height variation
  renderItem: (item: any, index: number) => React.ReactNode;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  animatedScrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  // Threshold (0-10) for triggering onEndReached.
  // 0.5 = halfway through remaining content
  onEndReached?: () => void;
  onEndReachedThreshold?: number;

  // Support ListHeaderComponent for pull-to-refresh
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;

  // Props that WithPullToRefresh may inject
  scrollEventThrottle?: number;
  bounces?: boolean; // FlashList doesn't support this, but we accept it to avoid prop warnings
}

export const StaggeredGrid = forwardRef<FlashListInstance | null, StaggeredGridProps>(
  (
    {
      items,
      onScroll,
      renderItem,
      onEndReached,
      animatedScrollHandler,
      isLoading,
      headerHeight = 0,
      refreshControl,
      ListHeaderComponent,
      onEndReachedThreshold = 0.5,
      scrollEventThrottle = 16,
    },
    ref,
  ) => {
    // Stable keyExtractor
    const keyExtractor = useCallback((item: any) => item.id.toString(), []);

    // Adapt renderItem for FlashList's expected signature
    // Pass index for masonry height variation
    const flashListRenderItem = useCallback(
      ({ item, index }: { item: any; index: number }) => (
        <View style={styles.itemWrapper}>{renderItem(item, index)}</View>
      ),
      [renderItem],
    );

    const contentContainerStyle = useMemo(
      () => ({ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: headerHeight + 16 }),
      [headerHeight],
    );

    // Footer component for loading indicator
    const ListFooterComponent = useCallback(
      () =>
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#222" />
          </View>
        ) : null,
      [isLoading],
    );

    // Use onScroll if provided (from WithPullToRefresh - already composed),
    // otherwise fall back to animatedScrollHandler
    const scrollHandler = onScroll || animatedScrollHandler;

    // Use AnimatedFlashList to support reanimated scroll handlers
    // Note: bounces prop is ignored as FlashList doesn't support it
    return (
      <AnimatedFlashList
        masonry
        ref={ref as React.Ref<FlashListInstance>}
        data={items}
        numColumns={2}
        onScroll={scrollHandler}
        onEndReached={onEndReached}
        keyExtractor={keyExtractor}
        renderItem={flashListRenderItem}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        onEndReachedThreshold={onEndReachedThreshold}
        contentContainerStyle={contentContainerStyle}
      />
    );
  },
);

const styles = StyleSheet.create({
  itemWrapper: {
    width: columnWidth,
    marginBottom: 20,
    // Half the gap on each side creates the column spacing
    marginHorizontal: COLUMN_GAP / 2,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
