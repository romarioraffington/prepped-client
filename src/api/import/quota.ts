//External Dependencies
import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/libs/constants";
//Internal Dependencies
import type { ImportQuota } from "@/libs/types";

const fetchImportQuota = async (): Promise<ImportQuota> => {
  // Return hardcoded values for now
  return {
    creditBalanceRemaining: 100,
    totalImportCreditsUsed: 0,
  };
};

// Hook to get import quota information
export const useImportQuota = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.RECIPE_QUOTA],
    queryFn: fetchImportQuota,
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });
};
