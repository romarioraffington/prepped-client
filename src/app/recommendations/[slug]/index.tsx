// External Dependencies
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import Animated from "react-native-reanimated";
import { Portal } from "react-native-portalize";
import type BottomSheet from "@gorhom/bottom-sheet";
import { scheduleOnRN } from "react-native-worklets";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useRef, useState, useLayoutEffect, useCallback, useEffect } from "react";

import {
  View,
  Text,
  Dimensions,
  StyleSheet,
} from "react-native";

import {
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";

// Internal Dependencies
import {
  Hero,
  MapSection,
  ReviewList,
  OfferingList,
  BlurBackButton,
  HoursBottomSheet,
  ParallaxScrollView,
  QuickActionButtons,
  HeaderMetadataSection,
  ReviewsMetadataSection,
  WishlistButtonWithCount,
  RecommendationOptionsButton,
} from "@/components";

import { useTitleCrossfade } from "@/hooks";
import { useRecommendationDetails } from "@/api";
import { hasValidHours, truncate } from "@/libs/utils";
import { isLiquidGlassAvailable } from "expo-glass-effect";

// Constants
const HEADER_HEIGHT = 400;

export default function RecommendationDetail() {
  const navigation = useNavigation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isLoading, data: recommendation } = useRecommendationDetails(slug);

  // Check if the recommendation is saved from API response
  const wishlistIds = recommendation?.wishlistIds ?? [];
  const isSaved = wishlistIds.length > 0;

  // Shared value for scroll position
  // - used for header title cross-fade animation
  const offsetY = useSharedValue(0);

  // State to track if scrolled past title (for blur)
  const [isScrolled, setIsScrolled] = useState(false);

  // Dynamic title crossfade -
  // measures title position and triggers header title fade
  const {
    titleRef,
    handleLayout,
    getHeaderOptions,
    isScrolledPastTitle,
  } = useTitleCrossfade({
    offsetY,
    headerTitleStyle: { color: "#000" },
    title: truncate(recommendation?.name, 25),
  });

  /**
   * React to scroll position changes to update blur state
   */
  useAnimatedReaction(
    () => isScrolledPastTitle.value,
    (scrolled) => {
      scheduleOnRN(setIsScrolled, scrolled);
    },
    [isScrolledPastTitle],
  );

  /**
 * Single setOptions call using hook-provided options;
 * keep blur tied to scroll state
 */
  useLayoutEffect(() => {
    if (!recommendation?.name) {
      navigation.setOptions({
        headerBackground: undefined,
      });
      return;
    }

    const headerOptions: any = {
      ...getHeaderOptions(),
      headerLeft: () => <BlurBackButton isScrolled={isScrolled} />,
      headerBackground: isScrolled ? () => <BlurView tint="light" intensity={60} style={{ flex: 1 }} /> : undefined,
    };

    if (!isLiquidGlassAvailable()) {
      headerOptions.headerRight = () => {
        return (
          <View style={[styles.headerRightContainer, { right: -10 }]}>
            <WishlistButtonWithCount
              showBlur={true}
              isScrolled={isScrolled}
              recommendationSlug={slug}
              wishlistIds={wishlistIds}
              thumbnailUri={recommendation?.images?.[0]}
            />
            <View style={{ marginRight: 8 }} />
            <RecommendationOptionsButton
              showBlur={true}
              isScrolled={isScrolled}
              recommendationSlug={slug}
            />
          </View>
        );
      };
    } else {
      // Liquid glass available: render plain buttons without blur containers
      headerOptions.headerRight = () => (
        <View style={[styles.headerRightContainer, { paddingHorizontal: 10 }]}>
          <View style={{ marginRight: 10 }}>
            <WishlistButtonWithCount
              recommendationSlug={slug}
              isScrolled={isScrolled}
              wishlistIds={wishlistIds}
              thumbnailUri={recommendation?.images?.[0]}
            />
          </View>
          <RecommendationOptionsButton
            isScrolled={isScrolled}
            recommendationSlug={slug}
          />
        </View>
      );
    }

    navigation.setOptions(headerOptions);
  }, [
    isSaved,
    slug,
    isScrolled,
    navigation,
    getHeaderOptions,
    recommendation?.name,
    recommendation?.images,
  ]);

  // Handle show all offerings button press
  const handleShowAllOfferings = useCallback(() => {
    router.push({
      pathname: "/recommendations/[slug]/amenities",
      params: {
        slug,
      },
    });
  }, [slug, router]);

  // Handle image press
  const handleImagePress = useCallback(() => {
    router.push({
      pathname: "/recommendations/[slug]/photos",
      params: {
        slug,
      },
    });
  }, [slug, router]);

  // Accessibility and reviews
  const isAccessible = recommendation?.isAccessible;
  const isReviewsAvailable = recommendation?.reviews && recommendation?.reviews?.count > 0;

  // Hours
  const isOpen24Hours = recommendation?.hours?.is24Hours;
  const isHoursAvailable = recommendation?.hours && hasValidHours(recommendation.hours);
  const isHoursBottomSheetAvailable = isHoursAvailable && !isOpen24Hours && recommendation?.hours?.dailyHours;

  // Hours BottomSheet
  const hoursBottomSheetRef = useRef<BottomSheet>(null);
  const handleOpenHoursSheet = () => {
    hoursBottomSheetRef.current?.snapToIndex(1);
  };

  if (isLoading) {
    return <RecommendationDetailSkeleton />;
  }

  if (!recommendation) {
    // TODO: Redirect to 404 page
    return null;
  }

  return (
    <View style={styles.screenContainer}>
      <ParallaxScrollView
        headerImage={
          <Hero height={HEADER_HEIGHT}
            imageUrls={recommendation.images}
            onImagePress={handleImagePress}
          />
        }
        offsetY={offsetY}
        headerHeight={HEADER_HEIGHT}
      >
        <View style={styles.overlayContainer}>

          {/* Header Section*/}
          <View style={styles.headerContainer}>
            <View ref={titleRef} onLayout={handleLayout}>
              <Text style={styles.title}>{recommendation.name}</Text>
            </View>
            <View style={styles.subTitleContainer}>
              <Text style={styles.subTitleText}>
                {recommendation.category} in {recommendation.city},{" "}
                {recommendation.country}
              </Text>

              {/* Header Metadata Section */}
              <HeaderMetadataSection
                hours={recommendation.hours}
                isAccessible={isAccessible}
                priceRange={recommendation.priceRange}
                onHoursClicked={isHoursBottomSheetAvailable ? handleOpenHoursSheet : undefined}
              />
            </View>
          </View>

          {/* Reviews Section */}
          {isReviewsAvailable && (
            <View style={styles.reviewsMetadataSection}>
              <ReviewsMetadataSection
                rating={recommendation.reviews.rating}
                count={recommendation.reviews.count}
              />
            </View>
          )}

          {/* Editorial Summary*/}
          <View style={styles.quickInfoContainer}>
            <View style={styles.editorialSummaryContainer}>
              <Text style={styles.editorialSummaryText}>
                {recommendation.editorialSummary}
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <QuickActionButtons
              directionsUrl={recommendation.mapsUri}
              websiteUrl={recommendation.contactInfo?.websiteUri}
              phone={recommendation.contactInfo?.internationalPhoneNumber}
              onOpenHoursClick={isHoursBottomSheetAvailable ? handleOpenHoursSheet : undefined}
            />
          </View>

          {/* Offerings Section */}
          {recommendation.offerings && recommendation.offerings.length > 1 && (
            <View style={styles.offeringsContainer}>
              <Text style={styles.sectionTitle}>What this place offers</Text>
              <OfferingList offerings={recommendation.offerings} onShowAll={handleShowAllOfferings} />
            </View>
          )}


          {/* Map Section */}
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Where you'll find it</Text>
            <MapSection
              mapUri={recommendation.mapsUri}
              address={recommendation.address}
              coordinates={recommendation.coordinates}
            />
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsContainer}>
            {isReviewsAvailable && (
              <ReviewList
                reviews={recommendation.reviews.items}
                totalCount={recommendation.reviews.count}
                viewAllReviewsUri={recommendation.reviews.uri}
                overallRating={recommendation.reviews.rating}
              />
            )}
          </View>

          {/* Google Maps Attribution */}
          <View style={styles.googleMapsAttribution}>
            <Image
              contentFit="contain"
              style={styles.googleMapsLogo}
              source={require("~/assets/images/attribution/GoogleMaps_Logo_Gray.svg")}
            />
          </View>

        </View>
      </ParallaxScrollView>


      {isHoursBottomSheetAvailable && (
        <Portal>
          <HoursBottomSheet
            ref={hoursBottomSheetRef} dailyHours={recommendation.hours.dailyHours}
          />
        </Portal>
      )}

    </View>
  );
}

