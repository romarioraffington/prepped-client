// External Dependencies
import type React from "react";
import { StyleSheet, type View } from "react-native";

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  HeaderTitle as HeaderTitleComponent,
  type HeaderTitleProps,
  useHeaderHeight,
} from "@react-navigation/elements";

import Animated, {
  withTiming,
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

// Internal Dependencies
import { truncate } from "@/libs/utils";

type UseTitleCrossfadeParams = {
  /** Shared value tracking scroll position */
  offsetY: SharedValue<number>;
  /** The title text to display in the header when scrolled */
  title?: string;
  /** Optional style for the header title text */
  headerTitleStyle?: object;
};

type UseTitleCrossfadeReturn = {
  /** Ref to attach to the title element */
  titleRef: React.RefObject<View | null>;
  /** Callback to attach to onLayout of the title element */
  handleLayout: () => void;
  /** Function to get header options for setOptions - call this in useLayoutEffect */
  getHeaderOptions: () => {
    headerTitle: (props: HeaderTitleProps) => JSX.Element;
  };
  /** Shared value indicating if scrolled past title - use with useAnimatedReaction for conditional blur */
  isScrolledPastTitle: SharedValue<boolean>;
};

const HEADER_TITLE_MAX = 32;

/**
 * Hook that dynamically measures title position and triggers header crossfade
 * at the correct scroll offset. Uses native headerBlurEffect for the blur background.
 * Used for pages with custom title styling where the LargeTitle component isn't suitable.
 *
 * Unlike useLargeTitleCrossfade, this hook:
 * - Does NOT provide opacity values for the content title (screen manages that)
 * - Only manages the header title crossfade
 * - Returns getHeaderOptions for consolidated setOptions calls
 *
 * @example
 * ```tsx
 * const { titleRef, handleLayout, getHeaderOptions } = useTitleCrossfade({
 *   offsetY,
 *   title: recommendation?.name,
 * });
 *
 * // Single setOptions call - no cleanup needed:
 * useLayoutEffect(() => {
 *   navigation.setOptions(getHeaderOptions());
 * }, [navigation, getHeaderOptions]);
 *
 * // In JSX - attach ref and onLayout to your custom title element:
 * <View ref={titleRef} onLayout={handleLayout}>
 *   <Text style={styles.title}>{recommendation.name}</Text>
 * </View>
 * ```
 */
export const useTitleCrossfade = ({
  offsetY,
  title,
  headerTitleStyle,
}: UseTitleCrossfadeParams): UseTitleCrossfadeReturn => {
  const truncatedTitle = useMemo(
    () => truncate(title, HEADER_TITLE_MAX),
    [title],
  );

  const titleRef = useRef<View>(null);

  // Runtime header height for trigger calculations
  const headerHeight = useHeaderHeight();

  // Tracks the bottom (baseline) of the title in screen coordinates
  const headerBaselineY = useSharedValue(0);

  // Tracks the height of the title for dynamic fade timing
  const titleHeight = useSharedValue(0);

  // Track the title for which measurements were taken
  const measuredTitleRef = useRef<string | null>(null);

  // Shared value to track if measurements are valid (worklet-safe)
  const measurementsValid = useSharedValue(0);

  // Track mounted state
  const isMountedRef = useRef(true);

  // Cleanup mounted ref on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived value for header title opacity
  const headerTitleOpacity = useDerivedValue(() => {
    if (
      measurementsValid.value === 0 ||
      headerBaselineY.value <= 0 ||
      titleHeight.value <= 0
    ) {
      const shouldShowFallback = offsetY.value > headerHeight + 8;
      return withTiming(shouldShowFallback ? 1 : 0, {
        duration: shouldShowFallback ? 220 : 160,
      });
    }

    // Trigger when the bottom of the title crosses the header height
    const scrollDistance = headerBaselineY.value - headerHeight;
    const shouldShow = offsetY.value > scrollDistance;

    return withTiming(shouldShow ? 1 : 0, { duration: shouldShow ? 320 : 200 });
  });

  // Derived value for whether scrolled past title (for blur toggle)
  const isScrolledPastTitle = useDerivedValue(() => {
    if (
      headerBaselineY.value <= 0 ||
      titleHeight.value <= 0 ||
      measurementsValid.value === 0
    ) {
      return offsetY.value > headerHeight + 8;
    }
    const scrollDistance = headerBaselineY.value - headerHeight;
    return offsetY.value > scrollDistance;
  });

  // Animated style for header title
  const rTitleOpacityStyle = useAnimatedStyle(() => ({
    opacity: headerTitleOpacity.value,
  }));

  // Memoized header title renderer
  const HeaderTitleRenderer = useMemo(
    () =>
      function HeaderTitle(props: HeaderTitleProps) {
        return (
          <Animated.View
            style={[rTitleOpacityStyle, styles.headerTitleWrapper]}
          >
            <HeaderTitleComponent {...props} style={headerTitleStyle}>
              {truncatedTitle}
            </HeaderTitleComponent>
          </Animated.View>
        );
      },
    [truncatedTitle, rTitleOpacityStyle, headerTitleStyle],
  );

  const getHeaderOptions = useCallback(
    () => ({
      headerTitle: HeaderTitleRenderer,
    }),
    [HeaderTitleRenderer],
  );

  // Measure the title's position
  const handleLayout = useCallback(() => {
    const titleKey = title ?? "";

    if (!titleRef.current) return;

    measuredTitleRef.current = titleKey;

    titleRef.current.measureInWindow((x, y, width, height) => {
      if (!isMountedRef.current) return;
      if (measuredTitleRef.current !== titleKey) return;

      // Ignore negative pull-to-refresh offsets when computing baseline
      const baseline = y + height + Math.max(0, offsetY.value);
      if (baseline <= 0 || height <= 0) return;
      headerBaselineY.value = baseline;
      titleHeight.value = height;
      measurementsValid.value = 1;
    });
  }, [title, headerBaselineY, offsetY, titleHeight, measurementsValid]);

  return {
    titleRef,
    handleLayout,
    getHeaderOptions,
    isScrolledPastTitle,
  };
};

const styles = StyleSheet.create({
  headerTitleWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
