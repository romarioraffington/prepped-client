// External Imports
import React, { type FC } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";

import Animated, {
  interpolate,
  withTiming,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const INDICATOR_ANIM_DURATION = 250;

type Props = {
  activeTabIndex: SharedValue<number>;
  tabMeasurements: { width: number; x: number }[];
  horizontalListOffsetX: SharedValue<number>;
  isHorizontalListScrollingX: SharedValue<boolean>;
};

export const TabIndicator: FC<Props> = ({
  activeTabIndex,
  tabMeasurements,
  horizontalListOffsetX,
  isHorizontalListScrollingX,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  const tabOffsets = tabMeasurements.map((m) => m.x);
  const tabWidths = tabMeasurements.map((m) => m.width);

  const rIndicatorStyle = useAnimatedStyle(() => {
    // Safety check for valid data
    if (
      tabOffsets.length === 0 ||
      tabWidths.length === 0 ||
      tabOffsets[activeTabIndex.value] === undefined
    ) {
      return {
        left: 0,
        width: 0,
      };
    }

    const left = isHorizontalListScrollingX.value
      ? interpolate(
        horizontalListOffsetX.value / windowWidth,
        tabOffsets.map((_, i) => i),
        tabOffsets
      )
      : withTiming(tabOffsets[activeTabIndex.value], {
        duration: INDICATOR_ANIM_DURATION,
      });

    const width = isHorizontalListScrollingX.value
      ? interpolate(
        horizontalListOffsetX.value / windowWidth,
        tabWidths.map((_, i) => i),
        tabWidths
      )
      : withTiming(tabWidths[activeTabIndex.value] ?? 0, {
        duration: INDICATOR_ANIM_DURATION,
      });

    return {
      left,
      width,
    };
  });

  return <Animated.View style={[styles.indicator, rIndicatorStyle]} />;
};

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    height: 2,
    bottom: 0,
    borderRadius: 1,
    backgroundColor: "#000000",
  },
});
