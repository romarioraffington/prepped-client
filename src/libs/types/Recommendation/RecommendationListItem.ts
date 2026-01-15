import type { Hours } from "@/libs/types";

export type RecommendationListItem = {
  id: string;
  name: string;
  images: string[];
  category: string;
  priceRange?: string;
  isAccessible?: boolean;
  editorialSummary?: string;
  hours?: Hours;
  reviews?: {
    rating: number;
    count: number;
  };
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  wishlistIds?: string[];
};
