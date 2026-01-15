import { Dimensions } from "react-native";

export const CARD_MARGIN = 15;
export const GRID_PADDING = 20;

const { width } = Dimensions.get("window");
export const AVAILABLE_WIDTH = width - GRID_PADDING * 2;
export const FIRST_CARD_WIDTH = AVAILABLE_WIDTH;
export const REGULAR_CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2;
