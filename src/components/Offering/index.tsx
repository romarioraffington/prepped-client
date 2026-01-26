// External Dependencies
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Internal Dependencies
import { getIconForOffering } from "@/libs/utils";

interface OfferingProps {
  name: string;
}

export function Offering({ name }: OfferingProps) {
  return (
    <View style={styles.offeringItem}>
      <View style={styles.offeringIconContainer}>
        {getIconForOffering(name)}
      </View>
      <Text style={styles.offeringText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  offeringItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  offeringIconContainer: {
    width: 30,
    marginRight: 15,
    alignItems: "center",
  },
  offeringText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#11181C",
  },
});
