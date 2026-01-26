import type React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Internal Imports
import { useImageErrorFilter } from "@/hooks";
import type { GridItemProps } from "@/libs/types";
import { columnWidth, itemHeight } from "./consts";

// Import directly to avoid circular dependency with @/components
import { ShimmerImage } from "@/components/Image";

export const FeaturedGridItem = ({
  item,
  heading,
  metadata,
  onItemPress,
  onOptionsPress,
}: GridItemProps & { isLoading?: boolean }) => {
  const { validImages, handleImageError } = useImageErrorFilter(
    item.imageUris || [],
  );

  const hasImage1 = validImages.length > 0;
  const hasImage2 = validImages.length > 1;
  const hasImage3 = validImages.length > 2;
  const hasImage4 = validImages.length > 3;
  const hasImage5 = validImages.length > 4;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.itemContainer}
      onPress={() => onItemPress(item)}
    >
      <View style={styles.imagesContainer}>
        {/* Stack of overlapping images */}
        <View style={[styles.featuredImageWrapper, styles.firstImageWrapper]}>
          {hasImage1 && (
            <ShimmerImage
              source={{ uri: validImages[0] }}
              style={styles.featuredImage}
              contentFit="cover"
              onError={() => handleImageError(validImages[0])}
            />
          )}
        </View>
        <View style={[styles.featuredImageWrapper, styles.secondImageWrapper]}>
          {hasImage2 && (
            <ShimmerImage
              source={{ uri: validImages[1] }}
              style={styles.featuredImage}
              contentFit="cover"
              onError={() => handleImageError(validImages[1])}
            />
          )}
        </View>
        <View style={[styles.featuredImageWrapper, styles.thirdImageWrapper]}>
          {hasImage3 && (
            <ShimmerImage
              source={{ uri: validImages[2] }}
              style={styles.featuredImage}
              contentFit="cover"
              onError={() => handleImageError(validImages[2])}
            />
          )}
        </View>
        <View style={[styles.featuredImageWrapper, styles.fourthImageWrapper]}>
          {hasImage4 && (
            <ShimmerImage
              source={{ uri: validImages[3] }}
              style={styles.featuredImage}
              contentFit="cover"
              onError={() => handleImageError(validImages[3])}
            />
          )}
        </View>
        <View style={[styles.featuredImageWrapper, styles.fifthImageWrapper]}>
          {hasImage5 && (
            <ShimmerImage
              source={{ uri: validImages[4] }}
              style={styles.featuredImage}
              contentFit="cover"
              onError={() => handleImageError(validImages[4])}
            />
          )}
        </View>
      </View>

      {/* Item Name and Info */}
      <View style={styles.featuredTextContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.featuredItemName} numberOfLines={1}>
            {heading}
          </Text>
          {onOptionsPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onOptionsPress();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.optionsButton}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#667" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.metadataContainer}>{metadata}</View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 20,
    width: columnWidth,
  },
  imagesContainer: {
    height: itemHeight,
  },
  featuredImageWrapper: {
    width: 100,
    borderWidth: 1,
    borderRadius: 16,
    height: itemHeight,
    position: "absolute",
    borderColor: "white",
    backgroundColor: "#E0E0E0",
  },
  firstImageWrapper: {
    zIndex: 5,
  },
  secondImageWrapper: {
    left: 20,
    zIndex: 4,
  },
  thirdImageWrapper: {
    left: 40,
    zIndex: 3,
  },
  fourthImageWrapper: {
    left: 60,
    zIndex: 2,
  },
  fifthImageWrapper: {
    left: 80,
    zIndex: 1,
  },
  featuredImage: {
    height: "100%",
    borderRadius: 16,
  },
  featuredTextContainer: {},
  titleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredItemName: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsButton: {
    paddingLeft: 8,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
