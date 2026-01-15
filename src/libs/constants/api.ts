import Constants from "expo-constants";

export const TRIPSPIRE_API_BASE_URL =
  Constants.expoConfig?.extra?.TRIPSPIRE_API_BASE_URL;

export const API_ENDPOINTS = {
  // User
  AUTH_ME_V1: `${TRIPSPIRE_API_BASE_URL}/v1/auth/me`,
  USER_QUOTA_V1: `${TRIPSPIRE_API_BASE_URL}/v1/user/quota`,

  // Auth
  AUTH_SOCIAL_V1: `${TRIPSPIRE_API_BASE_URL}/v1/auth/social`,
  AUTH_LOGOUT_V1: `${TRIPSPIRE_API_BASE_URL}/v1/auth/logout`,

  // Extractions
  EXTRACT_V1: `${TRIPSPIRE_API_BASE_URL}/v1/extract`,
  EXTRACTIONS_LIST_V1: `${TRIPSPIRE_API_BASE_URL}/v1/extractions`,

  // Recommendations
  RECOMMENDATIONS_V1: `${TRIPSPIRE_API_BASE_URL}/v1/recommendations`,

  // Collections
  COLLECTIONS_V1: `${TRIPSPIRE_API_BASE_URL}/v1/collections`,
  EXTRACTIONS_STATUS_V1: `${TRIPSPIRE_API_BASE_URL}/v1/extractions/{slug}/status`,
  RECOMMENDATIONS_V1_AMENITIES: `${TRIPSPIRE_API_BASE_URL}/v1/recommendations/{slug}/amenities`,

  // Reports
  USER_FEEDBACK_V1: `${TRIPSPIRE_API_BASE_URL}/v1/user-feedback`,

  // Account
  ACCOUNT_DELETION_REQUEST_V1: `${TRIPSPIRE_API_BASE_URL}/v1/account/deletion-request`,

  // User
  USER_ONBOARDING_COMPLETE: `${TRIPSPIRE_API_BASE_URL}/v1/user/onboarding/complete`,

  // Wishlists
  WISHLISTS_V1: `${TRIPSPIRE_API_BASE_URL}/v1/wishlists`,

  // Notes
  NOTES_V1: `${TRIPSPIRE_API_BASE_URL}/v1/notes`,
  WISHLIST_NOTE_V1: `${TRIPSPIRE_API_BASE_URL}/v1/wishlists/{wishlistId}/recommendations/{recommendationId}/notes`,
} as const;

// Helper function to get the API client with base URL
export const getApiClient = () => {
  const { getApiClient } = require("@/libs/api/client");
  return getApiClient(TRIPSPIRE_API_BASE_URL);
};
