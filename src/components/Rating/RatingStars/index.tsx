import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import type React from "react";
import { StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

interface RatingStarsProps {
  rating: number;
  size?: number;
  color?: string;
  style?: any;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  style,
  size = 15,
  color = Colors.pinkAccentColor,
}) => {
  // Ensure rating is between 0 and 5
  const clampedRating = Math.min(Math.max(rating, 0), 5);

  return (
    <View style={[styles.container, style]}>
      {[0, 1, 2, 3, 4].map((i) => {
        // Calculate if we need a half star
        const isHalfStar = clampedRating - i >= 0.5 && clampedRating - i < 1;
        const isFullStar = clampedRating - i >= 1;

        return (
          <Ionicons
            key={i}
            size={size}
            color={color}
            name={
              isHalfStar ? "star-half" : isFullStar ? "star" : "star-outline"
            }
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
