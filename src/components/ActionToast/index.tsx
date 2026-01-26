// External Dependencies
import * as Haptics from "expo-haptics";

// External Dependencies
import { Image } from "expo-image";
import { useActionToast } from "@/contexts";
import { ImagePlaceholder } from "@/components/Image";
import { type FC, useEffect, useRef, useState } from "react";

import {
  Text,
  View,
  Easing,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Duration of the toast in milliseconds
const DURATION = 3000;

// Slide distance for exit animation (in pixels)
const SLIDE_DISTANCE = 50;

export const ActionToast: FC = () => {
  const isExitingRef = useRef(false);
  const [imageError, setImageError] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast, hideToast, dismissToast, registerToastRef, onExitComplete } =
    useActionToast();

  // Determine if we should show the CTA button
  const shouldShowCTA = !!toast.cta?.text;

  // Reset image error state when thumbnailUri changes
  useEffect(() => {
    setImageError(false);
  }, [toast.thumbnailUri]);

  /**
   * Trigger exit animation immediately
   * Called when toast is replaced by a queued one
   */
  const forceExit = useRef(() => {
    if (isExitingRef.current) return;

    isExitingRef.current = true;

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Animate exit: fade out and slide down
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SLIDE_DISTANCE,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isExitingRef.current = false;
      onExitComplete();
    });
  }).current;

  // Register ref with context
  useEffect(() => {
    registerToastRef({ forceExit });
    return () => {
      registerToastRef(null);
    };
  }, [registerToastRef, forceExit]);

  useEffect(() => {
    if (toast.isVisible) {
      // Reset animation values for new toast
      opacity.setValue(0);
      translateY.setValue(SLIDE_DISTANCE); // Start from below
      isExitingRef.current = false;

      // Animate entry: fade in and slide up with smooth easing
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Set up auto-hide timer
      timerRef.current = setTimeout(() => {
        if (isExitingRef.current) return;

        isExitingRef.current = true;

        // Animate exit: fade out and slide down
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: SLIDE_DISTANCE,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isExitingRef.current = false;
          hideToast();
        });
      }, DURATION);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [
    opacity,
    toast.text,
    toast.icon,
    toast.cta,
    hideToast,
    translateY,
    toast.isVisible,
    toast.thumbnailUri,
  ]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCTAButtonPress = () => {
    if (isExitingRef.current) return;

    // Light haptic feedback for CTA button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Call the CTA onPress handler directly
    if (toast.cta?.onPress) {
      toast.cta.onPress();
    }

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    isExitingRef.current = true;

    // Hide toast immediately with exit animation (without calling onDismiss since user pressed CTA)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SLIDE_DISTANCE,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isExitingRef.current = false;
      dismissToast();
    });
  };

  if (!toast.isVisible) return null;

  // Render text - handle both string and ReactNode
  const renderText = () => {
    return (
      <Text numberOfLines={1} style={styles.toastText}>
        {toast.text}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toastBox}>
        <View style={styles.contentRow}>
          <View style={styles.thumbnailContainer}>
            {toast.icon ? (
              <View style={styles.defaultIconContainer}>{toast.icon}</View>
            ) : toast.thumbnailUri && !imageError ? (
              <Image
                contentFit="cover"
                style={styles.thumbnail}
                source={{ uri: toast.thumbnailUri }}
                onError={handleImageError}
              />
            ) : (
              <View style={styles.defaultIconContainer}>
                <ImagePlaceholder
                  height={45}
                  iconSize={24}
                  style={{ backgroundColor: "#f0f0f0" }}
                />
              </View>
            )}
          </View>
          <View style={styles.textWrapper}>{renderText()}</View>
          {shouldShowCTA && (
            <TouchableOpacity
              style={styles.ctaButton}
              accessibilityRole="button"
              onPress={handleCTAButtonPress}
              accessibilityLabel={toast.cta?.text}
            >
              <Text style={styles.ctaButtonText}>{toast.cta?.text}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    left: 0,
    right: 0,
    bottom: 50,
    zIndex: 9999,
    alignItems: "center",
    position: "absolute",
  },
  toastBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
    maxWidth: "90%",
    alignSelf: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailContainer: {
    width: 45,
    height: 45,
    flexShrink: 0,
    marginRight: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  defaultIconContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrapper: {
    flexShrink: 1,
    minWidth: 0,
  },
  toastText: {
    color: "#000",
    fontSize: 15,
    flexShrink: 1,
    marginRight: 8,
    fontWeight: "400",
  },
  ctaButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ctaButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

ActionToast.displayName = "ActionToast";
