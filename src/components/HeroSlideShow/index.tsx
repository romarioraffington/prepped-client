// External Dependencies
import type React from "react";
import { useCallback, useState } from "react";
import { scheduleOnRN } from "react-native-worklets";
import type { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import {
  Gesture,
  ScrollView,
  GestureDetector,
} from "react-native-gesture-handler";

// Internal Dependencies
import { useImageErrorFilter } from "@/hooks";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HeroSlideShowProps {
  id: string;
  name: string;
  height?: number;
  imageUrls: string[];
  description?: string;
  topRightAction?: React.ReactNode;
  metadataRight?: React.ReactNode;
  onPress?: (id: string, name: string) => void;
}

export const HeroSlideShow: React.FC<HeroSlideShowProps> = ({
  id,
  name,
  imageUrls,
  description,
  height = 350,
  metadataRight,
  topRightAction,
  onPress,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 50); // Default to account for 25px padding on each side

  const { validImages, handleImageError } = useImageErrorFilter(imageUrls);

  // Shared value to track if a horizontal swipe occurred
  const hasSwiped = useSharedValue(false);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const pageNum = Math.round(contentOffset / containerWidth);
    setActiveIndex(pageNum);
  };

  const executePress = useCallback(() => {
    if (onPress) {
      onPress(id, name);
    }
  }, [onPress, id, name]);

  // Pan gesture to detect horizontal swipes
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      "worklet";
      hasSwiped.value = false;
    })
    .onUpdate((event) => {
      "worklet";
      // Mark as swiped if horizontal movement exceeds threshold
      if (Math.abs(event.translationX) > 10) {
        hasSwiped.value = true;
      }
    })
    .onEnd(() => {
      "worklet";
      // Don't reset here - let tap gesture check first, then reset in next onStart
    });

  // Tap gesture for press handling
  const tapGesture = Gesture.Tap()
    .enabled(!!onPress)
    .onEnd(() => {
      "worklet";
      if (!hasSwiped.value && onPress) {
        scheduleOnRN(executePress);
      }
      // Reset after tap check completes
      hasSwiped.value = false;
    });

  // Compose gestures - simultaneous allows both to work together
  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  const hasImages = validImages && validImages.length > 0;
  const hasMultipleImages = validImages && validImages.length > 1;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Image Slideshow */}
      <View style={[styles.imageContainer, { height }]}>
        <GestureDetector gesture={composedGesture}>
          <View style={styles.gestureContainer}>
            {hasImages ? (
              <ScrollView
                horizontal
                pagingEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {validImages.map((url, index) => (
                  <View
                    key={`${url}-${index}`}
                    style={[
                      styles.imageWrapper,
                      { width: containerWidth, height },
                    ]}
                  >
                    <ShimmerImage
                      contentFit="cover"
                      source={{ uri: url }}
                      style={styles.image}
                      onError={() => handleImageError(url)}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ImagePlaceholder height={height} iconSize={40} />
            )}
          </View>
        </GestureDetector>

        {/* Top Right Action Overlay - Outside gesture detector to prevent navigation */}
        {topRightAction && (
          <View style={styles.topRightAction} pointerEvents="box-none">
            {topRightAction}
          </View>
        )}

        {/* Dots Indicator */}
        {hasMultipleImages && (
          <View style={styles.dotsContainer}>
            {validImages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, activeIndex === index && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Metadata Panel */}
      <View style={styles.metadataContainer}>
        {/* Name with Metadata */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {name}
          </Text>
          {metadataRight && (
            <View style={styles.metadataRightContainer}>{metadataRight}</View>
          )}
        </View>

        {/* Description */}
        {description && (
          <Text style={styles.subtitle} numberOfLines={3}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 3,
    borderRadius: 16,
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  gestureContainer: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
  },
  imageWrapper: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topRightAction: {
    top: 15,
    right: 15,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsContainer: {
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
    alignItems: "center",
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  metadataContainer: {
    marginTop: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#555",
  },
  metadataRightContainer: {
    flexShrink: 0,
  },
});
