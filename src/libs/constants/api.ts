import Constants from "expo-constants";

export const API_SERVER_BASE_URL =
  Constants.expoConfig?.extra?.API_SERVER_BASE_URL || "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
  // User
  AUTH_ME_V1: `${API_SERVER_BASE_URL}/api/v1/auth/me`,
  USER_QUOTA_V1: `${API_SERVER_BASE_URL}/api/v1/user/quota`,

  // Auth
  AUTH_SOCIAL_V1: `${API_SERVER_BASE_URL}/api/v1/auth/social`,
  AUTH_LOGOUT_V1: `${API_SERVER_BASE_URL}/api/v1/auth/logout`,

  // Extractions
  EXTRACT_V1: `${API_SERVER_BASE_URL}/api/v1/extract`,

  // Recipes
  RECIPES_LIST_V1: `${API_SERVER_BASE_URL}/api/v1/recipes`,

  // Recommendations
  RECOMMENDATIONS_V1: `${API_SERVER_BASE_URL}/api/v1/recommendations`,

  // Collections
  COLLECTIONS_V1: `${API_SERVER_BASE_URL}/api/v1/collections`,
  EXTRACTIONS_STATUS_V1: `${API_SERVER_BASE_URL}/api/v1/extractions/{slug}/status`,
  RECOMMENDATIONS_V1_AMENITIES: `${API_SERVER_BASE_URL}/api/v1/recommendations/{slug}/amenities`,

  // Reports
  USER_FEEDBACK_V1: `${API_SERVER_BASE_URL}/api/v1/user-feedback`,

  // Account
  ACCOUNT_DELETION_REQUEST_V1: `${API_SERVER_BASE_URL}/api/v1/account/deletion-request`,

  // User
  USER_ONBOARDING_COMPLETE: `${API_SERVER_BASE_URL}/api/v1/user/onboarding/complete`,

  // Wishlists
  WISHLISTS_V1: `${API_SERVER_BASE_URL}/api/v1/wishlists`,

  // Notes
  NOTES_V1: `${API_SERVER_BASE_URL}/api/v1/notes`,
  WISHLIST_NOTE_V1: `${API_SERVER_BASE_URL}/api/v1/wishlists/{wishlistId}/recommendations/{recommendationId}/notes`,
} as const;

// Helper function to get the API client with base URL
export const getApiClient = () => {
  const { getApiClient } = require("@/libs/api/client");
  return getApiClient(API_SERVER_BASE_URL);
};
