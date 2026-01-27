// External Dependencies
import { useEffect } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

// Internal Dependencies
import { Colors } from "@/libs/constants";

export type BulkEditFooterVariant = "default" | "organize" | "recipes";

export interface BulkEditFooterProps {
  isVisible: boolean;
  selectedCount: number;
  onMove?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  isPending?: boolean;
  variant?: BulkEditFooterVariant;
}

export function BulkEditFooter({
  isVisible,
  selectedCount,
  onMove,
  onDelete,
  onAdd,
  onRemove,
  isPending = false,
  variant = "default",
}: BulkEditFooterProps) {
  const insets = useSafeAreaInsets();

  // Footer animation - starts off-screen (100 = hidden below screen)
  const footerTranslateY = useSharedValue(100);

  // Animate footer when visibility changes
  useEffect(() => {
    footerTranslateY.value = withTiming(isVisible ? 0 : 100, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isVisible, footerTranslateY]);

  // Animated style for footer slide animation
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const hasSelections = selectedCount > 0;
  const isDisabled = !hasSelections || isPending;

  // Render buttons based on variant
  const renderButtons = () => {
    switch (variant) {
      case "organize":
        // Move and Delete only
        return (
          <>
            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onMove}
              disabled={isDisabled}
            >
              <MaterialIcons
                name="drive-file-move-outline"
                size={24}
                color={!isDisabled ? "#667" : "#999"}
              />
              <Text
                style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}
              >
                Move
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onDelete}
              disabled={isDisabled}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={!isDisabled ? Colors.destructive : "#999"}
              />
              <Text
                style={[
                  styles.buttonText,
                  styles.buttonTextDestructive,
                  isDisabled && styles.buttonTextDisabled,
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </>
        );

      case "recipes":
        // Add and Delete only
        return (
          <>
            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onAdd}
              disabled={isDisabled}
            >
              <MaterialIcons
                name="bookmark-add"
                size={25}
                color={!isDisabled ? "#667" : "#999"}
              />
              <Text
                style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}
              >
                Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onDelete}
              disabled={isDisabled}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={!isDisabled ? Colors.destructive : "#999"}
              />
              <Text
                style={[
                  styles.buttonText,
                  styles.buttonTextDestructive,
                  isDisabled && styles.buttonTextDisabled,
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </>
        );

      default:
        // Add, Remove, Delete (default variant)
        return (
          <>
            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onAdd}
              disabled={isDisabled}
            >
              <MaterialIcons
                name="bookmark-add"
                size={25}
                color={!isDisabled ? "#667" : "#999"}
              />
              <Text
                style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}
              >
                Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onRemove}
              disabled={isDisabled}
            >
              <MaterialIcons
                name="bookmark-remove"
                size={24}
                color={!isDisabled ? "#667" : "#999"}
              />
              <Text
                style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}
              >
                Remove
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={onDelete}
              disabled={isDisabled}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={!isDisabled ? Colors.destructive : "#999"}
              />
              <Text
                style={[
                  styles.buttonText,
                  styles.buttonTextDestructive,
                  isDisabled && styles.buttonTextDisabled,
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.footer,
        { paddingBottom: insets.bottom },
        footerAnimatedStyle,
      ]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <View style={styles.buttonRow}>{renderButtons()}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    overflow: "hidden",
    position: "absolute",
    backgroundColor: "rgba(245, 245, 240, 0.95)",
  },
  buttonRow: {
    gap: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    marginTop: 4,
    fontSize: 13,
    color: "#667",
    fontWeight: "500",
  },
  buttonTextDestructive: {
    color: Colors.destructive,
  },
  buttonTextDisabled: {
    color: "#999",
  },
});
