// External Dependencies
import type React from "react";
import Constants from "expo-constants";
import * as Sentry from '@sentry/react-native';
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Internal Dependencies
import { reportError } from "@/libs/utils";
import { AUTH_PROVIDERS } from "@/libs/constants";
import { useAuthStore } from "@/stores/authStore";
import type { User, AuthTokens } from "@/libs/types";
import { useSocialLogin, useLogout } from "@/api/auth";

interface AuthContextType {
  // State
  isLoading: boolean;
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  clearError: () => void;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    // State
    user,
    error,
    isLoading,
    isAuthenticated,

    // Actions
    setError,
    setLoading,
    clearError,
    setAuthenticatedUser,
    clearAuthentication,
  } = useAuthStore();

  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const socialLoginMutation = useSocialLogin();

  // Initialize Google Sign-In
  const initializeGoogleSignIn = async () => {
    try {
      const googleClientId = Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID_IOS;

      if (!googleClientId) {
        throw new Error("Google Client ID for iOS not configured");
      }

      GoogleSignin.configure({
        hostedDomain: "",
        iosClientId: googleClientId,
      });
    } catch (error) {
      reportError(error, {
        component: "AuthContext",
        action: "Initialize Google Sign-In",
      });
      throw error;
    }
  };


  const handleSignIn = async (user: User, tokens: AuthTokens) => {
    try {
      setLoading(true);
      setError(null);
      setAuthenticatedUser(user, tokens);

      // Set user context in Sentry
      Sentry.setUser({
        id: user.id,
      });
    } catch (error: any) {
      setError(error.message || "Sign in failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      clearError();

      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error("Apple Sign-In is not available on this device");
      }

      // Request Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Send credentials to backend via API
      const result = await socialLoginMutation.mutateAsync({
        provider: AUTH_PROVIDERS.APPLE,
        identity_token: credential.identityToken,
      });

      await handleSignIn(result.user, result.tokens);
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return;
      }

      setError(error.message || "Apple sign in failed");
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);

      // Initialize Google Sign-In
      await initializeGoogleSignIn();

      // Check if Google Play Services are available - required
      // for Google Sign-In on Android This ensures the device has
      // the necessary Google services and they're up-to-date
      await GoogleSignin.hasPlayServices();

      // Sign in
      const result = await GoogleSignin.signIn();

      if (!result.data) {
        throw new Error("No user data received from Google");
      }

      const {
        idToken,
      } = result.data;

      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      // Send credentials to backend via API
      const loginResult = await socialLoginMutation.mutateAsync({
        provider: AUTH_PROVIDERS.GOOGLE,
        identity_token: idToken,
      });


      await handleSignIn(loginResult.user, loginResult.tokens);
    } catch (error: any) {
      if (error.message?.includes("No user data received")) {
        return;
      }

      reportError(error, {
        component: "AuthContext",
        action: "Google Sign-In",
      });
      setError(error.message || "Google sign in failed");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Call backend logout API
      await logoutMutation.mutateAsync();

      // Sign out from Google if user was signed in with Google
      if (user?.provider === AUTH_PROVIDERS.GOOGLE) {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          reportError(error, {
            component: "AuthContext",
            action: "Google Sign-Out",
          });
        }
      }

      // Apple Sign-In doesn't require explicit sign out
      // The tokens will be cleared from storage

    } catch (error: any) {
      reportError(error, {
        component: "AuthContext",
        action: "Sign Out",
      });
    } finally {
      setLoading(false);

      // Clear all cached data and cancel ongoing requests
      queryClient.clear();

      // Clear authentication state
      clearAuthentication();

      // Clear user context in Sentry
      Sentry.setUser(null);
    }
  };

  const value: AuthContextType = {
    // State
    user,
    error,
    isLoading,
    isAuthenticated,

    // Actions
    signOut,
    signInWithGoogle,
    signInWithApple,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
