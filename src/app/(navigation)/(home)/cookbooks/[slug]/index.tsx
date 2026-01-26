// External Dependencies
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Alert, Platform, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useRef, useState, useMemo, forwardRef, useLayoutEffect, useCallback, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, type SharedValue } from "react-native-reanimated";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { useLargeTitleCrossfade } from "@/hooks";
import { createShortSlug, parseSlug } from "@/libs/utils";
import { Colors, COLLECTION_TYPE } from "@/libs/constants";

import {
  LargeTitle,
  RecipeCard,
  StaggeredGrid,
  WithPullToRefresh,
  RecipeOptionsSheet,
  LoadingStaggeredGrid,
  CookbookOptionsSheet,
  AddToCookbookSheet,
  PinterestRefreshIndicator,
} from "@/components";

// API
import {
  useCookbookDetails,
  useBulkRemoveRecipesFromCookbookMutation,
  useBulkDeleteRecipesMutation,
} from "@/api";

// Contexts
import { useActionToast } from "@/contexts";

// Stable noop function for fallback (prevents creating new functions on every render)
const noop = () => { };

export default function CookbookDetails() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [refreshing, setRefreshing] = useState(false);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Bulk edit mode state
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const cookbookOptionsSheetRef = useRef<BottomSheet | null>(null);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);

  // Add to cookbook sheet state
  const addToCookbookSheetRef = useRef<BottomSheet | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // Parse slug to extract ID and name for API call
  const { id: cookbookId, name: cookbookName } = parseSlug(slug);

  // Toast context for showing success messages
  const { showToast } = useActionToast();

  // Bulk operation mutations
  const {
    mutateAsync: bulkRemoveRecipesAsync,
    isPending: isRemovePending,
  } = useBulkRemoveRecipesFromCookbookMutation();

  const {
    mutateAsync: bulkDeleteRecipesAsync,
    isPending: isDeletePending,
  } = useBulkDeleteRecipesMutation();

  // Calculate bottom padding: safe area bottom + extra space for comfortable scrolling
  const contentBottomPadding = insets.bottom + 20;

  const {
    data,
    refetch,
    isLoading,
  } = useCookbookDetails(cookbookId);

  // Footer animation - starts off-screen (100 = hidden below screen)
  const footerTranslateY = useSharedValue(100);

  // Animate footer when bulk edit mode changes
  useEffect(() => {
    footerTranslateY.value = withTiming(isBulkEditMode ? 0 : 100, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isBulkEditMode, footerTranslateY]);

  // Animated style for footer slide animation
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: footerTranslateY.value }],
  }));

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

  // Handle options press - open bottom sheet instead of navigating
  const handleOptionsPress = useCallback(() => {
    setIsOptionsSheetOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Open options sheet when state changes
  useEffect(() => {
    if (isOptionsSheetOpen) {
      setTimeout(() => {
        cookbookOptionsSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [isOptionsSheetOpen]);

  // Handle edit press - navigate to edit recipes screen (only for unorganized collections)
  const handleEditPress = useCallback(() => {
    router.push({
      pathname: "/cookbooks/[slug]/edit" as any,
      params: {
        slug,
      },
    });
  }, [slug]);

  // Handle bulk edit press - triggered from options sheet
  const handleBulkEditPress = useCallback(() => {
    setIsBulkEditMode(true);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle done press - exit bulk edit mode
  const handleDonePress = useCallback(() => {
    setIsBulkEditMode(false);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle recipe selection toggle
  const handleRecipeSelect = useCallback((recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  }, []);

  // Create stable callback map using ref to prevent re-renders
  // This ensures callbacks don't change even when recipes array reference changes
  const selectCallbacksRef = useRef<Map<string, () => void>>(new Map());

  // Update callbacks when recipes change, but keep same Map reference
  useMemo(() => {
    const callbacks = selectCallbacksRef.current;
    // Clear old callbacks
    callbacks.clear();
    // Add new callbacks
    for (const recipe of recipes) {
      if (!callbacks.has(recipe.id)) {
        callbacks.set(recipe.id, () => handleRecipeSelect(recipe.id));
      }
    }
  }, [recipes, handleRecipeSelect]);

  const selectCallbacks = selectCallbacksRef.current;

  // Get selected recipes for add to cookbook sheet
  const selectedRecipes = useMemo(() => {
    return recipes.filter((recipe) => selectedRecipeIds.has(recipe.id));
  }, [recipes, selectedRecipeIds]);

  // Handle bulk add - open add to cookbook sheet
  const handleBulkAdd = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only add up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    // Exit bulk edit mode immediately when Add is pressed
    setIsBulkEditMode(false);

    // Open add to cookbook sheet
    setIsAddSheetOpen(true);
  }, [selectedRecipeIds.size]);

  // Sheet opening is now handled by the AddToCookbookSheet component via isOpen prop

  // Handle successful add to cookbook
  const handleAddToCookbookSuccess = useCallback(() => {
    // Clear selections and exit bulk edit mode after successful bulk add
    setSelectedRecipeIds(new Set());
    setIsBulkEditMode(false);
    setIsAddSheetOpen(false);
  }, []);

  // Handle add to cookbook sheet close
  const handleAddToCookbookClose = useCallback(() => {
    // Exit bulk edit mode and clear state when sheet closes
    setIsAddSheetOpen(false);
    setIsBulkEditMode(false);
    setSelectedRecipeIds(new Set());
  }, []);

  // Filter out stale selections when recipes change
  useEffect(() => {
    if (selectedRecipeIds.size === 0) return;
    const currentIds = new Set(recipes.map((r) => r.id));
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      for (const id of prev) {
        if (!currentIds.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [recipes]);

  // Exit bulk edit mode if cookbook becomes empty
  useEffect(() => {
    if (isBulkEditMode && recipes.length === 0) {
      setIsBulkEditMode(false);
      setSelectedRecipeIds(new Set());
    }
  }, [isBulkEditMode, recipes.length]);

  // Memoize headerRight component to prevent unnecessary recreations
  // Show "Done" button in bulk edit mode, otherwise show edit/options button
  const HeaderRightComponent = useMemo(
    () => {
      // In bulk edit mode, show "Done" button
      if (isBulkEditMode) {
        return (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              style={styles.headerOptionsButton}
              onPress={handleDonePress}
            >
              <Text style={styles.headerDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );
      }

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
    [
      handleOptionsPress,
      handleEditPress,
      handleDonePress,
      collectionType,
      isBulkEditMode,
    ],
  );

  // Single setOptions call using hook-provided options
  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: () => HeaderRightComponent,
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

  const handleBulkRemove = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only remove up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    const recipeCount = selectedRecipeIds.size;
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    Alert.alert(
      "Remove from Cookbook",
      `You have selected ${recipeCount} ${recipeText} to be removed from this cookbook. `,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const recipeIds = Array.from(selectedRecipeIds);

            bulkRemoveRecipesAsync({ cookbookId, recipeIds })
              .then(() => {
                // Haptic feedback for success
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast
                showToast({
                  text: `Removed ${recipeCount} ${recipeText}`,
                  icon: (
                    <View style={{
                      width: 45,
                      height: 45,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(255, 59, 48, 0.12)",
                    }}>
                      <MaterialIcons name="bookmark-remove" size={22} color={Colors.destructive} />
                    </View>
                  ),
                });

                // Clear selections
                setSelectedRecipeIds(new Set());
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to remove recipes from cookbook. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [selectedRecipeIds, cookbookId, bulkRemoveRecipesAsync, showToast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only delete up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    const recipeCount = selectedRecipeIds.size;
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    Alert.alert(
      "Delete Recipes",
      `Permanently delete ${recipeCount} ${recipeText}? This will remove them from all cookbooks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const recipeIds = Array.from(selectedRecipeIds);

            bulkDeleteRecipesAsync(recipeIds)
              .then(() => {
                // Haptic feedback for success
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast
                showToast({
                  text: `Deleted ${recipeCount} ${recipeText}`,
                  icon: (
                    <View style={{ backgroundColor: "rgba(255, 59, 48, 0.12)", borderRadius: 8, width: 45, height: 45, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="bookmark-remove" size={22} color={Colors.destructive} />
                    </View>
                  ),
                });

                // Clear selections
                setSelectedRecipeIds(new Set());
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete recipes. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [selectedRecipeIds, bulkDeleteRecipesAsync, showToast]);

  // Memoize renderItem to prevent re-creations during scroll
  // Use RecipeCard with conditional selectable props based on bulk edit mode
  const renderItem = useCallback(
    (item: Recipe, index: number) => {
      if (isBulkEditMode) {
        return (
          <RecipeCard
            key={item.id}
            recipe={item}
            index={index}
            selectable={true}
            isSelected={selectedRecipeIds.has(item.id)}
            onSelect={selectCallbacks.get(item.id) ?? noop}
          />
        );
      }

      return (
        <RecipeCard
          key={item.id}
          recipe={item}
          index={index}
          onMenuPress={handleMenuPress}
          onCardPress={handleCardItemPress}
        />
      );
    },
    [
      isBulkEditMode,
      handleMenuPress,
      handleCardItemPress,
      handleRecipeSelect,
      selectedRecipeIds,
      selectCallbacks,
    ],
  );

  // List header component with title and recipe count
  const ListHeaderComponent = useMemo(
    () => (
      <CookbookHeader
        ref={titleRef}
        offsetY={offsetY}
        onLayout={measureTitle}
        recipesCount={recipesCount}
        opacity={largeTitleOpacity}
        currentTitle={collectionName}
        isBulkEditMode={isBulkEditMode}
        selectedCount={selectedRecipeIds.size}
      />
    ),
    [
      titleRef,
      offsetY,
      measureTitle,
      recipesCount,
      collectionName,
      largeTitleOpacity,
      isBulkEditMode,
      selectedRecipeIds.size,
    ],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <LoadingStaggeredGrid />
      </View>
    );
  }

  // Calculate bottom padding for bulk edit mode (footer height + safe area)
  const bulkEditBottomPadding = isBulkEditMode ? 60 + insets.bottom : 0;
  const hasSelections = selectedRecipeIds.size > 0;
  const isMutationPending = isRemovePending || isDeletePending;

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
          contentBottomPadding={contentBottomPadding + bulkEditBottomPadding}
          animatedScrollHandler={scrollHandler}
          ListHeaderComponent={ListHeaderComponent}
        />
      </WithPullToRefresh>

      {/* Bulk Edit Footer */}
      <Animated.View
        style={[styles.bulkEditFooter, { paddingBottom: insets.bottom }, footerAnimatedStyle]}
        pointerEvents={isBulkEditMode ? "auto" : "none"}
      >
        <View style={styles.bulkEditButtonRow}>
          <TouchableOpacity
            style={[styles.bulkEditButton, (!hasSelections || isMutationPending) && styles.bulkEditButtonDisabled]}
            onPress={handleBulkAdd}
            disabled={!hasSelections || isMutationPending}
          >
            <MaterialIcons name="bookmark-add" size={25} color={hasSelections && !isMutationPending ? "#667" : "#999"} />
            <Text style={[styles.bulkEditButtonText, (!hasSelections || isMutationPending) && styles.bulkEditButtonTextDisabled]}>
              Add
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkEditButton, (!hasSelections || isMutationPending) && styles.bulkEditButtonDisabled]}
            onPress={handleBulkRemove}
            disabled={!hasSelections || isMutationPending}
          >
            <MaterialIcons name="bookmark-remove" size={24} color={hasSelections && !isMutationPending ? "#667" : "#999"} />
            <Text style={[styles.bulkEditButtonText, (!hasSelections || isMutationPending) && styles.bulkEditButtonTextDisabled]}>
              Remove
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkEditButton, (!hasSelections || isMutationPending) && styles.bulkEditButtonDisabled]}
            onPress={handleBulkDelete}
            disabled={!hasSelections || isMutationPending}
          >
            <Ionicons name="trash-outline" size={20} color={hasSelections && !isMutationPending ? Colors.destructive : "#999"} />
            <Text style={[styles.bulkEditButtonText, styles.bulkEditButtonTextDestructive, (!hasSelections || isMutationPending) && styles.bulkEditButtonTextDisabled]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Recipe Options Bottom Sheet */}
      {selectedRecipe && (
        <RecipeOptionsSheet
          variant="cookbook"
          cookbookId={cookbookId}
          recipeData={selectedRecipe}
          bottomSheetRef={bottomSheetRef}
          onAnimationCompleted={() => {
            // Clear selected recipe when sheet closes
            setSelectedRecipe(null);
          }}
        />
      )}

      {/* Cookbook Options Bottom Sheet */}
      {isOptionsSheetOpen && (
        <CookbookOptionsSheet
          cookbookId={cookbookId}
          cookbookSlug={slug}
          cookbookName={cookbookName}
          hasRecipes={recipes.length > 0}
          onBulkEditPress={handleBulkEditPress}
          bottomSheetRef={cookbookOptionsSheetRef}
          onAnimationCompleted={() => {
            setIsOptionsSheetOpen(false);
          }}
        />
      )}

      {/* Add to Cookbook Bottom Sheet */}
      <AddToCookbookSheet
        isOpen={isAddSheetOpen}
        recipes={selectedRecipes}
        currentCookbookId={cookbookId}
        bottomSheetRef={addToCookbookSheetRef}
        onSuccess={handleAddToCookbookSuccess}
        onClose={handleAddToCookbookClose}
      />
    </View>
  );
}

interface CookbookHeaderProps {
  currentTitle: string;
  recipesCount: number;
  offsetY: SharedValue<number>;
  opacity: SharedValue<number>;
  onLayout?: () => void;
  isBulkEditMode?: boolean;
  selectedCount?: number;
}

const CookbookHeader = forwardRef<Animated.View, CookbookHeaderProps>(
  function CookbookHeader(
    {
      offsetY,
      opacity,
      onLayout,
      currentTitle,
      recipesCount,
      selectedCount = 0,
      isBulkEditMode = false,
    },
    ref,
  ) {
    const hasRecipes = recipesCount > 0;
    const hasSelections = selectedCount > 0;
    const recipesText = recipesCount === 1 ? "recipe" : "recipes";

    // Show selection count when in bulk edit mode and items are selected
    const showSelectionCount = isBulkEditMode && hasSelections;

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
              <View style={styles.cookbookBadge}>
                <Ionicons size={10} name="book-outline" color="#FFF4ED" />
                <Text style={styles.cookbookBadgeText}>cookbook</Text>
              </View>
              <Text style={styles.metadataText}>
                {recipesCount} {recipesText}
              </Text>
              {showSelectionCount && (
                <>
                  <Text style={styles.metadataSeparator}> • </Text>
                  <Text style={styles.metadataTextSelected}>
                    {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
                  </Text>
                </>
              )}
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
  metadataSeparator: {
    color: "#999",
    fontSize: 13,
  },
  metadataTextSelected: {
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
    color: "#999",
    fontSize: 13,
    fontWeight: "400",
  },
  cookbookBadge: {
    gap: 4,
    borderRadius: 5,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    marginRight: 6,
    backgroundColor: 'rgba(234, 88, 12, 0.7)',
  },
  cookbookBadgeText: {
    fontFamily: Platform.select({
      android: "Manrope_500Medium",
      ios: "Manrope-Medium",
    }),
    top: -1,
    fontSize: 12,
    color: "#FFF4ED",
    fontWeight: "500",
  },
  headerOptionsButtonText: {
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  headerDoneButtonText: {
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 4,
    color: "#000",
  },
  bulkEditFooter: {
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    overflow: "hidden",
    position: "absolute",
    backgroundColor: "rgba(245, 245, 240, 0.95)",
  },
  bulkEditButtonRow: {
    gap: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  bulkEditButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  bulkEditButtonDisabled: {
    opacity: 0.5,
  },
  bulkEditButtonText: {
    marginTop: 4,
    fontSize: 13,
    color: "#667",
    fontWeight: "500",
  },
  bulkEditButtonTextDestructive: {
    color: Colors.destructive,
  },
  bulkEditButtonTextDisabled: {
    color: "#999",
  },
});
