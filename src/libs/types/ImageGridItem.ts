import type { CollectionVariant } from "@/libs/types";

export interface ImageGridItem {
  id: string;
  name: string;
  imageUris: string[];
  citiesCount?: number;
  recommendationsCount: number;
  hasSubCollections?: boolean;
  lastUpdatedTimestamp?: number;
  variant?: CollectionVariant;
}
