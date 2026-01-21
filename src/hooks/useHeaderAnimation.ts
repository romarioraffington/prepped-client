// External Imports
import {
  type ScrollEvent,
  type SharedValue,
  withTiming,
  Extrapolation,
  interpolate,
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

// Internal Imports
import type { ScrollDirectionValue } from "./useScrollDirection";

const ON_END_DRAG_ANIM_DURATION = 100;

type Params = {
  headerHeight: number;
  scrollDirection: ScrollDirectionValue;
  handleTabScroll: (e: ScrollEvent) => void;
  // When true, header state changes are paused
  // (e.g., during horizontal tab swiping)
  isHorizontalScrolling?: SharedValue<boolean>;
};

export const useHeaderAnimation = ({
  headerHeight,
  scrollDirection,
  handleTabScroll,
  isHorizontalScrolling,
}: Params) => {
  const listOffsetY = useSharedValue(0);
  const listOffsetYRefPoint = useSharedValue(0);
  const isListDragging = useSharedValue(false);

  // Track if user has actively scrolled vertically in
  // current tab (prevents header reset on tab switch)
  const hasActiveVerticalScroll = useSharedValue(false);

  // Track if we're at the end of the list (for bounce detection)
  const isAtEndOfList = useSharedValue(false);
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);

  const headerOpacity = useSharedValue(1);
  const headerOpacityRefPoint = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);
  const headerTranslateYRefPoint = useSharedValue(0);

  // Small threshold to detect when we're at the top (for pull-to-refresh protection)
  const TOP_THRESHOLD = 5;

  // Derived values for header animation - computed on UI thread without mutations
  const derivedOpacity = useDerivedValue(() => {
    // Always show header when at the top (prevents pull-to-refresh from affecting it)
    if (listOffsetY.value <= TOP_THRESHOLD) {
      return 1;
    }

    let nextOpacity = headerOpacity.value;

    if (
      listOffsetY.value > 0 &&
      scrollDirection.value === "to-bottom" &&
      isListDragging.value === true &&
      !isHorizontalScrolling?.value
    ) {
      nextOpacity = interpolate(
        listOffsetY.value,
        [
          listOffsetYRefPoint.value,
          listOffsetYRefPoint.value + headerHeight / 2,
        ],
        [headerOpacityRefPoint.value, 0],
        Extrapolation.CLAMP,
      );
    }

    if (
      listOffsetY.value > 0 &&
      scrollDirection.value === "to-top" &&
      isListDragging.value === true &&
      !isHorizontalScrolling?.value &&
      !isAtEndOfList.value
    ) {
      nextOpacity = interpolate(
        listOffsetY.value,
        [
          listOffsetYRefPoint.value,
          listOffsetYRefPoint.value - 2 * headerHeight,
        ],
        [headerOpacityRefPoint.value, 1],
        Extrapolation.CLAMP,
      );
    }

    return nextOpacity;
  });

  const derivedTranslateY = useDerivedValue(() => {
    // Always show header at top position when at the top (prevents pull-to-refresh from affecting it)
    if (listOffsetY.value <= TOP_THRESHOLD) {
      return 0;
    }

    let nextTranslateY = headerTranslateY.value;

    if (
      listOffsetY.value > 0 &&
      scrollDirection.value === "to-bottom" &&
      isListDragging.value === true &&
      !isHorizontalScrolling?.value
    ) {
      nextTranslateY = interpolate(
        listOffsetY.value,
        [listOffsetYRefPoint.value, listOffsetYRefPoint.value + headerHeight],
        [headerTranslateYRefPoint.value, -headerHeight],
        Extrapolation.CLAMP,
      );
    }

    if (
      listOffsetY.value > 0 &&
      scrollDirection.value === "to-top" &&
      isListDragging.value === true &&
      !isHorizontalScrolling?.value &&
      !isAtEndOfList.value
    ) {
      nextTranslateY = interpolate(
        listOffsetY.value,
        [
          listOffsetYRefPoint.value,
          listOffsetYRefPoint.value - 2 * headerHeight,
        ],
        [headerTranslateYRefPoint.value, 0],
        Extrapolation.CLAMP,
      );
    }

    return nextTranslateY;
  });

  // Reset header state when switching tabs - fade in header/blur
  const resetHeaderForTabSwitch = () => {
    "worklet";
    listOffsetY.value = 0;
    listOffsetYRefPoint.value = 0;
    // Set position immediately, only fade opacity
    headerTranslateY.value = 0;
    headerOpacity.value = withTiming(1, { duration: 200 });
    headerOpacityRefPoint.value = 1;
    headerTranslateYRefPoint.value = 0;
    hasActiveVerticalScroll.value = false;
  };

  useAnimatedReaction(
    () => scrollDirection.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        listOffsetYRefPoint.value = listOffsetY.value;
        headerOpacityRefPoint.value = derivedOpacity.value;
        headerTranslateYRefPoint.value = derivedTranslateY.value;
      }
    },
  );

  // Settle header to final state when drag/momentum ends
  const settleHeaderState = () => {
    "worklet";
    // Skip if horizontal scrolling or no active vertical scroll
    if (isHorizontalScrolling?.value || !hasActiveVerticalScroll.value) {
      isListDragging.value = false;
      return;
    }

    // Capture current derived values BEFORE setting isListDragging to false
    // This locks in the current visual state
    const currentOpacity = derivedOpacity.value;
    const currentTranslateY = derivedTranslateY.value;

    isListDragging.value = false;

    // Lock in the current state to prevent jumping
    headerOpacity.value = currentOpacity;
    headerTranslateY.value = currentTranslateY;
    headerOpacityRefPoint.value = currentOpacity;
    headerTranslateYRefPoint.value = currentTranslateY;

    // Only show header if we're at the very top of the list (with small threshold)
    const shouldShowHeader = listOffsetY.value <= TOP_THRESHOLD;

    if (shouldShowHeader && currentOpacity < 1) {
      headerOpacity.value = withTiming(1, {
        duration: ON_END_DRAG_ANIM_DURATION * 2,
      });
      headerTranslateY.value = withTiming(0, {
        duration: ON_END_DRAG_ANIM_DURATION * 2,
      });
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onMomentumBegin: () => {
      if (isHorizontalScrolling?.value) return;
      hasActiveVerticalScroll.value = true;
      isListDragging.value = true;
    },
    onMomentumEnd: settleHeaderState,
    onBeginDrag: (e) => {
      if (isHorizontalScrolling?.value) return;
      hasActiveVerticalScroll.value = true;
      isListDragging.value = true;
      listOffsetYRefPoint.value = e.contentOffset.y;
      headerOpacityRefPoint.value = derivedOpacity.value;
      headerTranslateYRefPoint.value = derivedTranslateY.value;
    },
    onScroll: (e) => {
      if (isHorizontalScrolling?.value) return;

      // Clamp scroll offset to >= 0 to prevent pull-to-refresh from affecting header animation
      // Negative offsets occur when pull-to-refresh header expands, which shouldn't trigger header hide/show
      const clampedOffsetY = Math.max(0, e.contentOffset.y);
      listOffsetY.value = clampedOffsetY;
      handleTabScroll(e);

      // Track content dimensions to detect end-of-list bounce
      contentHeight.value = e.contentSize.height;
      layoutHeight.value = e.layoutMeasurement.height;
      const maxScrollY = contentHeight.value - layoutHeight.value;
      isAtEndOfList.value = listOffsetY.value >= maxScrollY - 10;
    },
    onEndDrag: settleHeaderState,
  });

  const rHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: derivedOpacity.value,
      transform: [
        {
          translateY: derivedTranslateY.value,
        },
      ],
    };
  });

  const rBlurStyle = useAnimatedStyle(() => {
    // Always hide if header height is not set
    if (headerHeight === 0) {
      return { opacity: 0 };
    }

    // Blur opacity should follow header opacity directly
    // This avoids flickering during deceleration when scroll direction briefly changes
    // The blur fades in/out with the header itself, creating a smooth transition
    return { opacity: derivedOpacity.value };
  });

  return {
    rHeaderStyle,
    rBlurStyle,
    scrollHandler,
    resetHeaderForTabSwitch,
  };
};
