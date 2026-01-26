// External Dependencies
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { Colors } from "@/libs/constants";
// Internal Dependencies
import type { Recipe } from "@/libs/types";
import { RecipeCarouselCard } from "./RecipeCarouselCard";
import { RECIPE_CAROUSEL_CARD_WIDTH } from "./consts";

const CARD_GAP = 20;

// Get initial screen width for initial state
const SCREEN_WIDTH = Dimensions.get("window").width;

export interface RecipeCarouselProps {
  recipes: Recipe[];
}

export const RecipeCarousel = memo(({ recipes }: RecipeCarouselProps) => {
  const scrollPositionRef = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(SCREEN_WIDTH);

  // Calculate total pages based on content width and viewport width
  // When pagingEnabled is true, React Native pages by viewport width
  const totalPages = useMemo(() => {
    if (recipes.length <= 1) return 1;

    // Calculate total content width: all cards + gaps between them
    const contentWidth =
      recipes.length * RECIPE_CAROUSEL_CARD_WIDTH +
      (recipes.length - 1) * CARD_GAP;

    // Number of pages = how many viewport-widths fit in the content
    // We need at least 1 page, and we round up for partial last pages
    if (viewportWidth <= 0) return 1;

    return Math.ceil(contentWidth / viewportWidth);
  }, [recipes.length, viewportWidth]);

  // Capture viewport width when ScrollView lays out
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0 && width !== viewportWidth) {
        setViewportWidth(width);
      }
    },
    [viewportWidth],
  );

  // Handle scroll to track current page and preserve position
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      scrollPositionRef.current = contentOffset.x;
      const pageWidth = layoutMeasurement.width;
      const page = Math.round(contentOffset.x / pageWidth);
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages],
  );

  // Handle scroll end to track current page after snapping
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      scrollPositionRef.current = contentOffset.x;
      const pageWidth = layoutMeasurement.width;
      const page = Math.round(contentOffset.x / pageWidth);
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages],
  );

  // Restore scroll position when component remounts (not when recipes change)
  // This prevents the carousel from jumping when parent re-renders
  useEffect(() => {
    if (scrollViewRef.current && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame for smoother restoration
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          x: scrollPositionRef.current,
          animated: false,
        });
      });
    }
    // Only restore on mount, not when recipes change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't show carousel at all if no recipes
  if (recipes.length === 0) {
    return null;
  }

  // Show single card without dots if only 1 recipe
  const showDots = recipes.length > 1 && totalPages > 1;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        ref={scrollViewRef}
        onLayout={handleLayout}
        onScroll={handleScroll}
        pagingEnabled={showDots}
        scrollEventThrottle={16}
        style={styles.scrollView}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.scrollContent}
      >
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.cardWrapper}>
            <RecipeCarouselCard recipe={recipe} />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {showDots && (
        <PaginationDots totalPages={totalPages} currentPage={currentPage} />
      )}
    </View>
  );
});

RecipeCarousel.displayName = "RecipeCarousel";

// Memoized pagination dots component
const PaginationDots = memo(
  ({
    totalPages,
    currentPage,
  }: { totalPages: number; currentPage: number }) => {
    const dots = useMemo(
      () =>
        Array.from({ length: totalPages }, (_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              index === currentPage ? styles.dotActive : styles.dotInactive,
            ]}
          />
        )),
      [totalPages, currentPage],
    );

    return <View style={styles.dotsContainer}>{dots}</View>;
  },
);

PaginationDots.displayName = "PaginationDots";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: CARD_GAP,
  },
  cardWrapper: {
    flexShrink: 0,
    width: RECIPE_CAROUSEL_CARD_WIDTH,
  },
  dotsContainer: {
    gap: 6,
    marginTop: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    backgroundColor: "#D9D9D9",
  },
});
