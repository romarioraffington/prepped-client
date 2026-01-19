/**
 * Recipe type matching the API response from /api/v1/recipes
 */
export interface Recipe {
  id: string;
  title: string;
  coverUri: string | null;
  caloriesPerServing: number | null;
  cookTime: number | null;
  extractedUri: string | null;
}
