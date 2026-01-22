/**
 * Collection type constants
 */
export const COLLECTION_TYPE = {
  UNORGANIZED: 2,
} as const;

export type CollectionTypeValue =
  (typeof COLLECTION_TYPE)[keyof typeof COLLECTION_TYPE];
