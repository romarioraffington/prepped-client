import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from 'expo-haptics';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import type { ReasonId, ReportReason } from "@/libs/types";

const DEFAULT_REASON_ID: ReasonId = "feedback";
const reportReasons: ReportReason[] = [
  {
    id: "inaccurate_information",
    label: "Inaccurate information",
  },
  {
    id: "broken_link",
    label: "Images or links are broken or not working",
  },
  {
    id: "video",
    label: "There are issues with the video",
  },
  {
    id: "other",
    label: "Something else is broken",
  },
  {
    id: DEFAULT_REASON_ID,
    label: "Share feedback with us",
    placeholder: "👋 Tripster. Thanks for sharing your thoughts!"
  },
];

export default function Report() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null);
  const { returnTo, extractionId } = useLocalSearchParams<{ returnTo?: string; extractionId?: string }>();

  const handleReasonSelect = (reasonId: ReasonId) => {
    Haptics.selectionAsync();
    setSelectedReason(reasonId);
  };

  const handleNext = () => {
    if (!selectedReason) return;

    Haptics.selectionAsync();
    router.push({
      pathname: "/feedback",
      params: { reasonId: selectedReason, extractionId, returnTo }
    });
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close Button */}
      <TouchableOpacity
        onPress={handleClose}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={26} color="#000" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What's happening?</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {reportReasons.map((reason) => (
          <View
            key={reason.id}
            style={styles.reasonItem}
            onTouchEnd={() => handleReasonSelect(reason.id)}
          >
            <Text style={styles.reasonText}>{reason.label}</Text>
            <View
              style={[
                styles.radio,
                selectedReason === reason.id && styles.radioSelected,
              ]}
            >
              {selectedReason === reason.id && <View style={styles.radioInner} />}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedReason ? styles.nextButtonActive : styles.nextButtonInactive,
          ]}
          onPress={handleNext}
          disabled={!selectedReason}
        >
          <Text
            style={[
              styles.nextButtonText,
              selectedReason
                ? styles.nextButtonTextActive
                : styles.nextButtonTextInactive,
            ]}
          >
            Add details 💌
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  closeButton: {
    left: 12,
    opacity: 0.75,
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 16,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 25,
    borderBottomColor: "#EBEBEB",
    justifyContent: "space-between",
  },
  reasonText: {
    flex: 1,
    fontSize: 17,
    marginRight: 16,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#000",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  footer: {
    padding: 16,
    borderTopColor: "#EBEBEB",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonActive: {
    backgroundColor: "#000",
  },
  nextButtonInactive: {
    backgroundColor: "#EBEBEB",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonTextActive: {
    color: "#fff",
  },
  nextButtonTextInactive: {
    color: "#717171",
  },
});
