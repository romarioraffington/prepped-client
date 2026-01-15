// External Dependencies
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { persist, createJSONStorage } from "zustand/middleware";

// Internal Dependencies
import { reportWarning } from "@/libs/utils";

interface ReviewStore {
  // State
  hasAskedForReview: boolean;
  lastAskedAt?: number;

  // Actions
  setHasAskedForReview: (hasAsked: boolean) => void;
  reset: () => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      reportWarning("Error reading from secure storage", {
        component: "ReviewStore",
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
        component: "ReviewStore",
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
        component: "ReviewStore",
        action: "Remove Item",
        extra: { name, error },
      });
    }
  },
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set) => ({
      // Initial state
      hasAskedForReview: false,
      lastAskedAt: undefined,

      // Actions
      setHasAskedForReview: (hasAsked: boolean) =>
        set({
          hasAskedForReview: hasAsked,
          lastAskedAt: hasAsked ? Date.now() : undefined,
        }),

      reset: () =>
        set({
          hasAskedForReview: false,
          lastAskedAt: undefined,
        }),
    }),
    {
      name: "review-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        hasAskedForReview: state.hasAskedForReview,
        lastAskedAt: state.lastAskedAt,
      }),
    },
  ),
);
