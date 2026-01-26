// External Dependencies
import type React from "react";
import { StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

interface RatingBarsProps {
  style?: any;
  barHeight?: number;
  barColor?: string;
  barBgColor?: string;
  ratings: number[]; // Array of 5 numbers representing count of ratings from 1-5
}

export const RatingBars: React.FC<RatingBarsProps> = ({
  style,
  ratings,
  barHeight = 6,
  barBgColor = "#eee",
  barColor = Colors.pinkAccentColor,
}) => {
  // Find the maximum rating count to use as the baseline for 100%
  const maxRating = Math.max(...ratings);

  // Calculate percentages based on the maximum rating
  const percentages = ratings.map((count) =>
    maxRating > 0 ? Math.round((count / maxRating) * 100) : 0,
  );

  return (
    <View style={[styles.container, style]}>
      {percentages.map((percentage, i) => (
        <View key={i} style={styles.barRow}>
          <View
            style={[
              styles.barBg,
              { backgroundColor: barBgColor, height: barHeight },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                width: `${percentage}%`,
                backgroundColor: barColor,
                height: barHeight,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
  barRow: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  barBg: {
    top: 2,
    left: 0,
    zIndex: 1,
    width: "100%",
    borderRadius: 4,
    position: "absolute",
  },
  bar: {
    left: 0,
    top: 2,
    zIndex: 2,
    borderRadius: 4,
    position: "absolute",
  },
});
