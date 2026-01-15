// Types for Wishlist API responses

import type { PaginationLinks, PaginationMeta } from "../Pagination";

export type Vote = "up" | "down" | null;

export interface MemberPreview {
  userId: string;
  profilePictureUri: string | null;
}

// Types for WishlistCard component
export type WishlistMember = {
  id: string;
  name?: string;
  profilePictureUri: string;
};

export type WishlistCardData = {
  id: string;
  name: string;
  savedCount: number;
  dateRange?: string;
  coverImageUri: string | null;
  lastUpdatedText?: string;
  members: WishlistMember[];
  isRecentlyViewed?: boolean;
  containsRecommendation?: boolean;
};

export interface WishlistListItem {
  id: string;
  name: string;
  membersPreview: MemberPreview[];
  totalMembersCount: number;
  coverImageUri: string | null;
  recommendationsCount: number;
  lastUpdatedTimestamp: number;
  containsRecommendation?: boolean;
}

export interface WishlistListResponse {
  data: WishlistListItem[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}

/**
 * Paginated wishlist page result with transformed data
 * Used for React Query InfiniteData cache structure
 */
export interface WishlistPageResult {
  data: WishlistCardData[];
  meta?: PaginationMeta;
}

export interface CreateWishlistRequest {
  name: string;
  recommendation_id?: string;
}

export interface CreateWishlistResponseData {
  id: string;
  name: string;
  membersPreview: MemberPreview[];
  totalMembersCount: number;
  coverImageUri: string | null;
  recommendationsCount: number;
  lastUpdatedTimestamp: number;
}

export interface CreateWishlistResponse {
  data: CreateWishlistResponseData;
}

// Types for WishlistNotes component
export interface WishlistNote {
  id: string;
  userId: string;
  name: string;
  profilePictureUri?: string;
  text?: string;
  vote: Vote; // Note author's vote on the recommendation
  timestamp: number;
}

// Types for WishlistDetail screen
export interface WishlistRecommendation {
  id: string;
  name: string;
  description: string;
  imageUris: string[];
  rating: number;
  wishlistIds: string[];
  votes: {
    totalUpVotes: number;
    totalDownVotes: number;
    userVote?: Vote; // Current user's vote on this recommendation
  };
  notes: WishlistNote[];
}

export interface WishlistDetailData {
  id: string;
  name: string;
  members: WishlistMember[];
  recommendations: WishlistRecommendation[];
}
