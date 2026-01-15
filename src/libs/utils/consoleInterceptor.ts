// External Dependencies
import * as Sentry from "@sentry/react-native";

const originalConsoleError = console.error;

/**
 * Extract component/file name from stack trace
 * This provides automatic context without requiring explicit reportError calls
 */
const extractContextFromStack = (error: Error): {
  component?: string;
  file?: string;
  function?: string;
} => {
  const stack = error.stack || "";
  const stackLines = stack.split("\n");

  // Look for React component or function name in stack
  for (const line of stackLines) {
    // Match patterns like:
    // - at ComponentName (file:///path/to/file.tsx:123:45)
    // - at functionName (file:///path/to/file.tsx:123:45)
    // - at Object.functionName (file:///path/to/file.tsx:123:45)
    const functionMatch = line.match(/at\s+(?:Object\.)?(\w+)\s*\(/);
    const fileMatch = line.match(/\(([^)]+\.(tsx?|jsx?)):\d+:\d+\)/);

    if (functionMatch || fileMatch) {
      const fileName = fileMatch?.[1]?.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "");
      const functionName = functionMatch?.[1];

      // Prefer component-like names (PascalCase) or meaningful function names
      if (functionName && (functionName[0] === functionName[0].toUpperCase() || functionName.length > 3)) {
        return {
          component: functionName,
          file: fileName,
          function: functionName,
        };
      }

      if (fileName) {
        return {
          file: fileName,
          function: functionName,
        };
      }
    }
  }

  return {};
};

/**
 * Check if error is a network error
 */
const isNetworkError = (error: Error): boolean => {
  const networkIndicators = [
    "network",
    "fetch",
    "timeout",
    "connection",
    "offline",
    "no internet",
    "network request failed",
  ];

  const message = error.message.toLowerCase();
  return networkIndicators.some((indicator) => message.includes(indicator));
};

/**
 * Setup console.error interceptor as the PRIMARY error reporting mechanism
 *
 * Architecture: This is the main way errors are reported to Sentry.
 * - Automatically catches all console.error calls
 * - Extracts component/file context from stack traces
 * - Filters expected errors (user cancellations, etc.)
 * - Tags network errors for better filtering
 *
 * For critical business logic (payments, auth, critical mutations),
 * use explicit reportError() calls for additional context.
 */
export const setupConsoleErrorInterceptor = () => {
  // Only intercept in production
  if (__DEV__) {
    return;
  }

  console.error = (...args: any[]) => {
    // Extract error information
    const errorMessage = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === "string") {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    // Check if it's already an Error object
    const error = args.find((arg) => arg instanceof Error);

    // Filter out common expected errors that shouldn't go to Sentry
    const shouldIgnore = (err: Error | string): boolean => {
      const message = typeof err === "string" ? err : err.message;
      const lowerMessage = message.toLowerCase();

      // Ignore common user-initiated cancellations and expected errors
      const ignoredPatterns = [
        "user cancelled",
        "user canceled",
        "cancelled by user",
        "canceled by user",
        "request was cancelled",
        "request was canceled",
        "aborted",
        "no user data received", // Google Sign-In cancellation
        "err_request_canceled", // Apple Sign-In cancellation
      ];

      return ignoredPatterns.some((pattern) => lowerMessage.includes(pattern));
    };

    // Only send to Sentry if not ignored
    if (!shouldIgnore(error || errorMessage)) {
      // Extract context from stack trace
      const context = error ? extractContextFromStack(error) : {};

      const tags: Record<string, string> = {
        source: "console.error",
        errorHandling: "automatic",
      };

      // Add extracted context as tags
      if (context.component) {
        tags.component = context.component;
      }
      if (context.file) {
        tags.file = context.file;
      }

      // Tag network errors for better filtering
      if (error && isNetworkError(error)) {
        tags.errorType = "network";
      }

      if (error) {
        Sentry.captureException(error, {
          tags,
          extra: {
            // Include all console.error arguments for context
            consoleArgs: args.map((arg) => {
              if (arg instanceof Error) {
                return {
                  type: "Error",
                  message: arg.message,
                  stack: arg.stack,
                };
              }
              return arg;
            }),
            extractedContext: context,
          },
        });
      } else {
        // Create a new error from the console message
        Sentry.captureMessage(errorMessage, {
          level: "error",
          tags,
          extra: {
            consoleArgs: args,
            extractedContext: context,
          },
        });
      }
    }

    // Always call original console.error for debugging
    originalConsoleError.apply(console, args);
  };
};
