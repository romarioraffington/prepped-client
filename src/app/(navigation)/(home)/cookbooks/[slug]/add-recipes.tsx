// External Dependencies
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Alert,
  Text,
  View,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

// Internal Dependencies
import { parseSlug } from "@/libs/utils";
import { Colors } from "@/libs/constants";
import { useActionToast } from "@/contexts";
import type { Recipe } from "@/libs/types";
import { DotsLoader } from "@/components/DotsLoader";
import { BlurBackButton } from "@/components/BlurBackButton";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";
import { useRecipes, useBulkAddRecipesToCookbookMutation } from "@/api";

const IMAGE_SIZE = 56;
const IMAGE_RADIUS = 10;

type RouteParams = {
  slug: string;
  selectedRecipeIds?: string;
};

export default function AddRecipes() {
  const insets = useSafeAreaInsets();
  const { showToast } = useActionToast();

  // Read route params
  const { slug, selectedRecipeIds: selectedIdsParam } =
    useLocalSearchParams<RouteParams>();

  // Parse slug to extract cookbook ID
  const { id: cookbookId, name: cookbookName } = parseSlug(slug ?? "");

  // Parse selected recipe IDs from route params
  const selectedRecipeIds = useMemo(
    () => new Set(selectedIdsParam?.split(",").filter(Boolean) || []),
    [selectedIdsParam],
  );

  // Fetch recipes excluding those already in the cookbook
  const {
    data: recipesData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: isRecipesLoading,
  } = useRecipes({ excludeCookbookId: cookbookId });

  // Check if recipes are still loading
  const isLoadingRecipes = isRecipesLoading;

  // Bulk add mutation
  const { isPending: isAddPending, mutateAsync: bulkAddAsync } =
    useBulkAddRecipesToCookbookMutation();

  const isPending = isAddPending;

  // Load more recipes when user scrolls to the end
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all recipe pages
  const recipes = useMemo(() => {
    if (!recipesData?.pages) {
      return [];
    }
    return recipesData.pages.flatMap((page) => page.data ?? []);
  }, [recipesData]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isPending) return;
    router.back();
  }, [isPending]);

  // Handle recipe selection (toggle checkbox) - update route params
  const handleSelectRecipe = useCallback(
    (recipeId: string) => {
      if (isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const next = new Set(selectedRecipeIds);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }

      // Update route params - this persists state automatically
      router.setParams({
        selectedRecipeIds: Array.from(next).join(","),
      });
    },
    [isPending, selectedRecipeIds],
  );

  // Handle add recipes
  const handleAddRecipes = useCallback(async () => {
    if (selectedRecipeIds.size === 0 || isPending) return;

    // Client-side validation: max 20 recipes per request
    if (selectedRecipeIds.size > 20) {
      Alert.alert(
        "Too Many Recipes",
        "You can only add up to 20 recipes at a time. Please deselect some recipes and try again.",
        [{ text: "OK" }],
      );
      return;
    }

    const recipeCount = selectedRecipeIds.size;
    const recipeIds = Array.from(selectedRecipeIds);
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    try {
      await bulkAddAsync({
        recipeIds,
        cookbookIds: [cookbookId],
      });

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success toast
      showToast({
        icon: (
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(234, 88, 12, 0.12)",
            }}
          >
            <MaterialIcons size={22} name="bookmark-add" color={Colors.primary} />
          </View>
        ),
        text: (
          <Text style={{ fontWeight: "600" }}>
            {`Added ${recipeCount} ${recipeText} to ${cookbookName}`}
          </Text>
        ),
      });

      // Navigate back
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        "Oops!",
        error instanceof Error
          ? error.message
          : "Failed to add recipes. Please try again.",
        [{ text: "OK" }],
      );
    }
  }, [
    cookbookId,
    cookbookName,
    showToast,
    isPending,
    bulkAddAsync,
    selectedRecipeIds,
  ]);

  // Calculate item layout for FlatList performance
  const ITEM_HEIGHT = 80;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  /**
   * Render recipe item
   */
  const renderRecipeItem = useCallback(
    ({ item }: { item: Recipe }) => {
      const isSelected = selectedRecipeIds.has(item.id);
      const cookTime = item.cookTime;
      const calories = item.caloriesPerServing;

      return (
        <Pressable
          disabled={isPending}
          onPress={() => handleSelectRecipe(item.id)}
          style={[styles.recipeItem, isPending && styles.recipeItemDisabled]}
        >
          {/* Thumbnail */}
          <View style={styles.recipeImageContainer}>
            {item.coverUri ? (
              <ShimmerImage
                contentFit="cover"
                style={styles.recipeImage}
                source={{ uri: item.coverUri }}
              />
            ) : (
              <ImagePlaceholder
                iconSize={20}
                height={IMAGE_SIZE}
                style={styles.recipePlaceholder}
              />
            )}
          </View>

          {/* Content */}
          <View style={styles.recipeContent}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metadataRow}>
              {cookTime ? (
                <View style={styles.metadataItem}>
                  <Ionicons name="time-outline" size={14} color="#999" />
                  <Text style={styles.recipeMeta}>{cookTime} mins</Text>
                </View>
              ) : null}
              {calories ? (
                <View style={styles.metadataItem}>
                  <Ionicons name="flame-outline" size={14} color="#999" />
                  <Text style={styles.recipeMeta}>{calories} cal</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Checkbox */}
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkboxOuter,
                isSelected && styles.checkboxOuterSelected,
              ]}
            >
              <View style={styles.checkboxInner}>
                {isSelected && (
                  <Ionicons
                    name="checkmark-done-sharp"
                    size={14}
                    color={Colors.primary}
                  />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [selectedRecipeIds, handleSelectRecipe, isPending],
  );

  // Show error if required params are missing
  if (!slug) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <BlurBackButton onPress={handleClose} />
            <Text style={styles.headerTitle}>Add Recipes</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.divider} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Unable to load cookbook</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (isLoadingRecipes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <BlurBackButton onPress={handleClose} />
            <Text style={styles.headerTitle}>Add Recipes</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.divider} />
        </View>
        <View style={styles.loadingContainer}>
          <DotsLoader />
        </View>
      </SafeAreaView>
    );
  }

  // Button disabled state
  const isAddButtonDisabled = selectedRecipeIds.size === 0 || isPending;

  // Button text
  const addButtonText =
    selectedRecipeIds.size === 0
      ? "Add Recipes"
      : `Add ${selectedRecipeIds.size} ${selectedRecipeIds.size === 1 ? "Recipe" : "Recipes"}`;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BlurBackButton
            onPress={handleClose}
            disabled={isPending}
            style={{ top: 2 }}
          />
          <Text style={styles.headerTitle}>Add Recipes</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.divider} />
      </View>

      {/* Recipe List */}
      <FlatList
        data={recipes}
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        onEndReachedThreshold={0.5}
        getItemLayout={getItemLayout}
        updateCellsBatchingPeriod={50}
        onEndReached={handleEndReached}
        renderItem={renderRecipeItem}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item: Recipe) => item.id}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 100 + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes available to add</Text>
            <Text style={styles.emptySubtext}>
              All your recipes are already in this cookbook
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Floating Add Button */}
      {recipes.length > 0 && (
        <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            onPress={handleAddRecipes}
            disabled={isAddButtonDisabled}
            style={[
              styles.floatingButton,
              isAddButtonDisabled && styles.floatingButtonDisabled,
            ]}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.floatingButtonText,
                  isAddButtonDisabled && styles.floatingButtonTextDisabled,
                ]}
              >
                {addButtonText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingLeft: 18,
    paddingRight: 25,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    fontFamily: Platform.select({
      android: "BricolageGrotesque_700Bold",
      ios: "BricolageGrotesque-Bold",
    }),
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E5E0",
  },
  loadingContainer: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 0.5,
    alignItems: "center",
    paddingVertical: 40,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#667",
    marginBottom: 8,
    fontFamily: Platform.select({
      android: "Manrope_500Medium",
      ios: "Manrope-Medium",
    }),
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
  },
  contentContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  recipeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
  },
  recipeItemDisabled: {
    opacity: 0.6,
  },
  recipeImageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    overflow: "hidden",
    marginLeft: 12,
    borderRadius: IMAGE_RADIUS,
    backgroundColor: "#e5e5e5",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipePlaceholder: {
    backgroundColor: "#e5e5e5",
  },
  recipeContent: {
    flex: 1,
    marginLeft: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    fontFamily: Platform.select({
      android: "BricolageGrotesque_600SemiBold",
      ios: "BricolageGrotesque-SemiBold",
    }),
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMeta: {
    fontSize: 13,
    color: "#667",
    fontWeight: "700",
    fontFamily: Platform.select({
      android: "Manrope_700Bold",
      ios: "Manrope-Bold",
    }),
  },
  checkboxContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  checkboxOuter: {
    width: 25,
    height: 25,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  floatingButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingButtonDisabled: {
    backgroundColor: "#ccc",
  },
  floatingButtonText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
    fontFamily: Platform.select({
      android: "Manrope_700Bold",
      ios: "Manrope-Bold",
    }),
  },
  floatingButtonTextDisabled: {
    color: "#999",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
