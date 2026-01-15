import type { ImageGridItem } from "@/libs/types";
export interface GridItemProps {
  heading: string;
  item: ImageGridItem;
  metadata: React.ReactNode;
  onOptionsPress?: () => void;
  onItemPress: (item: ImageGridItem) => void;
}
