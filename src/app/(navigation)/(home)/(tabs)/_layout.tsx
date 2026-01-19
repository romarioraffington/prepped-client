// External Imports
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import type { FlatList } from "react-native";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, StyleSheet, View, Animated as RNAnimated } from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

// Internal Imports
import { useHeaderAnimation } from "@/hooks";
import type { ImageGridItem } from "@/libs/types";
import { Colors } from "@/libs/constants";
import { TabScrollProvider, useTabScroll } from "@/contexts";
import { BOTTOM_NAV_SCROLL_EVENT } from "@/hooks/useBottomNavigationAnimation";
import { FloatingAddButton, TopTabs, CONTENT_WIDTH, type TabData, type TabsData } from "@/components";

// Content Components
import Recipes from "./recipes";
import Cookbooks from "./index";

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
  const fabOpacity = useRef(new RNAnimated.Value(1)).current;
  const [statusBarHidden, setStatusBarHidden] = useState(false);
  const blurHeight = headerHeight || insets.top + 50;
  const blurOpacity = headerHeight > 0 ? 1 : 0;

  // From context
  const { scrollDirection, handleTabScroll, resetScrollDirection } = useTabScroll();

  // Horizontal tabs state
  const activeTabIndex = useSharedValue(0);
  const horizontalListOffsetX = useSharedValue(0);
  const isHorizontalListScrollingX = useSharedValue(false);
  const recipesListRef = useRef<ScrollableRef | null>(null);
  const horizontalListRef = useRef<FlatList<TabData> | null>(null);
  const cookbooksListRef = useRef<FlatList<ImageGridItem> | null>(null);

  // Header animation
  const { rHeaderStyle, rBlurStyle, scrollHandler, resetHeaderForTabSwitch } = useHeaderAnimation({
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
      if (previousDirection === undefined || currentDirection !== previousDirection) {
        scheduleOnRN(setStatusBarHidden, shouldHide);
      }
    },
  );

  const handleBottomNavVisibility = useCallback(
    (shouldHideNav: boolean) => {
      DeviceEventEmitter.emit(BOTTOM_NAV_SCROLL_EVENT, shouldHideNav);
      RNAnimated.spring(fabOpacity, {
        toValue: shouldHideNav ? 0 : 1,
        useNativeDriver: true,
        damping: 30,
        stiffness: 100,
      }).start();
    },
    [fabOpacity],
  );

  useAnimatedReaction(
    () => scrollDirection.value,
    (currentDirection, previousDirection) => {
      if (currentDirection === previousDirection) return;
      const shouldHideNav = currentDirection === "to-bottom";
      scheduleOnRN(handleBottomNavVisibility, shouldHideNav);
    },
  );

  // Ensure status bar is visible initially
  useEffect(() => {
    setStatusBarHidden(false);
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
        />
      )}
    </View>
  );

  const scrollTabToTop = useCallback(
    (tabIndex: number) => {
      if (tabIndex === Tab.Cookbooks) {
        cookbooksListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      }
      if (tabIndex === Tab.Recipes) {
        recipesListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      }
    },
    [],
  );

  const switchToTab = useCallback(
    (index: number) => {
      activeTabIndex.value = index;
      horizontalListRef.current?.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: true,
      });
      resetScrollDirection();
      resetHeaderForTabSwitch();
    },
    [activeTabIndex, horizontalListRef, resetHeaderForTabSwitch, resetScrollDirection],
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
    const homeListener = DeviceEventEmitter.addListener(HOME_TAB_PRESS_EVENT, () => {
      const currentIndex = activeTabIndex.value;
      if (currentIndex === Tab.Recipes) {
        switchToTab(Tab.Cookbooks);
        return;
      }
      scrollTabToTop(currentIndex);
    });

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
