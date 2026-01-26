// External Dependencies
import { useMutation } from "@tanstack/react-query";

import { API_ENDPOINTS, getApiClient } from "@/libs/constants";
// Internal Dependencies
import { reportError } from "@/libs/utils";

// Types
interface AccountDeletionRequestResponse {
  data: {
    message: string;
    request_id: string;
    requested_at: string;
    can_undo: boolean;
  };
}

/**
 * Submit an account deletion request
 */
export const submitAccountDeletionRequest = async (): Promise<
  AccountDeletionRequestResponse["data"]
> => {
  try {
    const client = getApiClient();
    const result = await client.post(API_ENDPOINTS.ACCOUNT_DELETION_REQUEST_V1);

    const data = result?.data;
    if (!data) {
      throw new Error("No data returned from account deletion request");
    }

    return data;
  } catch (error) {
    reportError(error, {
      component: "AccountDeletion",
      action: "Submit Deletion Request",
    });

    let errorMessage = "Failed to submit account deletion request";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * React Query mutation hook for account deletion requests
 */
export const useAccountDeletionMutation = () => {
  return useMutation({
    mutationFn: submitAccountDeletionRequest,
    onError: (error) => {
      reportError(error, {
        component: "AccountDeletion",
        action: "Submit Deletion Request Mutation",
      });
    },
  });
};
