import type { AUTH_PROVIDERS } from "@/libs/constants";

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  tokens?: AuthTokens;
  provider: AuthProvider;
  hasCompletedOnboarding: boolean;
}

export interface AuthTokens {
  identityToken: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
}

export interface GoogleSignInResult {
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
  idToken: string;
  accessToken: string;
}

export interface AppleSignInResult {
  user: {
    id: string;
    email: string;
    name: {
      firstName?: string;
      lastName?: string;
    };
  };
  identityToken: string;
  authorizationCode: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthService {
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  getCurrentUser: () => Promise<User | null>;
  isAuthenticated: () => boolean;
}
