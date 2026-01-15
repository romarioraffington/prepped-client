// External Dependencies
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { Offering } from "@/components/Offering"; // Imported directly to avoid circular dependency

interface OfferingListProps {
  offerings: string[];
  maxOfferings?: number; // The maximum number of offerings initially render
  onShowAll?: () => void;
}

export function OfferingList({ offerings, maxOfferings = 6, onShowAll }: OfferingListProps) {
  const offeringsList = offerings.slice(0, maxOfferings);

  return (
    <>
      <View style={styles.offeringsList}>
        {offeringsList.map((offering, index) => (
          <Offering key={`offering-${index}`} name={offering} />
        ))}
      </View>

      {offerings.length > maxOfferings && (
        <TouchableOpacity style={styles.showAllButton} onPress={onShowAll}>
          <Text style={styles.showAllText}>
            Show all {offerings.length} amenities
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  offeringsList: {
    gap: 20,
  },
  showAllButton: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  showAllText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#11181C",
  },
});
