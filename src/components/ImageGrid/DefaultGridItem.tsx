// External Imports
import type React from "react";
import { Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Imports
import { useImageErrorFilter } from "@/hooks";
import type { GridItemProps } from "@/libs/types";
import { columnWidth, imageGap, itemHeight } from "./consts";

// Import directly to avoid circular dependency with @/components
import { ShimmerImage } from "@/components/ShimmerImage";

export const DefaultGridItem = ({
  item,
  heading,
  metadata,
  onItemPress,
  onOptionsPress,
}: GridItemProps & { isLoading?: boolean }) => {
  const { validImages, handleImageError } = useImageErrorFilter(item.imageUris || []);

  const hasImage1 = validImages.length > 0;
  const hasImage2 = validImages.length > 1;
  const hasImage3 = validImages.length > 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.itemContainer}
      onPress={() => onItemPress(item)}
    >
      <View style={styles.imagesContainer}>
        {/* Large Image */}
        {hasImage1 ? (
          <ShimmerImage
            contentFit="cover"
            style={styles.largeImage}
            source={{ uri: validImages[0] }}
            onError={() => handleImageError(validImages[0])}
          />
        ) : (
          <View style={[styles.largeImage, styles.imagePlaceholder]} />
        )}

        {/* Horizontal Gap */}
        <View style={styles.imageGapHorizontal} />

        <View style={styles.smallImagesContainer}>
          {/* First Small Image */}
          {hasImage2 ? (
            <ShimmerImage
              contentFit="cover"
              source={{ uri: validImages[1] }}
              style={styles.smallImage}
              onError={() => handleImageError(validImages[1])}
            />
          ) : (
            <View style={[styles.smallImage, styles.imagePlaceholder]} />
          )}

          {/* Vertical Gap */}
          <View style={styles.imageGapVertical} />

          {/* Second Small Image */}
          {hasImage3 ? (
            <ShimmerImage
              contentFit="cover"
              source={{ uri: validImages[2] }}
              style={styles.smallImage}
              onError={() => handleImageError(validImages[2])}
            />
          ) : (
            <View style={[styles.smallImage, styles.imagePlaceholder]} />
          )}
        </View>
      </View>

      {/* Item Name and Options */}
      <View style={styles.titleRow}>
        <Text style={styles.itemName} numberOfLines={1}>{heading}</Text>
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

      {/* Item Info */}
      <View style={styles.metadataContainer}>
        {metadata}
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
    borderRadius: 16,
    overflow: "hidden",
    width: columnWidth,
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  largeImage: {
    height: itemHeight,
    width: columnWidth * 0.6 - imageGap,
  },
  imageGapHorizontal: {
    width: imageGap,
    height: "100%",
    backgroundColor: "#fff",
  },
  smallImagesContainer: {
    width: columnWidth * 0.4,
    height: itemHeight,
    flexDirection: "column",
  },
  smallImage: {
    height: itemHeight * 0.5,
    width: columnWidth * 0.4,
  },
  imageGapVertical: {
    height: imageGap,
    backgroundColor: "#fff",
  },
  imagePlaceholder: {
    backgroundColor: "#f0f0f0",
  },
  titleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsButton: {
    paddingLeft: 8,
    paddingRight: 8,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
