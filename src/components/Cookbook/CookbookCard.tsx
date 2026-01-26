import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import type { FC } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { useImageErrorFilter } from "@/hooks";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";
// Internal Dependencies
import { Colors } from "@/libs/constants";
import type { CookbookCardData } from "@/libs/types";

const CARD_GAP = 14;
const CARD_RADIUS = 18;
const CARD_WIDTH = (Dimensions.get("window").width - CARD_GAP * 3.5) / 2;
const CARD_HEIGHT = CARD_WIDTH * 0.9;

export interface CookbookCardProps {
  item: CookbookCardData;
  isEditing?: boolean;
  showRecentlyViewed?: boolean;
  isSelectedForRemoval?: boolean;
  isSelectedForAddition?: boolean;
  onPress: () => void;
  onDelete?: () => void;
  renderMeta?: (item: CookbookCardData) => string | undefined;
}

export const CookbookCard: FC<CookbookCardProps> = ({
  item,
  isEditing = false,
  showRecentlyViewed = false,
  isSelectedForRemoval = false,
  isSelectedForAddition = false,
  onPress,
  onDelete,
  renderMeta,
}) => {
  const primaryImage = item.coverImageUri;

  // Use useImageErrorFilter to filter out failed images
  const imageUrls = primaryImage ? [primaryImage] : [];
  const { validImages, handleImageError } = useImageErrorFilter(imageUrls);
  const hasValidImage = validImages.length > 0;

  const hasImages = Boolean(item.coverImageUri);
  const isRecentlyViewed = Boolean(showRecentlyViewed);
  const containsRecipe = Boolean(item.containsRecipe);

  const getMetaText = (): string => {
    if (renderMeta) {
      const meta = renderMeta(item);
      if (meta !== undefined) {
        return meta;
      }
    }
    if (showRecentlyViewed && item.lastUpdatedText) {
      return item.lastUpdatedText;
    }

    return `${item.savedCount} saved`;
  };

  const renderCollage = () => {
    if (!hasImages) {
      return (
        <Pressable
          onPress={onPress}
          style={[styles.placeholderTile, styles.placeholderTileRecent]}
        >
          <Ionicons name="time-outline" size={32} color="#fff" />
        </Pressable>
      );
    }

    // For now, show single image. Collage will be handled separately for recently-viewed
    return (
      <Pressable onPress={onPress} style={styles.singleImageWrapper}>
        {hasValidImage ? (
          <ShimmerImage
            contentFit="cover"
            style={styles.image}
            source={{ uri: validImages[0] }}
            onError={() => handleImageError(validImages[0])}
          />
        ) : (
          <ImagePlaceholder
            iconSize={26}
            height={CARD_HEIGHT}
            style={{ backgroundColor: "#e5e5e5" }}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.card, isRecentlyViewed && styles.cardRecentlyViewed]}>
      {isEditing && !isRecentlyViewed && onDelete ? (
        <Pressable onPress={onDelete} style={styles.deleteBadge}>
          <Ionicons name="close" size={18} color="#222" />
        </Pressable>
      ) : null}
      {(containsRecipe || isSelectedForAddition) && (
        <View
          style={[
            styles.recipeBadge,
            isSelectedForRemoval && styles.recipeBadgeSelected,
            isSelectedForAddition && styles.recipeBadgeAddition,
          ]}
        >
          {isSelectedForRemoval ? (
            <>
              <Ionicons
                name="remove-circle"
                size={14}
                color={Colors.pinkAccentColor}
              />
              <Text
                style={[styles.recipeBadgeText, styles.recipeBadgeTextSelected]}
              >
                Remove
              </Text>
            </>
          ) : isSelectedForAddition ? (
            <>
              <Ionicons
                name="add-circle"
                size={14}
                color={Colors.successColor}
              />
              <Text
                style={[styles.recipeBadgeText, styles.recipeBadgeTextAddition]}
              >
                Add
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.recipeBadgeText}>Included</Text>
            </>
          )}
        </View>
      )}

      <View
        style={[
          styles.imageWrapper,
          { height: CARD_HEIGHT, borderRadius: CARD_RADIUS },
          (isSelectedForRemoval || isSelectedForAddition) &&
          styles.imageWrapperSelected,
        ]}
      >
        {isRecentlyViewed ? (
          renderCollage()
        ) : (
          <Pressable onPress={onPress} style={styles.singleImageWrapper}>
            {hasValidImage ? (
              <ShimmerImage
                contentFit="cover"
                style={styles.image}
                source={{ uri: validImages[0] }}
                onError={() => handleImageError(validImages[0])}
              />
            ) : (
              <ImagePlaceholder
                iconSize={26}
                height={CARD_HEIGHT}
                style={{ backgroundColor: "#e5e5e5" }}
              />
            )}
          </Pressable>
        )}
      </View>

      <Pressable onPress={onPress} style={styles.textWrapper}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.meta}>{getMetaText()}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 14,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  cardRecentlyViewed: {
    backgroundColor: "#fff",
  },
  imageWrapper: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#d9d9d9",
  },
  singleImageWrapper: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  meta: {
    fontSize: 14,
    fontWeight: "400",
    color: "#555",
  },
  deleteBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recipeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  recipeBadgeSelected: {
    backgroundColor: "#FFF1F1",
  },
  recipeBadgeAddition: {
    backgroundColor: "#F0F8F0",
  },
  recipeBadgeTextSelected: {
    color: Colors.pinkAccentColor,
  },
  recipeBadgeTextAddition: {
    color: Colors.successColor,
  },
  imageWrapperSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  placeholderTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#b0b0b0",
  },
  placeholderTileRecent: {
    padding: 16,
  },
  placeholderTileSingle: {
    width: "100%",
    height: "100%",
  },
});
