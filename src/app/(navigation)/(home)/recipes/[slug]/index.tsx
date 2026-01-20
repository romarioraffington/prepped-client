// External Dependencies
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import type { ComponentProps } from "react";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useEffect, useRef, useMemo, useCallback, useLayoutEffect, memo } from "react";

import Animated, {
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import {
  Feather,
  Ionicons,
  FontAwesome6,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  View,
  Text,
  Alert,
  Linking,
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import { useImportDetails } from "@/api";
import type { ImportRecommendation } from "@/libs/types";
import { formatCompactNumber, parseSlug, createFullSlug } from "@/libs/utils";

import {
  useLargeTitleCrossfade,
  useRecommendationDeleteHandler,
  useRecommendationWishlistHandler,
} from "@/hooks";
import { reportWarning } from "@/libs/utils/errorReporting";

import {
  LargeTitle,
  ImageCarousel,
  EmptyImageState,
  SwipeableWrapper,
  RecipeOptionsSheet,
  WishlistButtonWithCount,
  RecommendationOptionsButton,
} from "@/components";

type FontAwesome6IconName = ComponentProps<typeof FontAwesome6>["name"];

export default function RecipeDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useSharedValue(0);
  const headerHeight = useHeaderHeight();
  const contentPaddingTop = headerHeight + 16;
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Get the slug and parse it to get the id and title
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { id } = parseSlug(slug);

  const {
    error,
    isLoading,
    data: importedData,
  } = useImportDetails(slug || '');

  // Get the title for the hook
  const title = importedData?.title || "";

  // Use the crossfade hook for title animation
  const {
    titleRef,
    offsetY,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: title,
  });

  // Share handler - defined early since it doesn't depend on data
  const handleSharePress = useCallback(() => {
    Alert.alert("Not Yet Implemented", "Share functionality is coming soon!");
  }, []);

  // Single setOptions call using hook-provided options; matches make-it-animated pattern
  useLayoutEffect(() => {
    if (!title) return;

    navigation.setOptions({
      ...getHeaderOptions(),
      headerRight: () => (
        <View>
          <Pressable
            onPress={handleSharePress}
            style={styles.headerShareButton}
          >
            <Feather name="share" size={19} color="#000" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, title, getHeaderOptions, handleSharePress]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error.message || "Failed to fetch import details", [
        {
          text: "Try Again",
          onPress: () => window.location.reload(),
        },
      ]);
    }
  }, [error]);

  // Fade in the floating nav
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 1200 });
  }, [fadeAnim]);

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  if (!id) {
    // TODO: Maybe redirect to a 404
    reportWarning(`No id found for id: ${id} slug: ${slug}`, {
      component: "ImportDetails",
      action: "Parse Import Slug",
      extra: { slug },
    });
    return null;
  }

  const {
    asset,
    author,
    siteName,
    likeCount,
    viewCount,
    sourceUri,
  } = importedData || {};

  // Get the recommendations
  const recommendations = importedData?.recommendations || [];

  // Check if recommendations are available and not loading
  const hasRecommendations = useMemo(
    () => recommendations.length > 0 && !isLoading,
    [recommendations.length, isLoading]
  );

  // Memoize recipeOptionsData to avoid recreating object on every render
  const recipeOptionsData = useMemo(() => {
    if (!importedData) return null;
    return {
      id: importedData.id,
      title: importedData.title,
      coverUri: importedData.asset.thumbnailUri || "",
      contentUri: importedData.sourceUri || "",
      caloriesPerServing: 0,
      cookTime: 0,
      platformId: (importedData as any).platformId || 1,
      author: {
        name: importedData.author?.name && importedData.author.name.trim() !== ""
          ? importedData.author.name
          : "",
        avatarUri: importedData.author?.photoUri || "",
        profileUri: importedData.author?.profileUri || "",
      },
    };
  }, [importedData]);

  // Determine if it's a video
  const isVideo = asset?.type === "video";

  // Determine the social platform
  const isFromTiktok = siteName?.toLowerCase().includes("tiktok");
  const isFromInstagram = siteName?.toLowerCase().includes("instagram");
  const isFromSocialPlatform = isFromTiktok || isFromInstagram;

  // Get the social platform icon based on the site name
  function getSocialPlatformIcon(name?: string): FontAwesome6IconName {
    const lower = name?.toLowerCase() ?? "";
    if (lower.includes("tiktok")) return "tiktok";
    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("youtube")) return "youtube";
    return "globe";
  }

  // Define handlers before useMemo to avoid reference issues
  // Using full objects in deps ensures callbacks update when content changes,
  // even if specific property values happen to be the same across different data
  const handleAuthorPress = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }

    if (!author?.profileUri) {
      return;
    }

    Linking.openURL(author.profileUri);
  }, [author]);

  const handleAssetPress = useCallback(async () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }

    if (!sourceUri) {
      return;
    }

    Linking.openURL(sourceUri);
  }, [sourceUri]);

  // Memoize header to avoid re-renders on scroll
  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      {/* Large Title with dynamic crossfade */}
      {title && (
        <LargeTitle
          ref={titleRef}
          offsetY={offsetY}
          currentTitle={title}
          onLayout={measureTitle}
          opacity={largeTitleOpacity}
        />
      )}

      {/* Author */}
      {author && (
        <TouchableOpacity
          style={styles.authorContainer}
          onPress={handleAuthorPress}
        >
          {author?.photoUri && (
            <Image
              style={styles.authorAvatar}
              source={{ uri: author?.photoUri }}
            />
          )}
          {author?.name && (
            <Text style={styles.authorName}>{author?.name}</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.metaContainer}>
        {/* Views */}
        {viewCount && (
          <View style={styles.metaCountContainer}>
            <Ionicons name="play" size={16} color="#667" />
            <Text style={styles.metaCountText}>{formatCompactNumber(viewCount)}</Text>
          </View>
        )}

        {/* Likes */}
        {likeCount && (
          <View style={styles.metaCountContainer}>
            <Ionicons name="heart" size={16} color="red" />
            <Text style={styles.metaCountText}>
              {formatCompactNumber(likeCount)}
            </Text>
          </View>
        )}

        {/* Social Platform */}
        {isFromSocialPlatform && (
          <View style={styles.importContainer}>
            <Text style={styles.metaCountText}>•</Text>
            <FontAwesome6
              size={14}
              color="#000"
              style={styles.headerSocialIcon}
              name={getSocialPlatformIcon(siteName)}
            />
          </View>
        )}
      </View>

      {/* Website link */}
      {!isFromSocialPlatform && siteName && (
        <View style={styles.importContainer}>
          <Text style={styles.metaCountText}> from </Text>
          <TouchableOpacity onPress={handleAssetPress}>
            <Text style={[styles.metaCountText, styles.linkText]}>
              {siteName}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [
    title,
    titleRef,
    offsetY,
    author,
    siteName,
    viewCount,
    likeCount,
    largeTitleOpacity,
    isFromSocialPlatform,
    measureTitle,
    handleAssetPress,
    handleAuthorPress,
  ]);

  const handlePlacePress = useCallback((place: ImportRecommendation) => {
    router.push({
      pathname: "/recommendations/[slug]",
      params: {
        slug: createFullSlug(place.title, place.id),
      },
    });
  }, [router]);

  // Memoize renderItem to avoid re-creations and VirtualizedList churn
  const renderItem = useCallback(
    ({ item }: { item: ImportRecommendation }) => {
      const recommendationSlug = createFullSlug(item.title, item.id);

      return (
        <ImportRecommendationItem
          item={item}
          onPress={() => handlePlacePress(item)}
          recommendationSlug={recommendationSlug}
        />
      );
    },
    [handlePlacePress],
  );

  const handleMapPress = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }

  }, [router, slug, bottomSheetRef]);

  const handleMorePress = () => {
    bottomSheetRef.current?.expand();
  };

  const handleDeleteSuccess = useCallback(() => {
    router.back();
  }, [router]);

  // Stable keyExtractor to avoid re-renders
  const keyExtractor = useCallback((item: ImportRecommendation) => item.id, []);

  if (isLoading) {
    return <LoadingImportDetails />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.FlatList
        data={recommendations}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyImageState
            title="Oops! 🙈"
            imageHeight={200}
            description="All recommendations have been deleted"
          />
        }
        contentContainerStyle={[styles.scrollViewContentContainer, { paddingTop: contentPaddingTop }]}

        // Performance optimizations
        windowSize={7}
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
      />

      {/* Floating Nav */}
      <Animated.View
        style={[styles.floatingNavContainer, fadeAnimatedStyle]}
      >
        <BlurView intensity={5} tint="extraLight" style={styles.floatingNav}>
          <View style={styles.navContainer}>
            {/* Map */}
            {hasRecommendations && (
              <TouchableOpacity
                style={[styles.navItem, { gap: 3, marginTop: 3 }]}
                onPress={handleMapPress}
              >
                <Feather name="map" size={21} color="#444" />
                <Text style={styles.navText}>Map</Text>
              </TouchableOpacity>
            )}

            {/* Play */}
            {isVideo ? (
              <TouchableOpacity
                style={[styles.navItem, { gap: 0 }]}
                onPress={handleAssetPress}
              >
                <MaterialCommunityIcons
                  size={29}
                  color="#333"
                  name="motion-play"
                />
                <Text style={styles.navText}>Watch</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navItem, { marginTop: 3, gap: 2 }]}
                onPress={handleAssetPress}
              >
                <MaterialIcons name="open-in-new" size={22} color="#333" />
                <Text style={styles.navText}>View</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* More */}
          <TouchableOpacity
            onPress={handleMorePress}
            style={[styles.navItem, { gap: 0, marginLeft: 8 }]}
          >
            <Ionicons name="caret-up-circle-outline" size={28} color="#222" />
            <Text style={styles.navText}>More</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Bottom Sheet */}
      {recipeOptionsData && (
        <RecipeOptionsSheet
          variant="detail"
          recipeData={recipeOptionsData}
          bottomSheetRef={bottomSheetRef}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </View>
  );
}