// Loading skeleton component
const RecommendationDetailSkeleton = () => {
  const offsetY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.screenContainer}>
      <ParallaxScrollView
        headerImage={
          <View style={[styles.skeletonHero, { height: HEADER_HEIGHT }]}>
            <Animated.View style={[styles.skeletonHeroImage, animatedStyle]} />
          </View>
        }
        offsetY={offsetY}
        headerHeight={HEADER_HEIGHT}
      >
        <View style={styles.overlayContainer}>
          {/* Header Section Skeleton */}
          <View style={styles.headerContainer}>
            <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
            <View style={styles.subTitleContainer}>
              <Animated.View style={[styles.skeletonSubtitle, animatedStyle]} />

              {/* Header Metadata Skeleton */}
              <View style={styles.skeletonMetadataContainer}>
                <Animated.View style={[styles.skeletonMetadataItem, animatedStyle]} />
                <Animated.View style={[styles.skeletonMetadataItem, animatedStyle]} />
                <Animated.View style={[styles.skeletonMetadataItem, animatedStyle]} />
              </View>
            </View>
          </View>

          {/* Reviews Section Skeleton */}
          <View style={styles.reviewsMetadataSection}>
            <View style={styles.skeletonMetadataContainer}>
              <Animated.View style={[styles.skeletonRating, animatedStyle]} />
              <Animated.View style={[styles.skeletonReviewCount, animatedStyle]} />
            </View>
          </View>

          {/* Editorial Summary Skeleton */}
          <View style={styles.quickInfoContainer}>
            <View style={styles.editorialSummaryContainer}>
              <Animated.View style={[styles.skeletonSummaryLine, animatedStyle]} />
              <Animated.View style={[styles.skeletonSummaryLine, { width: "90%" }, animatedStyle]} />
              <Animated.View style={[styles.skeletonSummaryLine, { width: "75%" }, animatedStyle]} />
            </View>

            {/* Quick Action Buttons Skeleton */}
            <View style={styles.skeletonActionButtons}>
              <Animated.View style={[styles.skeletonActionButton, animatedStyle]} />
              <Animated.View style={[styles.skeletonActionButton, animatedStyle]} />
              <Animated.View style={[styles.skeletonActionButton, animatedStyle]} />
            </View>
          </View>

          {/* Map Section Skeleton */}
          <View style={styles.mapContainer}>
            <Animated.View style={[styles.skeletonSectionTitle, animatedStyle]} />
            <Animated.View style={[styles.skeletonMap, animatedStyle]} />
          </View>
        </View>
      </ParallaxScrollView>
    </View>
  );
};

