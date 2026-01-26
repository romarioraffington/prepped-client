import type { ImportRecommendation } from "@/libs/types";
import type { AssetType } from "../AssetType";

export interface ImportDetail {
  id: string;
  title: string;
  siteName: string;
  likeCount?: number;
  viewCount?: number;
  sourceUri: string;
  asset: {
    uri: string;
    type: AssetType;
    thumbnailUri: string;
  };
  author: {
    name: string;
    photoUri?: string;
    profileUri?: string;
  };
  recommendations: ImportRecommendation[];
}