// Separate component for import recommendation item to allow hooks usage
type ImportRecommendationItemProps = {
  onPress: () => void;
  item: ImportRecommendation;
  recommendationSlug: string;
};

const ImportRecommendationItem = memo(({
  item,
  onPress,
  recommendationSlug,
}: ImportRecommendationItemProps) => {
  const {
    handleDelete,
    isPending: isDeletePending,
  } = useRecommendationDeleteHandler({
    recommendationSlug,
    recommendationName: item.title,
    thumbnailUri: item.imageUris?.[0],
  });

  const {
    handlePress: handleAddToWishlist,
    isPending: isWishlistPending,
  } = useRecommendationWishlistHandler({
    recommendationSlug,
    thumbnailUri: item.imageUris?.[0],
    wishlistIds: item.wishlistIds ?? [],
  });

  const isSwipePending = isDeletePending || isWishlistPending;

  // Create title actions with wishlist and options buttons
  const titleActions = (
    <>
      <WishlistButtonWithCount
        size={18}
        thumbnailUri={item.imageUris?.[0]}
        wishlistIds={item.wishlistIds ?? []}
        recommendationSlug={recommendationSlug}
      />
      <RecommendationOptionsButton
        size={18}
        orientation="vertical"
        recommendationSlug={recommendationSlug}
      />
    </>
  );

  return (
    <SwipeableWrapper
      onSwipeLeft={handleDelete}
      isPending={isSwipePending}
      onSwipeRight={handleAddToWishlist}
    >
      <Pressable onPress={onPress}>
        <View style={styles.placeContainer}>
          <ImageCarousel imageUrls={item.imageUris} imageHeight={160} />
          <View style={styles.placeInfo}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.placeTitleActions}>
                {titleActions}
              </View>
            </View>
            <Text style={styles.subtitle}>{item.editorialSummary}</Text>
          </View>
        </View>
      </Pressable>
    </SwipeableWrapper>
  );
});

