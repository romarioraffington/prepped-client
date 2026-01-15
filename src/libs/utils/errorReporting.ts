// External Dependencies
import * as Sentry from "@sentry/react-native";

interface ErrorContext {
  component: string;
  action: string;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
  level?: "error" | "warning" | "info";
  skipBreadcrumb?: boolean;
  shouldIgnore?: (error: Error) => boolean;
}

/**
 * Normalize unknown error to Error object
 * Best Practice: Always convert to Error for consistent handling
 */
const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown error occurred");
  }
};

/**
 * Check if error should be ignored (user cancellations, expected errors)
 * Best Practice: Filter out noise to focus on actionable errors
 */
const shouldIgnoreError = (
  error: Error,
  shouldIgnore?: (error: Error) => boolean,
): boolean => {
  if (shouldIgnore) {
    return shouldIgnore(error);
  }

  // Ignore common user-initiated cancellations
  const ignoredMessages = [
    "user cancelled",
    "user canceled",
    "cancelled by user",
    "canceled by user",
  ];

  const message = error.message.toLowerCase();
  return ignoredMessages.some((ignored) => message.includes(ignored));
};

/**
 * Check if error is a network error
 * Best Practice: Tag network errors for better filtering in Sentry
 */
const isNetworkError = (error: Error): boolean => {
  const networkIndicators = [
    "network",
    "fetch",
    "timeout",
    "connection",
    "offline",
    "no internet",
  ];

  const message = error.message.toLowerCase();
  return networkIndicators.some((indicator) => message.includes(indicator));
};

/**
 * Report error to Sentry with rich business context
 *
 * Architecture Note: This is for CRITICAL business logic only (payments, auth, critical mutations).
 * For general error reporting, use console.error() - it will be automatically captured
 * by the console interceptor with context extracted from stack traces.
 *
 * Use reportError() when you need:
 * - Business context (user IDs, transaction IDs, etc.)
 * - Custom error grouping (fingerprinting)
 * - Per-call-site error filtering
 * - Explicit component/action tags for critical flows
 *
 * Best practices:
 * - Normalizes error to Error object
 * - Adds breadcrumbs for context
 * - Filters ignored errors
 * - Adds fingerprinting for grouping
 * - Tags network errors
 */
export const reportError = (error: unknown, context: ErrorContext) => {
  const normalizedError = normalizeError(error);

  console.error(`${context.component} - ${context.action}:`, normalizedError);

  // Check if error should be ignored
  if (shouldIgnoreError(normalizedError, context.shouldIgnore)) {
    return;
  }

  if (!__DEV__) {
    // Add breadcrumb before capturing error (best practice for context)
    if (!context.skipBreadcrumb) {
      Sentry.addBreadcrumb({
        message: `${context.component} - ${context.action}`,
        category: "error",
        level: "error",
        data: {
          errorMessage: normalizedError.message,
          ...context.extra,
        },
      });
    }

    const tags: Record<string, string> = {
      component: context.component,
      action: context.action,
      source: "explicit", // Mark as explicit reportError call (vs automatic console interceptor)
      errorHandling: "explicit",
    };

    // Tag network errors for better filtering
    if (isNetworkError(normalizedError)) {
      tags.errorType = "network";
    }

    const sentryOptions: {
      tags: Record<string, string>;
      extra: Record<string, unknown>;
      fingerprint?: string[];
    } = {
      tags,
      extra: {
        ...context.extra,
        originalError: error,
      },
    };

    // Add fingerprinting for better error grouping
    if (context.fingerprint) {
      sentryOptions.fingerprint = context.fingerprint;
    }

    Sentry.captureException(normalizedError, sentryOptions);
  }
};

/**
 * Report warning message to Sentry
 * Best Practice: Use for non-critical issues that need monitoring
 */
export const reportWarning = (message: string, context: ErrorContext) => {
  console.warn(`${context.component} - ${context.action}:`, message);

  if (!__DEV__) {
    if (!context.skipBreadcrumb) {
      Sentry.addBreadcrumb({
        message: `${context.component} - ${context.action}`,
        category: "warning",
        level: "warning",
        data: context.extra,
      });
    }

    Sentry.captureMessage(message, {
      level: context.level || "warning",
      tags: {
        component: context.component,
        action: context.action,
      },
      extra: context.extra,
    });
  }
};

/**
 * Report info message to Sentry
 * Best Practice: Use for tracking important events (not errors)
 */
export const reportInfo = (message: string, context: ErrorContext) => {
  console.info(`${context.component} - ${context.action}:`, message);

  if (!__DEV__) {
    Sentry.captureMessage(message, {
      level: "info",
      tags: {
        component: context.component,
        action: context.action,
      },
      extra: context.extra,
    });
  }
};
