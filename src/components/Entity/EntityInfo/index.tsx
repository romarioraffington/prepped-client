// External dependencies
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextProps, TextStyle } from "react-native";

interface EntityInfoProps {
  category: string;
  priceRange?: string;
  isAccessible?: boolean;
  textStyle?: StyleProp<TextStyle>;
}

export const EntityInfo = ({
  category,
  priceRange,
  isAccessible,
  textStyle,
}: EntityInfoProps) => {
  const mergedTextStyle = StyleSheet.flatten([styles.text, textStyle]);
  const StyledText = (props: TextProps) => (
    <Text {...props} style={mergedTextStyle} />
  );

  return (
    <View style={styles.typeContainer}>
      <StyledText>{category}</StyledText>

      {isAccessible !== undefined && (
        <>
          <StyledText> • </StyledText>
          <MaterialIcons
            size={16}
            color="#0b57d0"
            name={isAccessible ? "accessible-forward" : "not-accessible"}
          />
        </>
      )}

      {priceRange && (
        <>
          <StyledText> • </StyledText>
          <StyledText>{priceRange}</StyledText>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    color: "#667",
  },
});
