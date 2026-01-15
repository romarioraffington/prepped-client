// External Dependencies
import type { FC, PropsWithChildren } from "react";
import React, { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

// Internal Dependencies
import { useScrollDirection, type ScrollDirection } from "@/hooks/useScrollDirection";

// Scroll event type matching reanimated's scroll handler event
type ScrollEventData = { contentOffset: { y: number } };

interface TabScrollContextValue {
  scrollDirection: SharedValue<ScrollDirection>;
  handleTabScroll: (e: ScrollEventData) => void;
  resetScrollDirection: () => void;
}

const TabScrollContext = createContext<TabScrollContextValue | null>(null);

export const TabScrollProvider: FC<PropsWithChildren> = ({ children }) => {
  const { scrollDirection, onScroll: handleScrollDirectionOnScroll, resetScrollDirection } =
    useScrollDirection();

  const handleTabScroll = (e: ScrollEventData) => {
    "worklet";
    handleScrollDirectionOnScroll(e);
  };

  const value = {
    scrollDirection,
    handleTabScroll,
    resetScrollDirection,
  };

  return (
    <TabScrollContext.Provider value={value}>
      {children}
    </TabScrollContext.Provider>
  );
};

export const useTabScroll = () => {
  const context = useContext(TabScrollContext);
  if (!context) {
    throw new Error("useTabScroll must be used within TabScrollProvider");
  }
  return context;
};
