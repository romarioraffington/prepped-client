// External Dependencies
import { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { RECIPE_CAROUSEL_CARD_WIDTH } from "./consts";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";

const IMAGE_SIZE = 64;
const IMAGE_RADIUS = 12;

export interface RecipeCarouselCardProps {
  recipe: Recipe;
}

export const RecipeCarouselCard = memo<RecipeCarouselCardProps>(
  ({ recipe }) => {
    const { title, coverUri, cookTime, caloriesPerServing } = recipe;

    return (
      <View style={styles.card}>
        {/* Thumbnail */}
        <View style={styles.imageContainer}>
          {coverUri ? (
            <ShimmerImage
              contentFit="cover"
              style={styles.image}
              source={{ uri: coverUri }}
            />
          ) : (
            <ImagePlaceholder
              iconSize={20}
              height={IMAGE_SIZE}
              style={styles.placeholder}
            />
          )}
        </View>

        {/* Content - to the right of image */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            {cookTime ? (
              <View style={styles.metadataItem}>
                <Ionicons name="time" size={14} color="#999" />
                <Text style={styles.metadataText}>{cookTime} min</Text>
              </View>
            ) : null}
            {caloriesPerServing ? (
              <View style={styles.metadataItem}>
                <Ionicons name="flame" size={14} color="#999" />
                <Text style={styles.metadataText}>
                  {caloriesPerServing} cal
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

RecipeCarouselCard.displayName = "RecipeCarouselCard";

const styles = StyleSheet.create({
  card: {
    width: RECIPE_CAROUSEL_CARD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_RADIUS,
    overflow: "hidden",
    backgroundColor: "#e5e5e5",
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: "#e5e5e5",
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    lineHeight: 20,
    fontFamily: Platform.select({
      android: "BricolageGrotesque_700Bold",
      ios: "BricolageGrotesque-Bold",
    }),
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metadataItem: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    fontFamily: Platform.select({
      android: "Manrope_600SemiBold",
      ios: "Manrope-SemiBold",
    }),
  },
});
