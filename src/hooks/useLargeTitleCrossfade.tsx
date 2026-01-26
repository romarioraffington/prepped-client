// External Dependencies
import { StyleSheet } from "react-native";

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  HeaderTitle as HeaderTitleComponent,
  type HeaderTitleProps,
  useHeaderHeight,
} from "@react-navigation/elements";

import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedRef,
  useDerivedValue,
  useAnimatedStyle,
  type SharedValue,
  type DerivedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

// Internal Dependencies
import { truncate } from "@/libs/utils";

const HEADER_TITLE_MAX = 32;

type UseLargeTitleCrossfadeParams = {
  /** Current title text (main line) */
  currentTitle?: string;
  /** Previous/parent title text (second line, faded) */
  previousTitle?: string;
  /** External shared value for scroll position (optional - will create one if not provided) */
  offsetY?: SharedValue<number>;
  /** Custom style for the header title text */
  headerTitleStyle?: object;
};

type UseLargeTitleCrossfadeReturn = {
  /** Ref to attach to the LargeTitle component */
  titleRef: ReturnType<typeof useAnimatedRef<Animated.View>>;
  /** Callback to attach to onLayout of the LargeTitle */
  measureTitle: () => void;
  /** Scroll handler to attach to the scroll view */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /** Shared value for scroll position */
  offsetY: SharedValue<number>;
  /** Animated opacity for the large title (fades out when scrolled) */
  largeTitleOpacity: DerivedValue<number>;
  /** Animated opacity for the header title (fades in when scrolled) */
  headerTitleOpacity: DerivedValue<number>;
  /** Memoized header title component for use in setOptions */
  HeaderTitleRenderer: (props: HeaderTitleProps) => JSX.Element;
  /** Function to get header options for setOptions - call this in useLayoutEffect */
  getHeaderOptions: () => {
    headerTransparent: boolean;
    headerBlurEffect: "light";
    headerTitle: (props: HeaderTitleProps) => JSX.Element;
  };
};

/**
 * Hook that manages the crossfade animation between a large title in content
 * and the small header title. Uses native headerBlurEffect for the blur background,
 * eliminating race conditions from JavaScript-managed blur toggling.
 *
 * @example
 * ```tsx
 * const {
 *   titleRef,
 *   measureTitle,
 *   scrollHandler,
 *   offsetY,
 *   largeTitleOpacity,
 *   getHeaderOptions,
 * } = useLargeTitleCrossfade({
 *   currentTitle: data?.name,
 *   previousTitle: parentCollectionName,
 * });
 *
 * // In useLayoutEffect - single setOptions call, no cleanup needed:
 * useLayoutEffect(() => {
 *   navigation.setOptions({
 *     ...getHeaderOptions(),
 *     headerRight: MyHeaderRight,
 *   });
 * }, [navigation, getHeaderOptions]);
 *
 * // In JSX:
 * <LargeTitle
 *   ref={titleRef}
 *   onLayout={measureTitle}
 *   currentTitle={currentTitle}
 *   previousTitle={previousTitle}
 *   offsetY={offsetY}
 *   opacity={largeTitleOpacity}
 * />
 * ```
 */
