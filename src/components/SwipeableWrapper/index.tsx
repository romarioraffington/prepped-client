// External Dependencies
import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { type ReactNode, useCallback } from "react";
import { scheduleOnRN } from "react-native-worklets";
import { Feather, Octicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Internal Dependencies
import { Colors } from "@/libs/constants";

import Animated, {
  withSpring,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// Swipe configuration
const SWIPE_THRESHOLD = 75;
const HAPTIC_THRESHOLD = SWIPE_THRESHOLD * 0.5;

interface SwipeableWrapperProps {
  children: ReactNode;
  /** Callback when user swipes left (delete action) */
  onSwipeLeft?: () => void;
  /** Callback when user swipes right (add to wishlist action) */
  onSwipeRight?: () => void;
  /** Whether the component is in a pending state (disables gestures) */
  isPending?: boolean;
  /** Whether swipe gestures are enabled */
  enabled?: boolean;
}

export const SwipeableWrapper = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  isPending = false,
}: SwipeableWrapperProps) => {
  // Shared values for gesture tracking
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);
  const swipeDirection = useSharedValue<"left" | "right" | null>(null);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Execute swipe left action (delete)
  const executeSwipeLeft = useCallback(() => {
    onSwipeLeft?.();
  }, [onSwipeLeft]);

  // Execute swipe right action (add to wishlist)
  const executeSwipeRight = useCallback(() => {
    onSwipeRight?.();
  }, [onSwipeRight]);

  // Pan gesture for swipe detection
  const panGesture = Gesture.Pan()
    .enabled(enabled && !isPending)
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      "worklet";
      hasTriggeredHaptic.value = false;
      swipeDirection.value = null;
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;

      // Determine swipe direction
      if (event.translationX > 0) {
        swipeDirection.value = "right";
      } else if (event.translationX < 0) {
        swipeDirection.value = "left";
      }

      // Trigger haptic at threshold
      const absTranslation = Math.abs(event.translationX);
      if (absTranslation >= HAPTIC_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        scheduleOnRN(triggerHaptic);
      }
    })
    .onEnd((event) => {
      "worklet";
      const absTranslation = Math.abs(event.translationX);

      if (absTranslation >= SWIPE_THRESHOLD) {
        if (event.translationX > 0) {
          // Swipe right - Add to wishlist
          translateX.value = withTiming(0, { duration: 200 });
          if (onSwipeRight) {
            scheduleOnRN(executeSwipeRight);
          }
        } else {
          // Swipe left - Delete
          translateX.value = withTiming(0, { duration: 200 });
          if (onSwipeLeft) {
            scheduleOnRN(executeSwipeLeft);
          }
        }
      } else {
        // Reset position
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }

      hasTriggeredHaptic.value = false;
      swipeDirection.value = null;
    });

  // Pan gesture handles all swipe interactions
  const composedGesture = panGesture;

  // Animated styles for the content
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Animated styles for right action (delete - revealed on swipe left)
  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -HAPTIC_THRESHOLD, 0],
      [1, 0.5, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -HAPTIC_THRESHOLD, 0],
      [1, 0.8, 0.5],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Animated styles for left action (add to wishlist - revealed on swipe right)
  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, HAPTIC_THRESHOLD, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      translateX.value,
      [0, HAPTIC_THRESHOLD, SWIPE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Background color animation for right action (delete - red)
  // Revealed continuously as user swipes left (negative translateX)
  const rightBackgroundStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
    };
  });

  // Background color animation for left action (add to wishlist - purple)
  // Revealed continuously as user swipes right (positive translateX)
  const leftBackgroundStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
    };
  });

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Left action background (Add to wishlist - Purple) */}
      <Animated.View style={[styles.actionBackground, styles.leftBackground, leftBackgroundStyle]}>
        <Animated.View style={[styles.actionButton, leftActionStyle]}>
          <Feather name="heart" size={26} color={Colors.primaryPurple} />
        </Animated.View>
      </Animated.View>

      {/* Right action background (Delete - Red) */}
      <Animated.View style={[styles.actionBackground, styles.rightBackground, rightBackgroundStyle]}>
        <Animated.View style={[styles.actionButton, rightActionStyle]}>
          <Octicons name="trash" size={25} color={Colors.destructive} />
        </Animated.View>
      </Animated.View>

      {/* Swipeable content */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  content: {
    backgroundColor: "#fff",
  },
  actionBackground: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: "absolute",
    justifyContent: "center",
  },
  leftBackground: {
    alignItems: "flex-start",
    paddingLeft: 20,
  },
  rightBackground: {
    alignItems: "flex-end",
    paddingRight: 20,
  },
  actionButton: {
    top: -40,
    alignItems: "center",
    justifyContent: "center",
  },
});

