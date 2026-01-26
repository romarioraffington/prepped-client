// External imports
import type React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

// Internal imports
import type { ImportRecommendation } from "@/libs/types";
import { LoadingFeaturedLayoutGrid } from "./LoadingFeaturedLayoutGrid";
import { CARD_MARGIN, FIRST_CARD_WIDTH, REGULAR_CARD_WIDTH } from "./consts";

interface FeaturedLayoutGridProps {
  items?: any[];
  isLoading?: boolean;
  featuredIndex?: number[];
  renderItem: (
    item: ImportRecommendation,
    isFeatured?: boolean,
  ) => React.ReactNode;
  onPress?: (item: ImportRecommendation) => void;
}

export const FeaturedLayoutGrid: React.FC<FeaturedLayoutGridProps> = ({
  items,
  isLoading,
  featuredIndex = [],
  renderItem,
  onPress,
}) => {
  if (isLoading) {
    return <LoadingFeaturedLayoutGrid featuredIndex={featuredIndex} />;
  }

  return (
    <View style={styles.placesGrid}>
      {items?.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.9}
          onPress={() => onPress?.(item)}
          style={[
            styles.placeCard,
            featuredIndex.includes(index) && styles.featuredPlaceCard,
          ]}
        >
          {renderItem(item, featuredIndex.includes(index))}
        </TouchableOpacity>
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
    width: REGULAR_CARD_WIDTH,
    backgroundColor: "#fff",
  },
  featuredPlaceCard: {
    width: FIRST_CARD_WIDTH,
  },
});
