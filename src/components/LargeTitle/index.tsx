// External Dependencies
import React, { forwardRef } from "react";
import { Platform, StyleSheet } from "react-native";

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

type LargeTitleProps = {
  /** Main title text */
  currentTitle: string;
  /** Secondary title text (displayed below, faded) */
  previousTitle?: string;
  /** Shared value for scroll position - used for pull-to-refresh scale effect */
  offsetY: SharedValue<number>;
  /** Animated opacity value - controlled by parent/hook for crossfade */
  opacity?: SharedValue<number>;
  /** Called when the component layout changes - used for measurement */
  onLayout?: () => void;
  /** Custom style for the title text */
  titleStyle?: object;
};

/**
 * Pure visual component for rendering a large title with optional subtitle.
 *
 * Features:
 * - Two-line title support (currentTitle + previousTitle)
 * - Subtle scale animation on pull-to-refresh
 * - Animated opacity controlled by parent for crossfade with header title
 *
 * This component does NOT manage navigation header state - that responsibility
 * belongs to the screen component using useLargeTitleCrossfade hook.
 *
 * @example
 * ```tsx
 * const { titleRef, measureTitle, largeTitleOpacity, offsetY } = useLargeTitleCrossfade({
 *   currentTitle: "Saint Lucia",
 *   previousTitle: "Caribbean",
 * });
 *
 * <LargeTitle
 *   ref={titleRef}
 *   offsetY={offsetY}
 *   onLayout={measureTitle}
 *   currentTitle="Kingston"
 *   previousTitle="Jamaica"
 *   opacity={largeTitleOpacity}
 * />
 * ```
 */
export const LargeTitle = forwardRef<Animated.View, LargeTitleProps>(
  function LargeTitle(
    { currentTitle, previousTitle, offsetY, opacity, onLayout, titleStyle },
    ref,
  ) {
    // Animated style for opacity and pull-to-refresh scale effect
    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        offsetY.value,
        [0, -200],
        [1, 1.1],
        Extrapolation.CLAMP,
      );

      return {
        opacity: opacity?.value ?? 1,
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View
        ref={ref}
        onLayout={onLayout}
        style={[styles.titleContainer, animatedStyle]}
      >
        <Animated.Text style={[styles.currentTitle, titleStyle]}>{currentTitle}</Animated.Text>
        {previousTitle ? (
          <Animated.Text style={styles.previousTitle}>
            {`${previousTitle},`}
          </Animated.Text>
        ) : null}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  titleContainer: {
    transformOrigin: "left",
  },
  currentTitle: {
    fontFamily: Platform.select({
      android: "BricolageGrotesque_500Medium",
      ios: "BricolageGrotesque-Medium",
    }),
    fontSize: 34,
    color: "#000",
  },
  previousTitle: {
    fontFamily: Platform.select({
      android: "BricolageGrotesque_500Medium",
      ios: "BricolageGrotesque-Medium",
    }),
    fontSize: 34,
    opacity: 0.5,
    color: "#667",
    marginTop: -2,
  },
});
