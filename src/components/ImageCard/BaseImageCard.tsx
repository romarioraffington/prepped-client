// External Imports
import type React from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  type ImageStyle,
  type StyleProp,
} from "react-native";

// Import directly to avoid circular dependency with @/components
import { ShimmerImage } from "@/components/ShimmerImage";

// Height options for masonry variation (creates staggered effect)
// Matches Pinterest-style dramatic height differences
const CARD_HEIGHTS = {
  short: 180,
  medium: 220,
  tall: 300,
};

interface BaseImageCardProps {
  assetId: string;
  thumbnailUri: string;
  // Controls image height for masonry layout variation
  isLarge?: boolean;
  // Optional index for automatic height variation in masonry grids
  index?: number;
  onPress: (assetId: string) => void;
  renderOverlay?: () => React.ReactNode;
  renderContent?: () => React.ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
}

export const BaseImageCard: React.FC<BaseImageCardProps> = ({
  assetId,
  thumbnailUri,
  isLarge = false,
  index,
  onPress,
  renderOverlay,
  renderContent,
  imageStyle,
}) => {
  // Use index-based height pattern for masonry variation
  // Pattern creates Pinterest-style stagger: tall, medium, short, tall...
  const getHeightFromIndex = (idx: number): number => {
    const pattern = [
      CARD_HEIGHTS.tall,    // 0: first item tall
      CARD_HEIGHTS.medium,  // 1: second medium
    ];
    return pattern[idx % pattern.length];
  };

  const cardHeight =
    index !== undefined
      ? getHeightFromIndex(index)
      : isLarge
        ? CARD_HEIGHTS.tall
        : CARD_HEIGHTS.medium;

  return (
    <TouchableOpacity
      key={assetId}
      activeOpacity={0.8}
      style={[styles.cardContainer]}
      onPress={() => onPress(assetId)}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        <ShimmerImage
          source={
            typeof thumbnailUri === "string"
              ? { uri: thumbnailUri }
              : thumbnailUri
          }
          style={[styles.thumbnail, imageStyle]}
          contentFit="cover"
        />
        {renderOverlay?.()}
      </View>

      {/* Content below the image */}
      {renderContent?.()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
});
