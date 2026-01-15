import { API_ERROR_CODES } from "@/libs/constants/APIErrorCodes";

/**
 * Backend error response shape
 */
export interface BackendErrorResponse {
  message: string;
  error_code: string;
  errors: Record<string, unknown>;
}

/**
 * Standardized API error class that matches backend error responses
 */
export class APIError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly errorCode: string,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "APIError";
  }

  /**
   * Create APIError from backend error response
   */
  static fromResponse(
    httpStatus: number,
    body: BackendErrorResponse,
  ): APIError {
    return new APIError(httpStatus, body.error_code, body.message, body.errors);
  }
}

/**
 * Type guard to check if error is an APIError
 */
export const isAPIError = (error: unknown): error is APIError => {
  return error instanceof APIError;
};

/**
 * Check if error is authentication-related
 * Trusts backend's explicit error_code first, with HTTP status as fallback
 */
export const isAuthError = (error: unknown): error is APIError => {
  if (!isAPIError(error)) return false;

  return (
    error.errorCode === API_ERROR_CODES.UNAUTHENTICATED ||
    error.httpStatus === 401
  );
};

/**
 * Check if error is quota-related
 * Trusts backend's explicit error_code first, with HTTP status as fallback
 */
export const isQuotaError = (error: unknown): error is APIError => {
  if (!isAPIError(error)) return false;

  return (
    error.errorCode === API_ERROR_CODES.QUOTA_EXCEEDED ||
    (error.httpStatus === 403 && error.errorCode.includes("QUOTA"))
  );
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: unknown): error is APIError => {
  if (!isAPIError(error)) return false;

  return error.httpStatus >= 500 && error.httpStatus < 600;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: unknown): error is APIError => {
  if (!isAPIError(error)) return false;

  return error.httpStatus >= 400 && error.httpStatus < 500;
};

/**
 * Check if error is a network request failure
 * This handles React Native's specific "Network request failed" error message
 */
export const isNetworkRequestError = (error: unknown): error is Error => {
  return (
    error instanceof Error && error.message?.includes("Network request failed")
  );
};
