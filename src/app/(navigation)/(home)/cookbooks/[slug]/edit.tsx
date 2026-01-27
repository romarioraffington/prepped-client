// External Dependencies
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { SingleInputForm } from "@/components";
import { parseSlug, reportError } from "@/libs/utils";
import { useCookbookDetails, useUpdateCookbookMutation } from "@/api";

type EditCookbookParams = {
  slug: string;
};

export default function EditCookbook() {
  const { slug } = useLocalSearchParams<EditCookbookParams>();

  // Parse slug to extract ID for API call
  const { id: cookbookId } = parseSlug(slug ?? "");

  // Fetch cookbook details - React Query handles cache automatically
  const { data, isLoading: isLoadingCookbook } = useCookbookDetails(cookbookId);

  // Extract the cookbook name from the fetched data
  const cookbookName = data?.name ?? "";

  const { mutate: updateCookbook, isPending: isUpdating } =
    useUpdateCookbookMutation();

  const handleSave = (name: string) => {
    if (!slug || isUpdating) return;

    updateCookbook(
      { slug, name },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reportError(error, {
            component: "EditCookbook",
            action: "Update Cookbook",
            extra: { slug },
          });
          Alert.alert("Oops!", "Failed to rename cookbook. Please try again.", [
            { text: "OK" },
          ]);
        },
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading state while fetching cookbook details
  if (isLoadingCookbook) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SingleInputForm
      title="Rename cookbook"
      isLoading={isUpdating}
      saveButtonText="Save"
      onSave={handleSave}
      onCancel={handleCancel}
      defaultValue={cookbookName}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
