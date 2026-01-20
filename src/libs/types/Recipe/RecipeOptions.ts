export type RecipeOptionsVariant = "recipes" | "cookbook" | "detail";

export interface RecipeOptionsData {
  id: string;
  title: string;
  thumbnailUri?: string | null;
  sourceUri?: string | null;
  siteName?: string | null;
  author?: {
    profileUri?: string | null;
  } | null;
}
