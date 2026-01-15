// External Dependencies
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { router, useNavigation, usePathname } from "expo-router";
import type { default as BottomSheet } from "@gorhom/bottom-sheet";
import { type FC, type RefObject, useCallback, useMemo } from "react";

// Internal Dependencies
import { useRecommendationDetails } from "@/api";
import { ActionBottomSheet } from "@/components/ActionBottomSheet";
import type { ActionBottomSheetMenuItem } from "@/components/ActionBottomSheet";
import { useRecommendationDeleteHandler } from "@/hooks/useRecommendationDeleteHandler";

export interface RecommendationOptionsSheetProps {
  recommendationSlug: string;
  bottomSheetRef: RefObject<BottomSheet | null>;
  onChange?: (index: number) => void;
  initialIndex?: number;
}

export const RecommendationOptionsSheet: FC<RecommendationOptionsSheetProps> = ({
  recommendationSlug,
  bottomSheetRef,
  onChange,
  initialIndex = -1,
}) => {
  const navigation = useNavigation();
  const pathname = usePathname();
  const { data: recommendation } = useRecommendationDetails(recommendationSlug);

  // Determine isSaved from fetched recommendation data
  const isSaved = (recommendation?.wishlistIds?.length ?? 0) > 0;

  // Check if we're on the recommendation detail page (not sub-routes like /photos or /amenities)
  const isRecommendationDetailPage = pathname?.match(/^\/recommendations\/[^/]+$/) !== null;

  // Use the delete handler hook
  const { handleDelete: executeDelete, isPending } = useRecommendationDeleteHandler({
    recommendationSlug,
    thumbnailUri: recommendation?.images?.[0],
    recommendationName: recommendation?.name ?? "This recommendation",
    onSuccess: () => {
      // Close the sheet after successful delete
      bottomSheetRef.current?.close();

      // Only navigate back if we're on the recommendation detail page
      if (isRecommendationDetailPage && navigation.canGoBack()) {
        router.back();
      }
    },
  });

  // Dynamic snap points based on isSaved state
  const snapPoints = useMemo(() => [isSaved ? "30%" : "25%"], [isSaved]);

  // Handle Share action
  const handleShare = useCallback(() => {
    bottomSheetRef.current?.close();
    Alert.alert("Not yet implemented", "Share functionality coming soon");
  }, [bottomSheetRef]);

  // Handle Add to wishlist action
  const handleManageWishlists = useCallback(() => {
    bottomSheetRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(modal)/manage-wishlists",
      params: {
        recommendationSlug,
      },
    });
  }, [bottomSheetRef, recommendationSlug]);

  // Handle Delete action - close bottom sheet first, then execute delete
  const handleDelete = useCallback(() => {
    if (isPending) return;
    bottomSheetRef.current?.close();
    executeDelete();
  }, [bottomSheetRef, isPending, executeDelete]);

  // Menu items
  const menuItems = useMemo<ActionBottomSheetMenuItem[]>(
    () => [
      {
        icon: "share-outline",
        label: "Share",
        onPress: handleShare,
      },
      {
        icon: "heart-outline",
        label: "Manage wishlists",
        onPress: handleManageWishlists,
      },
      {
        icon: "trash-outline",
        label: isPending ? "Deleting..." : "Delete",
        onPress: handleDelete,
        destructive: true,
        disabled: isPending,
      },
    ],
    [handleShare, handleManageWishlists, handleDelete, isSaved, isPending],
  );

  return (
    <ActionBottomSheet
      ref={bottomSheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      headerTitle="More options..."
      menuItems={menuItems}
      onChange={onChange}
    />
  );
};

export default RecommendationOptionsSheet;
