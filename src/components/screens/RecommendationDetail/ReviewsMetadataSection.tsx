// External Dependencies
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Internal Dependencies
import { formatCompactNumber } from "@/libs/utils";
import { RatingStars } from "@/components/Rating"; // Imported directly to avoid circular dependency

interface ReviewsMetadataSectionProps {
  rating: number;
  count: number;
}

export const ReviewsMetadataSection = ({ rating, count }: ReviewsMetadataSectionProps) => (
  <>
    <View style={styles.reviewsMetadataRatingContainer}>
      <Text style={styles.reviewsMetadataRatingText}>{rating?.toFixed(1)}</Text>
      <RatingStars
        size={11}
        color="#000"
        style={{ gap: 1 }}
        rating={rating}
      />
    </View>

    {/* Vertical border */}
    <View style={styles.verticalBorder} />

    <View style={styles.reviewsMetadataCountContainer}>
      <Text style={styles.reviewsMetadataCountText}>
        {formatCompactNumber(count)}
      </Text>
      <Text style={styles.reviewsMetadataLabelText}>Reviews</Text>
    </View>
  </>
);

const styles = StyleSheet.create({
  reviewsMetadataRatingContainer: {
    gap: 2,
    flexDirection: "column",
    alignItems: "center",
  },
  reviewsMetadataRatingText: {
    fontSize: 21,
    color: "#000",
    fontWeight: "600",
  },
  verticalBorder: {
    width: 1,
    height: "80%",
    alignSelf: "center",
    backgroundColor: "#E5E5E5",
  },
  reviewsMetadataCountContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  reviewsMetadataCountText: {
    fontSize: 19,
    color: "#000",
    fontWeight: "600",
  },
  reviewsMetadataLabelText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
});
