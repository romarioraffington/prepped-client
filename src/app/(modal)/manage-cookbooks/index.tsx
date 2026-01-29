// External Dependencies
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Text,
  View,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

// Internal Dependencies
import { parseSlug } from "@/libs/utils";
import { useQueryClient } from "@tanstack/react-query";
import { DotsLoader } from "@/components/DotsLoader";
import { BlurBackButton } from "@/components/BlurBackButton";
import { CookbookListRow } from "@/components/Cookbook";
import { Colors, QUERY_KEYS } from "@/libs/constants";
import { RecipeCarouselCard } from "@/components/Recipe/RecipeCarouselCard";
import type { ImageGridItem, PaginationMeta, Recipe } from "@/libs/types";

import {
  useCookbooks,
  useSaveRecipeToCookbookMutation,
  useRemoveRecipeFromCookbookMutation,
} from "@/api";

const ITEM_HEIGHT = 80;

export default function ManageCookbooks() {
  const queryClient = useQueryClient();
  const { recipeSlug } = useLocalSearchParams<{ recipeSlug: string }>();

  // Parse slug to extract ID and name
  const { id: recipeId, name: recipeName } = parseSlug(recipeSlug);

  // Local state for selected cookbook IDs (initialized from containsRecipe)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Track initial state to compare on save
  const hasInitializedRef = useRef(false);
  const initialSelectedIdsRef = useRef<Set<string>>(new Set());

  // Mutations
  const {
    isPending: isSaving,
    mutateAsync: saveAsync,
  } = useSaveRecipeToCookbookMutation();

  const {
    isPending: isRemoving,
    mutateAsync: removeAsync,
  } = useRemoveRecipeFromCookbookMutation();

  const isPending = isSaving || isRemoving;

  // Fetch cookbooks with containsRecipe status
  const {
    refetch,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: cookbooksData,
  } = useCookbooks({
    includeStatusForRecipeId: recipeId,
  });

  // Flatten paginated data
  const cookbooks = useMemo(
    () => cookbooksData?.pages.flatMap((page) => page.data) ?? [],
    [cookbooksData?.pages],
  );

  // Sort cookbooks: those with recipe first, then others
  const sortedCookbooks = useMemo(() => {
    if (!cookbooks) return [];
    const withRecipe = cookbooks.filter((c) => c.containsRecipe === true);
    const withoutRecipe = cookbooks.filter((c) => c.containsRecipe !== true);
    return [...withRecipe, ...withoutRecipe];
  }, [cookbooks]);

  // Initialize selection state from containsRecipe
  useEffect(() => {
    if (cookbooks.length > 0 && !hasInitializedRef.current) {
      const initialIds = new Set(
        cookbooks.filter((c) => c.containsRecipe).map((c) => c.id),
      );
      setSelectedIds(initialIds);
      initialSelectedIdsRef.current = new Set(initialIds);
      hasInitializedRef.current = true;
    }
  }, [cookbooks]);

  // Track if initial data has loaded to avoid refetching on first mount
  const hasInitialDataRef = useRef(false);

  useEffect(() => {
    if (cookbooksData && !isLoading) {
      hasInitialDataRef.current = true;
    }
  }, [cookbooksData, isLoading]);

  // Refetch when modal gains focus (after initial load)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialDataRef.current) {
        refetch();
      }
    }, [refetch]),
  );

  // Get recipe from cache for the RECIPE section
  const recipe = useMemo(() => {
    if (!recipeId) return null;

    // Try to get from recipes list cache
    const recipesData = queryClient.getQueryData<
      import("@tanstack/react-query").InfiniteData<{
        data: Recipe[];
        meta: PaginationMeta;
      }>
    >([QUERY_KEYS.RECIPES]);

    if (recipesData?.pages) {
      const allRecipes = recipesData.pages.flatMap((page) => page.data ?? []);
      const found = allRecipes.find((r) => r.id === recipeId);
      if (found) return found;
    }

    return null;
  }, [recipeId, queryClient]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isPending) return;
    router.back();
  }, [isPending]);

  // Handle cookbook selection (toggle checkbox)
  const handleSelectCookbook = useCallback(
    (cookbookId: string) => {
      if (isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(cookbookId)) {
          next.delete(cookbookId);
        } else {
          next.add(cookbookId);
        }
        return next;
      });
    },
    [isPending],
  );

  // Handle save - commit changes
  const handleSave = useCallback(async () => {
    if (isPending || !recipeSlug) return;

    const initialIds = initialSelectedIdsRef.current;
    const currentIds = selectedIds;

    // Find cookbooks to add (in current but not in initial)
    const toAdd = [...currentIds].filter((id) => !initialIds.has(id));
    // Find cookbooks to remove (in initial but not in current)
    const toRemove = [...initialIds].filter((id) => !currentIds.has(id));

    // No changes
    if (toAdd.length === 0 && toRemove.length === 0) {
      router.back();
      return;
    }

    try {
      // Run all mutations
      const promises: Promise<unknown>[] = [];

      for (const cookbookId of toAdd) {
        promises.push(
          saveAsync({
            cookbookId,
            recipeSlug,
          }),
        );
      }

      for (const cookbookId of toRemove) {
        promises.push(
          removeAsync({
            cookbookId,
            recipeId,
          }),
        );
      }

      await Promise.all(promises);

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate back
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Oops!",
        error instanceof Error
          ? error.message
          : "Failed to update cookbooks. Please try again.",
        [{ text: "OK" }],
      );
    }
  }, [isPending, recipeSlug, recipeId, selectedIds, saveAsync, removeAsync]);

  // Handle create cookbook
  const handleCreateCookbook = useCallback(() => {
    if (isPending) return;
    router.back();
    setTimeout(() => {
      router.push({
        pathname: "/(modal)/create-cookbook",
        params: { recipeSlug },
      });
    }, 100);
  }, [isPending, recipeSlug]);

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Calculate item layout for FlatList performance
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  // Render cookbook item
  const renderCookbookItem = useCallback(
    ({ item }: { item: ImageGridItem }) => {
      const isChecked = selectedIds.has(item.id);
      const recipeCount = item.count ?? 0;
      const recipeText = recipeCount === 1 ? "recipe" : "recipes";

      return (
        <CookbookListRow
          id={item.id}
          name={item.name}
          disabled={isPending}
          isChecked={isChecked ?? false}
          onPress={handleSelectCookbook}
          imageUri={item.imageUris?.[0] ?? null}
          metaText={`${recipeCount} ${recipeText}`}
        />
      );
    },
    [selectedIds, handleSelectCookbook, isPending],
  );

  // Check if there are changes to save (must be before any early return)
  const hasChanges = useMemo(() => {
    const initialIds = initialSelectedIdsRef.current;
    if (initialIds.size !== selectedIds.size) return true;
    for (const id of selectedIds) {
      if (!initialIds.has(id)) return true;
    }
    return false;
  }, [selectedIds]);

  const isSaveButtonDisabled = !hasChanges || isPending;
  const saveButtonText = isPending ? "Saving" : "Save";

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <BlurBackButton onPress={handleClose} />
            <Text style={styles.headerTitle}>Manage Cookbooks</Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BlurBackButton
            onPress={handleClose}
            disabled={isPending}
            style={{ top: 2 }}
          />
          <Text style={styles.headerTitle}>Manage Cookbooks</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isSaveButtonDisabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPending && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
            <Text
              style={[
                styles.saveButtonText,
                isSaveButtonDisabled && styles.saveButtonTextDisabled,
              ]}
            >
              {saveButtonText}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
      </View>

      {/* Recipe preview section */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionLabel}>Recipe</Text>
        <View style={styles.recipeCardContainer}>
          {recipe ? (
            <RecipeCarouselCard recipe={recipe} />
          ) : (
            <View style={styles.minimalRecipeCard}>
              <Text style={styles.minimalRecipeName} numberOfLines={1}>
                {recipeName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Cookbook section header */}
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

      {/* Cookbooks list */}
      <FlatList
        windowSize={5}
        data={sortedCookbooks}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        onEndReachedThreshold={0.5}
        getItemLayout={getItemLayout}
        updateCellsBatchingPeriod={50}
        onEndReached={handleEndReached}
        renderItem={renderCookbookItem}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cookbooks yet!</Text>
            <Text style={styles.emptySubtext}>
              Create your first cookbook to organizing.
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : null
        }
      />
    </View>
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
    paddingHorizontal: 16,
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
  recipeCardContainer: {
    marginTop: 16,
  },
  minimalRecipeCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FAFAF5",
  },
  minimalRecipeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    fontFamily: Platform.select({
      android: "BricolageGrotesque_600SemiBold",
      ios: "BricolageGrotesque-SemiBold",
    }),
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 40,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    fontFamily: Platform.select({
      android: "BricolageGrotesque_600SemiBold",
      ios: "BricolageGrotesque-SemiBold",
    }),
  },
  emptySubtext: {
    fontSize: 14,
    color: "#667",
    textAlign: "center",
    paddingHorizontal: 20,
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
  },
  contentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
