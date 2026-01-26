// External Dependencies
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatNumber } from "@/libs/utils";
// Internal Dependencies
import { RatingStars } from "../RatingStars";

interface RatingInfoProps {
  size?: number;
  rating: number;
  reviewCount: number;
}

export const RatingInfo = ({ size, rating, reviewCount }: RatingInfoProps) => {
  // Don't render if there are no reviews
  if (rating === 0 && reviewCount === 0) {
    return null;
  }

  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingAverage}>{rating.toFixed(1)}</Text>
      <RatingStars rating={rating} size={size} />
      <Text style={styles.reviewCount}>({formatNumber(reviewCount)})</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingAverage: {
    color: "#667",
    fontSize: 14,
    marginRight: 4,
  },
  reviewCount: {
    color: "#999",
    fontSize: 12,
  },
});
