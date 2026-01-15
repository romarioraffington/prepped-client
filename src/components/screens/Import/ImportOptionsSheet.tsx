// External Dependencies
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";
import { Alert, Linking, Text, View } from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import { useDeleteImportMutation } from "@/api";
import type { ImportRecommendation } from "@/libs/types";
import { createShortSlug, truncate, reportError } from "@/libs/utils";
import { ActionBottomSheet } from "@/components/ActionBottomSheet";

type ImportData = {
  id: string;
  title: string;
  asset: {
    type: string;
    thumbnailUri: string;
    contentUri?: string;
    uri?: string;
  };
  author?: {
    profileUri?: string;
  };
  sourceUri?: string;
  recommendations?: ImportRecommendation[];
};

export interface ImportOptionsSheetProps {
  importData: ImportData;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onAnimationCompleted?: () => void;
  onDeleteSuccess?: () => void;
}

export function ImportOptionsSheet({
  importData,
  bottomSheetRef,
  onAnimationCompleted,
  onDeleteSuccess,
}: ImportOptionsSheetProps) {
  const router = useRouter();
  const { showToast } = useActionToast();
  const { mutateAsync: deleteImportAsync, isPending: isDeletePending } = useDeleteImportMutation();

  const id = importData.id;
  const recommendations = importData.recommendations || [];
  const hasRecommendations = recommendations.length > 0;
  const isVideo = importData.asset.type === "video";

  // Set snap points based on recommendations
  const snapPoints = useMemo(() => {
    if (!hasRecommendations) {
      return ["34%"];
    }
    return ["38%"];
  }, [hasRecommendations]);

  const handleMapPress = useCallback(() => {
    const slug = createShortSlug(importData.title, importData.id);

    bottomSheetRef.current?.close();
    setTimeout(() => {
      router.push({
        pathname: "/imports/[slug]/recommendations",
        params: { slug },
      });
    }, 100);
  }, [importData, router, bottomSheetRef]);

  const handleAssetPress = useCallback(async () => {
    const uri = importData.sourceUri ||
      (importData.asset && 'contentUri' in importData.asset ? importData.asset.contentUri : undefined) ||
      (importData.asset && 'uri' in importData.asset ? importData.asset.uri : undefined);

    if (!uri) {
      reportError(new Error("No URI found for import"), {
        component: "ImportOptionsSheet",
        action: "Open Import",
        extra: { importId: importData?.id },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(uri);
    }, 100);
  }, [importData, bottomSheetRef]);

  const handleAuthorPress = useCallback(() => {
    const profileUri = importData.author?.profileUri;
    if (!profileUri) {
      reportError(new Error("No profile URI found for import"), {
        component: "ImportOptionsSheet",
        action: "Open Profile",
        extra: { importId: importData?.id },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      Linking.openURL(profileUri);
    }, 100);
  }, [importData, bottomSheetRef]);

  const handleReportPress = useCallback(() => {
    if (!id) {
      reportError(new Error("No ID found for import"), {
        component: "ImportOptionsSheet",
        action: "Delete Import",
        extra: { importData },
      });
      return;
    }

    bottomSheetRef.current?.close();
    setTimeout(() => {
      router.push({
        pathname: "/feedback/report",
        params: { importId: id },
      });
    }, 100);
  }, [id, router, bottomSheetRef]);

  const handleDeletePress = useCallback(() => {
    if (isDeletePending || !id) return;

    const displayName = importData.title || "This import";

    Alert.alert(
      "Delete Import?",
      `${displayName} and all recommendations will be deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteImportAsync(id)
              .then(async () => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast with green checkmark
                showToast({
                  text: `Deleted ${displayName}`,
                  thumbnailUri: importData.asset.thumbnailUri || null,
                });

                // Close bottom sheet
                bottomSheetRef.current?.close();

                // Call optional success callback (e.g., for navigation in detail view)
                if (onDeleteSuccess) {
                  onDeleteSuccess();
                }

                // Mutation handles cache updates and invalidation automatically
                // No need to manually invalidate here
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete import. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    id,
    showToast,
    importData,
    isDeletePending,
    bottomSheetRef,
    onDeleteSuccess,
    deleteImportAsync,
  ]);

  const menuItems = useMemo(() => {
    return [
      ...(hasRecommendations
        ? [
          {
            label: "Map",
            icon: "map-outline" as const,
            onPress: handleMapPress
          }
        ]
        : []),
      isVideo
        ? { icon: "play-outline" as const, label: "Watch", onPress: handleAssetPress }
        : { icon: "open-outline" as const, label: "View", onPress: handleAssetPress },
      {
        icon: "person-outline" as const,
        label: "Creator Profile",
        onPress: handleAuthorPress
      },
      {
        icon: "megaphone-outline" as const,
        label: "Report Issue",
        onPress: handleReportPress
      },
      {
        icon: "trash-outline" as const,
        label: "Delete",
        onPress: handleDeletePress,
        destructive: true,
      },
    ].filter(Boolean);
  }, [
    isVideo,
    hasRecommendations,
    handleMapPress,
    handleAssetPress,
    handleAuthorPress,
    handleReportPress,
    handleDeletePress,
  ]);

  const thumbnailUri = importData.asset.thumbnailUri || undefined;

  return (
    <ActionBottomSheet
      index={-1}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      menuItems={menuItems}
      headerImageUri={thumbnailUri}
      onAnimationCompleted={onAnimationCompleted}
    />
  );
}

