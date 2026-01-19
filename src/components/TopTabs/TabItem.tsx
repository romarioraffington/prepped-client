// External Dependencies
import React, { type FC } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

const TAB_COLOR_ACTIVE = "#000000";
const TAB_COLOR_INACTIVE = Colors.matureForeground;

export type TabItemProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

export const TabItem: FC<TabItemProps> = ({ label, isActive = false, onPress }) => {
  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
    >
      <Text style={[styles.tabText, { color: isActive ? TAB_COLOR_ACTIVE : TAB_COLOR_INACTIVE }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    height: 40,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: Platform.select({
      ios: "BricolageGrotesque-Bold",
    }),
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 0,
  },
});
