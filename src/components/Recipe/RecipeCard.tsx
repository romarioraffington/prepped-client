// External Dependencies
import type React from "react";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { Colors } from "@/libs/constants";
import { PreviewCard } from "@/components/ImageCard/PreviewCard";

interface RecipeCardProps {
  recipe: Recipe; // Primary source of data
  index?: number;
  isLarge?: boolean;
  onCardPress: (recipe: Recipe) => void;
  onMenuPress?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  index,
  isLarge,
  onCardPress,
  onMenuPress,
}) => {
  // Derive props from recipe object
  const id = recipe.id;
  const title = recipe.title;
  const cookTime = recipe.cookTime;
  const caloriesPerServing = recipe.caloriesPerServing;
  const thumbnailUri = recipe.coverUri;
  const renderContent = () => {
    return (
      <View style={styles.cardContentContainer}>
        {title && (
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {title}
          </Text>
        )}
        <View style={styles.metadataContainer}>
          <View style={styles.leftMetadataContainer}>
            {cookTime && (
              <View style={styles.recipeMetadataItem}>
                <Ionicons name="time" size={16} color={Colors.primary} />
                <Text style={styles.recipeMetadataText}>{cookTime} min</Text>
              </View>
            )}
            {caloriesPerServing && (
              <View style={styles.recipeMetadataItem}>
                <Ionicons name="flame" size={16} color={Colors.primary} />
                <Text style={styles.recipeMetadataText}>{caloriesPerServing}</Text>
              </View>
            )}
          </View>
          {onMenuPress && (
            <View style={styles.rightMetaContainer}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onMenuPress(recipe);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={15} color="#000" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Wrap onCardPress to pass recipe object instead of just ID
  // PreviewCard expects (id: string) => void, but we want to pass the full recipe
  const handleCardPress = useCallback(
    (_id: string) => {
      onCardPress(recipe);
    },
    [recipe, onCardPress],
  );

  return (
    <PreviewCard
      id={id}
      index={index}
      isLarge={isLarge}
      onCardPress={handleCardPress}
      thumbnailUri={thumbnailUri}
      renderContent={renderContent}
    />
  );
};

const styles = StyleSheet.create({
  cardContentContainer: {
    paddingTop: 10,
    paddingLeft: 5,
  },
  recipeTitle: {
    fontSize: 18,
    color: "#000",
    marginBottom: 8,
    fontWeight: "600",
    fontFamily: Platform.select({
      android: "BricolageGrotesque_400Regular",
      ios: "BricolageGrotesque-Regular",
    }),
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftMetadataContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    flex: 1,
  },
  rightMetaContainer: {
    flexShrink: 0,
  },
  menuButton: {
    padding: 4,
  },
  recipeMetadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMetadataText: {
    fontSize: 14,
    color: Colors.matureForeground,
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Regular",
    }),
  },
});
