// External Imports
import * as Haptics from "expo-haptics";
import { Portal } from "react-native-portalize";
import React, { useCallback, useState } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";

// Internal Imports
import type { ExpandablePreviewList as ExpandablePreviewListType } from "@/libs/types";

/**
 *  ExpandablePreviewList:
 *  This component is used to display a list of items that can be expanded.
 */
interface ExpandablePreviewListProps {
  items: ExpandablePreviewListType[];
}

export function ExpandablePreviewList({ items = [] }: ExpandablePreviewListProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [selectedItem, setSelectedItem] = useState<ExpandablePreviewListType | undefined>();

  const openBottomSheet = useCallback((item: ExpandablePreviewListType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    bottomSheetRef.current?.snapToPosition(30);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
  }, []);


  const calculateSnapPoints = useCallback((item: ExpandablePreviewListType) => {
    const minHeight = 22; // Minimum height of 22%
    const maxHeight = 80; // Maximum height of 80%
    const headerHeight = 10; // Header takes about 10% of screen height
    const itemHeight = 3.5; // Each item takes roughly ~3.5% of the screen heigh

    const calculatedHeight = Math.min(
      Math.max(
        headerHeight + (item.items.length * itemHeight),
        minHeight
      ),
      maxHeight
    );

    return [`${calculatedHeight}%`];
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  return (
    <>
      <View style={styles.container}>
        {items.map((item, index, arr) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.itemContainer,
              index === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
            disabled={item?.items.length <= 2}
            onPress={() => openBottomSheet(item)}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item?.items.length > 2 && (
                <MaterialIcons name="chevron-right" size={24} color="#555" />
              )}
            </View>
            {item?.items.slice(0, 2).map((item, idx) => (
              <View style={styles.item} key={`${idx}-${item.name}`}>
                <Ionicons
                  size={20}
                  color="#555"
                  name={item.isAvailable ? "checkmark" : "close"}
                />
                <Text style={styles.text}>{item.name}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </View>

      <Portal>
        {selectedItem && (
          <BottomSheet
            enablePanDownToClose
            ref={bottomSheetRef}
            backdropComponent={renderBackdrop}
            snapPoints={calculateSnapPoints(selectedItem)}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.bottomSheetHandleIndicator}
          >
            <BottomSheetFlatList
              data={selectedItem.items}
              style={styles.bottomSheetContainer}
              contentContainerStyle={{ paddingBottom: insets.bottom }}
              ListHeaderComponent={
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>{selectedItem.title}</Text>
                  <TouchableOpacity onPress={handleCloseBottomSheet}>
                    <Ionicons name="close" size={28} color="#222" />
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.bottomSheetItem}>
                  <Ionicons
                    size={20}
                    color="#555"
                    name={item.isAvailable ? "checkmark" : "close"}
                  />
                  <Text style={styles.bottomSheetItemText}>{item.name}</Text>
                </View>
              )}

            />
          </BottomSheet>
        )}
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  // ExpandablePreviewList
  container: {
    gap: 16,
  },
  itemContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
  },
  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  text: {
    fontSize: 16,
    color: "#555",
  },

  // Bottom Sheet Styles
  bottomSheetContainer: {
    paddingHorizontal: 20,
  },
  bottomSheetBackground: {
    elevation: 5,
    shadowRadius: 8,
    shadowOpacity: 0.1,
    shadowColor: "#000",
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomSheetHandleIndicator: {
    display: 'none',
  },
  bottomSheetHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomSheetTitle: {
    fontWeight: "bold",
    fontSize: 22,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  bottomSheetItemText: {
    fontSize: 16,
    color: "#333",
  },
});
