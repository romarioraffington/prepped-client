import type React from "react";
import { StyleSheet, View } from "react-native";

import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  type SharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

interface ParallaxScrollViewProps {
  headerHeight?: number;
  headerImage: React.ReactNode;
  children: React.ReactNode;
  scrollEventThrottle?: number;
  /** Optional external shared value to track scroll position for LargeTitle pattern */
  offsetY?: SharedValue<number>;
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerImage,
  headerHeight = 400,
  scrollEventThrottle = 16,
  offsetY,
}) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  // Create scroll handler that updates both internal and external scroll values
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: ({ contentOffset: { y } }) => {
      if (offsetY) {
        offsetY.value = y;
      }
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={offsetY ? scrollHandler : undefined}
    >
      <Animated.View
        style={[
          styles.header,
          headerAnimatedStyle,
          {
            height: headerHeight,
          },
        ]}
      >
        {headerImage}
      </Animated.View>
      <View>{children}</View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: "hidden",
    backgroundColor: "#fff",
  },
});
