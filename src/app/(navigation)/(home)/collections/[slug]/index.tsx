// External imports
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-portalize";
import type Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useState, useRef, useMemo, useEffect, forwardRef, useLayoutEffect } from "react";

// Internal imports
import { CollectionType } from "@/libs/types";
import { useLargeTitleCrossfade } from "@/hooks";
import type { ImageGridItem } from "@/libs/types";
import { createFullSlug, hasHomeButton, reportWarning } from "@/libs/utils";
import { ImageGridList, LargeTitle, WithPullToRefresh, PinterestRefreshIndicator } from "@/components";

// API
import { useCollectionDetails } from "@/api";

// Filters
enum FilterType {
  CITIES = "Cities",
  CATEGORIES = "Categories"
}

const filters = [
  { name: FilterType.CITIES, icon: "business-outline" },
  { name: FilterType.CATEGORIES, icon: "grid-outline" }
];

// Types
type CollectionRoute =
  | "/collections/[slug]"
  | "/collections/[slug]/recommendations";


export default function CollectionDetails() {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [snapPoints, setSnapPoints] = useState<string[]>(["21%"]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(FilterType.CITIES);

  const {
    data,
    refetch,
    isLoading,
  } = useCollectionDetails(slug, selectedFilter?.toLowerCase());

  // Extract the needed data
  const collections = data?.collections ?? [];
  const subCollectionName = data?.name ?? "";
  const parentCollectionName = data?.parentCollectionName ?? "";
  const isCountryCollection = data?.type === CollectionType.COUNTRY;
  const isCategoryFilterSelected = selectedFilter === FilterType.CATEGORIES;

  // Set the title
  const title = parentCollectionName ? `${subCollectionName}, ${parentCollectionName}` : subCollectionName;

  // Use the crossfade hook for title animation
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: data?.name || subCollectionName,
    previousTitle: parentCollectionName || undefined,
  });

  // Handle map button press
  const handleMapPress = React.useCallback(() => {
    router.push({
      pathname: "/collections/[slug]/recommendations",
      params: {
        slug,
        previousTitle: title,
      },
    });
  }, []);

  // Handle options press - navigate to options modal
  const handleOptionsPress = React.useCallback(() => {
    router.push({
      pathname: "/collections/[slug]/options",
      params: {
        slug,
        isCountry: isCountryCollection.toString(),
      },
    });
  }, [slug, isCountryCollection]);

  // Memoize headerRight component to prevent unnecessary recreations
  const HeaderRightComponent = useMemo(
    () => (
      <View style={styles.headerRightContainer}>
        {isCountryCollection ? (
          <TouchableOpacity
            style={styles.headerFilterButton}
            onPress={() => {
              if (bottomSheetRef.current) {
                bottomSheetRef.current.expand();
              }
            }}>
            <Ionicons
              size={20}
              color={isCategoryFilterSelected ? "#000" : "#667"}
              name={isCategoryFilterSelected ? "filter" : "filter-outline"}
            />
          </TouchableOpacity>

        ) : (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMapPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="map-o" size={16} color="#667" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.headerOptionsButton}
          onPress={handleOptionsPress}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#667" />
        </TouchableOpacity>
      </View>
    ),
    [isCountryCollection, isCategoryFilterSelected, handleOptionsPress, handleMapPress],
  );

  // Load snap points based on device home button status
  useEffect(() => {
    const loadSnapPoints = () => {
      try {
        const hasButton = hasHomeButton();
        // Devices without home button (iPhone X+) have bottom bar, use 24%
        // Devices with home button use 21%
        setSnapPoints([hasButton ? "24%" : "21%"]);
      } catch (error) {
        reportWarning('Error detecting device type', {
          component: 'CollectionDetail',
          action: 'Load Snap Point',
          extra: { error },
        });
        // Keep default value (21%) if detection fails
      }
    };

    loadSnapPoints();
  }, []);

  // Single setOptions call using hook-provided options;
  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: () => HeaderRightComponent,
      headerBackTitle: parentCollectionName || "Collections",
    });
  }, [navigation, getHeaderOptions, parentCollectionName, HeaderRightComponent]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleItemPress = (item: ImageGridItem) => {
    let pathname: CollectionRoute = "/collections/[slug]/recommendations";
    const itemSlug = createFullSlug(`${item.name} ${subCollectionName}`, item.id);

    // If item has sub-collections, navigate to the next
    // level (countries → cities, cities → categories)
    if (item.hasSubCollections && item.recommendationsCount > 2) {
      pathname = "/collections/[slug]";
    }
    // If the filter is categories, add the category query parameter
    if (selectedFilter === FilterType.CATEGORIES) {
      pathname = `${pathname}?category=${encodeURIComponent(item.name)}` as CollectionRoute;
    }

    router.push({
      pathname,
      params: {
        slug: itemSlug,
        ...(pathname === "/collections/[slug]/recommendations" && { previousTitle: title }),
      },
    });
  };

  const handleFilterPress = (filter: FilterType) => {
    setSelectedFilter(filter);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };

  // Handle item options press - navigate to options modal for the specific item
  // Only show options for city collections (items where hasSubCollections is false and filter is cities)
  const handleItemOptionsPress = React.useCallback((item: ImageGridItem) => {
    const itemSlug = createFullSlug(`${item.name} ${subCollectionName}`, item.id);
    router.push({
      pathname: "/collections/[slug]/options",
      params: {
        slug: itemSlug,
        isCountry: "false", // These are city collections, not country collections
      },
    });
  }, [subCollectionName]);

  // Determine if we should show options on grid items
  // Show options for city collections (when viewing cities filter and items don't have sub-collections)
  const shouldShowItemOptions = selectedFilter === FilterType.CITIES;

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
        <ImageGridList
          isLoading={isLoading}
          items={collections}
          contentContainerStyle={{
            paddingTop: headerHeight + 8
          }}
          onItemPress={handleItemPress}
          onItemOptionsPress={shouldShowItemOptions ? handleItemOptionsPress : undefined}
          animatedScrollHandler={scrollHandler}
          ListHeaderComponent={
            <CollectionHeader
              ref={titleRef}
              title={title}
              offsetY={offsetY}
              onLayout={measureTitle}
              opacity={largeTitleOpacity}
              currentTitle={data?.name}
              previousTitle={parentCollectionName}
              collectionsCount={collections.length}
              savesCount={data?.recommendationsCount}
            />}
        />
      </WithPullToRefresh>

      {/* Filter Bottom Sheet */}
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.handleIndicator}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              enableTouchThrough
              appearsOnIndex={0}
              disappearsOnIndex={-1}
            />
          )}
        >
          <BottomSheetView style={styles.bottomSheetContent}>

            {/* Header */}
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Filter by type</Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => bottomSheetRef.current?.close()}
              >
                <Ionicons name="close-outline" size={24} color="#667" />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.filterOptionsContainer}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.name}
                  style={styles.filterOption}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => handleFilterPress(filter.name)}
                >
                  <View style={styles.filterOptionLeft}>
                    <Ionicons size={20} color="#667" name={filter.icon as any} />
                    <Text style={styles.filterOptionText}>{filter.name}</Text>
                  </View>
                  {selectedFilter === filter.name && (
                    <Ionicons name="checkmark-circle" size={22} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    </View>
  );
}

