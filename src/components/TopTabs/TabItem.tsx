// External Dependencies
import React, { type FC } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

const TAB_COLOR = "#000000";

export type TabItemProps = {
  label: string;
  onPress: () => void;
};

export const TabItem: FC<TabItemProps> = ({ label, onPress }) => {
  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
    >
      <Text style={styles.tabText}>
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
    fontWeight: "600",
    fontSize: 16,
    marginHorizontal: 0,
    color: TAB_COLOR,
  },
});
