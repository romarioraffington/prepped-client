// External Dependencies
import { Image } from "expo-image";
import type { Region } from "react-native-maps";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useMemo, useRef, useState, useEffect, useCallback, memo } from "react";

import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import Animated, {
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MarkerPressEvent,
} from "react-native-maps";

// Internal dependencies
import { createFullSlug, truncate } from "@/libs/utils";
import type { RecommendationListItem } from "@/libs/types";

// Direct imports to avoid cyclic dependency:
import { MapEntityCard } from "@/components/Map/MapEntityCard";
import { MapLocationMarker } from "@/components/Map/MapLocationMarker";
import { EntityCard, LoadingEntityCardList } from "@/components/Entity";

// Offset for the marker cards
const MARKER_CARDS_BOTTOM_OFFSET = 130;

// Duration of the marker cards animation
const MARKER_CARDS_ANIMATION_DURATION = 450;

// Dimensions for the MapView
const { width, height } = Dimensions.get("window");

// Marker card calculations
const MARKER_CARD_MARGIN = 8;
const MARKER_CARD_WIDTH = width * 0.7;
const MARKER_CARD_SNAP_INTERVAL = MARKER_CARD_WIDTH + MARKER_CARD_MARGIN * 2;

interface RecommendationsScreenProps {
  name: string;
  isLoading: boolean;
  region?: Region | null;
  previousTitle?: string;
  subtitle?: React.ComponentType;
  recommendations: RecommendationListItem[];

  // Optional render prop for action buttons (WishlistButtonWithCount + OptionsButton)
  renderItemActions?: (props: {
    item: RecommendationListItem;
    slug: string;
  }) => React.ReactNode;

