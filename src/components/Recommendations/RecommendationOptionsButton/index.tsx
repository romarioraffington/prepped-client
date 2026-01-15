// External Dependencies
import type React from "react";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useCallback, useState } from "react";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, TouchableOpacity } from "react-native";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";

// Internal Dependencies
import { RecommendationOptionsSheet } from "@/components/Recommendations/RecommendationOptionsSheet";

export interface RecommendationOptionsButtonProps {
  recommendationSlug: string;
  onPress?: () => void;
  isScrolled?: boolean;
  size?: number;
  showBlur?: boolean;
  orientation?: "horizontal" | "vertical";
}

export const RecommendationOptionsButton: React.FC<RecommendationOptionsButtonProps> = ({
  onPress,
  size = 18,
  showBlur = false,
  isScrolled = false,
  recommendationSlug,
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

  const blurIntensity = !isScrolled ? 80 : 0;
  const useBlur = showBlur ?? !isLiquidGlassAvailable();
  const iconSize = size ?? (isLiquidGlassAvailable() ? 20 : 18);
  const iconName = orientation === "vertical" ? "ellipsis-vertical" : "ellipsis-horizontal";

  return (
    <>
      {useBlur ? (
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.headerButtonBlurContainer,
            !isScrolled && {
              paddingVertical: 10,
              paddingHorizontal: 10,
            }
          ]}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <BlurView
            tint="light"
            intensity={blurIntensity}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name={iconName} size={iconSize} color="#000" />
        </TouchableOpacity>
      ) : (
        // Liquid glass available: render plain button without blur container
        <TouchableOpacity onPress={handlePress}>
          <Ionicons name={iconName} size={iconSize} color="#000" />
        </TouchableOpacity>
      )}

      {/* Render options sheet (ActionBottomSheet already uses Portal internally) */}
      {isSheetOpen && (
        <RecommendationOptionsSheet
          initialIndex={0}
          onChange={handleSheetChange}
          bottomSheetRef={bottomSheetRef}
          recommendationSlug={recommendationSlug}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerButtonBlurContainer: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});

