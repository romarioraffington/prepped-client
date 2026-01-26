// External dependencies
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import Animated, {
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// Internal dependencies
import { LoadingImageCarousel } from "@/components/Image";

export const LoadingEntityCard = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.card}>
      {/* Image Carousel Skeleton */}
      <LoadingImageCarousel />

      {/* Content Skeleton */}
      <View style={styles.content}>
        <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
        <View style={styles.ratingContainer}>
          <Animated.View style={[styles.skeletonStars, animatedStyle]} />
          <Animated.View style={[styles.skeletonReviewCount, animatedStyle]} />
        </View>
        <Animated.View style={[styles.skeletonStatus, animatedStyle]} />
        <Animated.View style={[styles.skeletonDescription, animatedStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  content: {
    padding: 12,
  },
  skeletonTitle: {
    height: 18,
    width: 140,
    borderRadius: 4,
    marginBottom: 6,
    backgroundColor: "#E1E1E1",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  skeletonStars: {
    height: 14,
    width: 100,
    backgroundColor: "#E1E1E1",
    borderRadius: 4,
    marginRight: 10,
  },
  skeletonReviewCount: {
    height: 14,
    width: 50,
    backgroundColor: "#E1E1E1",
    borderRadius: 4,
  },
  skeletonStatus: {
    height: 14,
    width: 160,
    backgroundColor: "#E1E1E1",
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonDescription: {
    width: 250,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E1E1E1",
  },
});
