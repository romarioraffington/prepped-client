// External Dependencies
import React from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { useActionToast } from "@/contexts";
import type { ImageGridItem } from "@/libs/types";
import { useDeleteCollectionMutation } from "@/api";
import { Colors, QUERY_KEYS } from "@/libs/constants";
import { parseSlug, capitalizeWords } from "@/libs/utils";

type OptionsParams = {
  slug: string;
  isCountry?: string;
};

export default function CollectionOptions() {
  const queryClient = useQueryClient();
  const { showToast } = useActionToast();
  const { slug, isCountry } = useLocalSearchParams<OptionsParams>();

  const {
    mutateAsync: deleteCollectionAsync,
    isPending: isDeletePending
  } = useDeleteCollectionMutation();

  // Parse the slug to get ID and name
  const { id: collectionId, name: slugName } = parseSlug(slug);
  const displayName = capitalizeWords(slugName);

  // Extract city from displayName (e.g., "Rome Italy" -> city: "Rome")
  const nameParts = displayName.split(" ");
  const city = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : displayName;

  // Get isCountry from route params (passed from detail page)
  const isCountryCollection = isCountry === "true";

  // Helper function to get collection image from cache
  const getCollectionImage = (): string | null => {
    if (!collectionId) return null;

    // First, try to find in collections list cache (for top-level collections)
    const collectionsData = queryClient.getQueryData<
      InfiniteData<{ data: ImageGridItem[]; meta: unknown }>
    >([QUERY_KEYS.COLLECTIONS]);

    if (collectionsData) {
      for (const page of collectionsData.pages) {
        const collection = page.data.find((item) => item.id === collectionId);
        if (collection?.imageUris && collection.imageUris.length > 0) {
          return collection.imageUris[0];
        }
      }
    }

    // If not found, try collection details cache (for subcollections)
    // We need to check all collection details queries
    const allQueries = queryClient.getQueryCache().getAll();
    for (const query of allQueries) {
      const queryKey = query.queryKey;
      if (
        Array.isArray(queryKey) &&
        queryKey[0] === QUERY_KEYS.COLLECTION_DETAILS_BASE &&
        query.state.data
      ) {
        const detailsData = query.state.data as {
          collections: ImageGridItem[];
        };
        const collection = detailsData.collections?.find(
          (item) => item.id === collectionId,
        );
        if (collection?.imageUris && collection.imageUris.length > 0) {
          return collection.imageUris[0];
        }
      }
    }

    return null;
  };

  const handleClose = () => {
    router.back();
  };

  const handleMapPress = () => {
    // Close this screen first, then navigate to recommendations
    router.back();

    // Small delay to ensure clean navigation
    setTimeout(() => {
      router.push({
        pathname: "/collections/[slug]/recommendations",
        params: {
          slug,
          previousTitle: city,
        },
      });
    }, 100);
  };

  const handleDeletePress = () => {
    if (isDeletePending || !slug) return;

    Alert.alert(
      "Delete Collection?",
      `"${displayName}" and all it's recommendations will be deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Get collection image before deletion
            const collectionImage = getCollectionImage();

            // Find parent collection query key before deletion (while cache still has the deleted collection)
            // Search for a collection details query that contains this collection in its collections array
            let parentCollectionQueryKey: unknown[] | null = null;
            const allQueries = queryClient.getQueryCache().getAll();
            for (const query of allQueries) {
              const qKey = query.queryKey;
              if (
                Array.isArray(qKey) &&
                qKey[0] === QUERY_KEYS.COLLECTION_DETAILS_BASE &&
                query.state.data
              ) {
                const detailsData = query.state.data as {
                  collections: ImageGridItem[];
                };
                // Check if this query's collections array contains the deleted collection
                const containsDeletedCollection = detailsData.collections?.some(
                  (item) => item.id === collectionId,
                );
                if (containsDeletedCollection) {
                  // This is the parent collection, save its query key
                  parentCollectionQueryKey = qKey;
                  break;
                }
              }
            }

            deleteCollectionAsync(slug)
              .then(() => {
                // Haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show success toast with green checkmark
                showToast({
                  text: `Deleted ${displayName}`,
                  thumbnailUri: collectionImage || null,
                });

                // Invalidate parent collection query to refetch and remove deleted collection from list
                if (parentCollectionQueryKey) {
                  queryClient.invalidateQueries({
                    queryKey: parentCollectionQueryKey,
                  });
                }

                // Navigate back - closes this options modal
                router.back();

                // If it's a country collection, navigate back again to exit the detail page
                if (isCountryCollection) {
                  // Small delay to ensure the first router.back() completes
                  setTimeout(() => {
                    router.back();
                  }, 100);
                }
              })
              .catch((error) => {
                // Haptic feedback for error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Show error alert
                Alert.alert(
                  "Oops!",
                  error?.message || "Failed to delete collection. Please try again.",
                  [{ text: "OK" }],
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {city}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {/* Map Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleMapPress}>
          <Ionicons name="map-outline" size={20} color="#667" />
          <Text style={styles.optionText}>Map</Text>
        </TouchableOpacity>

        {/* Delete Option */}
        <TouchableOpacity style={styles.optionItem} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
          <Text style={[styles.optionText, styles.optionTextDestructive]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  closeButton: {
    top: 20,
    left: 20,
    opacity: 0.5,
    position: "absolute",
  },
  optionsContainer: {
    gap: 25,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 17,
    color: "#000",
    marginLeft: 8,
    fontWeight: "500",
  },
  optionTextDestructive: {
    color: Colors.destructive,
  },
});

