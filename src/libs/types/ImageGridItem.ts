import type { CollectionVariant, PaginationMeta } from "@/libs/types";

export interface ImageGridItem {
  id: string;
  name: string;
  imageUris: string[];
  count: number;
  hasSubCollections?: boolean;
  lastUpdatedTimestamp: number;
  variant?: CollectionVariant;
}

/**
 * Paginated image grid page result
 * Used for React Query InfiniteData cache structure
 */
export interface ImageGridPageResult {
  data: ImageGridItem[];
  meta?: PaginationMeta;
}
