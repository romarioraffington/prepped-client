import type { RecommendationListItem, Reviews } from "@/libs/types";

export type RecommendationDetail = RecommendationListItem & {
  isAccessible: boolean;
  category: string;
  priceRange: string | null;
  editorialSummary: string;
  address: string;
  mapsUri: string;
  city: string;
  country: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
  contactInfo: {
    websiteUri: string | null;
    instagramUri: string | null;
    twitterUri: string | null;
    tiktokUri: string | null;
    internationalPhoneNumber: string | null;
  };
  images: string[];
  hours: {
    isOpen: boolean;
    opensAt: string;
    closedAt: string;
    is24Hours: boolean;
    dailyHours: Array<{ day: string; hours: string }>;
  };
  reviews: Reviews;
  offerings: Array<string>;
  wishlistIds: string[];
};
