import { capitalizeWords } from "./text";

/**
 * Creates a URL-friendly slug from a string
 * @param name - The string to convert to a slug
 * @returns A URL-friendly slug
 *
 * @example
 * createSlug("Barcelona, Spain") // returns "barcelona-spain"
 * createSlug("Places of Worship") // returns "places-of-worship"
 * createSlug("Markets") // returns "markets"
 * createSlug("Best Restaurants in Madrid") // returns "best-restaurants-in-madrid"
 */
export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading and trailing hyphens
    .trim();
};

/**
 * Parses a slug to extract the original name and collection ID
 * @param slug - The slug in format "name-slug--id"
 * @returns Object containing name and id
 *
 * @example
 * parseSlug("barcelona-spain--0198851a-2249-7274-810e-a57f96d60f64")
 * // returns { name: "barcelona spain", id: "0198851a-2249-7274-810e-a57f96d60f64" }
 *
 * parseSlug("places-of-worship--abc123")
 * // returns { name: "places of worship", id: "abc123" }
 *
 * parseSlug("markets--def456")
 * // returns { name: "markets", id: "def456" }
 */
export const parseSlug = (slug: string) => {
  const parts = slug.split("--");
  if (parts.length !== 2) {
    return { name: "", id: slug };
  }

  const [slugPart, id] = parts;

  // Convert slug back to readable format (replace hyphens with spaces)
  const name = slugPart.replace(/-/g, " ");

  return {
    name: capitalizeWords(name),
    id,
  };
};

/**
 * Creates a full slug with ID from a name and ID
 * @param name - The name to check against the ID, or convert to slug
 * @param id - The ID to check or append to
 * @returns The ID if it already starts with the slugified name, otherwise "slug--id"
 * @example
 * createFullSlug("Barcelona, Spain", "0198851a-2249-7274-810e-a57f96d60f64")
 * // returns "barcelona-spain--0198851a-2249-7274-810e-a57f96d60f64"
 *
 * createFullSlug("Places of Worship", "abc123")
 * // returns "places-of-worship--abc123"
 *
 * createFullSlug("All Saves", "all-saves--0198851a-2259-73cf-8761-3bc6c8c5b50a")
 * // returns "all-saves--0198851a-2259-73cf-8761-3bc6c8c5b50a" (ID already starts with slug)
 */
export const createFullSlug = (name: string, id: string): string => {
  // Create the slug from the name to check against the ID
  const slug = createSlug(name);

  // If the ID already starts with the slug, just return it
  if (id.startsWith(`${slug}--`)) {
    return id;
  }

  // Otherwise, create the full slug
  return `${slug}--${id}`;
};

/**
 * Creates a short slug with ID from a title and ID, truncating long titles
 * @param title - The title to convert to a short slug
 * @param id - The ID to append
 * @param maxLength - Maximum length for the title part (default: 50)
 * @returns A shortened slug in format "short-title--id"
 * @example
 * createShortSlug("Nos encantó visitar Barcelona en esta época del año: Clima ideal, menos multitudes y una excelente energía", "584e2f64-11a2-4c8a-9c4c-73ee3c574df8")
 * // returns "nos-encant-visitar-barcelona-en-esta-poca-del-ao--584e2f64-11a2-4c8a-9c4c-73ee3c574df8"
 */
export const createShortSlug = (
  title: string,
  id: string,
  maxLength = 50,
): string => {
  // Truncate the title if it's too long
  const shortTitle =
    title.length > maxLength
      ? `${title.substring(0, maxLength).trim()}...`
      : title;

  return createFullSlug(shortTitle, id);
};

/**
 * Checks if a slug is a full slug with ID
 * @param slug - The slug to check
 * @returns True if the slug is a full slug with ID, false otherwise
 */
export const isSlug = (slug: string) => {
  return slug.includes("--");
};
