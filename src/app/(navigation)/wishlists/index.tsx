import { useFocusEffect } from "@react-navigation/native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
// External Dependencies
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import {
  Alert,
  DeviceEventEmitter,
  type FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useDeleteWishlistMutation, useWishlists } from "@/api/wishlist";
import {
  DotsLoader,
  LargeTitle,
  PinterestRefreshIndicator,
  WishlistCard,
  WithPullToRefresh,
} from "@/components";
// Internal Dependencies
import { useActionToast } from "@/contexts";
import { BOTTOM_NAV_SCROLL_EVENT } from "@/hooks/useBottomNavigationAnimation";
import { useLargeTitleCrossfade } from "@/hooks/useLargeTitleCrossfade";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import type { WishlistCardData } from "@/libs/types";
import { createFullSlug, truncate } from "@/libs/utils";

type Wishlist = WishlistCardData;

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showToast } = useActionToast();
  const [isEditing, setIsEditing] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { mutateAsync: deleteWishlistAsync, isPending: isDeletePending } =
    useDeleteWishlistMutation();

  const {
    data,
    isError,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useWishlists();

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = React.useRef(false);

  useEffect(() => {
    if (data && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [data, isLoading]);

  // Refetch when screen gains focus (after initial load)
  // This ensures data is fresh when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we've already loaded initial data
      // (avoids refetching during initial load)
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [refetch]),
  );

  // Use the crossfade hook for title animation
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: "Wishlists",
    headerTitleStyle: {
      color: "#000",
      fontSize: 20,
      paddingLeft: 12,
      textAlign: "left",
      fontWeight: "600",
    },
  });

  // Track scroll direction for bottom nav visibility
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);
  const { scrollDirection, onScroll: handleScrollDirection } =
    useScrollDirection();

  // Emit bottom nav visibility events based on scroll direction
  const handleBottomNavVisibility = useCallback((shouldHideNav: boolean) => {
    setIsTabBarHidden(shouldHideNav);
    DeviceEventEmitter.emit(BOTTOM_NAV_SCROLL_EVENT, shouldHideNav);
  }, []);

  useAnimatedReaction(
    () => scrollDirection.value,
    (currentDirection, previousDirection) => {
      if (currentDirection === previousDirection) return;
      const shouldHideNav = currentDirection === "to-bottom";
      scheduleOnRN(handleBottomNavVisibility, shouldHideNav);
    },
  );

  // Track when header is scrolled (small header is showing)
  useAnimatedReaction(
    () => offsetY.value,
    (currentOffset) => {
      const scrolled = currentOffset > 10;
      scheduleOnRN(setIsHeaderScrolled, scrolled);
    },
  );

  // Combined scroll handler for title animation and scroll direction tracking
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Forward to title crossfade handler (update offsetY)
      offsetY.value = event.contentOffset.y;
      // Track scroll direction for bottom nav
      handleScrollDirection(event);
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: () => (
        <Pressable
          onPress={() => setIsEditing((prev) => !prev)}
          hitSlop={8}
          style={[
            styles.headerButton,
            !isLiquidGlassAvailable() &&
              !isHeaderScrolled &&
              styles.headerButtonEditing,
          ]}
        >
          <Text style={styles.headerButtonText}>
            {isEditing ? "Done" : "Edit"}
          </Text>
        </Pressable>
      ),
    });
  }, [isEditing, navigation, getHeaderOptions, isHeaderScrolled]);

  // Flatten paginated data
  const wishlists = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data?.pages],
  );
  const flatListData = wishlists;

  const handleNavigateToWishlist = useCallback(
    (item: Wishlist) => {
      const slug = createFullSlug(item.name, item.id);
      router.push(`/wishlists/${slug}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (item: Wishlist) => {
      if (isDeletePending) return;

      try {
        await deleteWishlistAsync(item.id);

        // Show success toast
        showToast({
          text: `Deleted "${item.name}"`,
          thumbnailUri: item.coverImageUri || null,
        });
      } catch (error) {
        // Haptic feedback for error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Show error alert
        Alert.alert(
          "Oops!",
          error instanceof Error
            ? error.message
            : "Failed to delete wishlist. Please try again.",
          [{ text: "OK" }],
        );
      }
    },
    [deleteWishlistAsync, isDeletePending, showToast],
  );

  const confirmDelete = useCallback(
    (item: Wishlist) => {
      Alert.alert(
        "Delete this wishlist?",
        `"${item.name}" will be permanently deleted.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleDelete(item),
          },
        ],
        { cancelable: true },
      );
    },
    [handleDelete],
  );

  const renderMeta = useCallback((item: Wishlist) => {
    return `${item.savedCount} saved`;
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Wishlist }) => (
      <WishlistCard
        item={item}
        isEditing={isEditing}
        renderMeta={renderMeta}
        onDelete={() => confirmDelete(item)}
        onPress={() => handleNavigateToWishlist(item)}
      />
    ),
    [confirmDelete, handleNavigateToWishlist, isEditing],
  );

  if (isLoading) {
    return <DotsLoader />;
  }

  // Use stable bottom padding in contentContainerStyle
  // Account for tab bar (typically ~50-60px) + safe area insets
  const stableBottomPadding = (insets.bottom || 16) + 60; // 60px for tab bar height

  return (
    <View style={styles.container}>
      {isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>
            Please try again in a moment.
          </Text>
        </View>
      ) : (
        <WithPullToRefresh
          refreshComponent={<PinterestRefreshIndicator />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshViewBaseHeight={400}
          hapticFeedbackDirection="to-bottom"
          backAnimationDuration={700}
        >
          <Animated.FlatList
            numColumns={2}
            ref={flatListRef}
            data={flatListData}
            renderItem={renderItem}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onEndReachedThreshold={0.5}
            onEndReached={handleEndReached}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: stableBottomPadding },
            ]}
            ListHeaderComponent={
              <View style={styles.titleContainer}>
                <LargeTitle
                  ref={titleRef}
                  offsetY={offsetY}
                  onLayout={measureTitle}
                  currentTitle="Wishlists"
                  opacity={largeTitleOpacity}
                  titleStyle={styles.largeTitleText}
                />
              </View>
            }
            ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
          />
        </WithPullToRefresh>
      )}
    </View>
  );
}

const CARD_GAP = 14;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 20,
    paddingHorizontal: CARD_GAP,
  },
  titleContainer: {
    marginBottom: 24,
  },
  largeTitleText: {
    fontSize: 34,
    fontWeight: "600",
  },
  columnWrapper: {
    gap: CARD_GAP,
    justifyContent: "space-between",
  },
  headerButton: {
    paddingHorizontal: Platform.select({ ios: 12, default: 10 }),
    paddingVertical: Platform.select({ ios: 8, default: 6 }),
  },
  headerButtonEditing: {
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerButtonText: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
  },
  placeholderTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8a8a8a",
  },
  placeholderTileRecent: {
    padding: 16,
  },
  placeholderTileSingle: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});