interface CollectionHeaderProps {
  title: string;
  savesCount?: number;
  currentTitle?: string;
  previousTitle?: string;
  collectionsCount?: number;
  offsetY: SharedValue<number>;
  opacity: SharedValue<number>;
  onLayout?: () => void;
}

const CollectionHeader = forwardRef<Animated.View, CollectionHeaderProps>(
  function CollectionHeader(
    {
      title,
      offsetY,
      opacity,
      savesCount,
      currentTitle,
      previousTitle,
      collectionsCount,
      onLayout,
    },
    ref,
  ) {
    const hasSaves = !!(savesCount && savesCount > 0);
    const hasCollections = !!(collectionsCount && collectionsCount > 0);
    const collectionsText = collectionsCount && collectionsCount > 1 ? 'collections' : 'collection';

    return (
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          {/* Large Title fade-in animation*/}
          <LargeTitle
            ref={ref}
            offsetY={offsetY}
            opacity={opacity}
            onLayout={onLayout}
            currentTitle={currentTitle || title}
            previousTitle={previousTitle}
          />

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            {hasSaves && (
              <>
                <Text style={styles.metadataText}>
                  {savesCount} Saved
                </Text>
                {hasCollections &&
                  <Text style={styles.metadataSeparator}>
                    {" • "}
                  </Text>
                }
              </>
            )}
            {hasCollections && (
              <Text style={styles.metadataText}>
                {collectionsCount} {collectionsText}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleContainer: {
    flexDirection: "column",
  },
  previousTitle: {
    fontSize: 28,
    opacity: 0.5,
    color: "#667",
    marginTop: -2,
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    color: "#000",
    fontWeight: "500",
  },
  headerRightContainer: {
    gap: 10,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerFilterButton: {},
  headerOptionsButton: {},
  metadataContainer: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    color: "#999",
    fontSize: 13,
  },
  metadataSeparator: {
    color: "#999",
    fontSize: 10,
  },
  currentFilterContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  currentFilterText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },

  // Bottom Sheet styles
  bottomSheetBackground: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handleIndicator: {
    display: "none",
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomSheetHeader: {
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomSheetTitle: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  filterOptionsContainer: {
    gap: 18,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterOptionLeft: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  filterOptionText: {
    fontSize: 17,
    color: "#000",
    fontWeight: "500",
  },
});
