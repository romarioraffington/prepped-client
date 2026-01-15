// External Dependencies
import React from "react";
import * as Haptics from "expo-haptics";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

// Imported directly to prevent circular dependencies warning
import { RatingStars } from "@/components/Rating/RatingStars";
import { RatingBars } from "@/components/Rating/RatingBars";

interface ReviewSummaryChartProps {
  rating?: number;
  sourceUrl?: string;
  reviewCount?: number;
  ratingDistribution?: number[];
  onPress?: (url: string) => void;
}

export function ReviewSummaryChart({
  rating = 0,
  sourceUrl = '',
  reviewCount = 0,
  ratingDistribution = [0, 0, 0, 0, 0],
}: ReviewSummaryChartProps) {

  const handleSourceUrlPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
    }
  };

  return (
    <View style={styles.reviewSummaryContainer}>
      {/* Ratings */}
      <TouchableOpacity
        disabled={!sourceUrl}
        onPress={handleSourceUrlPress}
        style={styles.reviewSummaryRatingsContainer}
      >
        {/* Left: Rating and stars */}
        <View style={styles.reviewSummaryColumnLeft}>
          <View style={styles.reviewSummaryRatingColumn}>
            <Text style={styles.reviewSummaryRating}>{rating}</Text>
            <RatingStars rating={rating} size={15} color={Colors.pinkAccentColor} />
            <Text style={styles.reviewSummaryCount}>({reviewCount})</Text>
          </View>
        </View>

        {/* Right: Rating bars */}
        <View style={styles.reviewsRatingColumnRight}>
          <RatingBars ratings={ratingDistribution} barColor={Colors.pinkAccentColor} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewSummaryContainer: {
    gap: 30,
  },
  reviewSummaryRatingsContainer: {
    gap: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  reviewSummaryColumnLeft: {},
  reviewsRatingColumnRight: {
    flex: 2,
    paddingVertical: 10,
  },
  reviewSummaryRatingColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  reviewSummaryRating: {
    fontSize: 34,
    color: "#222",
  },
  reviewSummaryCount: {
    fontSize: 15,
    color: "#888",
  },
});
