// External Dependencies
import type React from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

// Internal Dependencies
import { Colors } from "@/libs/constants";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 200;

type FloatingAddButtonProps = {
  bottomOffset?: number;
  rightOffset?: number;
  visible?: boolean;
  animationValue?: SharedValue<number>;
  disableTranslate?: boolean;
  activeTabIndex?: number;
  isBulkEditMode?: boolean;
  hasRecipes?: boolean;
  onBulkEditPress?: () => void;
};

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  bottomOffset = 0,
  rightOffset = 16,
  visible = true,
  animationValue,
  disableTranslate = false,
  activeTabIndex = 0,
  isBulkEditMode = false,
  hasRecipes = true,
  onBulkEditPress,
}) => {
  const insets = useSafeAreaInsets();
  const buttonScale = useSharedValue(1);

  // Determine if we're on the Recipes tab
  const isRecipesTab = activeTabIndex === 1;

  // Determine which icon to show on Recipes tab
  // If no recipes, show add icon; if in bulk edit mode, show checkmark; otherwise show edit icon
  const showAddIconOnRecipesTab = isRecipesTab && !hasRecipes;
  const showCheckmarkIcon = isRecipesTab && hasRecipes && isBulkEditMode;
  const showBulkEditIcon = isRecipesTab && hasRecipes && !isBulkEditMode;

  // Animated style for the add icon (visible on Cookbooks tab OR Recipes tab with no recipes)
  const showAddIcon = !isRecipesTab || showAddIconOnRecipesTab;
  const rAddIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showAddIcon ? 1 : 0, { duration: DURATION }),
      transform: [
        {
          rotate: withTiming(showAddIcon ? "0deg" : "90deg", {
            duration: DURATION,
          }),
        },
      ],
    };
  }, [showAddIcon]);

  // Animated style for the bulk edit icon (visible on Recipes tab with recipes, not in bulk edit mode)
  const rBulkEditIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showBulkEditIcon ? 1 : 0, { duration: DURATION }),
      transform: [
        {
          rotate: withTiming(showBulkEditIcon ? "0deg" : "-90deg", {
            duration: DURATION,
          }),
        },
      ],
    };
  }, [showBulkEditIcon]);

  // Animated style for the checkmark icon (visible on Recipes tab in bulk edit mode)
  const rCheckmarkIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showCheckmarkIcon ? 1 : 0, { duration: DURATION }),
      transform: [
        {
          rotate: withTiming(showCheckmarkIcon ? "0deg" : "90deg", {
            duration: DURATION,
          }),
        },
      ],
    };
  }, [showCheckmarkIcon]);

  // Animated style for button scale on press
  const rButtonScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Animated style for visibility/translate using Reanimated
  const rVisibilityStyle = useAnimatedStyle(() => {
    if (animationValue) {
      return {
        opacity: animationValue.value,
        transform: disableTranslate
          ? []
          : [
            {
              translateY: (1 - animationValue.value) * 100,
            },
          ],
      };
    }
    return {
      opacity: visible ? 1 : 0,
      transform: disableTranslate ? [] : [{ translateY: visible ? 0 : 100 }],
    };
  }, [animationValue, visible, disableTranslate]);

  // Handle button press
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecipesTab) {
      if (hasRecipes) {
        // Toggle bulk edit mode when on Recipes tab with recipes
        onBulkEditPress?.();
      } else {
        // Navigate to create modal when on Recipes tab with no recipes
        router.push("/(modal)/create");
      }
    } else {
      // Navigate to create modal when on Cookbooks tab
      router.push("/(modal)/create");
    }
  };

  // Handle press in - scale down
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.8, { duration: DURATION });
  };

  // Handle press out - scale back up
  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: DURATION });
  };

  // Dynamic accessibility label
  const getAccessibilityLabel = () => {
    if (!isRecipesTab) return "Create";
    if (!hasRecipes) return "Add Recipe";
    if (isBulkEditMode) return "Done";
    return "Bulk Edit";
  };
  const accessibilityLabel = getAccessibilityLabel();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: insets.bottom + bottomOffset,
          right: rightOffset,
        },
      ]}
    >
      <Animated.View
        style={rVisibilityStyle}
        pointerEvents={visible ? "auto" : "none"}
      >
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          accessibilityRole="button"
          onPressOut={handlePressOut}
          accessibilityLabel={accessibilityLabel}
          style={[styles.buttonContainer, rButtonScaleStyle]}
        >
          <View style={styles.button}>
            {/* Add icon - visible on Cookbooks tab OR Recipes tab with no recipes */}
            <Animated.View style={[styles.iconContainer, rAddIconStyle]}>
              <Ionicons size={28} name="add" color="#fff" />
            </Animated.View>

            {/* Bulk Edit icon - visible on Recipes tab with recipes, not in bulk edit mode */}
            <Animated.View style={[styles.iconContainer, rBulkEditIconStyle]}>
              <MaterialCommunityIcons
                size={24}
                color="#fff"
                name="view-dashboard-edit-outline"
              />
            </Animated.View>

            {/* Checkmark icon - visible on Recipes tab in bulk edit mode */}
            <Animated.View style={[styles.iconContainer, rCheckmarkIconStyle]}>
              <Ionicons size={26} name="checkmark" color="#fff" />
            </Animated.View>
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10000,
    position: "absolute",
  },
  buttonContainer: {
    width: 53,
    height: 53,
    elevation: 6,
    shadowRadius: 8,
    borderRadius: 28,
    shadowOpacity: 0.3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
  },
  button: {
    width: 53,
    height: 53,
    borderRadius: 28,
    opacity: 0.9,
    alignItems: "center",
    backgroundColor: Colors.primary,
    justifyContent: "center",
  },
  iconContainer: {
    position: "absolute",
  },
});
