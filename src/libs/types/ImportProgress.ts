import type { Platform } from "./Platform";
import type { IMPORT_STATUS } from "@/libs/constants";

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];

export interface ImportProgressItem {
  id: string;
  title: string;
  thumbnailUri?: string;
  extractionId?: string;
  platform: Platform;
  status: ImportStatus;
  percentage: number;
  targetPercentage?: number;
  error?: string;
  url?: string;
  hasRecommendations?: boolean;
}
