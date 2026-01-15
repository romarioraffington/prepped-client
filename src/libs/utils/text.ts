/**
 * Capitalizes the first letter of each word in a string
 * @param str - The string to capitalize
 * @returns The string with first letter of each word capitalized
 * @example
 * capitalizeFirstLetter("hello world") // returns "Hello world"
 */
export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes the first letter of each word in a string, handling special cases
 * @param str - The string to capitalize
 * @returns The string with proper capitalization
 * @example
 * capitalizeWords("places of worship") // returns "Places of Worship"
 * capitalizeWords("best restaurants in madrid") // returns "Best Restaurants in Madrid"
 * capitalizeWords("barcelona spain") // returns "Barcelona Spain"
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return str;

  return str
    .split(" ")
    .map((word) => {
      // Handle special cases like "of", "the", "and" (lowercase in titles)
      const lowercaseWords = [
        "of",
        "the",
        "and",
        "in",
        "on",
        "at",
        "to",
        "for",
        "with",
        "by",
      ];
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return capitalizeFirstLetter(word);
    })
    .join(" ");
};

/**
 * Truncates a string to a maximum length and appends an ellipsis if needed.
 * @param value - The string to truncate
 * @param maxLength - Maximum allowed length before truncation
 * @param suffix - The suffix to append when truncated (default: …)
 * @returns The truncated string
 */
export const truncate = (
  value: string | undefined | null,
  maxLength: number,
  suffix = "…",
): string => {
  const input = value ?? "";
  if (maxLength <= 0) return "";
  if (input.length <= maxLength) return input;
  return input.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
};
