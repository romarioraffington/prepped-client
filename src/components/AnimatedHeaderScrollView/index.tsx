// External imports
import type React from "react";
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { type SharedValue } from "react-native-reanimated";

// Internal imports
import { LargeTitle } from "@/components/LargeTitle";
import { useLargeTitleCrossfade } from "@/hooks";

interface AnimatedHeaderScrollViewProps {
  children?: React.ReactNode;
  headerTitle?: string;
  /** Optional external shared value to track scroll position */
  offsetY?: SharedValue<number>;
}

export function AnimatedHeaderScrollView({
  children,
  headerTitle,
  offsetY: externalOffsetY,
}: AnimatedHeaderScrollViewProps) {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();

  // Use the crossfade hook for title animation
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: headerTitle,
    offsetY: externalOffsetY,
  });

  // Set up header options - uses native headerBlurEffect, no cleanup needed
  useLayoutEffect(() => {
    if (!headerTitle) return;
    navigation.setOptions(getHeaderOptions());
  }, [navigation, headerTitle, getHeaderOptions]);

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 50, paddingTop: headerHeight + 16 }}
    >
      {headerTitle && (
        <LargeTitle
          ref={titleRef}
          offsetY={offsetY}
          onLayout={measureTitle}
          currentTitle={headerTitle}
          opacity={largeTitleOpacity}
        />
      )}
      {children}
    </Animated.ScrollView>
  );
}
