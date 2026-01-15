/**
 * Validates if a string is a valid URL
 * @param url - The string to validate
 * @returns true if the string is a valid URL, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string is a valid URL and checks if it's from a supported platform
 * @param url - The string to validate
 * @returns true if the string is a valid URL from a supported platform, false otherwise
 */
export const isValidSupportedUrl = (url: string): boolean => {
  if (!isValidUrl(url)) {
    return false;
  }

  const supportedDomains = ["tiktok.com"];

  return supportedDomains.some((domain) => url.includes(domain));
};
