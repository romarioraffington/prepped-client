// External Dependencies
import { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";

export interface DotsLoaderProps {
  /**
   * Color of the loading dots
   * @default Colors.primaryPurple
   */
  color?: string;
  /**
   * Size of each dot in pixels
   * @default 10
   */
  dotSize?: number;
  /**
   * Spacing between dots in pixels
   * @default 6
   */
  dotSpacing?: number;
  /**
   * Background color of the container
   * @default "#fff"
   */
  backgroundColor?: string;
  /**
   * Whether the loader should take full height
   * @default true
   */
  fullHeight?: boolean;
}

export const DotsLoader: React.FC<DotsLoaderProps> = ({
  color = Colors.primaryPurple,
  dotSize = 10,
  dotSpacing = 6,
  backgroundColor = "#fff",
  fullHeight = true,
}) => {
  const dots = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    [],
  );

  useEffect(() => {
    const loops = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    for (const loop of loops) {
      loop.start();
    }

    return () => {
      for (const loop of loops) {
        loop.stop();
      }
      for (const dot of dots) {
        dot.setValue(0);
      }
    };
  }, [dots]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        fullHeight && styles.fullHeight,
      ]}
    >
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.loaderDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              marginHorizontal: dotSpacing / 2,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.05],
                  }),
                },
              ],
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullHeight: {
    flex: 0.5,
    paddingTop: 0,
  },
  loaderDot: {
    // Styles are applied inline for dynamic sizing
  },
});

export default DotsLoader;



