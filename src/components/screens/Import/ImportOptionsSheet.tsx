import { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";
// External Dependencies
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert, Linking } from "react-native";

import { useDeleteRecipeMutation } from "@/api";
import {
  ActionBottomSheet,
  type ActionBottomSheetMenuItem,
} from "@/components/ActionBottomSheet";
import { useActionToast } from "@/contexts";
// Internal Dependencies
import { Colors } from "@/libs/constants";
import type { ImportRecommendation } from "@/libs/types";
import { createShortSlug, reportError } from "@/libs/utils";

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
  const { mutateAsync: deleteImportAsync, isPending: isDeletePending } =
    useDeleteRecipeMutation();

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
    const uri =
      importData.sourceUri ||
      (importData.asset && "contentUri" in importData.asset
        ? importData.asset.contentUri
        : undefined) ||
      (importData.asset && "uri" in importData.asset
        ? importData.asset.uri
        : undefined);

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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );

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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message ||
                    "Failed to delete import. Please try again.",
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

  const menuItems = useMemo<ActionBottomSheetMenuItem[]>(() => {
    return [
      ...(hasRecommendations
        ? [
            {
              renderIcon: () => (
                <Ionicons size={20} name="map-outline" color="#667" />
              ),
              label: "Map",
              onPress: handleMapPress,
            },
          ]
        : []),
      isVideo
        ? {
            renderIcon: () => (
              <Ionicons size={20} name="play-outline" color="#667" />
            ),
            label: "Watch",
            onPress: handleAssetPress,
          }
        : {
            renderIcon: () => (
              <Ionicons size={20} name="open-outline" color="#667" />
            ),
            label: "View",
            onPress: handleAssetPress,
          },
      {
        renderIcon: () => (
          <Ionicons size={20} name="person-outline" color="#667" />
        ),
        label: "Creator Profile",
        onPress: handleAuthorPress,
      },
      {
        renderIcon: () => (
          <Ionicons size={20} name="megaphone-outline" color="#667" />
        ),
        label: "Report Issue",
        onPress: handleReportPress,
      },
      {
        renderIcon: () => (
          <Ionicons size={20} name="trash-outline" color={Colors.destructive} />
        ),
        label: "Delete",
        onPress: handleDeletePress,
        destructive: true,
      },
    ].filter(Boolean) as ActionBottomSheetMenuItem[];
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
