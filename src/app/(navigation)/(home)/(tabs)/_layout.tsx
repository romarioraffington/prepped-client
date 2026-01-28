// External Imports
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import type { FlatList } from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  View,
  StyleSheet,
  DeviceEventEmitter,
} from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";


// Internal Imports
import { Colors } from "@/libs/constants";
import { useHeaderAnimation } from "@/hooks";
import type { ImageGridItem } from "@/libs/types";
import { TabScrollProvider, useTabScroll } from "@/contexts";
import { BOTTOM_NAV_SCROLL_EVENT } from "@/hooks/useBottomNavigationAnimation";

import {
  TopTabs,
  type TabData,
  type TabsData,
  CONTENT_WIDTH,
  FloatingAddButton,
} from "@/components";

// Content Components
import Cookbooks from "./index";
import Recipes from "./recipes";

enum Tab {
  Cookbooks = 0,
  Recipes = 1,
}

const tabs: TabsData = [
  { label: "Cookbooks", value: Tab.Cookbooks },
  { label: "Recipes", value: Tab.Recipes },
];

const HOME_TAB_PRESS_EVENT = "tabPress:home";

type ScrollableRef = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
};

function TabsContent() {
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const fabOpacity = useSharedValue(1); // Use Reanimated instead of RNAnimated
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [statusBarHidden, setStatusBarHidden] = useState(false);
  const blurHeight = headerHeight || insets.top + 50;
  const blurOpacity = headerHeight > 0 ? 1 : 0;

  // Bulk edit mode state
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(
    new Set(),
  );

  const [hasRecipes, setHasRecipes] = useState(true);
  const [currentScrollDirection, setCurrentScrollDirection] = useState<
    "to-top" | "to-bottom" | "idle"
  >("idle");

  // From context
  const {
    scrollDirection,
    handleTabScroll,
    resetScrollDirection
  } = useTabScroll();

  // Horizontal tabs state
  const activeTabIndex = useSharedValue(0);
  const horizontalListOffsetX = useSharedValue(0);
  const isHorizontalListScrollingX = useSharedValue(false);
  const recipesListRef = useRef<ScrollableRef | null>(null);
  const horizontalListRef = useRef<FlatList<TabData> | null>(null);
  const cookbooksListRef = useRef<FlatList<ImageGridItem> | null>(null);

  // Header animation
  const { rHeaderStyle, rBlurStyle, scrollHandler, resetHeaderForTabSwitch } =
    useHeaderAnimation({
      headerHeight,
      scrollDirection,
      handleTabScroll,
      isHorizontalScrolling: isHorizontalListScrollingX,
    });

  // Status bar visibility: hide on scroll down, show on scroll up
  useAnimatedReaction(
    () => scrollDirection.value,
    (currentDirection, previousDirection) => {
      const shouldHide = currentDirection === "to-bottom";
      if (
        previousDirection === undefined ||
        currentDirection !== previousDirection
      ) {
        scheduleOnRN(setStatusBarHidden, shouldHide);
      }
    },
  );

  // Callback to emit bottom nav scroll event
  const emitBottomNavEvent = useCallback((shouldHide: boolean) => {
    DeviceEventEmitter.emit(BOTTOM_NAV_SCROLL_EVENT, shouldHide);
  }, []);

  // Track scroll direction in React state for use in useEffect
  useAnimatedReaction(
    () => scrollDirection.value,
    (currentDirection) => {
      scheduleOnRN(setCurrentScrollDirection, currentDirection);
    },
  );

  // Animate FAB opacity directly with Reanimated - no serialization issues
  useAnimatedReaction(
    () => scrollDirection.value,
    (currentDirection, previousDirection) => {
      if (currentDirection === previousDirection) return;
      const shouldHide = currentDirection === "to-bottom";
      fabOpacity.value = withSpring(shouldHide ? 0 : 1, {
        damping: 30,
        stiffness: 100,
      });
      scheduleOnRN(emitBottomNavEvent, shouldHide);
    },
  );

  // Sync active tab index to React state for FloatingAddButton
  useAnimatedReaction(
    () => activeTabIndex.value,
    (current, previous) => {
      if (previous !== undefined && current === previous) return;
      scheduleOnRN(setCurrentTabIndex, current);
    },
  );

  // Ensure status bar is visible initially
  useEffect(() => {
    setStatusBarHidden(false);
  }, []);

  // Exit bulk edit mode when switching away from Recipes tab
  useEffect(() => {
    if (currentTabIndex !== Tab.Recipes && isBulkEditMode) {
      setIsBulkEditMode(false);
      setSelectedRecipeIds(new Set());
    }
  }, [currentTabIndex, isBulkEditMode]);

  // Exit bulk edit mode if recipes list becomes empty
  useEffect(() => {
    if (isBulkEditMode && !hasRecipes) {
      setIsBulkEditMode(false);
      setSelectedRecipeIds(new Set());
    }
  }, [isBulkEditMode, hasRecipes]);

  // Hide bottom navigation when in bulk edit mode
  useEffect(() => {
    // Only hide bottom nav when on Recipes tab and in bulk edit mode
    if (currentTabIndex === Tab.Recipes && isBulkEditMode) {
      emitBottomNavEvent(true);
    } else if (currentTabIndex === Tab.Recipes && !isBulkEditMode) {
      // Restore bottom nav visibility based on current scroll direction when exiting bulk edit mode
      // Treat "idle" as "to-top" (show bottom nav)
      const shouldHide = currentScrollDirection === "to-bottom";
      emitBottomNavEvent(shouldHide);
    }
  }, [isBulkEditMode, currentTabIndex, currentScrollDirection, emitBottomNavEvent]);

  // Toggle bulk edit mode
  const handleBulkEditPress = useCallback(() => {
    setIsBulkEditMode((prev) => !prev);
    setSelectedRecipeIds(new Set());
  }, []);

  // Handle recipe selection toggle
  const handleRecipeSelect = useCallback((recipeId: string) => {
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

  // Exit bulk edit mode
  const handleBulkEditDone = useCallback(() => {
    setIsBulkEditMode(false);
    setSelectedRecipeIds(new Set());
  }, []);

  // Update hasRecipes state from Recipes component
  const handleRecipesCountChange = useCallback((recipesExist: boolean) => {
    setHasRecipes(recipesExist);
  }, []);

  // Horizontal scroll handler for tab switching
  const horizontalScrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      isHorizontalListScrollingX.value = true;
    },
    onScroll: (event) => {
      horizontalListOffsetX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      isHorizontalListScrollingX.value = false;
      activeTabIndex.value = Math.round(event.contentOffset.x / CONTENT_WIDTH);
      // Reset scroll direction so old tab's direction doesn't affect new tab's blur
      resetScrollDirection();
      // Ensure header state matches the newly focused tab (show if new tab is at top)
      resetHeaderForTabSwitch();
    },
  });

  const renderTabContent = ({ item }: { item: TabData }) => (
    <View style={styles.tabContentContainer}>
      {item.value === Tab.Cookbooks ? (
        <Cookbooks
          listRef={cookbooksListRef}
          scrollHandler={scrollHandler}
          headerHeight={headerHeight}
        />
      ) : (
        <Recipes
          listRef={recipesListRef}
          scrollHandler={scrollHandler}
          headerHeight={headerHeight}
          isBulkEditMode={isBulkEditMode}
          selectedRecipeIds={selectedRecipeIds}
          onRecipeSelect={handleRecipeSelect}
          onBulkEditDone={handleBulkEditDone}
          onRecipesCountChange={handleRecipesCountChange}
        />
      )}
    </View>
  );

  const scrollTabToTop = useCallback((tabIndex: number) => {
    if (tabIndex === Tab.Cookbooks) {
      cookbooksListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }
    if (tabIndex === Tab.Recipes) {
      recipesListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }
  }, []);

  const switchToTab = useCallback(
    (index: number) => {
      activeTabIndex.value = index;
      setCurrentTabIndex(index);
      horizontalListRef.current?.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: true,
      });
      resetScrollDirection();
      resetHeaderForTabSwitch();
    },
    [
      activeTabIndex,
      horizontalListRef,
      resetHeaderForTabSwitch,
      resetScrollDirection,
    ],
  );

  const handleTopTabPress = useCallback(
    (index: number, isActive: boolean) => {
      if (isActive) {
        scrollTabToTop(index);
        return;
      }
      switchToTab(index);
    },
    [scrollTabToTop, switchToTab],
  );

  useEffect(() => {
    const homeListener = DeviceEventEmitter.addListener(
      HOME_TAB_PRESS_EVENT,
      () => {
        const currentIndex = activeTabIndex.value;
        if (currentIndex === Tab.Recipes) {
          switchToTab(Tab.Cookbooks);
          return;
        }
        scrollTabToTop(currentIndex);
      },
    );

    return () => {
      homeListener.remove();
    };
  }, [activeTabIndex, scrollTabToTop, switchToTab]);

  return (
    <View style={styles.container}>
      {/* Status Bar - hide on scroll down, show on scroll up */}
      <StatusBar style="dark" hidden={statusBarHidden} />

      {/* Blur Background for entire header (covers tabs) */}
      <Animated.View
        style={[
          styles.blurContainer,
          {
            height: blurHeight, // Full header height (fallback used only while hidden)
            opacity: blurOpacity, // Hide until measured to avoid visible jump
          },
          rBlurStyle,
        ]}
        pointerEvents="none"
      >
        <BlurView
          intensity={80}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Animated Header */}
      <Animated.View
        style={[styles.header, rHeaderStyle]}
        onLayout={({ nativeEvent }) => {
          setHeaderHeight(nativeEvent.layout.height);
        }}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <View style={styles.tabsWrapper}>
            <TopTabs
              tabs={tabs}
              onTabPress={handleTopTabPress}
              horizontalListRef={horizontalListRef}
              horizontalListOffsetX={horizontalListOffsetX}
              isHorizontalListScrollingX={isHorizontalListScrollingX}
              activeTabIndex={activeTabIndex}
            />
          </View>
        </View>
      </Animated.View>

      {/* Tab Content - Horizontal FlatList */}
      <Animated.FlatList
        ref={horizontalListRef}
        data={tabs}
        keyExtractor={(item) => item.value.toString()}
        renderItem={renderTabContent}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={horizontalScrollHandler}
        style={styles.flatList}
      />

      <FloatingAddButton
        rightOffset={20}
        bottomOffset={70}
        disableTranslate
        animationValue={fabOpacity}
        activeTabIndex={currentTabIndex}
        isBulkEditMode={isBulkEditMode}
        hasRecipes={hasRecipes}
        onBulkEditPress={handleBulkEditPress}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <TabScrollProvider>
      <TabsContent />
    </TabScrollProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  headerContent: {
    paddingBottom: 0,
  },
  tabsWrapper: {
    alignSelf: "center",
    flexDirection: "row",
  },
  flatList: {
    flex: 1,
  },
  tabContentContainer: {
    width: CONTENT_WIDTH,
    flex: 1,
  },
});
