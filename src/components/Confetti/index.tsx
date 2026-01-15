import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { View, StyleSheet, Dimensions } from 'react-native';

import Animated, {
  runOnJS,
  withDelay,
  withTiming,
  withSequence,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  color: string;
  startX: number;
  onComplete: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX, onComplete }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const randomDuration = 2000 + Math.random() * 500;

    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(SCREEN_WIDTH + 100, { duration: randomDuration }),
        withTiming(SCREEN_WIDTH + 100, { duration: 0 }, () => {
          runOnJS(onComplete)();
        })
      )
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + randomX, { duration: randomDuration })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 2), { duration: randomDuration })
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: randomDuration * 0.7 }),
        withTiming(0, { duration: randomDuration * 0.3 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.confettiPiece, animatedStyle]}>
      <Svg width={12} height={12}>
        <Circle cx={6} cy={6} r={6} fill={color} />
      </Svg>
    </Animated.View>
  );
};

interface ConfettiProps {
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  const [pieces, setPieces] = React.useState<Array<{ id: number; color: string; startX: number }>>([]);

  useEffect(() => {
    const colors = ['#9333EA', '#A855F7', '#C084FC', '#E9D5FF', '#F3E8FF'];
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      startX: Math.random() * SCREEN_WIDTH,
    }));
    setPieces(newPieces);
  }, []);

  const handlePieceComplete = () => {
    setPieces((prev) => {
      if (prev.length === 1 && onComplete) {
        setTimeout(onComplete, 500);
      }
      return prev.slice(1);
    });
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.id * 20}
          color={piece.color}
          startX={piece.startX}
          onComplete={handlePieceComplete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});

