// External Dependencies
import { useState, useCallback, useEffect, useRef, useMemo } from "react";

/**
 * Hook to filter out failed images from an array of image URLs.
 * Tracks which images fail to load and provides a filtered list of valid images.
 *
 * @param imageUrls - Array of image URLs to filter
 * @returns Object containing:
 *   - validImages: Array of image URLs that haven't failed to load
 *   - handleImageError: Callback function to call when an image fails to load
 */
export function useImageErrorFilter(imageUrls: string[]) {
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    new Set(),
  );

  const handleImageError = useCallback((url: string) => {
    setFailedImageUrls((prev) => new Set(prev).add(url));
  }, []);

  // Create a stable string representation of the URLs array for comparison
  const urlsKey = useMemo(() => imageUrls.join("|"), [imageUrls]);
  const prevUrlsKeyRef = useRef<string | undefined>(undefined);

  // Reset failed images when imageUrls actually change (by comparing serialized keys)
  useEffect(() => {
    if (prevUrlsKeyRef.current !== urlsKey) {
      setFailedImageUrls(new Set());
      prevUrlsKeyRef.current = urlsKey;
    }
  }, [urlsKey]);

  // Filter out failed images
  const validImages = imageUrls.filter((url) => !failedImageUrls.has(url));

  return {
    validImages,
    handleImageError,
  };
}
