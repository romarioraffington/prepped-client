import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Hook to track app state changes and provide current app state
 * @description This hook monitors when the app goes to background/foreground
 * and provides utilities to handle app state transitions
 */
export const useAppState = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      appState.current = nextAppState;

      // Return both states for components that need to react to transitions
      return { previousAppState, currentAppState: nextAppState };
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, []);

  return appState.current;
};

/**
 * Hook to handle app state transitions with callbacks
 * @description Provides callbacks for when app enters background or foreground
 * @param onForeground - Callback when app comes to foreground
 * @param onBackground - Callback when app goes to background
 */
export const useAppStateTransition = (
  onForeground?: () => void,
  onBackground?: () => void,
) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      appState.current = nextAppState;

      // Call appropriate callback based on transition
      if (previousAppState === "background" && nextAppState === "active") {
        onForeground?.();
      } else if (
        previousAppState === "active" &&
        nextAppState === "background"
      ) {
        onBackground?.();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [onForeground, onBackground]);

  return appState.current;
};
