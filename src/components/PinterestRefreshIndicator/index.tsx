// External Dependencies
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

import Animated, {
  Easing,
  interpolate,
  withRepeat,
  withSpring,
  withTiming,
  Extrapolation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

// Internal Dependencies
import { usePullToRefresh } from "../WithPullToRefresh";

// DOT_SIZE controls visual weight of each node; small size keeps motion readable during rotation
const DOT_SIZE = 10;
// DOT_GAP tuned for equilateral spacing; determines triangle footprint and rotation radius
const DOT_GAP = 10;

// Vertical spacing for equilateral triangle layout (keeps triangle equi-angular during scale)
// For equilateral triangle: vertical gap = horizontal gap * sqrt(3) / 2
const VERTICAL_GAP = DOT_GAP * (Math.sqrt(3) / 2);

// Color cycle order chosen for high contrast between adjacent hues during interpolation
// Purple gradient matching TripSpire app aesthetics
const DOT_COLORS = ["#8a49b4", "#7C3AED", "#a855f7", "#c084fc"]; // primary purple, secondary purple, vibrant purple, light purple

const Dot: FC<{ refreshing: boolean }> = ({ refreshing }) => {
  // scale: subtle breathing to imply activity while refreshing; 0.7–1 mirror repeated with yoyo
  const scale = useDerivedValue(() => {
    return refreshing
      ? withRepeat(
        // 500ms hits a calm cadence; Easing.inOut keeps endpoints soft to avoid popping
        withTiming(0.7, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // yoyo to return to 1 without jump
      )
      : 1;
  });

  // colorIndex: advances continuously to blend between palette entries while refreshing
  const colorIndex = useDerivedValue(() => {
    return refreshing
      ? withRepeat(
        // 0→length over 2000ms gives ~500ms per color cross-fade
        withTiming(DOT_COLORS.length, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      )
      : 0;
  });

  const rDotStyle = useAnimatedStyle(() => {
    const currentColorIndex = Math.floor(colorIndex.value % DOT_COLORS.length);
    const nextColorIndex = (currentColorIndex + 1) % DOT_COLORS.length;
    const progress = colorIndex.value % 1;

    const currentColor = DOT_COLORS[currentColorIndex];
    const nextColor = DOT_COLORS[nextColorIndex];

    // Interpolate between current and next color; manual RGB lerp avoids extra deps and runs on UI thread
    const interpolateColor = (color1: string, color2: string, progress: number) => {
      const r1 = Number.parseInt(color1.slice(1, 3), 16);
      const g1 = Number.parseInt(color1.slice(3, 5), 16);
      const b1 = Number.parseInt(color1.slice(5, 7), 16);

      const r2 = Number.parseInt(color2.slice(1, 3), 16);
      const g2 = Number.parseInt(color2.slice(3, 5), 16);
      const b2 = Number.parseInt(color2.slice(5, 7), 16);

      const r = Math.round(r1 + (r2 - r1) * progress);
      const g = Math.round(g1 + (g2 - g1) * progress);
      const b = Math.round(b1 + (b2 - b1) * progress);

      return `rgb(${r}, ${g}, ${b})`;
    };

    return {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: interpolateColor(currentColor, nextColor, progress),
      transform: [{ scale: scale.get() }], // breath scale applied per-dot for subtle shimmer within rotating group
    };
  });

  return <Animated.View style={rDotStyle} />;
};

const usePullToRefreshSafe = () => {
  try {
    return usePullToRefresh();
  } catch (error) {
    return null;
  }
};

type PinterestRefreshIndicatorProps = {
  refreshing?: boolean;
  progress?: number;
};

export const PinterestRefreshIndicator: FC<PinterestRefreshIndicatorProps> = ({ refreshing: refreshingProp, progress }) => {
  const context = usePullToRefreshSafe();
  const fallbackProgress = useSharedValue(progress ?? 1);
  const refreshProgress = context?.refreshProgress ?? fallbackProgress;
  const refreshing = refreshingProp ?? context?.refreshing ?? true;

  // rotateWithoutRefreshing: map pull distance to rotation (0→360deg) for direct manipulation feel
  const rotateWithoutRefreshing = useDerivedValue(() => {
    return interpolate(refreshProgress.get(), [0, 1], [0, 360], Extrapolation.CLAMP); // 0→1 maps to 0→360deg
  });

  // scaleWithoutRefreshing: grow triangle from 0→1 to communicate affordance as user pulls
  const scaleWithoutRefreshing = useDerivedValue(() => {
    return interpolate(refreshProgress.get(), [0, 1], [0, 1], Extrapolation.CLAMP);
  });

  const rInnerContainerStyle = useAnimatedStyle(() => {
    return {
      // Fade-in earlier than full pull distance to pre-announce the indicator
      opacity: interpolate(refreshProgress.get(), [0, 0.75], [0, 1], Extrapolation.CLAMP),
      transform: [
        { scale: scaleWithoutRefreshing.get() }, // scale-in during pull interaction
        { rotate: `-${rotateWithoutRefreshing.get()}deg` }, // counter-rotate inner to keep dots upright while outer spins
      ],
    };
  });

  // rotateOnRefreshing: continuous rotation while refreshing; linear for constant velocity
  const rotateOnRefreshing = useDerivedValue(() => {
    return refreshing
      ? withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }), // 1.5s feels calm yet lively
        -1,
        false // accumulate angle rather than yoyo for same-direction spin
      )
      : 0;
  });

  const rOuterContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          // Lift the indicator when refreshing to separate from content area; spring adds tactile snap
          translateY: withSpring(refreshing ? 25 : 0),
        },
        { rotate: `${rotateOnRefreshing.get()}deg` }, // outer rotation drives overall spinner motion
      ],
    };
  });

  return (
    <Animated.View style={rOuterContainerStyle}>
      <Animated.View
        style={[styles.innerContainer, rInnerContainerStyle, { gap: VERTICAL_GAP }]}
      >
        <Dot refreshing={refreshing} />
        <View style={[styles.dotsRow, { gap: DOT_GAP }]}>
          <Dot refreshing={refreshing} />
          <Dot refreshing={refreshing} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    flexDirection: "row",
  },
});

