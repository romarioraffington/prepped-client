// External Dependencies
import type React from "react";
import { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type ImageStyle,
  type StyleProp,
} from "react-native";

// Internal Dependencies
import { ShimmerImage } from "@/components/ShimmerImage";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

// Height options for masonry variation (creates staggered effect)
// Matches Pinterest-style dramatic height differences
const CARD_HEIGHTS = {
  short: 180,
  medium: 220,
  tall: 300,
};

interface BaseImageCardProps {
  id: string;
  thumbnailUri: string;
  // Controls image height for masonry layout variation
  isLarge?: boolean;
  // Optional index for automatic height variation in masonry grids
  index?: number;
  onPress: (id: string) => void;
  renderContent?: () => React.ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
  backgroundColor?: string;
}

export const BaseImageCard: React.FC<BaseImageCardProps> = ({
  id,
  thumbnailUri,
  isLarge = false,
  index,
  onPress,
  renderContent,
  imageStyle,
  backgroundColor,
}) => {
  const [hasError, setHasError] = useState(false);

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

  // Reset error state when thumbnailUri changes
  useEffect(() => {
    setHasError(false);
  }, [thumbnailUri]);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <TouchableOpacity
      key={id}
      activeOpacity={0.8}
      style={[styles.cardContainer, backgroundColor && { backgroundColor }]}
      onPress={() => onPress(id)}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        {hasError || !thumbnailUri ? (
          <ImagePlaceholder
            height={cardHeight}
            iconSize={48}
            style={{ backgroundColor: "#e5e5e5" }}
          />
        ) : (
          <ShimmerImage
            source={
              typeof thumbnailUri === "string"
                ? { uri: thumbnailUri }
                : thumbnailUri
            }
            contentFit="cover"
            onError={handleImageError}
            style={[styles.thumbnail, imageStyle]}
          />
        )}
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
