import {
  isAPIError,
  isAuthError,
  isQuotaError,
  isNetworkRequestError,
} from "./errors";

/**
 * Determine if a request should be retried based on error type and attempt count
 * @param error - The error that occurred
 * @param attempt - Current attempt number (0-based)
 * @param maxRetries - Maximum number of retries allowed
 * @param appState - Current app state (optional, for network-aware retries)
 * @returns Whether the request should be retried
 */
export const isRequestRetryable = (
  error: unknown,
  attempt: number,
  maxRetries: number,
  appState?: string,
): boolean => {
  // Don't retry if max attempts reached
  if (attempt >= maxRetries) return false;

  // Don't retry auth or quota errors
  if (isAuthError(error) || isQuotaError(error)) return false;

  // Don't retry network failures when app is backgrounded
  // This prevents unnecessary retry attempts that will fail due to background restrictions
  if (isNetworkRequestError(error) && appState === "background") {
    return false;
  }

  // Retry on 5xx server errors
  if (isAPIError(error)) {
    return error.httpStatus >= 500 && error.httpStatus < 600;
  }

  // Retry on network errors when app is active (transient network issues)
  if (isNetworkRequestError(error) && appState === "active") {
    return true;
  }

  return false;
};

/**
 * Create a retry wrapper for API calls with app state awareness
 * @description Creates a retry wrapper for API calls that handles network failures
 * gracefully based on app state
 *
 * @param apiCall - The API call to retry
 * @param maxRetries - The maximum number of retries
 * @param delay_ms - The delay in milliseconds between retries
 * @param appState - Current app state (optional, for network-aware retries)
 * @returns The result of the API call
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delay_ms = 1000,
  appState?: string,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Use enhanced retry logic that considers app state
      if (!isRequestRetryable(error, attempt, maxRetries, appState)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay_ms * 2 ** attempt),
        );
      }
    }
  }

  throw lastError || new Error("Unknown error occurred");
};
