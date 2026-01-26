// External Dependencies
import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import type { Hours } from "@/libs/types";
import { formatTime } from "@/libs/utils";

interface HoursStatusProps {
  hours: Hours;
  textStyle?: StyleProp<TextStyle>;
}

export const HoursStatus = ({ hours, textStyle }: HoursStatusProps) => {
  const openTextStyle = StyleSheet.flatten([styles.openText, textStyle]);
  const closedTextStyle = StyleSheet.flatten([styles.closedText, textStyle]);
  const hoursTextStyle = StyleSheet.flatten([styles.hoursText, textStyle]);
  const typeSeparatorStyle = StyleSheet.flatten([
    styles.typeSeparator,
    textStyle,
  ]);

  if (!hours) {
    return null;
  }

  // Check if it's a 24-hour place
  if (hours.is24Hours) {
    return (
      <View style={styles.statusTextContainer}>
        <Text style={openTextStyle}>Open 24 hours</Text>
      </View>
    );
  }

  // Return null if essential hours data is missing
  if (hours.isOpen == null || !hours.opensAt || !hours.closedAt) {
    return null;
  }

  // Regular hours
  if (hours.isOpen) {
    return (
      <View style={styles.statusTextContainer}>
        <Text style={openTextStyle}>Open</Text>
        <Text style={typeSeparatorStyle}> • </Text>
        <Text style={hoursTextStyle}>Closes {formatTime(hours.closedAt)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusTextContainer}>
      <Text style={closedTextStyle}>Closed</Text>
      <Text style={typeSeparatorStyle}> • </Text>
      <Text style={hoursTextStyle}>Opens {formatTime(hours.opensAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  openText: {
    fontSize: 14,
    color: Colors.successColor,
    fontWeight: "500",
  },
  closedText: {
    fontSize: 14,
    color: Colors.pinkAccentColor,
    fontWeight: "500",
  },
  hoursText: {
    fontSize: 14,
    color: "#667",
  },
  typeSeparator: {
    fontSize: 14,
    color: "#667",
  },
});
