import type React from "react";
import { BlurView } from "expo-blur";
import { type FC, memo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Dimensions, Image, View, StyleSheet } from "react-native";

import Animated, {
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const screenWidth = Dimensions.get("screen").width;

export const _itemWidth = screenWidth * 0.6;

type Props = {
  index: number;
  imageSrc: number | { uri: string; cachePolicy?: string };
  allItemsWidth: number;
  scrollOffsetX: SharedValue<number>;
  renderFooter?: () => React.ReactNode;
};

const MarqueeItemComponent: FC<Props> = ({
  index,
  imageSrc,
  scrollOffsetX,
  allItemsWidth,
  renderFooter,
}) => {
  const shift = (allItemsWidth - screenWidth) / 2;
  const initialLeft = index * _itemWidth - shift;

  const constainerStyle = useAnimatedStyle(() => {
    const normalizedOffset =
      ((scrollOffsetX.value % allItemsWidth) + allItemsWidth) % allItemsWidth;
    const left = ((initialLeft - normalizedOffset) % allItemsWidth) + shift;

    const rotation = interpolate(
      left,
      [0, screenWidth - _itemWidth],
      [-0.6, 0.6],
    );
    const translateY = interpolate(
      left,
      [0, (screenWidth - _itemWidth) / 2, screenWidth - _itemWidth],
      [1, -0.5, 1],
    );

    return {
      left,
      transform: [{ rotateZ: `${rotation}deg` }, { translateY }],
    };
  });

  return (
    <Animated.View
      style={[styles.container, constainerStyle, { width: _itemWidth, transformOrigin: "bottom" }]}
    >
      <View style={styles.shadowContainer}>
        <View style={styles.imageContainer}>
          <Image source={imageSrc} style={styles.image} />
          <Animated.View
            entering={FadeIn}
            style={[
              styles.overlayContainer,
              { width: _itemWidth, height: "100%" },
            ]}
          >
            <MaskedView
              maskElement={
                <LinearGradient
                  locations={[0, 0.4, 0.7, 1]}
                  style={StyleSheet.absoluteFillObject}
                  colors={["transparent", "transparent", "black", "black"]}
                />
              }
              style={StyleSheet.absoluteFillObject}
            >
              <Image source={imageSrc} style={styles.image} />
              <BlurView intensity={100} style={StyleSheet.absoluteFillObject} />
            </MaskedView>
          </Animated.View>
          <View
            style={[StyleSheet.absoluteFillObject, styles.contentContainer]}
          >
            {renderFooter?.()}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    height: "100%",
    padding: 8,
  },
  shadowContainer: {
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  overlayContainer: {
    position: "absolute",
    bottom: 0,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 24,
  },
  placeholderLine1: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 9999,
    height: 32,
    width: "50%",
    marginBottom: 12,
  },
  placeholderLine2: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 9999,
    height: 20,
    width: "75%",
    marginBottom: 4,
  },
  placeholderLine3: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 9999,
    height: 20,
    width: "50%",
  },
});

export const MarqueeItem = memo(MarqueeItemComponent);
