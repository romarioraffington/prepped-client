// External Dependencies
import { memo } from "react";

import { RecommendationOptionsButton } from "@/components/Recommendations/RecommendationOptionsButton";
import { WishlistButtonWithCount } from "@/components/Wishlist/WishlistButtonWithCount";
// Internal Dependencies
import type { RecommendationListItem } from "@/libs/types";

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
      <RecommendationOptionsButton recommendationSlug={slug} />
    </>
  ),
);

DefaultRecommendationItemActions.displayName =
  "DefaultRecommendationItemActions";
