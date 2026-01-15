import React from "react";
import Svg, { Path } from "react-native-svg";
import { View, StyleSheet, Dimensions } from "react-native";

import Animated, {
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveHeroLoadingProps {
  height?: number;
  children?: React.ReactNode;
  scrollY?: SharedValue<number>;
}

export const WaveHeroLoading = ({
  children,
  scrollY,
  height = 400,
}: WaveHeroLoadingProps) => {
  const { width } = Dimensions.get("window");
  const opacity = useSharedValue(0.5);

  // Fade animation for loading state
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = scrollY
    ? useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-100, 0, 100],
            [15, 0, -15],
            "clamp"
          ),
        },
      ],
    }))
    : {};

  // Animated wave path
  const normalWavePath = "M0,80 C360,150 720,10 1440,80 L1440,120 L0,120 Z";
  const invertedWavePath = "M0,80 C360,10 720,150 1440,80 L1440,120 L0,120 Z";

  const wavePath = useSharedValue(normalWavePath);

  const animatedPathProps = useAnimatedProps(() => {
    if (scrollY) {
      const newPath = interpolate(
        scrollY.value,
        [0, 100],
        [0, 1],
        "clamp"
      );
      wavePath.value = withTiming(
        newPath === 0 ? normalWavePath : invertedWavePath,
        { duration: 0 }
      );
    }
    return {
      d: wavePath.value
    };
  });

  return (
    <View style={[styles.heroBanner, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        {/* Loading skeleton for the image */}
        <Animated.View style={[styles.heroImage, { opacity }]} />

        {/* Wave design */}
        <View style={[styles.waveContainer, { zIndex: 1 }]}>
          <Svg
            height="100%"
            width="100%"
            style={styles.wave}
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <AnimatedPath fill="#fff" animatedProps={animatedPathProps} />
          </Svg>
        </View>
      </Animated.View>

      {/* Hero content overlay */}
      {children}

      {/* Loading skeleton for pagination dots */}
      <View style={styles.pagination}>
        {[1, 2, 3].map((_, index) => (
          <Animated.View
            key={index}
            style={[styles.paginationDot, { opacity }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroBanner: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
  },
  waveContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    position: "absolute",
    backgroundColor: "transparent",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    zIndex: 1,
  },
  pagination: {
    bottom: 70,
    width: "100%",
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginHorizontal: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
