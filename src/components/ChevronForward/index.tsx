import { Ionicons } from "@expo/vector-icons";
import type { StyleProp, TextStyle } from "react-native";

export const ChevronForward = ({
  color = "grey",
  size = 20,
  style,
}: { color?: string; size?: number; style?: StyleProp<TextStyle> }) => (
  <Ionicons name="chevron-forward" size={size} color={color} style={style} />
);
