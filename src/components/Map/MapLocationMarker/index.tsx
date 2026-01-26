import { memo } from "react";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type MapLocationMarkerProps = {
  content?: string | ReactNode;
  isSelected?: boolean;
};

function MapLocationMarkerComponent({
  content = "",
  isSelected = false,
}: MapLocationMarkerProps) {
  const width = 32;
  const height = 36;
  const strokeColor = "#EA4335";

  const strokeWidth = isSelected ? 2 : 0;
  const padding = isSelected ? strokeWidth : 0;
  const color = isSelected ? "#FFFFFF" : "#EA4335";
  const textColor = isSelected ? "#EA4335" : "#FFFFFF";

  return (
    <View style={styles.markerContainer}>
      <View>
        <Svg
          width={width}
          height={height}
          viewBox={`${-padding} ${-padding} ${width + padding * 2} ${height + (padding * 2) + 8}`}
        >
          <Path
            d="M17 0C7.612 0 14 7.612 0 17c0 9.065 11.566 22.478 13.574 24.672.599.655 1.592.655 2.191 0C17.773 39.478 34 26.065 34 17 34 7.612 26.388 0 17 0z"
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
        <View style={styles.marketTextContainer}>
          {typeof content === "string" ? (
            <Text style={[styles.markerText, { color: textColor }]}>
              {content}
            </Text>
          ) : (
            <View style={styles.iconContainer}>{content}</View>
          )}
        </View>
      </View>
    </View>
  );
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export const MapLocationMarker = memo(MapLocationMarkerComponent);

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  marketTextContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
