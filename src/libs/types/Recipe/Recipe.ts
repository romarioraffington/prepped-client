/**
 * Recipe type matching the API response from /api/v1/recipes
 */
export interface Recipe {
  id: string;
  title: string;
  coverUri: string;
  caloriesPerServing: number;
  cookTime: number;
  contentUri: string;
  platformId: number;
  author: {
    name: string;
    avatarUri: string;
    profileUri: string;
  };
}

/**
 * Recipe options variant for the RecipeOptionsSheet
 */
export type RecipeOptionsVariant = "recipes" | "cookbook" | "detail";
