/**
 * Creates a cache utility that maintains both a Set of loaded IDs and a Record of cached data.
 * This is useful for caching data that needs to be tracked by ID and retrieved quickly.
 */
export const createCache = <T>() => {
  const loadedIds = new Set<string>();
  const dataCache: Record<string, T> = {};

  return {
    /**
     * Check if an ID exists in the cache
     */
    has: (id: string) => loadedIds.has(id),

    /**
     * Get data for an ID from the cache
     */
    get: (id: string) => dataCache[id],

    /**
     * Store data in the cache for an ID
     */
    set: (id: string, data: T) => {
      loadedIds.add(id);
      dataCache[id] = data;
    },

    /**
     * Remove data from the cache
     * @param id - If provided, removes only the specified ID. If not provided, clears the entire cache.
     */
    delete: (id?: string) => {
      if (id) {
        loadedIds.delete(id);
        delete dataCache[id];
      } else {
        loadedIds.clear();
        for (const key of Object.keys(dataCache)) {
          delete dataCache[key];
        }
      }
    },
  };
};
