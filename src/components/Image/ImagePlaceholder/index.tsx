// External Dependencies
import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import {
  type DimensionValue,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

interface ImagePlaceholderProps {
  height?: DimensionValue;
  style?: ViewStyle;
  iconSize?: number;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  height,
  style,
  iconSize = 48,
}) => {
  return (
    <View style={[styles.container, { height }, style]}>
      <Ionicons name="image-outline" size={iconSize} color="#d0d0d0" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
  },
});
