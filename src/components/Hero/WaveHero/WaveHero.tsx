import React from "react";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";

import {
  View,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";

// Internal Dependencies
import { reportWarning } from "@/libs/utils/errorReporting";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveHeroProps {
  height?: number;
  overlayColor?: string;
  children?: React.ReactNode;
  imageUrls: Array<string>;
  scrollY?: Animated.Value;
}

export const WaveHero = ({
  children,
  scrollY,
  overlayColor,
  height = 400,
  imageUrls = [],
}: WaveHeroProps) => {
  const { width } = Dimensions.get('window');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const pageNum = Math.round(contentOffset / width);
    setActiveIndex(pageNum);
  };

  const animatedStyle = scrollY ? {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: [15, 0, -15],
          extrapolate: 'clamp'
        })
      },
    ]
  } : {};

  // Animated wave path
  const normalWavePath = "M0,80 C360,150 720,10 1440,80 L1440,120 L0,120 Z";
  const invertedWavePath = "M0,80 C360,10 720,150 1440,80 L1440,120 L0,120 Z";

  const wavePath = scrollY ? scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [normalWavePath, invertedWavePath],
    extrapolate: 'clamp'
  }) : normalWavePath;

  return (
    <View style={[styles.heroBanner, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>

        {/* Render a cover or a ScrollView if there are multiple images */}
        {imageUrls.length > 1 ? (
          <ScrollView
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            {imageUrls.map((url, index) => (
              <View key={index} style={[{ width }]}>
                <Image
                  contentFit="cover"
                  source={{ uri: url }}
                  style={styles.heroImage}
                />
                {overlayColor && (<View style={[styles.overlay, { backgroundColor: overlayColor }]} />)}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={[{ width }]}>
            <Image
              contentFit="cover"
              source={{ uri: imageUrls[0] }}
              style={styles.heroImage}
              onError={(error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reportWarning(errorMessage, {
                  component: "WaveHero",
                  action: "Image Loading",
                  extra: { imageUrl: imageUrls[0] },
                });
              }}
            />
            {overlayColor && (<View style={[styles.overlay, { backgroundColor: overlayColor }]} />)}
          </View>
        )}

        {/* Wave design */}
        <View style={[styles.waveContainer, { zIndex: 1 }]}>
          <Svg
            height="100%"
            width="100%"
            style={styles.wave}
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <AnimatedPath
              fill="#fff"
              d={wavePath}
            />
          </Svg>
        </View>
      </Animated.View>

      {/* Hero content overlay */}
      {children}

      {/* Pagination dots */}
      {imageUrls.length > 1 && (
        <View style={styles.pagination}>
          {imageUrls.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  waveContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    position: "absolute",
    backgroundColor: "transparent",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    zIndex: 1,
  },
  pagination: {
    bottom: 70,
    width: '100%',
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
