import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, {
  useLayoutEffect,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  Alert,
  type FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// External Dependencies
import Animated from "react-native-reanimated";

import { useWishlistDetails } from "@/api/wishlist";
import {
  DotsLoader,
  LargeTitle,
  PinterestRefreshIndicator,
  WithPullToRefresh,
} from "@/components";
import { HeroSlideShow } from "@/components/HeroSlideShow";
// Internal Dependencies
import { Notes } from "@/components/Notes";
import { WishlistMembers, WishlistToggleButton } from "@/components/Wishlist";
import { useLargeTitleCrossfade } from "@/hooks";
import type { WishlistRecommendation } from "@/libs/types/Wishlists/Wishlist";
import { createFullSlug, parseSlug } from "@/libs/utils";

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const NOT_IMPLEMENTED = () =>
  Alert.alert("Not yet implemented", "Coming soon!");

export default function WishlistDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const flatListRef = React.useRef<FlatList>(null);

  // Parse slug to get wishlist ID
  const { slug: wishlistSlug } = useLocalSearchParams<{ slug?: string }>();
  const { id: wishlistId } = parseSlug(wishlistSlug ?? "");

  // Pending deletions and additions state for undo pattern
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set(),
  );
  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(
    new Set(),
  );

  const {
    data,
    refetch,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWishlistDetails(wishlistSlug ?? "");

  const wishlist = data?.pages[0]?.metadata;

  /**
   * Use the crossfade hook for title animation
   */
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: wishlist?.name ?? "Wishlist",
  });

  /**
   * Flatten paginated recommendations and filter out pending deletions
   * Also include pending additions (items that were added but can be undone)
   */
  const recommendations = useMemo(() => {
    const allRecommendations =
      data?.pages.flatMap((page) => page.recommendations) ?? [];
    const filtered = allRecommendations.filter(
      (rec) => !pendingDeletions.has(rec.id),
    );

    // Note: pendingAdditions are already in the list, we just track them for undo
    // If we need to show them optimistically before they appear in data,
    // we'd need to add them here, but mutations handle optimistic updates
    return filtered;
  }, [data?.pages, pendingDeletions]);

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = React.useRef(false);

  /**
   * Track if initial data has loaded to avoid refetching on first mount
   */
  useEffect(() => {
    if (data && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [data, isLoading]);

  /**
   * Always refetch when screen gains focus (after initial load)
   * useFocusEffect is more reliable than addListener('focus') for
   * React Navigation
   */
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we've already loaded initial data
      // (avoids refetching during initial load). React Query
      // will handle deduplication if a fetch is already in progress
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [refetch]),
  );

  // Clean up pending deletions and additions: if an item was successfully deleted on server,
  // it won't be in the refetched data, so remove it from pending set
  useEffect(() => {
    if (!data || (pendingDeletions.size === 0 && pendingAdditions.size === 0))
      return;

    const currentIds = new Set(
      data.pages.flatMap((page) => page.recommendations.map((rec) => rec.id)),
    );

    setPendingDeletions((prev) => {
      const next = new Set(prev);
      for (const id of prev) {
        if (!currentIds.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });

    setPendingAdditions((prev) => {
      const next = new Set(prev);
      for (const id of prev) {
        if (!currentIds.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [data, pendingDeletions.size, pendingAdditions.size]);

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

  const handleEllipsesPress = useCallback(() => {
    if (!wishlistSlug) return;
    router.push({
      pathname: "/wishlists/[slug]/options",
      params: { slug: wishlistSlug },
    });
  }, [router, wishlistSlug]);

  const handleMapPress = useCallback(() => {
    if (!wishlistSlug) return;
    router.push({
      pathname: "/wishlists/[slug]/recommendations",
      params: { slug: wishlistSlug },
    });
  }, [router, wishlistSlug]);

  const handleSlideShowPress = useCallback(
    (recommendationId: string, recommendationName: string) => {
      const recommendationSlug = createFullSlug(
        recommendationName,
        recommendationId,
      );
      router.push({
        pathname: "/recommendations/[slug]",
        params: { slug: recommendationSlug },
      });
    },
    [router],
  );

  /**
   * Handle undo for removal - removes from pending deletions
   */
  const handleUndoRemove = useCallback((recommendationId: string) => {
    setPendingDeletions((prev) => {
      const next = new Set(prev);
      next.delete(recommendationId);
      return next;
    });
  }, []);

  /**
   * Handle undo for addition - removes from pending additions
   */
  const handleUndoAdd = useCallback((recommendationId: string) => {
    setPendingAdditions((prev) => {
      const next = new Set(prev);
      next.delete(recommendationId);
      return next;
    });
  }, []);

  // Check if wishlist is empty (no recommendations)
  const isEmpty = !isLoading && recommendations.length === 0;

  /**
   * Header right component - Map icon (only when not empty) and ellipses
   */
  const HeaderRight = useCallback(
    () => (
      <View style={styles.headerRightContainer}>
        {!isEmpty && (
          <TouchableOpacity
            hitSlop={HIT_SLOP}
            onPress={handleMapPress}
            style={styles.headerButton}
          >
            <FontAwesome name="map-o" size={16} color="#000" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          hitSlop={HIT_SLOP}
          onPress={handleEllipsesPress}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    ),
    [handleMapPress, handleEllipsesPress, isEmpty],
  );

  /**
   * Set up header options - hide title when empty but keep same header styling
   */
  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: HeaderRight,
    });
  }, [navigation, getHeaderOptions, HeaderRight, isEmpty]);

  const renderRatingMetadata = useCallback((rating: number) => {
    if (rating <= 0) return undefined;
    return (
      <View style={styles.ratingMetadata}>
        <Ionicons name="star" size={14} color="#000" />
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  }, []);

  const renderRecommendationItem = useCallback(
    ({ item: recommendation }: { item: WishlistRecommendation }) => {
      const recommendationSlug = createFullSlug(
        recommendation.name,
        recommendation.id,
      );
      const isSaved = recommendation.wishlistIds.includes(wishlistId);

      // Track when action starts (add to pending sets)
      const handleActionStart = () => {
        if (isSaved) {
          // Currently saved, so we're removing
          setPendingDeletions((prev) => new Set(prev).add(recommendation.id));
        } else {
          // Currently not saved, so we're adding
          setPendingAdditions((prev) => new Set(prev).add(recommendation.id));
        }
      };

      // Handle undo - remove from pending sets
      const handleUndo = () => {
        if (isSaved) {
          // Currently saved, so undo would be for removal
          handleUndoRemove(recommendation.id);
        } else {
          // Currently not saved, so undo would be for addition
          handleUndoAdd(recommendation.id);
        }
      };

      const handleAddNote = () => {
        router.push({
          pathname: `/wishlists/[slug]/recommendations/[slug]/note` as any,
          params: {
            wishlistSlug,
            recommendationSlug,
          },
        });
      };

      const handleEditNote = (note: { id: string; text?: string }) => {
        router.push({
          pathname: `/wishlists/[slug]/recommendations/[slug]/note/[id]` as any,
          params: {
            wishlistSlug,
            id: note.id,
            recommendationSlug,
            noteText: note.text ?? "",
          },
        });
      };

      return (
        <View style={styles.recommendationCard}>
          <HeroSlideShow
            id={recommendation.id}
            name={recommendation.name}
            onPress={handleSlideShowPress}
            imageUrls={recommendation.imageUris}
            description={recommendation.description}
            metadataRight={renderRatingMetadata(recommendation.rating)}
            topRightAction={
              <WishlistToggleButton
                size={24}
                isSaved={isSaved}
                wishlistId={wishlistId}
                onUndo={handleUndo}
                wishlistName={wishlist?.name}
                onActionStart={handleActionStart}
                recommendationSlug={recommendationSlug}
                thumbnailUri={recommendation.imageUris?.[0]}
              />
            }
          />

          {/* Notes Section */}
          <View style={styles.notesContainer}>
            <Notes
              onVote={NOT_IMPLEMENTED}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              votes={recommendation.votes}
              notes={recommendation.notes || []}
            />
          </View>
        </View>
      );
    },
    [
      router,
      wishlistId,
      wishlistSlug,
      wishlist?.name,
      handleUndoAdd,
      handleUndoRemove,
      renderRatingMetadata,
      handleSlideShowPress,
    ],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <View style={styles.titleContainer}>
          <LargeTitle
            ref={titleRef}
            offsetY={offsetY}
            onLayout={measureTitle}
            opacity={largeTitleOpacity}
            currentTitle={wishlist?.name ?? "Wishlist"}
          />
        </View>
        {wishlist?.members && wishlist.members.length > 0 && (
          <View style={styles.membersContainer}>
            <WishlistMembers members={wishlist.members} />
          </View>
        )}
      </>
    ),
    [
      offsetY,
      titleRef,
      measureTitle,
      wishlist?.name,
      wishlist?.members,
      largeTitleOpacity,
    ],
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <DotsLoader />
      </View>
    );
  }

  return (
    <WithPullToRefresh
      refreshComponent={<PinterestRefreshIndicator />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      refreshViewBaseHeight={400}
      hapticFeedbackDirection="to-bottom"
      backAnimationDuration={700}
    >
      <Animated.FlatList
        ref={flatListRef}
        data={recommendations}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.container}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderRecommendationItem}
        ListEmptyComponent={<WishlistEmptyState />}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerHeight + 16 },
        ]}
        onEndReachedThreshold={0.5}
        onEndReached={handleEndReached}
        ListFooterComponent={isFetchingNextPage ? <DotsLoader /> : null}
      />
    </WithPullToRefresh>
  );
}

/**
 * Wishlist Empty State
 */
const WishlistEmptyState: React.FC = () => {
  const router = useRouter();

  const handleStartExploringPress = useCallback(() => {
    router.push("/(navigation)/(home)/(tabs)");
  }, [router]);

  return (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateHeading}>No saves yet</Text>
      <Text style={styles.emptyStateDescription}>
        As you search, tap the heart icon to save your favorite recommendations
        to a wishlist.
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.startExploringButton}
        onPress={handleStartExploringPress}
      >
        <Text style={styles.startExploringButtonText}>Start exploring</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  titleContainer: {
    marginBottom: 16,
  },
  membersContainer: {
    marginBottom: 16,
  },
  recommendationCard: {
    marginBottom: 24,
    gap: 25,
  },
  notesContainer: {
    marginTop: 0,
  },
  headerRightContainer: {
    gap: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerButton: {
    paddingVertical: 8,
  },
  ratingMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: 30,
  },
  emptyStateHeading: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000",
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 17,
    color: "#667",
    lineHeight: 24,
    marginBottom: 24,
  },
  startExploringButton: {
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignSelf: "flex-start",
    backgroundColor: "#000",
  },
  startExploringButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
