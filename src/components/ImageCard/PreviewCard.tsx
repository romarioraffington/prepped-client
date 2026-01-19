// External Dependencies
import type React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Text, StyleSheet } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { BaseImageCard } from "./BaseImageCard";
interface PreviewCardProps {
  index?: number;
  title?: string;
  assetId: string;
  isLarge?: boolean;
  thumbnailUri?: string | null;
  cookTime?: number | null;
  caloriesPerServing?: number | null;
  onCardPress: (assetId: string) => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  assetId,
  isLarge,
  index,
  title,
  cookTime,
  thumbnailUri,
  caloriesPerServing,
  onCardPress,
}) => {
  const renderContent = () => {
    return (
      <View style={styles.recipeContentContainer}>
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
    <View style={styles.container}>
      <BaseImageCard
        index={index}
        assetId={assetId}
        isLarge={isLarge}
        onPress={onCardPress}
        renderContent={renderContent}
        thumbnailUri={thumbnailUri ?? ""}
        backgroundColor={Colors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  recipeContentContainer: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
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
