import { Image } from "expo-image";
import React, { type FC, memo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Props = {
  itemKey: string;
  source: number | { uri: string; cachePolicy?: string };
};

const ImageBgComponent: FC<Props> = ({ itemKey, source }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <AnimatedImage
        key={itemKey}
        source={source}
        blurRadius={100}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={StyleSheet.absoluteFill}
      />
      <View style={StyleSheet.absoluteFill} className="bg-neutral-800/50" />
    </View>
  );
};

export const ImageBg = memo(ImageBgComponent);
