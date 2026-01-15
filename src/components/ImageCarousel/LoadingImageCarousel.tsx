// External dependencies
import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

import Animated, {
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// Internal dependencies
const LOADING_IMAGE_COUNT = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_WIDTH = SCREEN_WIDTH / 2.5;

interface LoadingImageCarouselProps {
  imageGap?: number;
  imageHeight?: number;
  imageWidth?: number;
}

export const LoadingImageCarousel = ({
  imageGap = 8,
  imageHeight = 140,
  imageWidth = IMAGE_WIDTH,
}: LoadingImageCarouselProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ height: imageHeight }}>
      <View style={styles.imageCarouselContent}>
        {Array(LOADING_IMAGE_COUNT).fill(0).map((_, index) => (
          <View
            key={index}
            style={[
              {
                width: imageWidth,
                height: imageHeight,
                marginRight: imageGap,
              },
              index === 0 && styles.firstImage,
              index === 2 && styles.lastImage,
            ]}
          >
            <Animated.View style={[styles.skeletonImage, animatedStyle]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageCarouselContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  firstImage: {
    marginLeft: 16,
  },
  lastImage: {
    marginRight: 16,
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
});
