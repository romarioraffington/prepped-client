import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import type { Hours } from "@/libs/types";

interface HoursBadgeProps {
  hours: Hours;
  onPress: () => void;
}

export const HoursBadge: React.FC<HoursBadgeProps> = ({ hours, onPress }) => {
  if (hours.is24Hours) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: "#f0f8f0", paddingHorizontal: 23 },
        ]}
      >
        <Ionicons
          size={15}
          color={Colors.successColor}
          name="time-outline"
          style={styles.icon}
        />
        <Text style={[styles.text, { color: Colors.successColor }]}>
          Open 24 Hours
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!hours?.dailyHours?.length}
      style={[
        styles.container,
        { backgroundColor: hours.isOpen ? "#f0f8f0" : "#FFF1F1" },
      ]}
    >
      <Ionicons
        size={15}
        name="time-outline"
        color={hours.isOpen ? Colors.successColor : Colors.pinkAccentColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          {
            color: hours.isOpen ? Colors.successColor : Colors.pinkAccentColor,
          },
        ]}
      >
        {hours.isOpen
          ? `Open until ${hours.closedAt}`
          : `Closed until ${hours.opensAt}`}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
  },
});
