import { View } from 'react-native';
import React, { useEffect } from 'react';

import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface LoadingImageGridListProps {
  rows?: number;
}

export const LoadingImageGridList = ({ rows = 3 }: LoadingImageGridListProps) => {
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

  const CardSkeleton = () => (
    <View style={{ width: '48%' }}>
      <Animated.View
        style={[
          {
            borderRadius: 16,
            gap: 2,
            width: '100%',
            aspectRatio: 1.8,
            overflow: 'hidden',
            marginBottom: 8,
            flexDirection: 'row',
          },
          animatedStyle
        ]}
      >
        {/* Main large image */}
        <View style={{
          flex: 0.65,
          backgroundColor: '#E1E9EE',
          height: '100%',
        }} />

        {/* Right column with 2 smaller images */}
        <View style={{
          flex: 0.35,
          gap: 2,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#E1E9EE',
          }} />
          <View style={{
            flex: 1,
            backgroundColor: '#E1E9EE',
          }} />
        </View>
      </Animated.View>

      {/* Title Bar */}
      <Animated.View
        style={[
          {
            backgroundColor: '#E1E9EE',
            height: 13,
            width: '50%',
            borderRadius: 4,
            marginBottom: 4,
            marginTop: 5,
          },
          animatedStyle
        ]}
      />

      {/* Subtitle Bar */}
      <Animated.View
        style={[
          {
            backgroundColor: '#E1E9EE',
            height: 10,
            width: '70%',
            borderRadius: 4,
          },
          animatedStyle
        ]}
      />
    </View>
  );

  return (
    <View style={{ padding: 16 }}>
      {[...Array(rows)].map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            marginBottom: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ))}
    </View>
  );
};

