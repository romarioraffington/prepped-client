// External Dependencies
import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Portal } from "react-native-portalize";

// Internal Dependencies
import { useImportProgress } from "@/contexts";
import { IMPORT_STATUS } from "@/libs/constants";

import { ExtractionStatusPoller } from "../ExtractionStatusPoller";
// Imported like this to avoid circular dependency
import { ImportProgressItem } from "./ImportProgressItem";

const BOTTOM_OFFSET = 125;

export const ImportProgressManager: React.FC = () => {
  const { progressItems, removeItem } = useImportProgress();
  const slideAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // Create slide animation for new items
  useEffect(() => {
    for (const item of progressItems) {
      if (!slideAnimations.current.has(item.id)) {
        const animValue = new Animated.Value(-BOTTOM_OFFSET); // Start off-screen
        slideAnimations.current.set(item.id, animValue);

        // Slide in
        Animated.timing(animValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [progressItems]);

  if (progressItems.length === 0) {
    return null;
  }

  return (
    <Portal>
      <View style={styles.container}>
        {/* Polling components for each active extraction */}
        {progressItems
          .filter(
            (item) =>
              item.extractionId && item.status === IMPORT_STATUS.PROCESSING,
          )
          .map((item) => (
            <ExtractionStatusPoller
              key={`poller-${item.id}`}
              progressItemId={item.id}
              extractionId={item.extractionId as string}
            />
          ))}

        {/* Progress items */}
        {progressItems.map((item, index) => {
          const animValue = slideAnimations.current.get(item.id);
          const translateY = animValue || new Animated.Value(0);

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.itemContainer,
                {
                  transform: [{ translateY }],
                  zIndex: progressItems.length - index, // Stack newer items on top
                },
              ]}
            >
              {
                // ImportProgressItem is the component that renders
                // the import progress item UI
              }
              <ImportProgressItem item={item} onClose={removeItem} />
            </Animated.View>
          );
        })}
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
    zIndex: 1000,
    bottom: BOTTOM_OFFSET,
    position: "absolute",
  },
  itemContainer: {
    marginBottom: 8,
  },
});
