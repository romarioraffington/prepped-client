// External Dependencies
import { Ionicons } from "@expo/vector-icons";
import type Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Platform, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useRef, useState, useMemo, forwardRef, useLayoutEffect, useCallback, useEffect } from "react";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { createShortSlug } from "@/libs/utils";
import { useLargeTitleCrossfade } from "@/hooks";
import { Colors, COLLECTION_TYPE } from "@/libs/constants";

import {
  LargeTitle,
  RecipeCard,
  StaggeredGrid,
  WithPullToRefresh,
  RecipeOptionsSheet,
  LoadingStaggeredGrid,
  PinterestRefreshIndicator,
} from "@/components";

// API
import { useCollectionDetails } from "@/api";

export default function CollectionDetails() {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Calculate bottom padding: safe area bottom + extra space for comfortable scrolling
  const contentBottomPadding = insets.bottom + 20;

  const {
    data,
    refetch,
    isLoading,
  } = useCollectionDetails(slug);

  // Extract the needed data
  const recipes = data?.recipes ?? [];
  const collectionType = data?.type;
  const collectionName = data?.name ?? "";
  const recipesCount = data?.recipesCount ?? 0;

  // Use the crossfade hook for title animation
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: collectionName,
  });

  // Handle options press - navigate to options modal
  const handleOptionsPress = useCallback(() => {
    router.push({
      pathname: "/cookbooks/[slug]/options",
      params: {
        slug,
      },
    });
  }, [slug]);

  // Handle edit press - navigate to edit recipes screen (only for unorganized collections)
  const handleEditPress = useCallback(() => {
    router.push({
      pathname: "/cookbooks/[slug]/edit" as any,
      params: {
        slug,
      },
    });
  }, [slug]);

  // Memoize headerRight component to prevent unnecessary recreations
  // Show edit button for UNORGANIZED collections, options button for others
  const HeaderRightComponent = useMemo(
    () => {
      // Show edit button for UNORGANIZED collections
      if (collectionType === COLLECTION_TYPE.UNORGANIZED) {
        return (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              style={styles.headerOptionsButton}
              onPress={handleEditPress}
            >
              <Text style={styles.headerOptionsButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Show options button for organized collections
      return (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.headerOptionsButton}
            onPress={handleOptionsPress}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#667" />
          </TouchableOpacity>
        </View>
      );
    },
    [handleOptionsPress, handleEditPress, collectionType],
  );

  // Single setOptions call using hook-provided options
  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: () => HeaderRightComponent,
      headerBackTitle: "Collections",
    });
  }, [navigation, getHeaderOptions, HeaderRightComponent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle recipe card press
  const handleCardItemPress = useCallback((item: Recipe) => {
    router.push({
      pathname: "/recipes/[slug]",
      params: {
        slug: createShortSlug(item.title, item.id),
      },
    });
  }, []);

  // Handle menu press - open options sheet for the selected recipe
  const handleMenuPress = useCallback(
    (recipe: Recipe) => {
      setSelectedRecipe(recipe);
    },
    [],
  );

  // Open bottom sheet when recipe is selected
  useEffect(() => {
    if (selectedRecipe) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [selectedRecipe]);

  // Memoize renderItem to prevent re-creations during scroll
  const renderItem = useCallback(
    (item: Recipe, index: number) => (
      <RecipeCard
        key={item.id}
        recipe={item}
        index={index}
        onMenuPress={handleMenuPress}
        onCardPress={handleCardItemPress}
      />
    ),
    [handleCardItemPress, handleMenuPress],
  );

  // List header component with title and recipe count
  const ListHeaderComponent = useMemo(
    () => (
      <CollectionHeader
        ref={titleRef}
        offsetY={offsetY}
        onLayout={measureTitle}
        opacity={largeTitleOpacity}
        currentTitle={collectionName}
        recipesCount={recipesCount}
      />
    ),
    [titleRef, offsetY, measureTitle, largeTitleOpacity, collectionName, recipesCount],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <LoadingStaggeredGrid />
      </View>
    );
  }

  return (
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
          items={recipes}
          renderItem={renderItem}
          headerHeight={headerHeight}
          contentBottomPadding={contentBottomPadding}
          animatedScrollHandler={scrollHandler}
          ListHeaderComponent={ListHeaderComponent}
        />
      </WithPullToRefresh>

      {/* Recipe Options Bottom Sheet */}
      {selectedRecipe && (
        <RecipeOptionsSheet
          variant="cookbook"
          recipeData={selectedRecipe}
          bottomSheetRef={bottomSheetRef}
          onAnimationCompleted={() => {
            // Clear selected recipe when sheet closes
            setSelectedRecipe(null);
          }}
        />
      )}
    </View>
  );
}

interface CollectionHeaderProps {
  currentTitle: string;
  recipesCount: number;
  offsetY: SharedValue<number>;
  opacity: SharedValue<number>;
  onLayout?: () => void;
}

const CollectionHeader = forwardRef<Animated.View, CollectionHeaderProps>(
  function CollectionHeader(
    {
      offsetY,
      opacity,
      onLayout,
      currentTitle,
      recipesCount,
    },
    ref,
  ) {
    const hasRecipes = recipesCount > 0;
    const recipesText = recipesCount === 1 ? "recipe" : "recipes";

    return (
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          {/* Large Title with fade animation */}
          <LargeTitle
            ref={ref}
            offsetY={offsetY}
            opacity={opacity}
            onLayout={onLayout}
            currentTitle={currentTitle}
          />

          {/* Recipe count metadata */}
          {hasRecipes && (
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataText}>
                {recipesCount} {recipesText}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    marginBottom: 24,
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleContainer: {
    flexDirection: "column",
  },
  headerRightContainer: {
    gap: 10,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headerOptionsButton: {},
  metadataContainer: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
    color: "#999",
    fontSize: 13,
  },
  headerOptionsButtonText: {
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 4,
  },
});
