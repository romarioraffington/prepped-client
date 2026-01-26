import * as SecureStore from "expo-secure-store";
// External Dependencies
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthState, AuthTokens, User } from "@/libs/types";
// Internal Dependencies
import { reportWarning } from "@/libs/utils";

interface AuthStore extends AuthState {
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  clearAuthentication: () => void;
  setAuthenticatedUser: (user: User, tokens: AuthTokens) => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      reportWarning("Error reading from secure storage", {
        component: "AuthStore",
        action: "Get Item",
        extra: { name, error },
      });
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      reportWarning("Error writing to secure storage", {
        component: "AuthStore",
        action: "Set Item",
        extra: { name, error },
      });
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      reportWarning("Error removing from secure storage", {
        component: "AuthStore",
        action: "Remove Item",
        extra: { name, error },
      });
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      error: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      setAuthenticatedUser: (user: User, tokens: AuthTokens) =>
        set({
          user,
          tokens,
          error: null,
          isLoading: false,
          isAuthenticated: true,
        }),

      clearAuthentication: () =>
        set({
          user: null,
          tokens: null,
          error: null,
          isLoading: false,
          isAuthenticated: false,
        }),

      clearError: () => set({ error: null }),

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
