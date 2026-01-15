// External Dependencies
import type React from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, Pressable, StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

type FloatingAddButtonProps = {
  bottomOffset?: number;
  rightOffset?: number;
  visible?: boolean;
  animationValue?: Animated.Value;
  disableTranslate?: boolean;
};

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  bottomOffset = 0,
  rightOffset = 16,
  visible = true,
  animationValue,
  disableTranslate = false,
}) => {
  const insets = useSafeAreaInsets();

  const animatedStyle = animationValue
    ? {
      opacity: animationValue,
      transform: disableTranslate
        ? []
        : [
          {
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          },
        ],
    }
    : {
      opacity: visible ? 1 : 0,
      transform: disableTranslate ? [] : [{ translateY: visible ? 0 : 100 }],
    };

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
        pointerEvents={visible ? "auto" : "none"}
        style={animatedStyle}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(modal)/create");
          }}
          style={styles.button}
        >
          <View style={styles.purpleButton}>
            <Ionicons size={28} name="add" color="#fff" />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10000,
    position: "absolute",
  },
  button: {
    width: 56,
    borderRadius: 28,
    height: 56,
    elevation: 6,
    shadowRadius: 8,
    shadowOpacity: 0.3,
    shadowColor: Colors.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
  },
  purpleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.9,
    alignItems: "center",
    backgroundColor: Colors.primaryPurple,
    justifyContent: "center",
  },
});
