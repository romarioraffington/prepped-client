// External Dependencies
import AsyncStorage from "@react-native-async-storage/async-storage";

// Internal Dependencies
import { reportWarning } from "@/libs/utils";

const CACHE_KEY = "last_used_wishlist_id";
const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000;

interface CachedWishlist {
  wishlistId: string;
  wishlistName: string;
  timestamp: number;
}

/**
 * Cache a wishlist ID and name with an expiration.
 * This is allow us to easily add to a wishlist that
 * was previously added to ( without having to open the
 * manage wishlists modal).
 */
export const cacheWishlistId = async (
  wishlistId: string,
  wishlistName: string,
): Promise<void> => {
  try {
    const cached: CachedWishlist = {
      wishlistId,
      wishlistName,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    reportWarning("Failed to cache wishlist ID", {
      component: "WishlistStorage",
      action: "Cache Wishlist ID",
      extra: { wishlistId, wishlistName, error },
    });
  }
};

/**
 * Get the cached wishlist ID and name if it hasn't expired (72 hours)
 * Returns null if no cache exists or if it has expired
 */
export const getCachedWishlist = async (): Promise<{
  wishlistId: string;
  wishlistName: string;
} | null> => {
  try {
    const cachedString = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedString) {
      return null;
    }

    const cached: CachedWishlist = JSON.parse(cachedString);
    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache has expired (older than 72 hours)
    if (age > CACHE_EXPIRY_MS) {
      // Clean up expired cache
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      wishlistId: cached.wishlistId,
      wishlistName: cached.wishlistName,
    };
  } catch (error) {
    reportWarning("Failed to get cached wishlist ID", {
      component: "WishlistStorage",
      action: "Get Cached Wishlist",
      extra: { error },
    });
    return null;
  }
};

/**
 * Clear the cached wishlist ID
 */
export const clearCachedWishlistId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    reportWarning("Failed to clear cached wishlist ID", {
      component: "WishlistStorage",
      action: "Clear Cached Wishlist ID",
      extra: { error },
    });
  }
};
