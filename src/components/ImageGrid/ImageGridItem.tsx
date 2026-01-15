// External Imports
import { memo } from "react";

// Internal Imports
import type { GridItemProps } from "@/libs/types";
import { DefaultGridItem } from "./DefaultGridItem";
import { FeaturedGridItem } from "./FeaturedGridItem";

// Memoize to prevent re-renders when props haven't changed
export const ImageGridItem = memo((props: GridItemProps) => {
  if (props.item.variant === "featured") {
    return <FeaturedGridItem {...props} />;
  }
  return <DefaultGridItem {...props} />;
});
