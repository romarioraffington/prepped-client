// External Dependencies
import { useMutation } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants";
import type { User, AuthTokens, AuthProvider } from "@/libs/types";

interface SocialLoginRequest {
  provider: AuthProvider;
  identity_token: string;
  authorization_code?: string;
}

interface SocialLoginResponse {
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      has_completed_onboarding: boolean;
    };
  };
}

const socialLoginMutationFn = async (
  request: SocialLoginRequest,
): Promise<{ user: User; tokens: AuthTokens }> => {
  const apiClient = getApiClient();

  const response = <SocialLoginResponse>(
    await apiClient.post(API_ENDPOINTS.AUTH_SOCIAL_V1, request)
  );

  const { token, user: backendUser } = response?.data || {};

  // Create tokens with backend token
  const tokens: AuthTokens = {
    identityToken: token,
  };

  // Create name with backend user data
  let name = "Tripster";
  if (backendUser?.first_name && backendUser?.last_name) {
    name = `${backendUser.first_name} ${backendUser.last_name}`;
  }

  if (!backendUser) {
    throw new Error("Oops! Unable to find your account.");
  }

  // Create user object with backend user data
  const user: User = {
    name: name,
    tokens: tokens,
    id: backendUser?.id || "",
    provider: request.provider,
    email: backendUser.email || "",
    firstName: backendUser?.first_name || undefined,
    lastName: backendUser?.last_name || undefined,
    hasCompletedOnboarding: backendUser.has_completed_onboarding,
  };

  return {
    user,
    tokens,
  };
};

export const useSocialLogin = () => {
  return useMutation({
    mutationFn: socialLoginMutationFn,
    onError: (error) => {
      reportError(error, {
        component: "SocialLogin",
        action: "Login",
      });
    },
  });
};
