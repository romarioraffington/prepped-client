import React, { type FC, type RefObject, useState, useCallback } from "react";
import {
  Dimensions,
  type FlatList,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
// External Imports
import {
  type SharedValue,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";

import { TabIndicator } from "./TabIndicator";
// Internal Imports
import { TabItem } from "./TabItem";

export type TabData = { label: string; value: number };
export type TabsData = TabData[];

export const CONTENT_WIDTH = Dimensions.get("window").width;

type Props = {
  tabs: TabsData;
  horizontalListRef: RefObject<FlatList | null>;
  horizontalListOffsetX: SharedValue<number>;
  isHorizontalListScrollingX: SharedValue<boolean>;
  activeTabIndex: SharedValue<number>;
  onTabPress?: (index: number, isActive: boolean) => void;
};

export const TopTabs: FC<Props> = ({
  tabs,
  horizontalListRef,
  horizontalListOffsetX,
  isHorizontalListScrollingX,
  activeTabIndex,
  onTabPress,
}) => {
  const [tabMeasurements, setTabMeasurements] = useState<
    { width: number; x: number }[]
  >(new Array(tabs.length).fill({ width: 0, x: 0 }));

  // Track active tab index in React state for re-renders
  const [currentActiveIndex, setCurrentActiveIndex] = useState(
    activeTabIndex.value,
  );

  // Sync shared value changes to React state
  useAnimatedReaction(
    () => activeTabIndex.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setCurrentActiveIndex)(current);
      }
    },
    [activeTabIndex],
  );

  const handleTabLayout = useCallback(
    (index: number) => (event: LayoutChangeEvent) => {
      const { width, x } = event.nativeEvent.layout;
      setTabMeasurements((prev) => {
        const updated = [...prev];
        updated[index] = { width, x };
        return updated;
      });
    },
    [],
  );

  const handleTabPress = useCallback(
    (index: number) => {
      const isActive = activeTabIndex.value === index;
      onTabPress?.(index, isActive);
      if (!isActive) {
        activeTabIndex.value = index;
        horizontalListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: true,
        });
      }
    },
    [activeTabIndex, horizontalListRef, onTabPress],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabsRow}>
        {tabs.map((item, index) => (
          <View
            key={item.value}
            style={styles.tabItemContainer}
            onLayout={handleTabLayout(index)}
          >
            <TabItem
              label={item.label}
              isActive={currentActiveIndex === index}
              onPress={() => handleTabPress(index)}
            />
          </View>
        ))}
        <TabIndicator
          activeTabIndex={activeTabIndex}
          tabMeasurements={tabMeasurements}
          horizontalListOffsetX={horizontalListOffsetX}
          isHorizontalListScrollingX={isHorizontalListScrollingX}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
});
