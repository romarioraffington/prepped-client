/**
 * Pagination links for cursor-based pagination
 */
export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * Pagination metadata for cursor-based pagination
 */
export interface PaginationMeta {
  path: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}
