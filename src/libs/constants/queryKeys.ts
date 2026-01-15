/**
 * Centralized React Query keys
 *
 * This file contains all query keys used throughout the application.
 * Using constants ensures consistency and makes refactoring easier.
 */
const NOTES_BASE = "notes";
const AMENITIES_BASE = "amenities";
const IMPORT_DETAILS_BASE = "import-details";
const EXTRACTION_STATUS_BASE = "extraction-status";
const COLLECTION_DETAILS_BASE = "collection-details";
const RECOMMENDATION_PHOTOS_BASE = "recommendation-photos";
const RECOMMENDATION_DETAILS_BASE = "recommendation-details";
const IMPORT_RECOMMENDATIONS_BASE = "import-recommendations";
const WISHLIST_RECOMMENDATIONS_BASE = "wishlist-recommendations";
const COLLECTION_RECOMMENDATIONS_BASE = "collection-recommendations";

export const QUERY_KEYS = {
  // Import
  IMPORTS: "imports",
  IMPORT_QUOTA: "importQuota",

  // Import Details
  IMPORT_DETAILS_BASE,
  IMPORT_DETAILS: (id: string) => [IMPORT_DETAILS_BASE, id] as const,

  // Import Recommendations
  // ( query key to fetch imported recommendations to display on the map screen)
  // i.e imports/[slug]/recommendations
  IMPORT_RECOMMENDATIONS_BASE,
  IMPORT_RECOMMENDATIONS: (importId: string) =>
    [IMPORT_RECOMMENDATIONS_BASE, importId] as const,

  // Collection
  COLLECTIONS: "collections",

  // Collection Details
  COLLECTION_DETAILS_BASE,
  COLLECTION_DETAILS: (id: string, type?: string) =>
    [COLLECTION_DETAILS_BASE, id, type] as const,

  // Collection Recommendations
  COLLECTION_RECOMMENDATIONS_BASE,
  COLLECTION_RECOMMENDATIONS: (collectionId: string, category?: string) =>
    [COLLECTION_RECOMMENDATIONS_BASE, collectionId, category] as const,

  // Recommendation Details
  RECOMMENDATION_DETAILS_BASE,
  RECOMMENDATION_DETAILS: (slug: string) =>
    [RECOMMENDATION_DETAILS_BASE, slug] as const,

  // Recommendation Photos
  RECOMMENDATION_PHOTOS_BASE,
  RECOMMENDATION_PHOTOS: (slug: string) =>
    [RECOMMENDATION_PHOTOS_BASE, slug] as const,

  // Amenities
  AMENITIES_BASE,
  AMENITIES: (slug: string) => [AMENITIES_BASE, slug] as const,

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