export function useLargeTitleCrossfade({
  currentTitle = "",
  previousTitle,
  offsetY: externalOffsetY,
  headerTitleStyle,
}: UseLargeTitleCrossfadeParams): UseLargeTitleCrossfadeReturn {
  const titleRef = useAnimatedRef<Animated.View>();

  // Use external offsetY if provided, otherwise create internal one
  const internalOffsetY = useSharedValue(0);
  const offsetY = externalOffsetY ?? internalOffsetY;

  // Compute the header title text (truncated combination of titles)
  const headerTitleText = useMemo(
    () =>
      truncate(
        previousTitle ? `${currentTitle}, ${previousTitle}` : currentTitle,
        HEADER_TITLE_MAX,
      ),
    [currentTitle, previousTitle],
  );

  // Runtime header height for trigger calculations
  const headerHeight = useHeaderHeight();

  // Tracks the bottom (baseline) of the large title in screen coordinates
  const headerBaselineY = useSharedValue(0);

  // Tracks the height of the large title for dynamic fade timing
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

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: ({ contentOffset: { y } }) => {
      offsetY.value = y;
    },
  });

  // Derived value for header title opacity (fades in when scrolled)
  // Returns 0-1 range, typed as number for compatibility
  const headerTitleOpacity = useDerivedValue(() => {
    // Fallback: if no measurement yet, still show title when clearly scrolled past header
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

    // Calculate when header title should appear (when large title is scrolled past)
    // Use the baseline (bottom) of the title vs header height; no extra subtraction
    const scrollDistance = headerBaselineY.value - headerHeight;
    const shouldShow = offsetY.value > scrollDistance;

    // Smooth fade-in (320ms) or faster fade-out (200ms)
    return withTiming(shouldShow ? 1 : 0, { duration: shouldShow ? 320 : 200 });
  }) as DerivedValue<number>;

  // Derived value for large title opacity (fades out when scrolled)
  // Returns 0-1 range, typed as number for compatibility
  const largeTitleOpacity = useDerivedValue(() => {
    // Default to visible if measurements aren't ready, but hide once clearly past header height
    if (
      headerBaselineY.value <= 0 ||
      titleHeight.value <= 0 ||
      measurementsValid.value === 0
    ) {
      const shouldHideFallback = offsetY.value > headerHeight + 8;
      return withTiming(shouldHideFallback ? 0 : 1, {
        duration: shouldHideFallback ? 180 : 240,
      });
    }

    // Calculate when large title should disappear (when scrolled past)
    const scrollDistance = headerBaselineY.value - headerHeight;
    const shouldHide = offsetY.value > scrollDistance;

    // Faster fade-out (200ms) or smooth fade-in (320ms)
    return withTiming(shouldHide ? 0 : 1, { duration: shouldHide ? 200 : 320 });
  }) as DerivedValue<number>;

  // Animated style for header title opacity
  const rTitleOpacityStyle = useAnimatedStyle(() => ({
    opacity: headerTitleOpacity.value,
  }));

  // Measure the title's position to determine scroll trigger point
  // Called from LargeTitle's onLayout prop
  const measureTitle = useCallback(() => {
    const titleKey = `${currentTitle}-${previousTitle}`;

    if (!titleRef.current) return;

    // Track which title we're measuring to prevent stale measurements
    measuredTitleRef.current = titleKey;

    // Measure in window coordinates (includes scroll offset)
    titleRef.current.measureInWindow((x, y, width, height) => {
      // Guard against unmounted component or stale measurements
      if (!isMountedRef.current) return;
      if (measuredTitleRef.current !== titleKey) return;

      // Calculate baseline: bottom of title + current scroll offset (ignore negative pull-to-refresh)
      // This gives us the absolute position where the title ends
      const baseline = y + height + Math.max(0, offsetY.value);
      // Ignore invalid measurements (e.g., when view is clipped offscreen)
      if (baseline <= 0 || height <= 0) return;
      headerBaselineY.value = baseline;
      titleHeight.value = height;
      measurementsValid.value = 1;
    });
  }, [
    currentTitle,
    previousTitle,
    headerBaselineY,
    offsetY,
    titleHeight,
    measurementsValid,
  ]);

  // Re-measure when header height changes (can shift threshold on iOS during nav transitions)
  useEffect(() => {
    // Defer to next frame so layout reflects the new header height
    requestAnimationFrame(() => {
      measureTitle();
    });
  }, [headerHeight, measureTitle]);

  // Determine wrapper alignment based on headerTitleStyle
  const wrapperAlignment = useMemo((): {
    alignItems: "flex-start" | "center";
  } => {
    const textAlign = (headerTitleStyle as { textAlign?: string })?.textAlign;
    return textAlign === "left"
      ? { alignItems: "flex-start" as const }
      : { alignItems: "center" as const };
  }, [headerTitleStyle]);

  // Memoized header title renderer
  const HeaderTitleRenderer = useMemo(
    () =>
      function HeaderTitle(props: HeaderTitleProps) {
        return (
          <Animated.View
            style={[
              rTitleOpacityStyle,
              styles.headerTitleWrapper,
              wrapperAlignment,
            ]}
          >
            <HeaderTitleComponent
              {...props}
              style={headerTitleStyle ?? { textAlign: "center" }}
            >
              {headerTitleText}
            </HeaderTitleComponent>
          </Animated.View>
        );
      },
    [headerTitleText, rTitleOpacityStyle, headerTitleStyle, wrapperAlignment],
  );

  // Determine if we need left-aligned container style
  const headerTitleContainerStyle = useMemo(() => {
    const textAlign = (headerTitleStyle as { textAlign?: string })?.textAlign;
    if (textAlign === "left") {
      return { paddingLeft: 0, alignItems: "flex-start" };
    }
    return undefined;
  }, [headerTitleStyle]);

  // Function to get header options for setOptions
  const getHeaderOptions = useCallback(() => {
    return {
      headerTransparent: true as const,
      headerBlurEffect: "light" as const,
      headerTitle: HeaderTitleRenderer,
      ...(headerTitleContainerStyle && { headerTitleContainerStyle }),
    };
  }, [HeaderTitleRenderer, headerTitleContainerStyle]);

  return {
    titleRef,
    offsetY,
    largeTitleOpacity,
    headerTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
    HeaderTitleRenderer,
  };
}

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
