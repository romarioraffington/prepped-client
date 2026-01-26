import * as Sentry from "@sentry/react-native";
import { fetch as expoFetch } from "expo/fetch";
// External Dependencies
import { Alert } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { APIError, type BackendErrorResponse, isAuthError } from "./errors";
// Internal Dependencies
import { withRetry } from "./retry";

interface ApiClientOptions extends RequestInit {
  retry?: boolean;
  maxRetries?: number;
}

/**
 * Authenticated API client
 * @description A client for making authenticated API requests
 */
class AuthenticatedApiClient {
  public baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication headers from the auth store
   * @description Returns the authentication headers from the auth store
   */
  private getAuthHeaders(): HeadersInit {
    const { tokens, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !tokens?.identityToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${tokens.identityToken}`,
    };
  }

  /**
   * Make an authenticated API request
   * @description Makes an authenticated API request
   *
   * @param endpoint - The endpoint to make the request to
   * @param options - The options for the request
   * @returns The response from the API
   */
  async request<T = any>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T | undefined> {
    const { retry = true, maxRetries = 3, ...fetchOptions } = options;

    const makeRequest = async (): Promise<T> => {
      const authHeaders = this.getAuthHeaders();

      // Merge headers
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
        ...fetchOptions.headers,
      };

      // Build full URL
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${this.baseURL}${endpoint}`;

      // Use native fetch in development for Radon IDE network tab visibility,
      // expo/fetch in production for streaming support and WinterCG compliance
      let response: Response;

      if (__DEV__) {
        // Development: Native fetch handles null/undefined values properly
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        // Production: expo/fetch doesn't accept null values, clean them
        const cleanFetchOptions: {
          method?: string;
          headers?: HeadersInit;
          body?: BodyInit;
          signal?: AbortSignal;
          cache?: RequestCache;
          credentials?: RequestCredentials;
          integrity?: string;
          keepalive?: boolean;
          mode?: RequestMode;
          redirect?: RequestRedirect;
          referrer?: string;
          referrerPolicy?: ReferrerPolicy;
        } = {};

        if (fetchOptions.method) cleanFetchOptions.method = fetchOptions.method;
        if (headers) cleanFetchOptions.headers = headers;
        if (fetchOptions.body !== null && fetchOptions.body !== undefined) {
          cleanFetchOptions.body = fetchOptions.body;
        }
        if (fetchOptions.signal !== null && fetchOptions.signal !== undefined) {
          cleanFetchOptions.signal = fetchOptions.signal;
        }
        if (fetchOptions.cache) cleanFetchOptions.cache = fetchOptions.cache;
        if (fetchOptions.credentials)
          cleanFetchOptions.credentials = fetchOptions.credentials;
        if (fetchOptions.integrity)
          cleanFetchOptions.integrity = fetchOptions.integrity;
        if (fetchOptions.keepalive !== undefined)
          cleanFetchOptions.keepalive = fetchOptions.keepalive;
        if (fetchOptions.mode) cleanFetchOptions.mode = fetchOptions.mode;
        if (fetchOptions.redirect)
          cleanFetchOptions.redirect = fetchOptions.redirect;
        if (fetchOptions.referrer)
          cleanFetchOptions.referrer = fetchOptions.referrer;
        if (fetchOptions.referrerPolicy)
          cleanFetchOptions.referrerPolicy = fetchOptions.referrerPolicy;

        response = await expoFetch(url, cleanFetchOptions);
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorBody: BackendErrorResponse;
        try {
          errorBody = await response.json();
        } catch {
          // If response is not JSON,
          // create a generic error
          errorBody = {
            message: response.statusText || "Request failed",
            error_code: `HTTP_${response.status}`,
            errors: {},
          };
        }

        throw APIError.fromResponse(response.status, errorBody);
      }

      // Handle 204 No Content - no body to parse
      if (response.status === 204) {
        return undefined as T;
      }

      // Check if response has content before parsing
      const contentType = response.headers.get("content-type");
      if (
        !contentType ||
        typeof contentType !== "string" ||
        !contentType.includes("application/json")
      ) {
        return undefined as T;
      }

      return await response.json();
    };

    try {
      if (retry) {
        return await withRetry(makeRequest, maxRetries);
      }
      return await makeRequest();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);

      Sentry.captureException(error, {
        tags: {
          component: "API Client",
          endpoint: endpoint,
          method: options.method || "GET",
        },
        extra: {
          url: endpoint.startsWith("http")
            ? endpoint
            : `${this.baseURL}${endpoint}`,
          retry: retry,
          maxRetries: maxRetries,
        },
      });

      // Handle auth errors after retry logic
      if (isAuthError(error)) {
        useAuthStore.getState().clearAuthentication();

        Alert.alert(
          "Session Expired",
          error.message || "Please sign in again to continue.",
          [{ text: "OK" }],
        );
        return;
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options: ApiClientOptions = {},
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options: ApiClientOptions = {},
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Create singleton instance
let apiClient: AuthenticatedApiClient | null = null;

/**
 * Get the authenticated API client instance
 */
export const getApiClient = (baseURL?: string): AuthenticatedApiClient => {
  if (!apiClient || (baseURL && apiClient.baseURL !== baseURL)) {
    apiClient = new AuthenticatedApiClient(baseURL || "");
  }
  return apiClient;
};

/**
 * Hook to use the authenticated API client in React components
 */
export const useApiClient = () => {
  const { isAuthenticated, tokens } = useAuthStore();

  return {
    isAuthenticated,
    client: getApiClient(),
    hasValidToken: !!tokens?.identityToken,
  };
};

export default AuthenticatedApiClient;
