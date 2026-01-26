// External Components
import type React from "react";
import { type FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
  Easing,
  type SharedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Internal Components
import { MarqueeItem, _itemWidth } from "../MarqueeItem";

const DEFAULT_SCROLL_SPEED = 25; // Units per second

type Props = {
  events: {
    image: number | { uri: string; cachePolicy?: string };
    renderFooter?: () => React.ReactNode;
  }[];
  scrollOffsetX: SharedValue<number>;
};

const MarqueeComponent: FC<Props> = ({ events, scrollOffsetX }) => {
  const scrollSpeed = useSharedValue(DEFAULT_SCROLL_SPEED);

  const allItemsWidth = events.length * _itemWidth;

  useFrameCallback((frameInfo) => {
    // deltaSeconds is important to handle different device frame rates (30, 60, 120 etc.)
    const deltaSeconds = (frameInfo?.timeSincePreviousFrame ?? 0) / 1000;
    scrollOffsetX.value += scrollSpeed.value * deltaSeconds;
  });

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scrollSpeed.value = 0;
    })
    .onChange((event) => {
      scrollOffsetX.value -= event.changeX;
    })
    .onFinalize((event) => {
      scrollSpeed.value = -event.velocityX;
      scrollSpeed.value = withTiming(DEFAULT_SCROLL_SPEED, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      });
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {events.map((event, index) => (
          <MarqueeItem
            key={index}
            index={index}
            imageSrc={event.image}
            scrollOffsetX={scrollOffsetX}
            allItemsWidth={allItemsWidth}
            renderFooter={event.renderFooter}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    flexDirection: "row",
  },
});

export const Marquee = memo(MarqueeComponent);
