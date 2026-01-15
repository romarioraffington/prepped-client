// External Dependencies
import { useCallback, useEffect, useRef } from "react";
import type { RouteProp } from "@react-navigation/native";
import { Animated, DeviceEventEmitter, Easing } from "react-native";

// Internal Dependencies
import { getBottomNavigationVisibility } from "@/libs/utils";

export const BOTTOM_NAV_SCROLL_EVENT = "bottomNav:scrollHidden";

interface BottomNavigationAnimationProps {
  route: RouteProp<any, any>;
}
interface BottomNavigationAnimationReturn {
  shouldHide: boolean;
  tabBarAnimation: Animated.Value;
  scaleAnimation: Animated.Value;
}

export const useBottomNavigationAnimation = ({
  route,
}: BottomNavigationAnimationProps): BottomNavigationAnimationReturn => {
  const shouldHide = getBottomNavigationVisibility(route);
  const tabBarAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const isScrollHiddenRef = useRef(false);
  const shouldHideRef = useRef(shouldHide);

  const runAnimation = useCallback(
    (isHidden: boolean) => {
      Animated.parallel([
        Animated.spring(tabBarAnimation, {
          toValue: isHidden ? 0 : 1,
          useNativeDriver: true,
          damping: 30,
          stiffness: 100,
        }),
        Animated.timing(scaleAnimation, {
          toValue: isHidden ? 0.98 : 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scaleAnimation, tabBarAnimation],
  );

  useEffect(() => {
    shouldHideRef.current = shouldHide;
    runAnimation(shouldHide || isScrollHiddenRef.current);
  }, [runAnimation, shouldHide]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      BOTTOM_NAV_SCROLL_EVENT,
      (isHidden: boolean) => {
        isScrollHiddenRef.current = isHidden;
        runAnimation(isHidden || shouldHideRef.current);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [runAnimation]);

  return {
    shouldHide,
    tabBarAnimation,
    scaleAnimation,
  };
};
