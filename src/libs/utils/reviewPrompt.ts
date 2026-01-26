// External Dependencies
import * as StoreReview from "expo-store-review";

import { reportWarning } from "@/libs/utils/errorReporting";
// Internal Dependencies
import { useReviewStore } from "@/stores/reviewStore";

/**
 * Show native review prompt
 * @description Uses the native StoreReview API to request an in-app review.
 * The API handles platform differences automatically and respects OS rate limiting.
 * On iOS, this shows the native SKStoreReviewController prompt.
 * On Android, this may show the Play Store review prompt if available.
 * Only marks as "asked" if the prompt was actually shown (when StoreReview is available).
 */
export const showReviewPrompt = async (): Promise<void> => {
  try {
    // Check if StoreReview is available on this platform
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      // Request review using native API
      // This respects OS rate limiting and won't show too frequently
      await StoreReview.requestReview();
      // Only mark as asked if we successfully showed the prompt
      useReviewStore.getState()?.setHasAskedForReview(true);
    } else {
      // StoreReview not available on this platform/version
      // This is expected on some Android versions or in development
      reportWarning("StoreReview is not available on this platform", {
        component: "ReviewPrompt",
        action: "Check StoreReview Availability",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    reportWarning(errorMessage, {
      component: "ReviewPrompt",
      action: "Request Review",
    });
    // Silently fail - we don't want to interrupt the user experience
  }
};
