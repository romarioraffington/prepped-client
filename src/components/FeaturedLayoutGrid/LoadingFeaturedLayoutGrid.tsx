// External imports
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// Internal imports
import { CARD_MARGIN, FIRST_CARD_WIDTH, REGULAR_CARD_WIDTH } from "./consts";

interface LoadingFeaturedLayoutGridProps {
  featuredIndex?: number[];
}

export const LoadingFeaturedLayoutGrid = ({
  featuredIndex = [],
}: LoadingFeaturedLayoutGridProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const PlaceCardSkeleton = ({ isFeatured = false }) => {
    const cardWidth = isFeatured ? FIRST_CARD_WIDTH : REGULAR_CARD_WIDTH;
    const imageHeight = isFeatured ? 200 : 160;

    return (
      <View style={[styles.placeCard, { width: cardWidth }]}>
        <Animated.View
          style={[styles.placeImage, { height: imageHeight }, animatedStyle]}
        />
        <View style={styles.placeInfo}>
          <Animated.View
            style={[styles.skeletonText, { width: "80%" }, animatedStyle]}
          />
          <Animated.View
            style={[styles.skeletonText, { width: "60%" }, animatedStyle]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.placesGrid}>
      {[...Array(5)].map((_, index) => (
        <PlaceCardSkeleton
          key={index}
          isFeatured={featuredIndex.includes(index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  placesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: CARD_MARGIN,
  },
  placeCard: {
    backgroundColor: "#fff",
  },
  placeImage: {
    width: "100%",
    resizeMode: "cover",
    borderRadius: 12,
    backgroundColor: "#E1E9EE",
  },
  placeInfo: {
    padding: 12,
    paddingLeft: 0,
    alignItems: "flex-start",
    gap: 4,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
  },
});