  // Optional render prop for swipe wrapper
  renderSwipeableItem?: (props: {
    item: RecommendationListItem;
    slug: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

// Move ItemSeparatorComponent outside to avoid recreating it on every render
const ItemSeparator = () => <View style={styles.separator} />;

// Move contentContainerStyle outside to avoid recreating it on every render
const itemContentContainerStyle = { paddingLeft: 16, paddingRight: 5 };

// Estimated EntityCard height for getItemLayout optimization
// Breakdown: ImageCarousel (140) + Title (28) + RatingInfo (20) + EntityInfo (20)
// + HoursStatus (20) + Padding (24) + Gap (12) + Separator (16) = ~310px average
const ESTIMATED_ENTITY_CARD_HEIGHT = 310;
const SEPARATOR_HEIGHT = 16; // 1px height + 15px marginBottom

// Memoized marker component with dynamic tracksViewChanges
// to prevent flickering while allowing visual selection updates
const MemoizedMarker = memo(({
  index,
  isSelected,
  recommendation,
  onPress,
}: {
  index: number;
  isSelected: boolean;
  recommendation: RecommendationListItem;
  onPress: (event: MarkerPressEvent) => void;
}) => {
  const isFirstRender = useRef(true);
  const [shouldTrack, setShouldTrack] = useState(isSelected);

  useEffect(() => {
    // Skip tracking on initial mount for non-selected markers
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isSelected) {
        setShouldTrack(false);
        return;
      }
    }

    // Enable tracking when selection or index
    // changes, then disable after render
    setShouldTrack(true);
    const timer = setTimeout(() => setShouldTrack(false), 300);
    return () => clearTimeout(timer);
  }, [isSelected, index]);

  return (
    <Marker
      identifier={recommendation.id}
      coordinate={recommendation.coordinates}
      onPress={onPress}
      tracksViewChanges={shouldTrack}
    >
      <MapLocationMarker
        content={`${index + 1}`}
        isSelected={isSelected}
      />
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Re-render if isSelected, recommendation.id, or index changes
  return prevProps.isSelected === nextProps.isSelected &&
    prevProps.recommendation.id === nextProps.recommendation.id &&
    prevProps.index === nextProps.index;
});

export const RecommendationsScreen = ({
  name,
  region,
  isLoading,
  previousTitle,
  recommendations,
  renderItemActions,
  renderSwipeableItem,
  subtitle: Subtitle,
}: RecommendationsScreenProps) => {
  // Refs
  const scrollViewWidth = useRef(0);
  const map = useRef<MapView | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const markerCardsRef = useRef<FlatList<RecommendationListItem>>(null);

  // Flag to prevent marker updates during programmatic
  // scrolling when we programmatically scroll to a card
  // (e.g., when a marker is clicked), we don't want the
  // scroll events to trigger marker updates until the
  // scroll is complete
  const isProgrammaticScroll = useRef(false);

  // State
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [activeMakerCardIndex, setActiveMakerCardIndex] = useState<number | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationListItem | null>(null);


  const snapPoints = useMemo(() => {
    return recommendations.length > 1
      ? ["12%", "50%", "88%"]
      : ["12%", "45%", "88%"];
  }, [recommendations.length]);

  // State - Animated marker cards
  const markerCardsOpacity = useSharedValue(0);
  const markerCardsAnimation = useSharedValue(120);

  // Coordinates for the map - memoized to prevent recalculation on every render
  const coordinates = useMemo(
    () => recommendations.map((r) => r.coordinates),
    [recommendations]
  );

  const animatedMarkerCardsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: markerCardsAnimation.value }],
    opacity: markerCardsOpacity.value,
  }));

  // Effects
  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: previousTitle ?? name ?? "Back",
    });
  }, [navigation, previousTitle, name]);

  useEffect(() => {
    // Show skeleton when list is empty
    if (recommendations.length === 0 && !isLoading) {
      setShowSkeleton(false);
      return;
    }

    // If map is ready, hide
    // skeleton immediately
    if (isMapReady) {
      setShowSkeleton(false);
      return;
    }

    // Only show skeleton when
    // loading and map not ready
    if (isLoading && !isMapReady) {
      setShowSkeleton(true);

      // Set a timer to hide skeleton
      // after minimum display time.
      // This prevents the skeleton
      // from flashing for quick loads
      const timer = setTimeout(() => {
        // Only hide if map is ready
        // (don't override if map became ready earlier)
        if (isMapReady) {
          setShowSkeleton(false);
        }
      }, 800); // Minimum 800ms display time

      return () => clearTimeout(timer);
    }
  }, [isLoading, isMapReady, recommendations.length]);

  // Refit map when recommendations change (e.g., after deletion)
  useEffect(() => {
    // Only refit if map is ready and we have recommendations
    if (!isMapReady || !map.current || !recommendations?.length) {
      return;
    }

    // Clear selection if the selected recommendation no longer exists
    if (selectedRecommendation) {
      const stillExists = recommendations.some(
        (r) => r.id === selectedRecommendation.id
      );
      if (!stillExists) {
        setSelectedRecommendation(null);
        setActiveMakerCardIndex(null);
        // Continue to refit below
      } else {
        // Don't refit if a marker is currently selected (user is interacting)
        return;
      }
    }

    // For single recommendation, use the region prop if available
    if (recommendations.length === 1 && region) {
      map.current.animateToRegion(region, 300);
      return;
    }

    // For multiple recommendations, fit to all coordinates
    if (recommendations.length > 1) {
      map.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: Math.round(height * 0.2),
          right: Math.round(width * 0.2),
          bottom: Math.round(height * 0.55),
          left: Math.round(width * 0.2),
        },
        animated: true,
      });
    }
  }, [recommendations, coordinates, isMapReady, region, selectedRecommendation, height, width]);

  // Memoize handleMapReady to prevent recreation on every render
  const handleMapReady = useCallback(() => {
    if (isMapReady) {
      return;
    }

    if (!map.current || !recommendations?.length) {
      return;
    }

    // Only use fitToCoordinates for multiple markers
    // For single markers, let the initial region handle the zoom
    if (recommendations.length === 1) {
      setIsMapReady(true);
      return;
    }

    map.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: Math.round(height * 0.2), // 20% from top
        right: Math.round(width * 0.2), // 20% from right
        bottom: Math.round(height * 0.55), // 55% from bottom (accounts for bottom sheet)
        left: Math.round(width * 0.2), // 20% from left
      },
      animated: false,
    });

    setIsMapReady(true);
  }, [isMapReady, recommendations, coordinates, height, width]);

  // Memoize handleMakerCardScroll to prevent recreation on every render
  const handleMakerCardScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!markerCardsRef.current || isProgrammaticScroll.current) {
      return;
    }

    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / MARKER_CARD_SNAP_INTERVAL);

    if (
      index !== activeMakerCardIndex &&
      index >= 0 &&
      index < recommendations.length
    ) {
      setActiveMakerCardIndex(index);
      setSelectedRecommendation(recommendations[index]);
    }
  }, [activeMakerCardIndex, recommendations]);

  // Memoize handleMakerCardLayout to prevent recreation on every render
  const handleMakerCardLayout = useCallback((event: any) => {
    scrollViewWidth.current = event.nativeEvent.layout.width;

    // If we have a selected recommendation, scroll to its position
    if (selectedRecommendation && markerCardsRef.current) {
      const index = recommendations.findIndex(
        (r) => r.id === selectedRecommendation.id,
      );

      if (index < 0) {
        return;
      }

      isProgrammaticScroll.current = true;

      // Use scrollToIndex for FlatList
      markerCardsRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // Center the item
      });

      // Reset the flag after a short delay to ensure the scroll has completed
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 300);
    }
  }, [selectedRecommendation, recommendations]);

  // Memoize handleMarkerPress to prevent recreation on every render
  const handleMarkerPress = useCallback((event: MarkerPressEvent) => {
    const markerId = event.nativeEvent?.id;
    const recommendation = recommendations.find((rec) => rec.id === markerId);

    if (!recommendation) {
      return;
    }

    // Find the index of the selected recommendation
    const index = recommendations.findIndex(
      (rec) => rec.id === recommendation.id,
    );

    // Set programmatic scroll flag BEFORE any state updates or animations
    // to prevent handleMakerCardScroll from interfering
    isProgrammaticScroll.current = true;

    setSelectedRecommendation(recommendation);
    setActiveMakerCardIndex(index);
    bottomSheetRef.current?.snapToIndex(0);

    // Animate marker cards down with opacity
    markerCardsAnimation.value = withTiming(0, {
      duration: MARKER_CARDS_ANIMATION_DURATION,
    });

    // Animate marker cards up with opacity
    markerCardsOpacity.value = withTiming(1, {
      duration: MARKER_CARDS_ANIMATION_DURATION,
    });

    // Scroll to the selected card
    // Use setTimeout to ensure state updates have propagated
    setTimeout(() => {
      if (markerCardsRef.current) {
        // Use scrollToIndex for FlatList
        markerCardsRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // Center the item
        });

        // Reset the flag after the animation duration plus a small buffer
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, MARKER_CARDS_ANIMATION_DURATION + 100);
      }
    }, 0);
  }, [recommendations, markerCardsAnimation, markerCardsOpacity]);

  // Memoize handleBottomSheetAnimation to prevent recreation on every render
  const handleBottomSheetAnimation = useCallback((fromIndex: number, toIndex: number) => {
    // When the bottom sheet first mounts,
    // do not run the animations
    if (fromIndex < 0) {
      return;
    }

    // Only animate the map when the bottom sheet is going
    // to to index 0 or 1, the first two snap points
    if (toIndex > 1) {
      return;
    }

    // Only clear selection when EXPANDING the bottom sheet (user dragging up),
    // not when COLLAPSING (which happens when marker is pressed).
    // This prevents clearing the selection when a marker is tapped.
    const isExpanding = toIndex > fromIndex;

    // If we have a selected recommendation and the bottom sheet is expanding,
    // animate the marker cards down and up with opacity, then clear selection
    if (selectedRecommendation && isExpanding) {
      // Animate marker cards down
      markerCardsAnimation.value = withTiming(MARKER_CARDS_BOTTOM_OFFSET, {
        duration: MARKER_CARDS_ANIMATION_DURATION,
      });

      // Animate marker cards up with opacity
      markerCardsOpacity.value = withTiming(0, {
        duration: MARKER_CARDS_ANIMATION_DURATION,
      });

      setSelectedRecommendation(null);
      setActiveMakerCardIndex(null);
    }

    // If we have a single recommendation, we
    // need to modify the zoom in effect
    if (recommendations.length === 1) {
      if (!region) {
        return;
      }

      // Duration of the zoom animation (in milliseconds)
      const ANIMATION_DURATION = 300;

      // Amount to shift the map upward when the bottom
      //sheet is collapsed (in degrees of latitude)
      const COLLAPSED_LATITUDE_OFFSET = 0.02;

      // Controls how much the map zooms in when bottom sheet
      // is collapsed (0.7 = 70% of original zoom). The higher
      // the value, the more the map zooms in.
      const ZOOM_FACTOR = 0.7;

      const newRegion: Region = {
        ...region,
        latitude:
          region.latitude + (toIndex === 0 ? COLLAPSED_LATITUDE_OFFSET : 0),
        latitudeDelta:
          toIndex === 0
            ? region.latitudeDelta * ZOOM_FACTOR
            : region.latitudeDelta,
        longitudeDelta:
          toIndex === 0
            ? region.longitudeDelta * ZOOM_FACTOR
            : region.longitudeDelta,
      };

      map.current?.animateToRegion(newRegion, ANIMATION_DURATION);
      return;
    }

    // Zoomed out: The default values causes
    // the map to have a zoomed in effect
    let topPercentage = 0.1; // 10% from top
    let rightPercentage = 0.1; // 10% from right
    let leftPercentage = 0.1; // 10% from left
    let bottomPercentage = 0.4; // 40% from bottom (accounts for the MapEntityCard)

    // Zoomed in: When the bottom sheet is back
    // to it's orginal position, we want the map zoom
    // to go back to the original values
    if (toIndex === 1) {
      topPercentage = 0.2;
      rightPercentage = 0.2;
      leftPercentage = 0.2;
      bottomPercentage = 0.55;
    }

    map.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: Math.round(height * topPercentage),
        right: Math.round(width * rightPercentage),
        bottom: Math.round(height * bottomPercentage),
        left: Math.round(width * leftPercentage),
      },
      animated: true,
    });
  }, [
    region,
    width,
    height,
    coordinates,
    recommendations,
    selectedRecommendation,
    markerCardsAnimation,
    markerCardsOpacity,
  ]
  );

  // Memoize handleRecommendationPress to prevent recreation on every render
  const handleRecommendationPress = useCallback((item: RecommendationListItem) => {
    router.push({
      pathname: "/recommendations/[slug]",
      params: {
        slug: createFullSlug(item.name, item.id),
      },
    });
  }, [router]);


  // Memoize renderItem to prevent recreation on every render
  const renderItem = useCallback(({
    item,
    index,
  }: { item: RecommendationListItem; index: number }) => {
    const slug = createFullSlug(item.name, item.id);
    return (
      <RecommendationListItemComponent
        slug={slug}
        item={item}
        index={index}
        onPress={handleRecommendationPress}
        renderItemActions={renderItemActions}
        renderSwipeableItem={renderSwipeableItem}
        itemContentContainerStyle={itemContentContainerStyle}
      />
    );
  }, [
    renderItemActions,
    renderSwipeableItem,
    itemContentContainerStyle,
    handleRecommendationPress,
  ]);

  // Memoize keyExtractor to prevent recreation on every render
  const keyExtractor = useCallback((item: RecommendationListItem) => item.id, []);

  // Memoize renderMarkerCard to prevent recreation on every render
  const renderMarkerCard = useCallback(({
    item,
    index,
  }: { item: RecommendationListItem; index: number }) => {
    // Calculate values once per item render
    const itemSlug = createFullSlug(item.name, item.id);

    return (
      <MapEntityCard
        hours={item?.hours}
        category={item.category}
        imageUrls={item.images || []}
        priceRange={item.priceRange}
        rating={item?.reviews?.rating}
        isAccessible={item.isAccessible}
        reviewCount={item?.reviews?.count}
        title={`${index + 1}. ${item.name}`}
        renderActions={renderItemActions ? () => renderItemActions({ item, slug: itemSlug }) : undefined}
        onPress={() => handleRecommendationPress(item)}
      />
    );
  }, [handleRecommendationPress, renderItemActions]);

  // Memoize getItemLayout for FlatList performance
  const getMarkerCardItemLayout = useCallback(
    (_: any, index: number) => ({
      length: MARKER_CARD_SNAP_INTERVAL,
      offset: MARKER_CARD_SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  // Memoize getItemLayout for BottomSheetFlatList performance
  // This significantly improves scroll performance by allowing FlatList
  // to calculate item positions without measuring each item
  const getBottomSheetItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ESTIMATED_ENTITY_CARD_HEIGHT + SEPARATOR_HEIGHT,
      offset: (ESTIMATED_ENTITY_CARD_HEIGHT + SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );


  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* Map View */}
      <View style={styles.mapViewContainer}>
        <MapView
          ref={map}
          userInterfaceStyle="light"
          provider={PROVIDER_GOOGLE}
          onMapReady={handleMapReady}
          onMapLoaded={handleMapReady}
          initialRegion={region || undefined}
          key={`map-recommendation-screen-${name}`}
          style={[styles.map, { opacity: isMapReady ? 1 : 1 }]}
        >
          {recommendations.map((recommendation, index) => (
            <MemoizedMarker
              index={index}
              key={recommendation.id}
              onPress={handleMarkerPress}
              recommendation={recommendation}
              isSelected={selectedRecommendation?.id === recommendation.id}
            />
          ))}
        </MapView>
        {showSkeleton && (
          <View style={[styles.map, { position: "absolute" }]}>
            <MapLoadingSkeleton isLoading={isLoading} />
          </View>
        )}
      </View>

      {/* Marker Card List */}
      {selectedRecommendation && (
        <Animated.View
          style={[styles.markerCardContainer, animatedMarkerCardsStyle]}
        >
          <FlatList
            horizontal
            ref={markerCardsRef}
            data={recommendations}
            decelerationRate="fast"
            scrollEventThrottle={16}
            snapToAlignment="center"
            keyExtractor={keyExtractor}
            renderItem={renderMarkerCard}
            onScroll={handleMakerCardScroll}
            onLayout={handleMakerCardLayout}
            showsHorizontalScrollIndicator={false}
            getItemLayout={getMarkerCardItemLayout}
            snapToInterval={MARKER_CARD_SNAP_INTERVAL}
            contentContainerStyle={styles.markerCardsContent}

            // Performance optimizations for large lists
            windowSize={5}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}

            // Prevent scrollToIndex errors when item is not yet rendered
            onScrollToIndexFailed={(info) => {
              // Wait a bit and try again
              setTimeout(() => {
                if (markerCardsRef.current) {
                  markerCardsRef.current.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.5,
                  });
                }
              }, 100);
            }}
          />
        </Animated.View>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        index={1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.handleIndicator}
        onAnimate={handleBottomSheetAnimation}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>{name}</Text>
          {Subtitle && <Subtitle />}
        </View>

        {/* List */}
        {isLoading ? (
          <LoadingEntityCardList />
        ) : (
          <BottomSheetFlatList
            data={recommendations}
            scrollEnabled={true}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={ItemSeparator}
            getItemLayout={getBottomSheetItemLayout}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateImageContainer}>
                  <Image
                    style={styles.emptyStateImage}
                    source={require("assets/images/other/purple-pins.webp")}
                  />
                </View>
                <Text style={styles.emptyStateText}>Oops! Looks like this list is empty </Text>
              </View>
            }
            // Performance optimizations for large lists
            windowSize={5}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
          />
        )}
      </BottomSheet>

    </View>
  );
};

