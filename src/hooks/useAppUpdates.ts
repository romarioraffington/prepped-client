import { useEffect, useState, useCallback, useMemo } from "react";
import * as Updates from "expo-updates";

import { reportError } from "@/libs/utils";

interface UseAppUpdatesReturn {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  isCheckingUpdate: boolean;
  error: Error | null;
  checkForUpdates: () => Promise<void>;
  fetchAndReload: () => Promise<void>;
}

/**
 * Hook to handle app updates with automatic checking and manual fallback
 * Works in development builds, preview, and production builds
 * (Updates.isEnabled will be false in Expo Go, which doesn't support updates)
 */
export function useAppUpdates(): UseAppUpdatesReturn {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Determine if we're in a build that supports updates
  const canCheckUpdates = useMemo(() => {
    // Updates.isEnabled will be true in development builds, preview, and production
    // but false in Expo Go (which doesn't support updates)
    return Updates.isEnabled;
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!canCheckUpdates) {
      return;
    }

    try {
      setIsCheckingUpdate(true);
      setError(null);

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setIsUpdateAvailable(true);
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (err) {
      // Return early if this is a development builds error
      if (err instanceof Error && err.message?.includes("development builds")) {
        return;
      }

      const error =
        err instanceof Error ? err : new Error("Failed to check for updates");

      setError(error);
      setIsUpdateAvailable(false);
      reportError(error, {
        component: "AppUpdates",
        action: "Check For Updates",
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [canCheckUpdates]);

  const fetchAndReload = useCallback(async () => {
    if (!canCheckUpdates || !isUpdateAvailable) {
      return;
    }

    try {
      setIsUpdatePending(true);
      setError(null);

      // Fetch the update
      await Updates.fetchUpdateAsync();

      // Reload the app to apply the update
      await Updates.reloadAsync();
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to fetch or apply update");
      setError(error);
      setIsUpdatePending(false);
      reportError(error, {
        component: "AppUpdates",
        action: "Fetch And Reload",
      });
      // Don't throw - allow manual retry
    }
  }, [canCheckUpdates, isUpdateAvailable]);

  // Automatically check for updates on mount (in all builds that support updates)
  useEffect(() => {
    if (canCheckUpdates) {
      checkForUpdates().catch((err) => {
        reportError(err, {
          component: "AppUpdates",
          action: "Automatic Update Check",
        });
      });
    }
  }, [canCheckUpdates, checkForUpdates]);

  return {
    isUpdateAvailable,
    isUpdatePending,
    isCheckingUpdate,
    error,
    checkForUpdates,
    fetchAndReload,
  };
}
