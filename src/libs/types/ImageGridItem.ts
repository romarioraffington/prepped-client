import type { CollectionVariant } from "@/libs/types";

export interface ImageGridItem {
  id: string;
  name: string;
  imageUris: string[];
  count: number;
  hasSubCollections?: boolean;
  lastUpdatedTimestamp: number;
  variant?: CollectionVariant;
}