const BORDER_WIDTH = 1;
const BORDER_COLOR = "#E5E5E5";

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  overlayContainer: {
    zIndex: 10,
    marginTop: -40,
    paddingVertical: 20,
    paddingBottom: 50,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: Dimensions.get("window").height,
  },
  headerContainer: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    color: "#222",
    marginBottom: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  subTitleContainer: {
    gap: 5,
  },
  subTitleSeparator: {
    fontSize: 15,
  },
  subTitleText: {
    fontSize: 15,
    color: "#667",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 25,
  },


  // Reviews Metadata Section
  reviewsMetadataSection: {
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 100,
  },

  // Quick Info Section
  quickInfoContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    borderColor: BORDER_COLOR,
    borderTopWidth: BORDER_WIDTH,
    borderBottomWidth: BORDER_WIDTH,
  },
  editorialSummaryContainer: {
    marginBottom: 20,
  },
  editorialSummaryText: {
    fontSize: 15,
    color: "#11181C",
    lineHeight: 22,
    fontWeight: "400",
  },

  // Offerings Section Styles
  offeringsContainer: {
    marginTop: 28,
    paddingBottom: 30,
    borderColor: BORDER_COLOR,
    borderBottomWidth: BORDER_WIDTH,
  },

  // Map Section
  mapContainer: {
    marginTop: 28,
    paddingBottom: 40,
    borderColor: BORDER_COLOR,
    borderBottomWidth: BORDER_WIDTH,
  },

  // Reviews Container
  reviewsContainer: {
    marginTop: 28,
    marginBottom: 15,
  },

  // Google Maps Attribution
  googleMapsAttribution: {
    alignItems: 'center',
  },
  googleMapsLogo: {
    width: 90,
    height: 18,
  },

  // Skeleton Styles
  skeletonHero: {
    backgroundColor: "#E1E1E1",
  },
  skeletonHeroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E1E1E1",
  },
  skeletonTitle: {
    height: 25,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
    marginBottom: 15,
    width: "80%",
    alignSelf: "center",
  },
  skeletonSubtitle: {
    height: 15,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
    width: "70%",
    alignSelf: "center",
    marginBottom: 10,
  },
  skeletonMetadataContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  skeletonMetadataItem: {
    width: 60,
    height: 20,
    borderRadius: 20,
    backgroundColor: "#E1E1E1",
  },
  skeletonRating: {
    height: 20,
    width: 80,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
  },
  skeletonReviewCount: {
    height: 20,
    width: 80,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
  },
  skeletonSummaryLine: {
    height: 16,
    backgroundColor: "#E1E1E1",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonActionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
  skeletonActionButton: {
    height: 20,
    width: 100,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
  },
  skeletonSectionTitle: {
    height: 20,
    backgroundColor: "#E1E1E1",
    borderRadius: 20,
    marginBottom: 25,
    width: "50%",
  },
  skeletonMap: {
    height: 200,
    backgroundColor: "#E1E1E1",
    borderRadius: 12,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
