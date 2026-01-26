// External Dependencies
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { useWishlistDetails } from "@/api/wishlist/detail";
import { useUpdateWishlistMutation } from "@/api/wishlist/update";
// Internal Dependencies
import { SingleInputForm } from "@/components";
import { reportError } from "@/libs/utils/errorReporting";

type EditWishlistParams = {
  slug: string;
};

export default function EditWishlist() {
  const { slug } = useLocalSearchParams<EditWishlistParams>();

  // Fetch wishlist details - React Query handles cache automatically
  const { data, isLoading: isLoadingWishlist } = useWishlistDetails(slug ?? "");

  // Extract metadata from first page
  const wishlist = data?.pages[0]?.metadata;

  const { mutate: updateWishlist, isPending: isUpdating } =
    useUpdateWishlistMutation();

  const handleSave = (name: string) => {
    if (!slug || isUpdating) return;

    updateWishlist(
      { slug, name },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reportError(error, {
            component: "EditWishlist",
            action: "Update Wishlist",
            extra: { slug },
          });
          Alert.alert("Oops!", "Failed to rename wishlist. Please try again.", [
            { text: "OK" },
          ]);
        },
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading state while fetching wishlist details
  if (isLoadingWishlist) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SingleInputForm
      title="Rename wishlist"
      isLoading={isUpdating}
      saveButtonText="Save"
      onSave={handleSave}
      onCancel={handleCancel}
      defaultValue={wishlist?.name ?? ""}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
