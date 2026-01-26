import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

interface HoursBottomSheetProps {
  dailyHours: { day: string; hours: string }[];
}

export const HoursBottomSheet = forwardRef<BottomSheet, HoursBottomSheetProps>(
  ({ dailyHours }, ref) => {
    // Snap points
    const snapPoints = useMemo(() => ["36%"], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.5}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          enableTouchThrough={true}
        />
      ),
      [],
    );

    if (!dailyHours) {
      return null;
    }

    const handleCloseHoursSheet = () => {
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    // Get current day name
    const getCurrentDay = () => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return days[new Date().getDay()];
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={{ paddingHorizontal: 20 }}>
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Hours</Text>
            <TouchableOpacity onPress={handleCloseHoursSheet}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
          </View>

          {/* Weekly Hours */}
          {dailyHours.map((item, idx) => {
            const isCurrentDay = item.day === getCurrentDay();
            return (
              <View key={item.day} style={styles.bottomSheetItem}>
                <Text
                  style={{
                    fontSize: 16,
                    color: isCurrentDay ? "#222" : "#555",
                    fontWeight: isCurrentDay ? "bold" : "normal",
                  }}
                >
                  {item.day}
                  {isCurrentDay && " (today)"}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: isCurrentDay ? "#222" : "#555",
                    fontWeight: isCurrentDay ? "bold" : "normal",
                  }}
                >
                  {item.hours}
                </Text>
              </View>
            );
          })}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
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
  bottomSheetIndicator: {
    display: "none",
  },
  bottomSheetHeader: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomSheetTitle: {
    fontWeight: "bold",
    fontSize: 22,
  },
  bottomSheetItem: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
