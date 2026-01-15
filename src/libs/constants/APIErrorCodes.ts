/**
 * API Error Codes
 * Backend error codes that our app handles specifically
 */

export const API_ERROR_CODES = {
  // Authentication errors
  UNAUTHENTICATED: "UNAUTHENTICATED",

  // Quota/Subscription errors
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // Add more as needed
  // VALIDATION_ERROR: "VALIDATION_ERROR",
  // RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Helper to check if an error code is an API-specific error
 */
export const isApiErrorCode = (code: string): code is ApiErrorCode => {
  return Object.values(API_ERROR_CODES).includes(code as ApiErrorCode);
};
