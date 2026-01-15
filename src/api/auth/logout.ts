import { useMutation } from "@tanstack/react-query";

import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants";

const logout = async (): Promise<void> => {
  const apiClient = getApiClient();
  await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT_V1);
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logout,
    onError: (error) => {
      reportError(error, {
        component: "Logout",
        action: "Logout",
      });
    },
  });
};
