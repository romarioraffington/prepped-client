// External Dependencies
import type React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Text, StyleSheet } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { PreviewCard } from "@/components/ImageCard/PreviewCard";

interface RecipeCardProps {
  id: string;
  index?: number;
  title?: string;
  isLarge?: boolean;
  thumbnailUri?: string | null;
  cookTime?: number | null;
  caloriesPerServing?: number | null;
  onCardPress: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  index,
  title,
  isLarge,
  cookTime,
  thumbnailUri,
  caloriesPerServing,
  onCardPress,
}) => {
  const renderContent = () => {
    return (
      <View style={styles.cardContentContainer}>
        {title && (
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {title}
          </Text>
        )}
        <View style={styles.recipeMetadataContainer}>
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
      </View>
    );
  };

  return (
    <PreviewCard
      id={id}
      index={index}
      isLarge={isLarge}
      onCardPress={onCardPress}
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
  recipeMetadataContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
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