// Loading skeleton component
const LoadingImportDetails = () => {
  const headerHeight = useHeaderHeight();
  const contentPaddingTop = headerHeight + 16;
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

  // Create header skeleton component
  const renderHeaderSkeleton = () => (
    <View style={styles.loadingHeader}>
      {/* Title skeleton */}
      <Animated.View style={[styles.skeletonTitle, animatedStyle]} />

      {/* Author skeleton */}
      <View style={styles.loadingAuthorContainer}>
        <Animated.View style={[styles.skeletonAvatar, animatedStyle]} />
        <Animated.View style={[styles.skeletonAuthorName, animatedStyle]} />
      </View>

      {/* Meta info skeleton */}
      <View style={styles.loadingMetaContainer}>
        <Animated.View style={[styles.skeletonMetaItem, animatedStyle]} />
        <Animated.View style={[styles.skeletonMetaItem, animatedStyle]} />
        <Animated.View style={[styles.skeletonMetaItem, animatedStyle]} />
      </View>
    </View>
  );

  // Create skeleton data for FlatList
  const skeletonData = [...Array(4)].map((_, index) => ({ id: `skeleton-${index}` }));

  // Render skeleton item
  const renderSkeletonItem = () => (
    <View style={styles.loadingPlaceContainer}>
      <View style={styles.imageCarouselContainer}>
        {[...Array(3)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.skeletonImage,
              animatedStyle
            ]}
          />
        ))}
      </View>
      <View style={styles.loadingPlaceInfo}>
        <Animated.View style={[styles.skeletonPlaceTitle, animatedStyle]} />
        <Animated.View style={[styles.skeletonPlaceSubtitle, animatedStyle]} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={skeletonData}
      style={{ flex: 1 }}
      renderItem={renderSkeletonItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeaderSkeleton}
      contentContainerStyle={[styles.scrollViewContentContainer, { paddingTop: contentPaddingTop }]}
    />
  );
};

