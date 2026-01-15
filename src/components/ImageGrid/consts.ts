import { Dimensions } from "react-native";

export const imageGap = 2;
export const columnGap = 12;
export const itemHeight = 140;
export const paddingHorizontal = 16;
export const { width } = Dimensions.get("window");

// Calculate the width of each column
export const columnWidth = (width - paddingHorizontal * 2 - columnGap) / 2;
