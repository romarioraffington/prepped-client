import * as Haptics from "expo-haptics";
// External Dependencies
import type React from "react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Internal Dependencies
import { IMPORT_STATUS } from "@/libs/constants";
import type { ImportProgressItem } from "@/libs/types";

interface ImportProgressContextType {
  progressItems: ImportProgressItem[];
  addItem: (item: Omit<ImportProgressItem, "id">) => string;
  updateItem: (id: string, updates: Partial<ImportProgressItem>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

interface ImportProgressProviderProps {
  children: ReactNode;
}

// Create context
const ImportProgressContext = createContext<
  ImportProgressContextType | undefined
>(undefined);

// ImportProgressProvider
export const ImportProgressProvider: React.FC<ImportProgressProviderProps> = ({
  children,
}) => {
  const [progressItems, setProgressItems] = useState<ImportProgressItem[]>([]);

  /**
   * Add a new item to the progress items
   * @param item - The item to add
   * @returns The id of the new item
   */
  const addItem = useCallback(
    (item: Omit<ImportProgressItem, "id">): string => {
      const id = `import_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newItem: ImportProgressItem = { ...item, id };

      setProgressItems((prev) => [...prev, newItem]);
      return id;
    },
    [],
  );

  /**
   * Update an item in the progress items
   * @param id - The id of the item to update
   * @param updates - The updates to apply to the item
   */
  const updateItem = useCallback(
    (id: string, updates: Partial<ImportProgressItem>) => {
      setProgressItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedItem = { ...item, ...updates };

            // Haptic feedback for status changes
            if (updates.status === IMPORT_STATUS.COMPLETED) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } else if (updates.status === IMPORT_STATUS.FAILED) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }

            return updatedItem;
          }
          return item;
        }),
      );
    },
    [],
  );

  /**
   * Remove an item from the progress items
   * @param id - The id of the item to remove
   */
  const removeItem = useCallback((id: string) => {
    setProgressItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Clear all items from the progress items
   */
  const clearAll = useCallback(() => {
    setProgressItems([]);
  }, []);

  const value: ImportProgressContextType = useMemo(
    () => ({
      progressItems,
      addItem,
      updateItem,
      removeItem,
      clearAll,
    }),
    [progressItems, addItem, updateItem, removeItem, clearAll],
  );

  return (
    <ImportProgressContext.Provider value={value}>
      {children}
    </ImportProgressContext.Provider>
  );
};

export const useImportProgress = (): ImportProgressContextType => {
  const context = useContext(ImportProgressContext);
  if (context === undefined) {
    throw new Error(
      "useImportProgress must be used within an ImportProgressProvider",
    );
  }
  return context;
};
