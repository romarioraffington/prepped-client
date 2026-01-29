import type { CollectionVariant, PaginationMeta } from "@/libs/types";

export interface ImageGridItem {
  id: string;
  name: string;
  imageUris: string[];
  count: number;
  hasSubCollections?: boolean;
  lastUpdatedTimestamp: number;
  variant?: CollectionVariant;
  type: number;
  /** Set when fetched with include_status_for_recipe_id (e.g. manage-cookbooks) */
  containsRecipe?: boolean;
}

/**
 * Paginated image grid page result
 * Used for React Query InfiniteData cache structure
 */
export interface ImageGridPageResult {
  data: ImageGridItem[];
  meta?: PaginationMeta;
}
