// External Dependencies
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Alert,
  Text,
  View,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { createFullSlug } from "@/libs/utils";
import { DotsLoader } from "@/components/DotsLoader";
import { useQueryClient } from "@tanstack/react-query";
import { BlurBackButton } from "@/components/BlurBackButton";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";
import { RecipeCarousel } from "@/components/Recipe/RecipeCarousel";
import { COLLECTION_TYPE, Colors, QUERY_KEYS } from "@/libs/constants";
import type { ImageGridItem, PaginationMeta, Recipe } from "@/libs/types";
import { useBulkAddRecipesToCookbookMutation, useCookbooks } from "@/api";

// Type for cookbook details cache data
interface CookbookDetailsCache {
  name: string;
  type: number;
  recipesCount: number;
  recipes: Recipe[];
  meta: PaginationMeta;
}

const IMAGE_SIZE = 56;
const IMAGE_RADIUS = 10;

type RouteParams = {
  newCookbookId?: string;
  selectedRecipeIds: string;
  currentCookbookId: string;
  selectedCookbookIds?: string;
};

export default function AddToCookbook() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();

  // Read route params
  const {
    newCookbookId,
    selectedRecipeIds,
    currentCookbookId,
    selectedCookbookIds: selectedIdsParam,
  } = useLocalSearchParams<RouteParams>();

  // Validate required params
  const recipeIdList = useMemo(() => {
    if (!selectedRecipeIds) return [];
    return selectedRecipeIds.split(",").filter(Boolean);
  }, [selectedRecipeIds]);

  // Get recipes from React Query cache
  const recipes = useMemo(() => {
    if (!currentCookbookId || recipeIdList.length === 0) return [];

    const cookbookData = queryClient.getQueryData<CookbookDetailsCache>(
      QUERY_KEYS.COOKBOOK_DETAILS(currentCookbookId),
    );

    if (!cookbookData?.recipes) return [];

    return cookbookData.recipes.filter((r) => recipeIdList.includes(r.id));
  }, [currentCookbookId, recipeIdList, queryClient]);

  // Parse selected cookbook IDs from route params
  const selectedCookbookIds = useMemo(
    () => new Set(selectedIdsParam?.split(",").filter(Boolean) || []),
    [selectedIdsParam],
  );

  // Fetch all cookbooks
  const {
    hasNextPage,
    fetchNextPage,
    data: cookbooksData,
    isFetchingNextPage,
    isLoading: isCookbooksLoading,
  } = useCookbooks();

  // Check if cookbooks are still loading
  const isLoadingCookbooks = isCookbooksLoading || isFetchingNextPage;

  // Bulk add mutation
  const { isPending, mutateAsync: bulkAddAsync } =
    useBulkAddRecipesToCookbookMutation();

  // Load more cookbooks when user scrolls to the end
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all cookbook pages and filter out current cookbook, system cookbooks, and featured cookbooks
  const cookbooks = useMemo(() => {
    if (!cookbooksData?.pages) {
      return [];
    }
    const allCookbooks = cookbooksData.pages.flatMap((page) => page.data ?? []);
    const filtered = allCookbooks.filter(
      (cookbook) =>
        cookbook.id !== currentCookbookId &&
        cookbook.variant !== "featured" &&
        cookbook.type !== COLLECTION_TYPE.UNORGANIZED,
    );
    return filtered;
  }, [cookbooksData, currentCookbookId]);

  // Handle new cookbook pre-selection from route params
  useEffect(() => {
    if (newCookbookId && !selectedCookbookIds.has(newCookbookId)) {
      const next = new Set(selectedCookbookIds);
      next.add(newCookbookId);
      router.setParams({
        newCookbookId: undefined, // Clear the param after using it
        selectedCookbookIds: Array.from(next).join(","),
      });
    }
  }, [newCookbookId, selectedCookbookIds]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isPending) return;
    router.back();
  }, [isPending]);

  // Handle cookbook selection (toggle checkbox) - update route params
  const handleSelectCookbook = useCallback(
    (cookbookId: string) => {
      if (isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const next = new Set(selectedCookbookIds);
      if (next.has(cookbookId)) {
        next.delete(cookbookId);
      } else {
        next.add(cookbookId);
      }

      // Update route params - this persists state automatically
      router.setParams({
        selectedCookbookIds: Array.from(next).join(","),
      });
    },
    [isPending, selectedCookbookIds],
  );

  // Handle save (add to cookbooks)
  const handleSave = useCallback(async () => {
    if (selectedCookbookIds.size === 0 || isPending) return;

    const recipeCount = recipes.length;
    const recipeIdsToAdd = recipes.map((r) => r.id);
    const cookbookIds = Array.from(selectedCookbookIds);
    const cookbookCount = cookbookIds.length;
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    try {
      await bulkAddAsync({
        recipeIds: recipeIdsToAdd,
        cookbookIds,
      });

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show toast message
      if (cookbookCount === 1) {
        const cookbook = cookbooks.find((cb) => cb.id === cookbookIds[0]);
        const cookbookName = cookbook?.name ?? "cookbook";
        const cookbookIdForNav = cookbook?.id;
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
              <Ionicons
                name="checkmark-done-circle"
                size={22}
                color={Colors.primary}
              />
            </View>
          ),
          text: (
            <Text style={{ fontWeight: "600" }}>
              {`Added ${recipeText} to ${cookbookName}`}
            </Text>
          ),
          cta: cookbookIdForNav
            ? {
              text: "View",
              onPress: () => {
                const slug = createFullSlug(cookbookName, cookbookIdForNav);
                router.push({
                  pathname: "/cookbooks/[slug]",
                  params: { slug },
                });
              },
            }
            : undefined,
        });
      } else {
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
              <Ionicons
                name="checkmark-done-circle"
                size={22}
                color={Colors.primary}
              />
            </View>
          ),
          text: (
            <Text style={{ fontWeight: "600" }}>
              {`Added ${recipeText} to ${cookbookCount} cookbooks`}
            </Text>
          ),
        });
      }

      // Navigate back with success indicator
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
    recipes,
    cookbooks,
    showToast,
    isPending,
    bulkAddAsync,
    selectedCookbookIds,
  ]);

  // Handle create cookbook
  const handleCreateCookbook = useCallback(() => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    router.replace({
      pathname: "/(modal)/create-cookbook",
      params: {
        selectedRecipeIds,
        currentCookbookId,
        selectedCookbookIds: Array.from(selectedCookbookIds).join(","),
      },
    });
  }, [
    isPending,
    selectedRecipeIds,
    currentCookbookId,
    selectedCookbookIds
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
   * Render cookbook item
   */
  const renderCookbookItem = useCallback(
    ({ item }: { item: ImageGridItem }) => {
      const isSelected = selectedCookbookIds.has(item.id);
      const recipeCount = item.count ?? 0;
      const recipeText = recipeCount === 1 ? "recipe" : "recipes";

      return (
        <Pressable
          disabled={isPending}
          onPress={() => handleSelectCookbook(item.id)}
          style={[
            styles.cookbookItem,
            isPending && styles.cookbookItemDisabled,
          ]}
        >
          {/* Thumbnail */}
          <View style={styles.cookbookImageContainer}>
            {item.imageUris?.[0] ? (
              <ShimmerImage
                contentFit="cover"
                style={styles.cookbookImage}
                source={{ uri: item.imageUris[0] }}
              />
            ) : (
              <ImagePlaceholder
                iconSize={20}
                height={IMAGE_SIZE}
                style={styles.cookbookPlaceholder}
              />
            )}
          </View>

          {/* Content */}
          <View style={styles.cookbookContent}>
            <Text style={styles.cookbookName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cookbookMeta}>
              {recipeCount} {recipeText}
            </Text>
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
    [selectedCookbookIds, handleSelectCookbook, isPending],
  );

  // Show error if required params are missing
  if (!selectedRecipeIds || !currentCookbookId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <BlurBackButton onPress={handleClose} />
            <Text style={styles.headerTitle}>Add to Cookbook</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.divider} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Unable to load recipes</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading if recipes not found in cache
  if (recipes.length === 0 && recipeIdList.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <BlurBackButton onPress={handleClose} />
            <Text style={styles.headerTitle}>Add to Cookbook</Text>
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

  const isSaveButtonDisabled = selectedCookbookIds.size === 0 || isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BlurBackButton onPress={handleClose} disabled={isPending} />
          <Text style={styles.headerTitle}>Add to Cookbook</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isSaveButtonDisabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPending && <DotsLoader />}
            <Text
              style={[
                styles.saveButtonText,
                isSaveButtonDisabled && styles.saveButtonTextDisabled,
              ]}
            >
              {isPending ? "Saving" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
      </View>

      {/* Recipe preview section */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionLabel}>
          Adding{" "}
          {recipes.length === 1 ? "1 RECIPE" : `${recipes.length} RECIPES`}
        </Text>
        <View style={styles.carouselContainer}>
          <RecipeCarousel recipes={recipes} />
        </View>
      </View>

      {/* Cookbook section header*/}
      <View style={styles.cookbookSectionHeader}>
        <Text style={styles.sectionLabel}>My Cookbooks</Text>
        <TouchableOpacity
          disabled={isPending}
          accessibilityRole="button"
          style={styles.createButton}
          onPress={handleCreateCookbook}
          accessibilityLabel="Create new cookbook"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="add"
            size={18}
            style={styles.createButtonIcon}
            color={isPending ? Colors.matureForeground : Colors.primary}
          />
          <Text
            style={[
              styles.createButtonText,
              isPending && styles.createButtonTextDisabled,
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingCookbooks ? (
        <View style={styles.loadingContainer}>
          <DotsLoader />
        </View>
      ) : (
        <FlatList
          windowSize={5}
          data={cookbooks}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.5}
          getItemLayout={getItemLayout}
          updateCellsBatchingPeriod={50}
          onEndReached={handleEndReached}
          renderItem={renderCookbookItem}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item: ImageGridItem) => item.id}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Create your first cookbook</Text>
            </View>
          }
        />
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
    paddingHorizontal: 25,
  },
  header: {
    paddingTop: 20,
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
  saveButton: {
    gap: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: Platform.select({
      android: "Manrope_600SemiBold",
      ios: "Manrope-SemiBold",
    }),
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E5E0",
  },
  recipeSection: {
    paddingVertical: 20,
    paddingLeft: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Colors.matureForeground,
    fontFamily: Platform.select({
      android: "Manrope_800ExtraBold",
      ios: "Manrope-ExtraBold",
    }),
  },
  carouselContainer: {
    marginTop: 20,
  },
  cookbookSectionHeader: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createButton: {
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  createButtonIcon: {
    marginRight: 0,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: Platform.select({
      android: "Manrope_600SemiBold",
      ios: "Manrope-SemiBold",
    }),
  },
  createButtonTextDisabled: {
    color: "#999",
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
    marginBottom: 16,
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
  },
  contentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  cookbookItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#FAFAF5",
    borderRadius: 16,
  },
  cookbookItemDisabled: {
    opacity: 0.6,
  },
  cookbookImageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    overflow: "hidden",
    marginLeft: 12,
    borderRadius: IMAGE_RADIUS,
    backgroundColor: "#e5e5e5",
  },
  cookbookImage: {
    width: "100%",
    height: "100%",
  },
  cookbookPlaceholder: {
    backgroundColor: "#e5e5e5",
  },
  cookbookContent: {
    flex: 1,
    marginLeft: 12,
  },
  cookbookName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
    fontFamily: Platform.select({
      android: "BricolageGrotesque_600SemiBold",
      ios: "BricolageGrotesque-SemiBold",
    }),
  },
  cookbookMeta: {
    fontSize: 13,
    color: "#667",
    fontWeight: "400",
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Medium",
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
});
