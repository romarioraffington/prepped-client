import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useExtractMutation, useIsExtractionAllowed } from "@/api";
import { useImportProgress } from "@/contexts/ImportProgressContext";
// Internal Dependencies
import { IMPORT_STATUS } from "@/libs/constants";
import {
  getPlatformFromUrl,
  isValidSupportedUrl,
  isValidUrl,
  reportError,
} from "@/libs/utils";

interface ImportContentOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useImportContent = (options?: ImportContentOptions) => {
  const extractMutation = useExtractMutation();
  const isExtractionAllowed = useIsExtractionAllowed();
  const { progressItems, removeItem } = useImportProgress();

  const importContent = useCallback(
    async (url: string, options?: ImportContentOptions) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      try {
        if (!isExtractionAllowed) {
          Alert.alert("Oops... 🙈", "All free imports have been used.", [
            {
              text: "Later",
              style: "cancel",
            },
            {
              text: "Upgrade ✨",
              style: "default",
              isPreferred: true,
              onPress: () => {
                // Navigate to subscription management page
                router.push("/account/manage-subscription");
              },
            },
          ]);
          options?.onError?.("Import quota reached");
          return;
        }

        // Check if the url
        const normalizedUrl = url.trim();

        if (!normalizedUrl || normalizedUrl.trim().length === 0) {
          Alert.alert("Oops.. 🤔", "Looks like no links were found");
          options?.onError?.("No links found");
          return;
        }
        // Check if the URL is valid
        if (!isValidUrl(normalizedUrl)) {
          const errorMessage = "Looks like the link shared is not valid";
          Alert.alert("Oops.. 🤔", errorMessage);
          options?.onError?.(errorMessage);
          return;
        }

        // Check if the URL is from a supported platform
        if (!isValidSupportedUrl(normalizedUrl)) {
          const errorMessage = "Only TikTok links are supported at this time";
          Alert.alert("Oops.. 🤔", errorMessage);
          options?.onError?.(errorMessage);
          return;
        }

        // Check if this URL is already being processed
        const existingItem = progressItems.find(
          (item) => item.url === normalizedUrl,
        );

        if (existingItem) {
          // If the item is not failed, return an error
          if (existingItem.status !== IMPORT_STATUS.FAILED) {
            const errorMessage =
              "Looks like we are already importing this content";

            // Alert.alert("Oops.. 🤔", errorMessage);
            options?.onError?.(errorMessage);
            return;
          }

          removeItem(existingItem.id);
        }

        // Detect platform from URL
        const platform = getPlatformFromUrl(normalizedUrl);

        // Trigger the extract mutation
        extractMutation.mutate(
          {
            platform,
            title: "Importing...",
            url: normalizedUrl,
          },
          {
            onSuccess: () => {
              options?.onSuccess?.();
            },
            onError: (error) => {
              options?.onError?.(error?.message);

              reportError(error, {
                component: "ImportContent",
                action: "Extract Mutation",
                extra: { url: normalizedUrl },
              });
            },
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        reportError(new Error(errorMessage), {
          component: "ImportContent",
          action: "Import Content",
          extra: { url },
        });
        Alert.alert("Oops.. 🤔", errorMessage);
        options?.onError?.(errorMessage);
      }
    },
    [extractMutation, progressItems, isExtractionAllowed, removeItem],
  );

  return {
    importContent,
    isImporting: extractMutation.isPending,
  };
};
