import { API_ENDPOINTS, QUERY_KEYS, getApiClient } from "@/libs/constants";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

interface UserMeResponse {
  data: {
    user: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      has_completed_onboarding: boolean;
    };
  };
}

const fetchUserMe = async (): Promise<UserMeResponse> => {
  const client = getApiClient();
  const response = await client.get(API_ENDPOINTS.AUTH_ME_V1);
  return response?.data?.data; // Handle the nested data structure
};

export const useUserMe = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: QUERY_KEYS.USER_ME,
    queryFn: fetchUserMe,
    enabled: isAuthenticated,
  });
};
