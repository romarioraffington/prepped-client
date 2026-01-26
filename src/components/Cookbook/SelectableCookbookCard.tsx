import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import type { CookbookCardData } from "@/libs/types";
import { CookbookCard } from "./CookbookCard";

export interface SelectableCookbookCardProps {
  item: CookbookCardData;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const SelectableCookbookCard: FC<SelectableCookbookCardProps> = ({
  item,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  return (
    <View
      accessibilityRole="checkbox"
      style={[styles.container, disabled && styles.containerDisabled]}
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={`${item.name}, ${isSelected ? "selected" : "not selected"}`}
    >
      <CookbookCard item={item} onPress={disabled ? () => {} : onSelect} />
      {isSelected && (
        <View style={styles.checkmarkOverlay}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-sharp" size={18} color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  containerDisabled: {
    opacity: 0.5,
  },
  checkmarkOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
