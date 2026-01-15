import { View } from 'react-native';
import React, { useEffect } from 'react';

import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

export const LoadingStaggeredGrid = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const ImageCardSkeleton = ({ isLarge = false }) => {
    const cardHeight = isLarge ? 280 : 200;

    return (
      <View style={{ width: '100%', marginBottom: 16 }}>
        <Animated.View
          style={[
            {
              height: cardHeight,
              borderRadius: 12,
              backgroundColor: '#E1E9EE',
              marginBottom: 8,
            },
            animatedStyle
          ]}
        />

        {/* Title skeleton */}
        <Animated.View
          style={[
            {
              backgroundColor: '#E1E9EE',
              height: 16,
              width: '80%',
              borderRadius: 4,
              marginBottom: 4,
            },
            animatedStyle
          ]}
        />
      </View>
    );
  };

  return (
    <View style={{ padding: 20, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {/* Left column */}
        <View style={{ width: '48%' }}>
          {[...Array(4)].map((_, index) => (
            <ImageCardSkeleton key={index} isLarge={index % 3 === 0} />
          ))}
        </View>

        {/* Right column */}
        <View style={{ width: '48%' }}>
          {[...Array(4)].map((_, index) => (
            <ImageCardSkeleton key={index} isLarge={index % 3 === 1} />
          ))}
        </View>
      </View>
    </View>
  );
};
