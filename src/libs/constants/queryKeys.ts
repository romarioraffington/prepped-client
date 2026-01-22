/**
 * Centralized React Query keys
 *
 * This file contains all query keys used throughout the application.
 * Using constants ensures consistency and makes refactoring easier.
 */
const NOTES_BASE = "notes";
const AMENITIES_BASE = "amenities";
const RECIPE_DETAILS_BASE = "recipe-details";
const EXTRACTION_STATUS_BASE = "extraction-status";
const COOKBOOK_DETAILS_BASE = "cookbook-details";
const RECOMMENDATION_PHOTOS_BASE = "recommendation-photos";
const RECOMMENDATION_DETAILS_BASE = "recommendation-details";
const RECIPE_RECOMMENDATIONS_BASE = "recipe-recommendations";
const WISHLIST_RECOMMENDATIONS_BASE = "wishlist-recommendations";
const COOKBOOK_RECOMMENDATIONS_BASE = "cookbook-recommendations";

export const QUERY_KEYS = {
  // Recipe
  RECIPES: "recipes",
  RECIPE_QUOTA: "recipeQuota",

  // Recipe Details
  RECIPE_DETAILS_BASE,
  RECIPE_DETAILS: (id: string) => [RECIPE_DETAILS_BASE, id] as const,

  // Recipe Recommendations
  // (query key to fetch recipe recommendations to display on the map screen)
  // i.e recipes/[slug]/recommendations
  RECIPE_RECOMMENDATIONS_BASE,
  RECIPE_RECOMMENDATIONS: (recipeId: string) =>
    [RECIPE_RECOMMENDATIONS_BASE, recipeId] as const,

  // Cookbook
  COOKBOOKS: "cookbooks",

  // Cookbook Details
  COOKBOOK_DETAILS_BASE,
  COOKBOOK_DETAILS: (id: string) => [COOKBOOK_DETAILS_BASE, id] as const,

  // Cookbook Recommendations
  COOKBOOK_RECOMMENDATIONS_BASE,
  COOKBOOK_RECOMMENDATIONS: (cookbookId: string, category?: string) =>
    [COOKBOOK_RECOMMENDATIONS_BASE, cookbookId, category] as const,

  // Recommendation Details
  RECOMMENDATION_DETAILS_BASE,
  RECOMMENDATION_DETAILS: (id: string) =>
    [RECOMMENDATION_DETAILS_BASE, id] as const,

  // Recommendation Photos
  RECOMMENDATION_PHOTOS_BASE,
  RECOMMENDATION_PHOTOS: (id: string) =>
    [RECOMMENDATION_PHOTOS_BASE, id] as const,

  // Amenities
  AMENITIES_BASE,
  AMENITIES: (id: string) => [AMENITIES_BASE, id] as const,

  // Auth
  USER_ME: ["user", "me"] as const,

  // Extraction
  EXTRACTION_STATUS_BASE,
  EXTRACTION_STATUS: (extractionId: string) =>
    [EXTRACTION_STATUS_BASE, extractionId] as const,

  // Wishlists
  WISHLISTS: "wishlists" as const,

  // Wishlist Recommendations
  WISHLIST_RECOMMENDATIONS_BASE,
  WISHLIST_RECOMMENDATIONS: (wishlistId: string) =>
    [WISHLIST_RECOMMENDATIONS_BASE, wishlistId] as const,

  // Notes
  NOTES_BASE,
  NOTES_DETAIL: (noteId: string) => [NOTES_BASE, noteId] as const,
} as const;
