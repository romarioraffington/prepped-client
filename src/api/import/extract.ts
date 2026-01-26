/**
 * Import Extraction API
 *
 * This module handles content extraction and polling with app state awareness.
 *
 * Key Features:
 * - App state-aware polling that stops when app goes to background
 * - Automatic resume and status check when app returns to foreground
 * - Network failure handling that distinguishes between background and real errors
 * - Prevents false "failed" status when app is backgrounded during import
 *
 * Background/Foreground Handling:
 * - When app goes to background: polling stops to avoid network request failures
 * - When app returns to foreground: immediately refetches to get latest status
 * - Network errors in background are logged but doesn't mark imports as failed
 * - Only real errors (not background network failures) mark imports as failed
 */

import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// External Dependencies
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";

import { useImportQuota } from "@/api/import/quota";
import { useImportProgress, useSubscription } from "@/contexts";
import { isNetworkRequestError, isQuotaError } from "@/libs/api/errors";
import type { ImportQuota, Platform } from "@/libs/types";
// Internal Dependencies
import { reportError } from "@/libs/utils";
import { showReviewPrompt } from "@/libs/utils/reviewPrompt";
import { useReviewStore } from "@/stores/reviewStore";
import { useSubscriptionStore } from "~/src/stores/subscriptionStore";

import {
  API_ENDPOINTS,
  DEFAULT_QUOTA,
  IMPORT_STATUS,
  QUERY_KEYS,
  getApiClient,
} from "@/libs/constants";

// Configuration
const MAX_RETRIES = 3;
const POLLING_INTERVAL_MS = 2000; // 2 seconds
const TIMEOUT_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
const MAX_POLLING_DURATION_MS = 2 * 60 * 1000; // 2 minutes

// Track which extractions have already had completion handled to prevent duplicate calls
const handledCompletions = new Set<string>();

interface ExtractRequest {
  url: string;
}

interface ExtractResponse {
  success: true;
  data: {
    percentage: number;
    targetPercentage?: number;
    extractionId: string;
    status: string;
    title: string;
    platform: Platform;
    thumbnailUri?: string;
    hasRecommendations?: boolean;
  };
}

interface ExtractErrorResponse {
  success: false;
  data: {
    code: string;
    message: string;
  };
}

interface ExtractMutationVariables {
  url: string;
  title: string;
  platform: Platform;
}

/**
 * Get extraction status by ID
 * @description Get extraction status by ID
 * @param extractionId - The ID of the extraction
 * @returns The extraction status
 */
export const getExtractionStatus = async (
  extractionId: string,
): Promise<ExtractResponse["data"]> => {
  try {
    const client = getApiClient();
    const result = (await client.get(
      API_ENDPOINTS.EXTRACTIONS_STATUS_V1.replace("{id}", extractionId),
    )) as ExtractResponse | ExtractErrorResponse;

    // Check for error response
    if (!result?.success) {
      throw new Error("Failed to get extraction status");
    }

    const successResponse = result as ExtractResponse;
    const data = successResponse?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }

    return data;
  } catch (error) {
    reportError(error, {
      component: "ImportExtract",
      action: "Fetch Extraction Status",
      extra: { extractionId },
    });
    throw new Error("Import failed");
  }
};

/**
 * Helper functions
 * @param queryClient - The query client
 * @returns The import quota
 */
const getImportQuota = (queryClient: any): ImportQuota => {
  const cachedData = queryClient.getQueryData([QUERY_KEYS.RECIPE_QUOTA]);

  // Return cached data if available
  if (cachedData) {
    return cachedData as ImportQuota;
  }

  // Return default quota if no cached data
  return {
    totalImportCreditsUsed: 0,
    creditBalanceRemaining: DEFAULT_QUOTA,
  };
};

/**
 * Show import quota alert
 * @description Show import quota alert
 * @param creditBalanceRemaining - The number of credit remaining
 */
