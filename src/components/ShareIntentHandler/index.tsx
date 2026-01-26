import { useShareIntentContext } from "expo-share-intent";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";

import { useImportContent } from "@/hooks/useImportContent";
// Internal Dependencies
import { reportError } from "@/libs/utils";

/**
 * Component that handles share intent imports with queuing support
 * This component doesn't render anything - it just manages the share intent logic.
 *
 * Features:
 * - Queues multiple shares to process sequentially
 * - Prevents duplicate URL processing
 * - Each share makes its own backend request
 *
 * Must be placed inside ImportProgressProvider context
 */
export const ShareIntentHandler: React.FC = () => {
  const { importContent } = useImportContent();

  const { error, shareIntent, hasShareIntent, resetShareIntent } =
    useShareIntentContext();

  // Queue for storing incoming share URLs
  const shareQueueRef = useRef<string[]>([]);

  // Track if currently processing a share
  const isProcessingRef = useRef(false);

  // Track last processed URL to avoid duplicates
  const lastProcessedUrlRef = useRef<string | null>(null);

  /**
   * Process the next share from the queue
   * Each share makes its own backend request via importContent()
   */
  const processNextShare = useCallback(() => {
    // If already processing or queue is empty, do nothing
    if (isProcessingRef.current || shareQueueRef.current.length === 0) {
      return;
    }

    // Get next URL from queue
    const urlToProcess = shareQueueRef.current.shift();
    if (!urlToProcess) {
      return;
    }

    // Mark as processing
    isProcessingRef.current = true;
    lastProcessedUrlRef.current = urlToProcess;

    // Process this share - makes new backend request
    importContent(urlToProcess, {
      onSuccess: () => {
        // Mark as done and process next
        isProcessingRef.current = false;
        processNextShare();
      },
      onError: () => {
        // Mark as done and process next even on error
        isProcessingRef.current = false;
        processNextShare();
      },
    });
  }, [importContent]);

  /**
   * Handle share intent errors
   */
  useEffect(() => {
    if (error) {
      reportError(error, {
        component: "ShareIntentHandler",
        action: "Handle Share Intent",
      });
      resetShareIntent();
    }
  }, [error, resetShareIntent]);

  /**
   * Handle share intent - add to queue for processing
   */
  useEffect(() => {
    if (!hasShareIntent) {
      return;
    }

    const urlToProcess = extractUrlFromShareIntent(shareIntent);
    if (!urlToProcess) {
      Alert.alert("Oops.. 🤔", "Looks like no links were found");
      resetShareIntent();
      return;
    }

    // Check if this URL was just processed (avoid immediate duplicates)
    if (urlToProcess === lastProcessedUrlRef.current) {
      resetShareIntent();
      return;
    }

    // Check if URL is already in queue
    if (shareQueueRef.current.includes(urlToProcess)) {
      resetShareIntent();
      return;
    }

    // Add to queue
    shareQueueRef.current.push(urlToProcess);

    // Reset share intent so we can receive new shares
    resetShareIntent();

    // Start processing queue
    processNextShare();
  }, [shareIntent, hasShareIntent, resetShareIntent, processNextShare]);

  return null;
};

// Extract URL from share intent data
const extractUrlFromShareIntent = (shareIntent: {
  webUrl?: string | null;
  text?: string | null;
}): string | null => {
  // Check for direct webUrl first (most reliable)
  if (shareIntent.webUrl) {
    return shareIntent.webUrl;
  }

  // Fallback to extracting URL from text
  if (shareIntent.text) {
    const urlMatch = shareIntent.text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
  }

  return null;
};
