import type { AssetType } from "../AssetType";
import type { Platform } from "../Platform";

export interface Import {
  id: string;
  title: string;
  platform: Platform;
  status: string;
  asset: {
    type: AssetType;
    thumbnailUri: string;
    contentUri: string;
  };
  metrics: {
    views: number;
    likes: number;
  };
  channel: {
    name: string;
  };
  creator: {
    username: string;
    profileUri: string;
    photoUri: string;
  };
}
