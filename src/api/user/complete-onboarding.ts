// External Dependencies
import { useMutation } from "@tanstack/react-query";

// Internal Dependencies
import { useAuthStore } from "@/stores/authStore";
import { reportError } from "@/libs/utils/errorReporting";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants";

const completeOnboardingMutationFn = async (): Promise<void> => {
  const apiClient = getApiClient();
  await apiClient.post(API_ENDPOINTS.USER_ONBOARDING_COMPLETE);
};

export const useCompleteOnboarding = () => {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: completeOnboardingMutationFn,
    onSuccess: () => {
      // Update the user in the auth store to mark onboarding as complete
      updateUser({ hasCompletedOnboarding: true });
    },
    onError: (error) => {
      reportError(error, {
        component: "CompleteOnboardingAPI",
        action: "Complete Onboarding Mutation",
      });
    },
  });
};
