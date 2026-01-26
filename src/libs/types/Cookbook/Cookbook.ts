// Types for Cookbook API responses

import type { PaginationLinks, PaginationMeta } from "../Pagination";

// Types for CookbookCard component
export type CookbookCardData = {
  id: string;
  name: string;
  savedCount: number;
  coverImageUri: string | null;
  lastUpdatedText?: string;
  containsRecipe?: boolean;
};

export interface CookbookListItem {
  id: string;
  name: string;
  imageUris: string[];
  recipesCount: number;
  lastUpdatedTimestamp: number;
  containsRecipe?: boolean;
  type: number;
}

export interface CookbookListResponse {
  data: CookbookListItem[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}

/**
 * Paginated cookbook page result with transformed data
 * Used for React Query InfiniteData cache structure
 */
export interface CookbookPageResult {
  data: CookbookCardData[];
  meta?: PaginationMeta;
}

export interface CreateCookbookRequest {
  name: string;
  recipe_id?: string;
}

export interface CreateCookbookResponseData {
  id: string;
  name: string;
  imageUris: string[];
  recipesCount: number;
  lastUpdatedTimestamp: number;
}

export interface CreateCookbookResponse {
  data: CreateCookbookResponseData;
}
