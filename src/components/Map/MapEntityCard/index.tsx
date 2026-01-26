// External Dependencies
import { type ReactNode, memo } from "react";
import { useImageErrorFilter } from "@/hooks";

import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import type { Hours } from "@/libs/types";
import { EntityInfo } from "@/components/Entity/EntityInfo";
import { HoursStatus } from "@/components/Hours/HoursStatus";
import { RatingInfo } from "@/components/Rating/RatingInfo";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";

type MapEntityCardProps = {
  hours?: Hours;
  category: string;
  title: string;
  rating?: number;
  imageUrls: string[];
  reviewCount?: number;
  priceRange?: string;
  isAccessible?: boolean;
  onPress: () => void;
  renderActions?: () => ReactNode;
};

const IMAGE_HEIGHT = 90;
const CARD_WIDTH = Dimensions.get("window").width * 0.7;

const MapEntityCardComponent = ({
  category,
  title,
  rating,
  hours,
  imageUrls,
  priceRange,
  reviewCount,
  isAccessible,
  onPress,
  renderActions,
}: MapEntityCardProps) => {
  const { validImages, handleImageError } = useImageErrorFilter(imageUrls);
  const firstValidImage = validImages[0];
  const isReviewAvailable = !!(
    reviewCount &&
    reviewCount > 0 &&
    rating &&
    rating > 0
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {firstValidImage ? (
          <ShimmerImage
            source={{ uri: firstValidImage }}
            contentFit="cover"
            style={styles.image}
            onError={() => handleImageError(firstValidImage)}
          />
        ) : (
          <ImagePlaceholder
            iconSize={35}
            height={IMAGE_HEIGHT}
            style={{
              width: CARD_WIDTH,
              borderRadius: 0,
            }}
          />
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Title row with rating and buttons */}
        <View style={styles.titleRow}>
          {isReviewAvailable &&
            rating !== undefined &&
            reviewCount !== undefined && (
              <View style={styles.ratingContainer}>
                <RatingInfo
                  size={14}
                  rating={rating}
                  reviewCount={reviewCount}
                />
              </View>
            )}
          {renderActions && (
            <View style={styles.actionsContainer}>{renderActions()}</View>
          )}
        </View>

        <EntityInfo
          category={category}
          isAccessible={isAccessible}
          priceRange={priceRange}
        />
        {hours && <HoursStatus hours={hours} />}
      </View>
    </TouchableOpacity>
  );
};

// Memoize MapEntityCard to prevent unnecessary re-renders
export const MapEntityCard = memo(MapEntityCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    width: CARD_WIDTH,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  contentContainer: {
    padding: 14,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ratingContainer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editorialSummary: {
    flex: 1,
    fontSize: 14,
    marginTop: 3,
    color: "#888",
    lineHeight: 18,
    fontWeight: "400",
  },
});
