// External Dependencies
import type React from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";

// Internal Dependencies
import type { Recipe, RecipeOptionsVariant } from "@/libs/types";
import { RecipeOptionsSheet } from "./RecipeOptionsSheet";

export interface RecipeOptionsButtonProps {
  size?: number;
  onPress?: () => void;
  recipeData: Recipe;
  variant: RecipeOptionsVariant;
  onDeleteSuccess?: () => void;
  orientation?: "horizontal" | "vertical";
}

export const RecipeOptionsButton: React.FC<RecipeOptionsButtonProps> = ({
  recipeData,
  variant,
  onPress,
  size = 15,
  onDeleteSuccess,
  orientation = "horizontal",
}) => {
  // Internal state management for bottom sheet
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Track when sheet closes to unmount it
  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      // Sheet is closed, unmount it
      setIsSheetOpen(false);
    }
  }, []);

  // Internal handler to open the sheet
  const handleOptionsPress = useCallback(() => {
    setIsSheetOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Use external onPress if provided, otherwise use internal handler
  const handlePress = onPress ?? handleOptionsPress;

  const iconName = orientation === "vertical" ? "ellipsis-vertical" : "ellipsis-horizontal";

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={iconName} size={size} color="#000" />
      </TouchableOpacity>

      {/* Render options sheet (ActionBottomSheet already uses Portal internally) */}
      {isSheetOpen && (
        <RecipeOptionsSheet
          variant={variant}
          recipeData={recipeData}
          bottomSheetRef={bottomSheetRef}
          onDeleteSuccess={onDeleteSuccess}
          onAnimationCompleted={() => {
            handleSheetChange(-1);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