const styles = StyleSheet.create({
  scrollViewContentContainer: {
    paddingBottom: 120,
    paddingLeft: 20,
    paddingRight: 8,
  },

  // Main content
  header: {
    gap: 3,
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    marginBottom: 5,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  authorName: {
    fontSize: 16,
    color: "#667",
    fontWeight: "400",
  },
  metaContainer: {
    gap: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  metaCountContainer: {
    gap: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  metaCountText: {
    fontSize: 14,
    color: "#667",
  },
  importContainer: {
    flexDirection: "row",
  },
  linkText: {
    textDecorationLine: "underline",
  },
  headerSocialIcon: {
    marginLeft: 4,
  },

  // Place Info
  placeContainer: {
    flex: 1,
    marginBottom: 15,
  },
  placeInfo: {
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  placeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
    gap: 8,
  },
  placeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "left",
  },
  placeTitleActions: {
    gap: 15,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#667",
    textAlign: "left",
  },

  // Floating Nav
  floatingNavContainer: {
    left: 0,
    right: 0,
    bottom: 45,
    position: "absolute",
    alignItems: "center",
  },
  floatingNav: {
    gap: 17,
    overflow: "hidden",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  navContainer: {
    gap: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
  },
  navText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
  },

  // Bottom Sheet
  bottomSheetHeader: {
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetBackground: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSheetIndicator: {
    display: "none",
  },
  bottomSheetTitle: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
  },
  bottomSheetText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
    marginTop: 4,
  },
  bottomSheetRow: {
    paddingTop: 8,
    flexDirection: "row",
    paddingHorizontal: 30,
  },
  bottomSheetButton: {
    flex: 1,
    gap: 3,
    alignItems: "center",
  },
  bottomSheetIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Close Button
  closeButton: {
    position: "absolute",
    left: 10,
    top: -5,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading skeleton styles
  loadingHeader: {
    gap: 3,
    marginBottom: 24,
  },
  skeletonTitle: {
    height: 24,
    borderRadius: 10,
    marginBottom: 5,
    width: "80%",
    backgroundColor: '#E1E1E1',
  },
  loadingAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonAvatar: {
    width: 24,
    height: 24,
    borderRadius: 20,
    backgroundColor: '#E1E1E1',
  },
  skeletonAuthorName: {
    height: 16,
    width: 100,
    backgroundColor: '#E1E1E1',
    borderRadius: 20,
  },
  loadingMetaContainer: {
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonMetaItem: {
    height: 14,
    width: 60,
    borderRadius: 10,
    backgroundColor: '#E1E1E1',
  },
  loadingPlaceContainer: {
    flex: 1,
    marginBottom: 15,
  },
  imageCarouselContainer: {
    height: 160,
    flexDirection: 'row',
  },
  skeletonImage: {
    height: 160,
    width: 200,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: '#E1E1E1',
  },
  loadingPlaceInfo: {
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  skeletonPlaceTitle: {
    height: 16,
    width: '40%',
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#E1E1E1',
  },
  skeletonPlaceSubtitle: {
    height: 14,
    width: '80%',
    backgroundColor: '#E1E1E1',
    borderRadius: 10
  },

  // Header Right
  headerShareButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
