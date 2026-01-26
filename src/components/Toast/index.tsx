import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface ToastProps {
  visible: boolean;
  message: string | React.ReactNode;
  duration?: number;
  onHide: () => void;
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 2500,
  onHide,
  icon,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <View style={styles.toastBox}>
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {typeof message === "string" ? (
            <Text style={styles.toastText}>{message}</Text>
          ) : (
            <View style={styles.messageContainer}>{message}</View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 48,
    alignItems: "center",
    zIndex: 9999,
  },
  toastBox: {
    backgroundColor: "#222",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  messageContainer: {
    flex: 1,
  },
  toastText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
  },
});
