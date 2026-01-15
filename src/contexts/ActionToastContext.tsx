// External Dependencies
import type React from "react";
import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";

/**
 * Parameters for showing a toast notification
 */
export interface ActionToastParams {
  // Main message (can be string or React element)
  text: string | ReactNode;
  // Optional thumbnail image
  thumbnailUri?: string | null;
  // CTA button configuration - if provided, shows button
  cta?: { text: string; onPress: () => void };
  // Callback executed when toast auto-closes
  onDismiss?: () => void;
}

interface ActionToastState {
  isVisible: boolean;
  text: string | ReactNode;
  thumbnailUri: string | null;
  cta: { text: string; onPress: () => void } | null;
}

/**
 * Methods exposed by the ActionToast component via ref
 */
export interface ActionToastRef {
  forceExit: () => void;
}

interface ActionToastContextType {
  toast: ActionToastState;
  showToast: (params: ActionToastParams) => void;
  hideToast: () => void;
  // Dismiss toast without calling onDismiss (for CTA press)
  dismissToast: () => void;
  // Register toast component ref for communication
  registerToastRef: (ref: ActionToastRef | null) => void;
  // Called by toast component when exit animation completes
  onExitComplete: () => void;
}

interface ActionToastProviderProps {
  children: ReactNode;
}

// Create context
const ActionToastContext = createContext<ActionToastContextType | undefined>(undefined);

// ActionToastProvider
export const ActionToastProvider: React.FC<ActionToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ActionToastState>({
    text: "",
    cta: null,
    isVisible: false,
    thumbnailUri: null,
  });

  // Store onDismiss callback in ref to avoid it being part of state
  const onDismissRef = useRef<(() => void) | undefined>(undefined);

  // Queue for pending toasts
  const queueRef = useRef<ActionToastParams[]>([]);

  // Track if toast is currently animating (showing or hiding)
  const isAnimatingRef = useRef(false);

  // Ref to the toast component for triggering exit
  const toastRefRef = useRef<ActionToastRef | null>(null);

  /**
   * Register the toast component ref
   */
  const registerToastRef = useCallback((ref: ActionToastRef | null) => {
    toastRefRef.current = ref;
  }, []);

  /**
   * Process the next toast in the queue
   */
  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }

    const nextToast = queueRef.current.shift();
    if (!nextToast) {
      isAnimatingRef.current = false;
      return;
    }

    // Store callback in ref
    onDismissRef.current = nextToast.onDismiss;

    // Show the next toast
    setToast({
      isVisible: true,
      text: nextToast.text,
      cta: nextToast.cta ?? null,
      thumbnailUri: nextToast.thumbnailUri ?? null,
    });

    isAnimatingRef.current = true;
  }, []);

  /**
   * Called by toast component when exit animation completes
   */
  const onExitComplete = useCallback(() => {
    // Execute onDismiss callback if present
    if (onDismissRef.current) {
      onDismissRef.current();
    }

    // Clear callback
    onDismissRef.current = undefined;

    // Process next toast in queue (this will either show next toast or clear state)
    if (queueRef.current.length > 0) {
      // There's a queued toast, process it directly without clearing state first
      const nextToast = queueRef.current.shift();
      if (nextToast) {
        // Store callback in ref
        onDismissRef.current = nextToast.onDismiss;

        // Show the next toast directly
        setToast({
          isVisible: true,
          text: nextToast.text,
          cta: nextToast.cta ?? null,
          thumbnailUri: nextToast.thumbnailUri ?? null,
        });

        isAnimatingRef.current = true;
      } else {
        // Queue was empty, clear state
        setToast({
          text: "",
          isVisible: false,
          thumbnailUri: null,
          cta: null,
        });
        isAnimatingRef.current = false;
      }
    } else {
      // No queued toast, clear state
      setToast({
        text: "",
        isVisible: false,
        thumbnailUri: null,
        cta: null,
      });
      isAnimatingRef.current = false;
    }
  }, []);

  /**
   * Show the action toast
   * @param params - Toast parameters
   */
  const showToast = useCallback((params: ActionToastParams) => {
    // If a toast is currently visible and animating, queue this one
    if (toast.isVisible && isAnimatingRef.current) {
      queueRef.current.push(params);
      // Trigger exit animation for current toast
      toastRefRef.current?.forceExit();
      return;
    }

    // Store callback in ref
    onDismissRef.current = params.onDismiss;

    // Show immediately
    setToast({
      isVisible: true,
      text: params.text,
      cta: params.cta ?? null,
      thumbnailUri: params.thumbnailUri ?? null,
    });

    isAnimatingRef.current = true;
  }, [toast.isVisible]);

  /**
   * Hide the action toast and execute the onDismiss callback if present
   * Called when toast auto-closes (action is confirmed)
   * Note: The actual state clearing and queue processing happens in onExitComplete
   * after the exit animation completes.
   */
  const hideToast = useCallback(() => {
    // Trigger exit animation - onExitComplete will handle the rest
    toastRefRef.current?.forceExit();
  }, []);

  /**
   * Dismiss the toast without executing onDismiss callback
   * Called when CTA button is pressed (action is cancelled/undone)
   */
  const dismissToast = useCallback(() => {
    // Clear callback without executing
    onDismissRef.current = undefined;

    // Clear toast state
    setToast({
      text: "",
      cta: null,
      isVisible: false,
      thumbnailUri: null,
    });

    // Process next toast in queue
    isAnimatingRef.current = false;
    processQueue();
  }, [processQueue]);

  const value: ActionToastContextType = useMemo(
    () => ({
      toast,
      showToast,
      hideToast,
      dismissToast,
      registerToastRef,
      onExitComplete,
    }),
    [toast, showToast, hideToast, dismissToast, registerToastRef, onExitComplete],
  );

  return (
    <ActionToastContext.Provider value={value}>
      {children}
    </ActionToastContext.Provider>
  );
};

/**
 * Hook to use the ActionToast context
 * @returns The ActionToast context
 */
export const useActionToast = (): ActionToastContextType => {
  const context = useContext(ActionToastContext);
  if (context === undefined) {
    throw new Error("useActionToast must be used within an ActionToastProvider");
  }
  return context;
};
