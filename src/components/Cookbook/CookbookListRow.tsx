// External Dependencies
import { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";

const IMAGE_SIZE = 56;
const IMAGE_RADIUS = 10;

export interface CookbookListRowProps {
  id: string;
  name: string;
  imageUri?: string | null;
  metaText: string;
  isChecked: boolean;
  disabled?: boolean;
  onPress: (id: string) => void;
}

export const CookbookListRow = memo<CookbookListRowProps>(
  ({ id, name, imageUri, metaText, isChecked, disabled = false, onPress }) => {
    return (
      <Pressable
        disabled={disabled}
        onPress={() => onPress(id)}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${metaText}, ${isChecked ? "in cookbook" : "not in cookbook"}`}
        style={[styles.container, disabled && styles.containerDisabled]}
      >
        {/* Thumbnail */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <ShimmerImage
              contentFit="cover"
              style={styles.image}
              source={{ uri: imageUri }}
            />
          ) : (
            <ImagePlaceholder
              iconSize={20}
              height={IMAGE_SIZE}
              style={styles.placeholder}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.meta}>{metaText}</Text>
        </View>

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkboxOuter,
              isChecked && styles.checkboxOuterSelected,
            ]}
          >
            <View style={styles.checkboxInner}>
              {isChecked && (
                <Ionicons
                  size={14}
                  color={Colors.primary}
                  name="checkmark-done-sharp"
                />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

CookbookListRow.displayName = "CookbookListRow";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#FAFAF5",
    borderRadius: 16,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    overflow: "hidden",
    marginLeft: 12,
    borderRadius: IMAGE_RADIUS,
    backgroundColor: "#e5e5e5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: "#e5e5e5",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
    fontFamily: Platform.select({
      android: "BricolageGrotesque_600SemiBold",
      ios: "BricolageGrotesque-SemiBold",
    }),
  },
  meta: {
    fontSize: 13,
    color: "#667",
    fontWeight: "400",
    fontFamily: Platform.select({
      android: "Manrope_400Regular",
      ios: "Manrope-Medium",
    }),
  },
  checkboxContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  checkboxOuter: {
    width: 25,
    height: 25,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
