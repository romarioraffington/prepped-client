import { MaterialIcons } from "@expo/vector-icons";
// External Dependencies
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { HoursStatus } from "@/components/Hours"; // Imported directly to avoid circular dependency
// Internal Dependencies
import { hasValidHours } from "@/libs/utils";

interface HeaderMetadataSectionProps {
  hours: any;
  priceRange: string | null;
  onHoursClicked?: () => void;
  isAccessible: boolean | undefined;
}

export const HeaderMetadataSection = ({
  hours,
  priceRange,
  isAccessible,
  onHoursClicked,
}: HeaderMetadataSectionProps) => {
  const isHoursAvailable = hours && hasValidHours(hours);
  const isAccessibleAvailable = isAccessible !== undefined;

  return (
    <View style={styles.headerMetadataContainer}>
      {isHoursAvailable && (
        <TouchableOpacity
          disabled={!onHoursClicked}
          onPress={onHoursClicked}
          style={styles.headerMetadataButton}
        >
          <HoursStatus hours={hours} textStyle={{ fontSize: 14 }} />
          <Text style={styles.headerMetadataText}> • </Text>
        </TouchableOpacity>
      )}
      {priceRange && (
        <>
          <Text style={styles.headerMetadataText}>{priceRange}</Text>
          <Text style={styles.headerMetadataText}> • </Text>
        </>
      )}
      {/*
        Only show accessibility icon if hours or price range is available, to avoid
        only showing the accessibility icon when there is no hours or price range.
      */}
      {isAccessibleAvailable && (isHoursAvailable || priceRange) && (
        <MaterialIcons
          size={16}
          color="#0b57d0"
          name={isAccessible === true ? "accessible-forward" : "not-accessible"}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerMetadataContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerMetadataText: {
    fontSize: 15,
    color: "#667",
  },
  headerMetadataButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});
