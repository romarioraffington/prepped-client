import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Local background images
const imageOne = require('~/assets/images/welcome/key-insights.webp');
const imageTwo = require('~/assets/images/welcome/auto-tagging.webp');

interface BackgroundCyclerProps {
  imageBackgroundUris?: any[];
  children: React.ReactNode;
  cycleInterval?: number;
  transitionDuration?: number;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

// Default background images
const defaultImageBackgroundUris = [
  imageOne,
  imageTwo,
];

export function BackgroundCycler({
  children,
  cycleInterval = 4000,
  imageBackgroundUris = defaultImageBackgroundUris,
}: BackgroundCyclerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Cycle through images
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % imageBackgroundUris.length);
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [imageBackgroundUris.length, cycleInterval]);

  const currentImage = imageBackgroundUris[activeIndex];

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <AnimatedImage
          key={activeIndex}
          source={currentImage}
          blurRadius={100}
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(38, 38, 38, 0.5)', // equivalent to bg-neutral-800/50
  },
  content: {
    flex: 1,
  },
});
