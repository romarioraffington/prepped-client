// External Dependencies
import type { FC } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { useImageErrorFilter } from "@/hooks";
import type { WishlistCardData } from "@/libs/types";
import { ProfileIcon } from "@/components/ProfileIcon";
import { ShimmerImage } from "@/components/ShimmerImage";
import { ImagePlaceholder } from "../ImagePlaceholder";

const DEFAULT_AVATAR = require("~/assets/images/welcome/leaning-tower-of-pisa-in-pisa-italy.webp");

const CARD_GAP = 14;
const CARD_RADIUS = 18;
const CARD_WIDTH = (Dimensions.get("window").width - (CARD_GAP * 3.5)) / 2;
const CARD_HEIGHT = CARD_WIDTH * 0.90;

export interface WishlistCardProps {
  item: WishlistCardData;
  isEditing?: boolean;
  showRecentlyViewed?: boolean;
  isSelectedForRemoval?: boolean;
  isSelectedForAddition?: boolean;
  onPress: () => void;
  onDelete?: () => void;
  renderMeta?: (item: WishlistCardData) => string | undefined;
}

export const WishlistCard: FC<WishlistCardProps> = ({
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

  const displayMembers = item.members.slice(0, 2);
  const hasImages = Boolean(item.coverImageUri);
  const extraCount = Math.max(0, item.members.length - displayMembers.length);
  const isRecentlyViewed = Boolean(item.isRecentlyViewed) && showRecentlyViewed;
  const containsRecommendation = Boolean(item.containsRecommendation);

  const getMetaText = (): string => {
    if (renderMeta) {
      const meta = renderMeta(item);
      if (meta !== undefined) {
        return meta;
      }
    }
    if (item.isRecentlyViewed && item.lastUpdatedText) {
      return item.lastUpdatedText;
    }

    return `${item.savedCount} saved`;
  };

  const renderCollage = () => {
    if (!hasImages) {
      return (
        <Pressable onPress={onPress} style={[styles.placeholderTile, styles.placeholderTileRecent]}>
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
    <View style={[
      styles.card,
      isRecentlyViewed && styles.cardRecentlyViewed,
    ]}>
      {isEditing && !isRecentlyViewed && onDelete ? (
        <Pressable onPress={onDelete} style={styles.deleteBadge}>
          <Ionicons name="close" size={18} color="#222" />
        </Pressable>
      ) : null}
      {(containsRecommendation || isSelectedForAddition) && (
        <View style={[
          styles.recommendationBadge,
          isSelectedForRemoval && styles.recommendationBadgeSelected,
          isSelectedForAddition && styles.recommendationBadgeAddition,
        ]}>
          {isSelectedForRemoval ? (
            <>
              <Ionicons name="remove-circle" size={14} color={Colors.pinkAccentColor} />
              <Text style={[
                styles.recommendationBadgeText,
                styles.recommendationBadgeTextSelected,
              ]}>
                Remove
              </Text>
            </>
          ) : isSelectedForAddition ? (
            <>
              <Ionicons name="add-circle" size={14} color={Colors.successColor} />
              <Text style={[
                styles.recommendationBadgeText,
                styles.recommendationBadgeTextAddition,
              ]}>Add</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={14} color={Colors.primaryPurple} />
              <Text style={styles.recommendationBadgeText}>Included</Text>
            </>
          )}
        </View>
      )}

      <View style={[
        styles.imageWrapper,
        { height: CARD_HEIGHT, borderRadius: CARD_RADIUS },
        (isSelectedForRemoval || isSelectedForAddition) && styles.imageWrapperSelected,
      ]}>
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
        {item.members.length > 0 ? (
          <View style={styles.avatarOverlay}>
            {displayMembers.map((member, index) => (
              <View key={member.id} style={[styles.avatarWrapper, index > 0 && styles.avatarOffset]}>
                <ProfileIcon
                  size={20}
                  imageUrl={member.profilePictureUri || DEFAULT_AVATAR}
                />
              </View>
            ))}
            {extraCount > 0 ? (
              <View style={[styles.avatarWrapper, styles.avatarOverflow, displayMembers.length > 0 && styles.avatarOffset]}>
                <Text style={styles.avatarOverflowText}>{`+${extraCount}`}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
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
  avatarOverlay: {
    right: 10,
    bottom: 10,
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  recentlyViewedGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  collageItem: {
    width: "50%",
    height: "50%",
    overflow: "hidden",
    borderColor: "#fff",
    borderWidth: 0.5,
  },
  collageImage: {
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
  avatarWrapper: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 13,
    overflow: "hidden",
  },
  avatarOffset: {
    marginLeft: -8,
  },
  avatarOverflow: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverflowText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#222",
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
  recommendationBadge: {
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
  recommendationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primaryPurple,
  },
  recommendationBadgeSelected: {
    backgroundColor: "#FFF1F1",
  },
  recommendationBadgeAddition: {
    backgroundColor: "#F0F8F0",
  },
  recommendationBadgeTextSelected: {
    color: Colors.pinkAccentColor,
  },
  recommendationBadgeTextAddition: {
    color: Colors.successColor,
  },
  imageWrapperSelected: {
    borderWidth: 2,
    borderColor: Colors.primaryPurple,
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
