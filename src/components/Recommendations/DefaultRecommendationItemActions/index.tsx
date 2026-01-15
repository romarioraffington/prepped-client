// External Dependencies
import { memo } from "react";

// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";
import { WishlistButtonWithCount } from "@/components/Wishlist/WishlistButtonWithCount";
import { RecommendationOptionsButton } from "@/components/Recommendations/RecommendationOptionsButton";

interface DefaultRecommendationItemActionsProps {
  item: RecommendationListItem;
  slug: string;
}

export const DefaultRecommendationItemActions = memo(
  ({ item, slug }: DefaultRecommendationItemActionsProps) => (
    <>
      <WishlistButtonWithCount
        recommendationSlug={slug}
        wishlistIds={item.wishlistIds ?? []}
        thumbnailUri={item.images?.[0]}
      />
      <RecommendationOptionsButton 
        recommendationSlug={slug} 
      />
    </>
  ),
);

DefaultRecommendationItemActions.displayName = "DefaultRecommendationItemActions";