const showImportQuotaAlert = async (creditBalanceRemaining: number) => {
  const isQuotaFull = creditBalanceRemaining <= 0;
  const importCountText = isQuotaFull
    ? `You have no import credits remaining. Top up or subscribe for additional imports!`
    : `You have ${creditBalanceRemaining} import credits remaining. Top up or subscribe for unlimited imports!`;

  Alert.alert("Heads up! 👀", importCountText, [
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
};

/**
 * Check and show approaching quota limit
 * @description Check and show approaching quota limit when balance is low
 * @param creditBalanceRemaining - The credit balance remaining
 */
const checkAndShowApproachingQuotaLimit = (creditBalanceRemaining: number) => {
  const LOW_BALANCE_THRESHOLD = 2;

  // Show alert when balance is low.
  if (creditBalanceRemaining <= LOW_BALANCE_THRESHOLD) {
    console.log("Showing import quota alert");
    showImportQuotaAlert(creditBalanceRemaining);
  }
};

/**
 * Refetch all data after import completion
 * @description Refetches collections, imports, and quota to refresh the UI
 * @param queryClient - The query client instance
 */
const refetchImportData = (queryClient: ReturnType<typeof useQueryClient>) => {
  // Use refetchQueries for infinite queries to force immediate refetch from the beginning
  // This ensures the UI updates immediately after import completion
  queryClient.refetchQueries({ queryKey: [QUERY_KEYS.COOKBOOKS] });
  queryClient.refetchQueries({ queryKey: [QUERY_KEYS.RECIPES] });

  // Use refetchQueries for non-infinite queries to get the latest data
  queryClient.refetchQueries({ queryKey: [QUERY_KEYS.RECIPE_QUOTA] });
};

/**
 * Handle import completion
 * @description Centralized handler for when an import completes - refetches data and checks quota
 * @param queryClient - The query client instance
 * @param quotaData - Optional quota data to check (if not provided, will fetch from cache)
 * @param extractionId - Optional extraction ID to track and prevent duplicate calls
 */
const handleImportCompletion = async (
  queryClient: ReturnType<typeof useQueryClient>,
  extractionId?: string,
) => {
  // Prevent duplicate calls for the same extraction
  const key = extractionId ?? `unknown_${Date.now()}`;
  if (handledCompletions.has(key)) {
    return;
  }
  handledCompletions.add(key);

  // Refetch all import-related data to refresh the UI
  await refetchImportData(queryClient);

  // NOTE: Eventhough we refetch the quota, the quota is not updated
  // immediately so we need to subtract 1 from the cached quota
  const cachedQuota = getImportQuota(queryClient);
  const creditBalanceRemaining = Math.max(
    0,
    cachedQuota.creditBalanceRemaining - 1,
  );

  // Only show quota alert if user doesn't have a subscription
  const { isPremium } = useSubscriptionStore.getState();
  if (!isPremium) {
    checkAndShowApproachingQuotaLimit(creditBalanceRemaining);
  }

  // Check if we should show review prompt
  const { hasAskedForReview } = useReviewStore.getState();
  const totalImportCreditsUsed = cachedQuota.totalImportCreditsUsed;

  if (!hasAskedForReview && totalImportCreditsUsed % 2 === 0) {
    // Show review prompt
    await showReviewPrompt();
  }
};

/**
 * Extract content from a URL
 * @description Extract content from a URL
 * @param url - The URL to extract content from
 * @returns The extracted content
 */
export const extractContent = async (
  url: string,
): Promise<ExtractResponse["data"]> => {
  try {
    const client = getApiClient();
    const result = (await client.post(API_ENDPOINTS.EXTRACT_V1, {
      url,
    } as ExtractRequest)) as ExtractResponse | ExtractErrorResponse;

    // Check for error response
    if (!result?.success) {
      throw new Error("Import failed");
    }

    const successResponse = result as ExtractResponse;
    const data = successResponse?.data;

    if (!data) {
      throw new Error("Invalid response format: expected data object");
    }
    return data;
  } catch (error) {
    reportError(error, {
      component: "ImportExtract",
      action: "Extract Content",
      extra: { url, isQuotaError: isQuotaError(error) },
    });

    if (isQuotaError(error)) {
      throw new Error("Import quota reached");
    }

    // If it's a network error, re-throw it for retry handling
    // This preserves the original error so mutation's onError
    // can detect background network errors
    if (isNetworkRequestError(error)) {
      throw error;
    }

    // Only non-network errors get generic message
    throw new Error("Import failed");
  }
};

/**
 * Check if extraction is allowed
 * @description Check if extraction is allowed
 * @returns True if extraction is allowed, false otherwise
 */
export const useIsExtractionAllowed = () => {
  const { isPremium } = useSubscription();
  const { data: quotaData } = useImportQuota();

  if (isPremium) {
    return true;
  }

  // Check quota for free users
  if (quotaData && quotaData?.creditBalanceRemaining <= 0) {
    return false;
  }

  return true;
};

/**
 * Use extract mutation
 * @description Use extract mutation with app state awareness
 *
 * Handles background network errors gracefully by:
 * - Not marking imports as failed when app is backgrounded
 * - Automatically retrying failed extractions when app returns to foreground
 * @returns The extract mutation
 */
export const useExtractMutation = () => {
  const queryClient = useQueryClient();
  const { data: quotaData } = useImportQuota();
  const { addItem, updateItem } = useImportProgress();

  // Track app state to handle background network errors
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Store pending retry information including callbacks
  const pendingRetryRef = useRef<{
    url: string;
    progressItemId: string;
    onSuccess?: () => void;
    onError?: () => void;
  } | null>(null);

  // Store current mutation callbacks to access them in retry logic
  const currentCallbacksRef = useRef<{
    onSuccess?: () => void;
    onError?: () => void;
  }>({});

  // Listen for app state changes to retry failed extractions on foreground return
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // If app returned to foreground and we have a pending retry, attempt it
      if (previousAppState === "background" && nextAppState === "active") {
        if (pendingRetryRef.current) {
          const retry = pendingRetryRef.current;
          pendingRetryRef.current = null;

          try {
            // Call extractContent directly to avoid creating duplicate progress item
            const data = await extractContent(retry.url);

            // Update the existing progress item with the extraction result
            const status = data?.status?.toLowerCase();
            const isCompleted = status === IMPORT_STATUS.COMPLETED;

            updateItem(retry.progressItemId, {
              url: retry.url,
              percentage: data.percentage,
              targetPercentage: data.targetPercentage,
              thumbnailUri: data.thumbnailUri,
              extractionId: data.extractionId,
              title: data.title,
              platform: data.platform,
              hasRecommendations: data.hasRecommendations,
              status: isCompleted
                ? IMPORT_STATUS.COMPLETED
                : IMPORT_STATUS.PROCESSING,
            });

            if (isCompleted) {
              // Note: handleImportCompletion is called by the polling hook
              // to avoid duplicate calls. For immediate completions, the mutation's
              // onSuccess will handle it since polling won't start for COMPLETED items.
            }

            // Invoke success callback to
            // unblock ShareIntentHandler queue
            retry.onSuccess?.();
          } catch (error) {
            reportError(error, {
              component: "ImportExtract",
              action: "Retry Extraction",
              extra: { progressItemId: retry.progressItemId },
            });

            // Mark as failed only if it's not another background error
            const isBackgroundNetworkError =
              appStateRef.current === "background" &&
              isNetworkRequestError(error);

            if (!isBackgroundNetworkError) {
              updateItem(retry.progressItemId, {
                status: IMPORT_STATUS.FAILED,
                error: "Import failed",
              });

              // Invoke error callback to
              // unblock ShareIntentHandler queue
              retry.onError?.();
              console.log("Retry failed, invoked onError callback");
            } else {
              // Still backgrounded, store for another retry
              pendingRetryRef.current = retry;
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
    };
  }, [queryClient, updateItem]);

  const mutation = useMutation({
    mutationFn: ({ url }: ExtractMutationVariables) => {
      // Add breadcrumb for import attempt
      Sentry.addBreadcrumb({
        message: "Content import started",
        category: "import",
        data: { url },
        level: "info",
      });
      return extractContent(url);
    },
    onMutate: async ({ platform, title, url }) => {
      // Add item immediately for immediate feedback
      const uiGeneratedId = await addItem({
        title,
        platform,
        percentage: 0,
        url, // Store the URL to track duplicates
        status: IMPORT_STATUS.PROCESSING,
      });

      return {
        url, // Include URL for debugging
        importId: uiGeneratedId,
      };
    },
    onSuccess: (data, variables, context) => {
      if (context?.importId) {
        const isCompleted =
          data.status.toLowerCase() === IMPORT_STATUS.COMPLETED;

        // Update with real extracted data
        updateItem(context.importId, {
          url: variables.url, // Preserve the URL
          percentage: data.percentage,
          targetPercentage: data.targetPercentage,
          thumbnailUri: data.thumbnailUri,
          extractionId: data.extractionId,
          title: data.title || variables.title,
          platform: data.platform || variables.platform,
          hasRecommendations: data.hasRecommendations,
          status: isCompleted
            ? IMPORT_STATUS.COMPLETED
            : IMPORT_STATUS.PROCESSING,
        });

        if (isCompleted) {
          // Handle immediate completions here (polling won't start for COMPLETED items)
          // The polling hook handles completions that happen during polling
          handleImportCompletion(queryClient, data.extractionId);

          // Add breadcrumb for import progress
          Sentry.addBreadcrumb({
            message: "Import completed",
            category: "import",
            data: {
              url: variables.url,
              status: data.status,
              percentage: data.percentage,
              title: data.title || variables.title,
              platform: data.platform || variables.platform,
            },
            level: "info",
          });
        }
      }
    },
    onError: (error, variables, context) => {
      if (context?.importId) {
        // Check if this is a background network error
        // (app was backgrounded during request)
        const isBackgroundNetworkError =
          appStateRef.current === "background" && isNetworkRequestError(error);

        if (isBackgroundNetworkError) {
          // Don't mark as failed - this is expected when app is backgrounded
          // Store for retry when app returns to foreground
          console.debug(
            "Background network error during extraction (expected), will retry when app returns to foreground:",
            {
              url: variables.url,
              error: error?.message,
            },
          );

          pendingRetryRef.current = {
            url: variables.url,
            progressItemId: context.importId,
            onSuccess: currentCallbacksRef.current.onSuccess,
            onError: currentCallbacksRef.current.onError,
          };

          return;
        }

        // Real error - mark as failed and log to Sentry
        Sentry.addBreadcrumb({
          message: "Import failed",
          category: "import",
          data: {
            url: variables.url,
            error: error?.message,
            title: variables.title,
            platform: variables.platform,
          },
          level: "error",
        });

        // Update with error state
        updateItem(context.importId, {
          status: IMPORT_STATUS.FAILED,
          error: error?.message || "Import failed",
        });

        reportError(error, {
          component: "ImportExtract",
          action: "Import Mutation Failed",
          extra: { context, variables },
          skipBreadcrumb: true, // Already captured via Sentry.addBreadcrumb above
        });
      }
    },
  });

  // Wrap the mutation to capture callbacks when mutate() is called
  const originalMutate = mutation.mutate;
  mutation.mutate = (variables, options) => {
    // Store the callbacks so we can invoke them during retry
    currentCallbacksRef.current = {
      onSuccess: options?.onSuccess as () => void,
      onError: options?.onError as () => void,
    };
    // Call original mutate
    originalMutate(variables, options);
  };

  return mutation;
};

/**
 * Hook to poll extraction status with app state awareness
 * @description Hook to poll extraction status that handles background/foreground transitions
 * gracefully. Stops polling when app goes to background and resumes when it returns.
 * @param extractionId - The ID of the extraction
 * @param progressItemId - The ID of the progress item
 * @returns The query
 */
export const useExtractionStatusPolling = (
  extractionId: string | null,
  progressItemId: string,
) => {
  const queryClient = useQueryClient();
  const { updateItem } = useImportProgress();
  const startTimeRef = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const previousStatusRef = useRef<string | null>(null);
  const hasHandledCompletionRef = useRef<boolean>(false);

  // Listen for app state changes to handle background/foreground transitions
  useEffect(() => {
    if (!extractionId) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      appState.current = nextAppState;

      // If app returned to foreground, immediately refetch to get latest status
      // This ensures we don't miss any status updates that happened while backgrounded
      if (previousAppState === "background" && nextAppState === "active") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.EXTRACTION_STATUS(extractionId),
        });
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
      // Cancel any ongoing queries on unmount to prevent memory leaks
      queryClient.cancelQueries({
        queryKey: QUERY_KEYS.EXTRACTION_STATUS(extractionId),
      });
    };
  }, [extractionId, queryClient]);

  const query = useQuery({
    queryKey: extractionId
      ? QUERY_KEYS.EXTRACTION_STATUS(extractionId)
      : [QUERY_KEYS.EXTRACTION_STATUS_BASE],
    queryFn: () => {
      if (!extractionId) {
        throw new Error("Extraction ID is required");
      }
      return getExtractionStatus(extractionId);
    },
    enabled: !!extractionId,
    refetchInterval: (query) => {
      // Initialize start time on first poll
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }

      // Stop polling if extraction is completed or failed
      if (
        query.state.data?.status === IMPORT_STATUS.COMPLETED ||
        query.state.data?.status === IMPORT_STATUS.FAILED
      ) {
        return false;
      }

      // Check if we've exceeded the maximum polling duration
      const elapsedTime = Date.now() - (startTimeRef.current || 0);
      if (elapsedTime >= MAX_POLLING_DURATION_MS) {
        return false;
      }

      // Only poll when app is active to avoid network request failures in background
      return appState.current === "active" ? POLLING_INTERVAL_MS : false;
    },
    retry: (failureCount, error) => {
      // Don't retry network failures when app is backgrounded
      // This prevents unnecessary retry attempts that will fail
      if (appState.current === "background" && isNetworkRequestError(error)) {
        console.log("Skipping retry for background network failure");
        return false;
      }

      // Retry up to 3 times for other errors when app is active
      return failureCount < MAX_RETRIES;
    },
    refetchIntervalInBackground: false, // Explicitly disable background polling
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle success and error states using useEffect
  useEffect(() => {
    if (query.data && progressItemId) {
      const currentStatus = query?.data?.status.toLowerCase();
      const isCompleted = currentStatus === IMPORT_STATUS.COMPLETED;
      const previousStatus = previousStatusRef.current;
      const statusChangedToCompleted =
        isCompleted &&
        previousStatus !== IMPORT_STATUS.COMPLETED &&
        !hasHandledCompletionRef.current;

      // Update the progress item with latest data
      updateItem(progressItemId, {
        title: query.data.title,
        platform: query.data.platform,
        thumbnailUri: query.data.thumbnailUri,
        status: isCompleted
          ? IMPORT_STATUS.COMPLETED
          : IMPORT_STATUS.PROCESSING,
        percentage: query.data.percentage,
        targetPercentage: query.data.targetPercentage,
        hasRecommendations: query.data.hasRecommendations,
      });

      // Only handle completion once when status transitions to COMPLETED
      if (statusChangedToCompleted) {
        hasHandledCompletionRef.current = true;
        handleImportCompletion(queryClient, extractionId ?? undefined);
      }

      // Update previous status for next comparison
      previousStatusRef.current = currentStatus;
    }
  }, [query.data, progressItemId, updateItem, queryClient]);

  useEffect(() => {
    if (query.error && progressItemId) {
      // Only mark as failed if it's not a background network error
      // Background network errors are expected and will be resolved
      // when app returns to foreground
      const isBackgroundNetworkError =
        appState.current === "background" && isNetworkRequestError(query.error);

      if (!isBackgroundNetworkError) {
        // Update with error state for real errors
        updateItem(progressItemId, {
          status: IMPORT_STATUS.FAILED,
          error: "Import failed",
        });

        reportError(query.error, {
          component: "ImportExtract",
          action: "Get Import Status",
          extra: { progressItemId },
        });
      } else {
        // Log background network error but don't mark as failed
        console.log(
          "Background network error (expected), will retry when app returns to foreground:",
          [query.error, progressItemId],
        );
      }
    }
  }, [query.error, progressItemId, updateItem]);

  // Handle timeout case
  useEffect(() => {
    if (!progressItemId || !startTimeRef.current) return;

    const checkTimeout = () => {
      const startTime = startTimeRef.current;
      if (!startTime) return;

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= MAX_POLLING_DURATION_MS) {
        // Mark as failed due to timeout
        updateItem(progressItemId, {
          status: IMPORT_STATUS.FAILED,
          error: "Import process timed out",
        });

        reportError(new Error("Import process timed out"), {
          component: "ImportExtract",
          action: "Import Timeout",
          extra: { progressItemId, elapsedTime },
        });
      }
    };

    // Check timeout
    const timeoutInterval = setInterval(
      checkTimeout,
      TIMEOUT_CHECK_INTERVAL_MS,
    );

    return () => {
      clearInterval(timeoutInterval);
    };
  }, [progressItemId, updateItem]);

  return query;
};
