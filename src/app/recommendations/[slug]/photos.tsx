// External Dependencies
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useState, useEffect } from "react";
import { Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRecommendationPhotos } from "@/api";
import { ProfileIcon } from "@/components";
// Our Dependencies
import { reportError } from "@/libs/utils";

const { width } = Dimensions.get("window");

export default function RecommendationPhotosContent() {
  const navigation = useNavigation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [currentPhotoNumber, setCurrentPhotoNumber] = useState(1);
  const { data, isLoading, error } = useRecommendationPhotos(slug);

  const name = data?.data?.name || "";
  const photos = data?.data?.photos || [];

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const pageNum = Math.round(contentOffset / width);
    setCurrentPhotoNumber(pageNum + 1);
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name || "Photos"}
        </Text>
      ),
      headerRight: () => (
        <Text style={styles.counterText}>
          {currentPhotoNumber} / {photos?.length || 0}
        </Text>
      ),
    });
  }, [navigation, name, currentPhotoNumber, photos?.length]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    reportError(error, {
      component: "RecommendationPhotos",
      action: "Load Photos",
      extra: { slug },
    });
  }

  if (photos.length === 0 || error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No photos available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAuthorPress = (profileUri: string | null) => {
    if (!profileUri) {
      return;
    }

    Linking.openURL(profileUri);
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.scrollViewContentContainer}
    >
      {photos.map((photo, index) => (
        <View key={`${photo.id}`}>
          <View style={styles.imageContainer}>
            <Image
              contentFit="cover"
              style={styles.image}
              source={{ uri: photo.uri }}
            />
          </View>

          {/* Author Attribution for each photo */}
          <View style={styles.authorContainer}>
            <ProfileIcon
              size={24}
              imageUrl={photo?.authorAttribution?.photoUri || undefined}
              letter={photo?.authorAttribution?.displayName
                ?.charAt(0)
                .toUpperCase()}
              onPress={() =>
                handleAuthorPress(photo?.authorAttribution?.profileUri)
              }
            />
            {photo?.authorAttribution?.displayName && (
              <Text style={styles.authorName}>
                {photo?.authorAttribution?.displayName}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollViewContentContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  counterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    width,
  },
  image: {
    width: "100%",
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  authorContainer: {
    left: 10,
    bottom: "-28%",
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
