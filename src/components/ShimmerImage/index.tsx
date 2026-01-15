// External Dependencies
import { Image, type ImageProps } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useState, type ComponentRef } from "react";

import Animated, {
  Easing,
  withRepeat,
  withTiming,
  interpolate,
  useSharedValue,
  cancelAnimation,
  useAnimatedStyle,
} from "react-native-reanimated";

// Internal Dependencies
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export type ShimmerImageProps = ImageProps;

/**
 * ShimmerImage wraps `expo-image` and provides a lightweight shimmer placeholder until the image loads.
 * - API mirrors `expo-image` and all props are passed through to the underlying `Image`.
 * - If `placeholder` is provided (e.g. a BlurHash), it will be passed to `Image` and shimmer will be disabled.
 */
type ExpoImageComponentRef = ComponentRef<typeof Image>;

export const ShimmerImage = forwardRef<ExpoImageComponentRef, ShimmerImageProps>((props, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const { style, placeholder, onLoadEnd, onLoadStart, onError, ...rest } = props;

  const shouldShowShimmer = useMemo(() => isLoading && showShimmer && !placeholder, [isLoading, showShimmer, placeholder]);

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!shouldShowShimmer || containerWidth <= 0) {
      cancelAnimation(translateX);
      return;
    }

    // Start the shimmer from the left outside and move to right outside continuously
    translateX.value = -containerWidth * 1.5; // Start further left for smoother entry
    translateX.value = withRepeat(
      withTiming(containerWidth * 1.5, {
        duration: 1500, // Slightly slower for smoother feel
        easing: Easing.linear, // Use linear for consistent speed
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [containerWidth, shouldShowShimmer, translateX]);

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    // Calculate opacity based on position for fade effect at edges
    const progress = (translateX.value + containerWidth * 1.5) / (containerWidth * 3);
    const opacity = interpolate(
      progress,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      'clamp'
    );

    return {
      transform: [{ translateX: translateX.value }],
      opacity,
    };
  });

  const handleLoadEnd = useCallback<NonNullable<ImageProps["onLoadEnd"]>>(() => {
    setIsLoading(false);
    setShowShimmer(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleLoadStart = useCallback<NonNullable<ImageProps["onLoadStart"]>>(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  // Add a small delay before showing shimmer to avoid flicker for cached images
  useEffect(() => {
    if (isLoading && !placeholder) {
      const timer = setTimeout(() => {
        setShowShimmer(true);
      }, 100);

      return () => clearTimeout(timer);
    }
    setShowShimmer(false);
  }, [isLoading, placeholder]);

  type OnErrorParams = Parameters<NonNullable<ImageProps["onError"]>>;
  const handleError = useCallback<NonNullable<ImageProps["onError"]>>((...args: OnErrorParams) => {
    setIsLoading(false);
    setShowShimmer(false);
    onError?.(...args);
  }, [onError]);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // Width of the shimmer band relative to container. Slightly wider for better visibility
  const shimmerBandWidth = Math.max(40, Math.floor(containerWidth * 0.4));

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Image
        ref={ref}
        {...rest}
        style={style}
        onError={handleError}
        placeholder={placeholder}
        onLoadEnd={handleLoadEnd}
        onLoadStart={handleLoadStart}
      />

      {shouldShowShimmer ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.placeholderBase]}>
          <AnimatedLinearGradient
            colors={["#e5e7eb", "#f3f4f6", "#ffffff", "#f3f4f6", "#e5e7eb"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            locations={[0, 0.3, 0.5, 0.7, 1]}
            style={[
              styles.shimmerBand,
              { width: shimmerBandWidth },
              shimmerAnimatedStyle,
            ]}
          />
        </View>
      ) : null}
    </View>
  );
});

ShimmerImage.displayName = "ShimmerImage";

const styles = StyleSheet.create({
  container: {
    overflow: "hidden", // Enable overflow hidden for cleaner edges
  },
  placeholderBase: {
    backgroundColor: "#e5e7eb", // neutral-200
  },
  shimmerBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
});