const MapLoadingSkeleton = ({ isLoading }: { isLoading: boolean }) => {
  const iconOpacity = useSharedValue(0.4);

  useEffect(() => {
    iconOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.mapSkeletonView}>
      <View style={styles.mapIconContainer}>
        <Animated.View style={isLoading && animatedIconStyle}>
          <FontAwesome name="map-o" size={25} color="#9ca3af" />
        </Animated.View>
      </View>
    </View>
  );
};

// Separate component for recommendation list item to allow hooks usage
type RecommendationListItemComponentProps = {
  slug: string;
  index: number;
  item: RecommendationListItem;
  itemContentContainerStyle?: any;
  onPress: (item: RecommendationListItem) => void;
  renderItemActions?: (props: {
    item: RecommendationListItem;
    slug: string;
  }) => React.ReactNode;
  renderSwipeableItem?: (props: {
    item: RecommendationListItem;
    slug: string;
    children: React.ReactNode;
  }) => React.ReactNode;
};

const RecommendationListItemComponent = ({
  item,
  index,
  slug,
  onPress,
  renderItemActions,
  renderSwipeableItem,
  itemContentContainerStyle,
}: RecommendationListItemComponentProps) => {
  // Pre-compute and truncate title to avoid creating new string on every render check
  const fullTitle = `${index + 1}. ${item.name}`;
  const title = truncate(fullTitle, 35);

  // Create wrapper for onPress that calls it with the item
  const handlePress = useCallback((): void => {
    onPress(item);
  }, [onPress, item]);

  // Render title actions using render prop if provided
  const titleActions = renderItemActions ? (
    <View style={styles.titleActionsContainer}>
      {renderItemActions({ item, slug })}
    </View>
  ) : null;

  // The entity card content
  const entityCard = (
    <EntityCard
      title={title}
      hours={item.hours}
      onPress={handlePress}
      category={item.category}
      imageUrls={item.images}
      titleActions={titleActions}
      rating={item?.reviews?.rating}
      priceRange={item.priceRange}
      reviewCount={item?.reviews?.count}
      isAccessible={item.isAccessible}
      editorialSummary={item.editorialSummary}
      contentContainerStyle={itemContentContainerStyle}
    />
  );

  if (renderSwipeableItem) {
    return <>{renderSwipeableItem({ item, slug, children: entityCard })}</>;
  }

  return entityCard;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapViewContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  markerCardContainer: {
    left: 0,
    right: 0,
    position: "absolute",
    bottom: MARKER_CARDS_BOTTOM_OFFSET,
  },
  markerCardsContent: {
    paddingHorizontal: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 15,
    paddingTop: 0,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 3,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#DDDDDD",
  },
  separator: {
    height: 1,
    marginBottom: 15,
    backgroundColor: "#E5E5E5",
  },
  loadingMapContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingMapPlaceholder: {
    width: "80%",
    height: "60%",
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
  },
  mapIconContainer: {
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
  },
  emptyStateImageContainer: {
    width: 100,
    height: 90,
    opacity: 0.4,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  emptyStateText: {
    fontSize: 18,
    color: "#667",
    textAlign: "center",
  },
  emptyStateContainer: {
    flex: 1,
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSkeletonView: {
    flex: 1,
    backgroundColor: "#e8eaed",
  },
  titleActionsContainer: {
    gap: 15,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
});
