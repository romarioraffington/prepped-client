// External Dependencies
import { type ReactNode, memo } from "react";

import { SwipeableWrapper } from "@/components/SwipeableWrapper";
import {
  useRecommendationDeleteHandler,
  useRecommendationWishlistHandler,
} from "@/hooks";
// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";

interface DefaultSwipeableRecommendationItemProps {
  slug: string;
  children: ReactNode;
  item: RecommendationListItem;
}

export const DefaultSwipeableRecommendationItem = memo(
  ({ item, slug, children }: DefaultSwipeableRecommendationItemProps) => {
    const { handleDelete, isPending: isDeletePending } =
      useRecommendationDeleteHandler({
        recommendationSlug: slug,
        recommendationName: item.name,
        thumbnailUri: item.images?.[0],
      });

    const { handlePress: handleAddToWishlist, isPending: isWishlistPending } =
      useRecommendationWishlistHandler({
        recommendationSlug: slug,
        thumbnailUri: item.images?.[0],
        wishlistIds: item.wishlistIds ?? [],
      });

    return (
      <SwipeableWrapper
        onSwipeLeft={handleDelete}
        onSwipeRight={handleAddToWishlist}
        isPending={isDeletePending || isWishlistPending}
      >
        {children}
      </SwipeableWrapper>
    );
  },
);

DefaultSwipeableRecommendationItem.displayName =
  "DefaultSwipeableRecommendationItem";
