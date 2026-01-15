/**
 * Import status constants
 * Used throughout the app to maintain consistency and avoid magic strings
 */
export const IMPORT_STATUS = {
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];
