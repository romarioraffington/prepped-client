//External Dependencies
import { useQuery } from "@tanstack/react-query";

//Internal Dependencies
import { reportError } from "@/libs/utils";
import type { ImportQuota } from "@/libs/types";
import { useAuthStore } from "@/stores/authStore";
import { QUERY_KEYS, getApiClient, API_ENDPOINTS } from "@/libs/constants";

const fetchImportQuota = async (): Promise<ImportQuota> => {
  try {
    const client = getApiClient();
    const response = await client.get(API_ENDPOINTS.USER_QUOTA_V1);
    const quotaData = response?.data || {};

    return {
      creditBalanceRemaining: quotaData.creditBalanceRemaining,
      totalImportCreditsUsed: quotaData.totalImportCreditsUsed,
    };
  } catch (error) {
    reportError(error, {
      component: "ImportQuota",
      action: "Fetch Import Quota",
    });
    return {
      creditBalanceRemaining: 0,
      totalImportCreditsUsed: 0,
    };
  }
};

// Hook to get import quota information
export const useImportQuota = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [QUERY_KEYS.IMPORT_QUOTA],
    queryFn: fetchImportQuota,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });
};
