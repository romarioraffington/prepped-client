// External Dependencies
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

// Color Constants
const WHITE = "#FFFFFF";
const PRIMARY_PURPLE = "#8a49b4";

interface ProBadgeProps {
  /**
   * The text to display in the badge (default: "PRO")
   */
  text?: string;
  /**
   * Whether to show the animated entrance (default: false)
   */
  animated?: boolean;
  /**
   * Custom style for the badge container
   */
  style?: object;
}

export const ProBadge = ({
  text = "Premium",
  animated = false,
  style,
}: ProBadgeProps) => {
  const badgeContent = (
    <View style={[styles.proBadge, style]}>
      <View style={styles.proBadgeProContainer}>
        <Text style={styles.proBadgeTextPro}>{text}</Text>
      </View>
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(800).delay(300)}>
        {badgeContent}
      </Animated.View>
    );
  }

  return badgeContent;
};

const styles = StyleSheet.create({
  proBadge: {
    gap: 8,
    width: 100,
    flexDirection: "row",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: "space-between",
  },
  proBadgeProContainer: {
    backgroundColor: PRIMARY_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    paddingVertical: 5,
  },
  proBadgeTextPro: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
  },
});
