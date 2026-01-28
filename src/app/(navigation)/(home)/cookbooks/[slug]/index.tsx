// External Dependencies
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useCallback,
  useLayoutEffect,
} from "react";

import {
  Alert,
  Text,
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import type Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { useActionToast } from "@/contexts";
import { useLargeTitleCrossfade } from "@/hooks";
import { createShortSlug, parseSlug } from "@/libs/utils";
import { COLLECTION_TYPE, Colors } from "@/libs/constants";

import {
  RecipeCard,
  LargeTitle,
  StaggeredGrid,
  BulkEditFooter,
  WithPullToRefresh,
  RecipeOptionsSheet,
  CookbookOptionsSheet,
  LoadingStaggeredGrid,
  PinterestRefreshIndicator,
} from "@/components";

// API
import {
  useCookbookDetails,
  useBulkDeleteRecipesMutation,
  useBulkRemoveRecipesFromCookbookMutation,
} from "@/api";

// Stable noop function for fallback (prevents creating new functions on every render)
const noop = () => { };

export default function CookbookDetails() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useActionToast();
  const headerHeight = useHeaderHeight();
  const [refreshing, setRefreshing] = useState(false);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const cookbookOptionsSheetRef = useRef<BottomSheet | null>(null);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Parse slug to extract ID and name for API call
  const { id: cookbookId, name: cookbookName } = parseSlug(slug);

  // Bulk edit mode state
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch cookbook details
  const {
    data,
    refetch,
    isLoading,
  } = useCookbookDetails(cookbookId);

  // Bulk operation mutations
  const {
    isPending: isRemovePending,
    mutateAsync: bulkRemoveRecipesAsync,
  } = useBulkRemoveRecipesFromCookbookMutation();

  const {
    isPending: isDeletePending,
    mutateAsync: bulkDeleteRecipesAsync,
  } = useBulkDeleteRecipesMutation();

  // Extract the needed data
  const collectionType = data?.type;
  const recipes = data?.recipes ?? [];
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

  // Handle organize press - trigger bulk edit mode for unorganized collections
  const handleOrganizePress = useCallback(() => {
    setIsBulkEditMode(true);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle bulk edit press - triggered from options sheet
  const handleBulkEditPress = useCallback(() => {
    setIsBulkEditMode(true);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle add recipes press - navigate to add-recipes screen
  const handleAddRecipesPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/cookbooks/[slug]/add-recipes",
      params: { slug },
    });
  }, [slug]);

  // Handle done press - exit bulk edit mode
  const handleDonePress = useCallback(() => {
    setIsBulkEditMode(false);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle move press - navigate to add-to-cookbook modal in move mode
  const handleMovePress = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Exit bulk edit mode immediately
    setIsBulkEditMode(false);

    // Navigate to add-to-cookbook modal with move mode
    router.push({
      pathname: "/(modal)/add-to-cookbook",
      params: {
        mode: "move",
        selectedRecipeIds: Array.from(selectedRecipeIds).join(","),
        currentCookbookId: cookbookId,
        selectedCookbookIds: "",
      },
    });
  }, [selectedRecipeIds, cookbookId]);

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

  // Handle bulk copy - navigate to copy to cookbook route
  const handleBulkCopy = useCallback(() => {
    if (selectedRecipeIds.size === 0) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only copy up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    // Exit bulk edit mode immediately when Copy is pressed
    setIsBulkEditMode(false);

    // Navigate to copy to cookbook route
    router.push({
      pathname: "/(modal)/add-to-cookbook",
      params: {
        selectedRecipeIds: Array.from(selectedRecipeIds).join(","),
        currentCookbookId: cookbookId,
        selectedCookbookIds: "",
      },
    });
  }, [selectedRecipeIds, cookbookId]);

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
  const HeaderRightComponent = useMemo(() => {
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

    // Show organize button for UNORGANIZED collections
    if (collectionType === COLLECTION_TYPE.UNORGANIZED) {
      return (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            onPress={handleOrganizePress}
            style={styles.headerOptionsButton}
          >
            <Text style={styles.headerOptionsButtonText}>Organize</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show plus button and options button for organized collections
    return (
      <View style={styles.headerRightContainer}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleAddRecipesPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={22} color="#667" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerOptionsButton}
          onPress={handleOptionsPress}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#667" />
        </TouchableOpacity>
      </View>
    );
  }, [
    collectionType,
    isBulkEditMode,
    handleDonePress,
    handleOptionsPress,
    handleOrganizePress,
    handleAddRecipesPress,
  ]);

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
  const handleMenuPress = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

                // Show success toast
                showToast({
                  text: `Removed ${recipeCount} ${recipeText}`,
                  icon: (
                    <View
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 59, 48, 0.12)",
                      }}
                    >
                      <MaterialCommunityIcons
                        size={22}
                        color={Colors.destructive}
                        name="book-remove-multiple-outline"
                      />
                    </View>
                  ),
                });

                // Clear selections
                setSelectedRecipeIds(new Set());
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message ||
                  "Failed to remove recipes from cookbook. Please try again.",
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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

                // Show success toast
                showToast({
                  text: `Deleted ${recipeCount} ${recipeText}`,
                  icon: (
                    <View
                      style={{
                        borderRadius: 8,
                        width: 45,
                        height: 45,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 59, 48, 0.12)",
                      }}
                    >
                      <MaterialIcons
                        size={22}
                        name="bookmark-remove"
                        color={Colors.destructive}
                      />
                    </View>
                  ),
                });

                // Clear selections
                setSelectedRecipeIds(new Set());
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message ||
                  "Failed to delete recipes. Please try again.",
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
  const isMutationPending = isRemovePending || isDeletePending;
  const bulkEditBottomPadding = isBulkEditMode ? 60 + insets.bottom : 0;

  // Calculate bottom padding: safe area
  // bottom + extra space for comfortable scrolling
  const contentBottomPadding = insets.bottom + 20;

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
      <BulkEditFooter
        isVisible={isBulkEditMode}
        selectedCount={selectedRecipeIds.size}
        isPending={isMutationPending}
        onCopy={handleBulkCopy}
        onMove={handleMovePress}
        onDelete={handleBulkDelete}
        onRemove={handleBulkRemove}
        variant={
          collectionType === COLLECTION_TYPE.UNORGANIZED
            ? "organize"
            : "default"
        }
      />

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
                    {selectedCount} {selectedCount === 1 ? "item" : "items"}{" "}
                    selected
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
  headerButton: {
    padding: 4,
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
    backgroundColor: "rgba(234, 88, 12, 0.8)",
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
});
