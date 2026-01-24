// External Dependencies
import type { RefObject } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-portalize";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import type { Recipe, ImageGridItem } from "@/libs/types";
import { Colors, COLLECTION_TYPE } from "@/libs/constants";
import { useCookbooks, useBulkAddRecipesToCookbookMutation } from "@/api";

// Components
import { DotsLoader } from "@/components/DotsLoader";
import { ShimmerImage } from "@/components/ShimmerImage";
import { BlurBackButton } from "@/components/BlurBackButton";
import { RecipeCarousel } from "@/components/Recipe/RecipeCarousel";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

const IMAGE_SIZE = 56;
const IMAGE_RADIUS = 10;

export interface AddToCookbookSheetProps {
  recipes: Recipe[];
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  currentCookbookId: string;
  bottomSheetRef: RefObject<BottomSheet | null>;
}

export function AddToCookbookSheet({
  recipes,
  onClose,
  onSuccess,
  isOpen = false,
  bottomSheetRef,
  currentCookbookId,
}: AddToCookbookSheetProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useActionToast();
  const snapPoints = ["100%"];
  const [selectedCookbookIds, setSelectedCookbookIds] = useState<Set<string>>(new Set());

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
  const {
    isPending,
    mutateAsync: bulkAddAsync,
  } = useBulkAddRecipesToCookbookMutation();

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

  // Open/close sheet based on isOpen prop
  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Small delay to ensure Portal is mounted
      const timeoutId = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 150);
      return () => clearTimeout(timeoutId);
    }
    if (!isOpen && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [isOpen, bottomSheetRef]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isPending) return;
    bottomSheetRef.current?.close();
  }, [bottomSheetRef, isPending]);

  // Handle sheet change - detect when sheet closes
  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      // Reset selections when sheet closes
      setSelectedCookbookIds(new Set());
      onClose?.();
    }
  }, [onClose]);

  // Handle cookbook selection (toggle checkbox)
  const handleSelectCookbook = useCallback((cookbookId: string) => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCookbookIds((prev) => {
      const next = new Set(prev);
      if (next.has(cookbookId)) {
        next.delete(cookbookId);
      } else {
        next.add(cookbookId);
      }
      return next;
    });
  }, [isPending]);

  // Handle save (add to cookbooks)
  const handleSave = useCallback(async () => {
    if (selectedCookbookIds.size === 0 || isPending) return;

    const recipeCount = recipes.length;
    const recipeIds = recipes.map((r) => r.id);
    const cookbookIds = Array.from(selectedCookbookIds);
    const cookbookCount = cookbookIds.length;
    const recipeText = recipeCount === 1 ? "recipe" : "recipes";

    try {
      await bulkAddAsync({
        recipeIds,
        cookbookIds,
      });

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show toast message
      if (cookbookCount === 1) {
        const cookbook = cookbooks.find((cb) => cb.id === cookbookIds[0]);
        const cookbookName = cookbook?.name ?? "cookbook";
        showToast({
          text: `Added ${recipeCount} ${recipeText} to ${cookbookName}`,
        });
      } else {
        showToast({
          text: `Added ${recipeCount} ${recipeText} to ${cookbookCount} cookbooks`,
        });
      }

      // Close sheet
      bottomSheetRef.current?.close();

      // Notify parent of success
      onSuccess?.();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        "Oops!",
        error instanceof Error ? error.message : "Failed to add recipes. Please try again.",
        [{ text: "OK" }],
      );
    }
  }, [
    recipes,
    cookbooks,
    onSuccess,
    showToast,
    isPending,
    bulkAddAsync,
    bottomSheetRef,
    selectedCookbookIds,
  ]);

  // Handle create cookbook
  const handleCreateCookbook = useCallback(() => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to create cookbook route with recipe IDs
    // After creation, automatically add recipes to new cookbook
    Alert.alert(
      "Create Cookbook",
      "Create cookbook functionality coming soon",
      [{ text: "OK" }],
    );
  }, [isPending]);

  // Render backdrop
  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

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
          style={[styles.cookbookItem, isPending && styles.cookbookItemDisabled]}
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
            <View style={[styles.checkboxOuter, isSelected && styles.checkboxOuterSelected]}>
              <View style={styles.checkboxInner}>
                {isSelected && (
                  <Ionicons name="checkmark-done-sharp" size={14} color={Colors.primary} />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [selectedCookbookIds, handleSelectCookbook, isPending],
  );

  /**
   * Render Header
   */
  const isSaveButtonDisabled = selectedCookbookIds.size === 0 || isPending;
  const renderHeader = useCallback(() => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BlurBackButton onPress={handleClose} disabled={isPending} />
        <Text style={styles.headerTitle}>Add to Cookbook</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={isSaveButtonDisabled}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isPending && <ActivityIndicator size="small" color={Colors.primary} />}
          <Text style={[styles.saveButtonText, isSaveButtonDisabled && styles.saveButtonTextDisabled]}>
            {isPending ? "Saving" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </View>
  ), [
    isPending,
    insets.top,
    handleSave,
    handleClose,
    isSaveButtonDisabled,
  ]);

  return (
    <Portal>
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        handleComponent={() => null}
        enableDynamicSizing={false}
        enablePanDownToClose={!isPending}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
      >
        {/* Header */}
        {renderHeader()}

        {/* Recipe preview section */}
        <View style={styles.recipeSection}>
          <Text style={styles.sectionLabel}>
            Adding {recipes.length === 1 ? "1 RECIPE" : `${recipes.length} RECIPES`}
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
              size={17}
              style={styles.createButtonIcon}
              color={isPending ? Colors.matureForeground : Colors.primary}
            />
            <Text style={[
              styles.createButtonText,
              isPending && styles.createButtonTextDisabled,
            ]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingCookbooks ? (
          <View style={styles.loadingContainer}>
            <DotsLoader />
          </View>
        ) : (
          <BottomSheetFlatList
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
      </BottomSheet>
    </Portal>
  );
}
const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    paddingVertical: 10,
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
    fontSize: 17,
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
    marginRight: 4,
  },
  createButtonText: {
    fontSize: 14,
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
    flex: 1,
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
