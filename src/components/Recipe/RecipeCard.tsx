// External Dependencies
import { memo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";

// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { Colors } from "@/libs/constants";
import { PreviewCard } from "@/components/ImageCard/PreviewCard";

interface RecipeCardProps {
  recipe: Recipe; // Primary source of data
  index?: number;
  isLarge?: boolean;
  onCardPress?: (recipe: Recipe) => void;
  onMenuPress?: (recipe: Recipe) => void;

  // Selection mode props (optional)
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const RecipeCardComponent = ({
  recipe,
  index,
  isLarge,
  onCardPress,
  onMenuPress,
  selectable = false,
  isSelected = false,
  onSelect,
}: RecipeCardProps) => {
  // Derive props from recipe object
  const id = recipe.id;
  const title = recipe.title;
  const cookTime = recipe.cookTime;
  const caloriesPerServing = recipe.caloriesPerServing;
  const thumbnailUri = recipe.coverUri;

  // When selectable, don't show the menu button
  const showMenuButton = !selectable && onMenuPress;

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
          {showMenuButton && (
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

  // Handle card press - when selectable, use onSelect; otherwise use onCardPress
  const handleCardPress = useCallback(
    (_id: string) => {
      if (selectable && onSelect) {
        onSelect();
      } else if (onCardPress) {
        onCardPress(recipe);
      }
    },
    [selectable, onSelect, onCardPress, recipe],
  );

  const previewCard = (
    <PreviewCard
      id={id}
      index={index}
      isLarge={isLarge}
      onCardPress={handleCardPress}
      thumbnailUri={thumbnailUri}
      renderContent={renderContent}
    />
  );

  // When selectable, wrap in container with selection overlay
  if (selectable) {
    return (
      <View
        accessibilityRole="checkbox"
        style={styles.selectableContainer}
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${title}, ${isSelected ? "selected" : "not selected"}`}
      >
        {previewCard}
        <Pressable
          onPress={onSelect}
          style={styles.selectionOverlay}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {/* Always render both to prevent flicker, use opacity to show/hide */}
          <View style={styles.indicatorWrapper} collapsable={false}>
            <View
              style={[
                styles.checkmarkContainer,
                { opacity: isSelected ? 1 : 0 },
              ]}
            >
              <Ionicons name="checkmark-sharp" size={16} color="#FFF4E6" />
            </View>
            <View
              style={[
                styles.circleOutlineAbsolute,
                { opacity: isSelected ? 0 : 1 },
              ]}
            />
          </View>
        </Pressable>
      </View>
    );
  }

  // When not selectable, return PreviewCard directly (no wrapper)
  return previewCard;
};

// Memoize to prevent unnecessary re-renders
// Custom comparison: only re-render if rendering-affecting props change
export const RecipeCard = memo(RecipeCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.isLarge === nextProps.isLarge &&
    prevProps.recipe.id === nextProps.recipe.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.recipe.title === nextProps.recipe.title &&
    prevProps.recipe.coverUri === nextProps.recipe.coverUri
  );
});

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
  // Selection mode styles
  selectableContainer: {
    position: "relative",
  },
  selectionOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
  },
  indicatorWrapper: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  circleOutlineAbsolute: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
