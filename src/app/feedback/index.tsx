import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubmitReportMutation } from "@/api/report/submit";
// Internal Dependencies
import { reportError } from "@/libs/utils/errorReporting";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Internal Dependencies
import type { ReasonId, ReportReason } from "@/libs/types";

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
    id: "feedback",
    label: "Share feedback with us",
    placeholder: "👋 Tripster. Thanks for sharing your thoughts!",
  },
];

export default function Feedback() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState("");
  const { reasonId, returnTo, extractionId } = useLocalSearchParams<{
    reasonId: ReasonId;
    returnTo?: string;
    extractionId?: string;
  }>();

  const { mutate: submitReport, isPending } = useSubmitReportMutation();

  const selectedReasonData = reasonId
    ? reportReasons.find((reason) => reason.id === reasonId)
    : null;

  const isSubmitDisabled =
    !feedback.trim() || feedback.trim().length < 10 || isPending;

  const handleSubmit = () => {
    // Prepend the reason label and metadata to the feedback
    let feedbackWithContext = selectedReasonData?.label
      ? `[${selectedReasonData.label}] ${feedback}`
      : feedback;

    // Add extraction ID if available
    if (extractionId) {
      feedbackWithContext = `[Extraction ID: ${extractionId}] ${feedbackWithContext}`;
    }

    submitReport(
      {
        feedback: feedbackWithContext,
      },
      {
        onSuccess: () => {
          router.push({
            pathname: "/feedback/thank-you",
            params: returnTo ? { returnTo } : {},
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reportError(error, {
            component: "FeedbackScreen",
            action: "Submit Report",
            extra: { reasonId, extractionId },
          });
          Alert.alert(
            "Oops! 🥲",
            "Failed to submit your feedback. \nPlease try again.",
            [
              {
                text: "OK",
                style: "default",
              },
            ],
          );
        },
      },
    );
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>We'd love your feedback</Text>
      </View>

      {/* Form */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.feedbackFormContentContainer}
        >
          <View style={styles.content}>
            <TextInput
              multiline
              value={feedback}
              onChangeText={setFeedback}
              style={styles.feedbackInput}
              placeholderTextColor="#999999"
              placeholder="Sorry 🥺, tell us where we went wrong."
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                isSubmitDisabled
                  ? styles.nextButtonInactive
                  : styles.nextButtonActive,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  isSubmitDisabled
                    ? styles.nextButtonTextInactive
                    : styles.nextButtonTextActive,
                ]}
              >
                {isPending ? "Sending..." : "Send 💌"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 16,
  },
  feedbackFormContentContainer: {
    flex: 1,
    justifyContent: "space-between",
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
  feedbackInput: {
    height: 100,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginTop: 50,
    borderColor: "black",
    textAlignVertical: "top",
  },
});
