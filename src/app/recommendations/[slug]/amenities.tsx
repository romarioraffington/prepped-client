// External Dependencies
import Animated from "react-native-reanimated";
import React, { useEffect, useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { View, Text, StyleSheet, Alert, FlatList } from "react-native";

// Internal Dependencies
import { LargeTitle } from "@/components";
import { useLargeTitleCrossfade } from "@/hooks";
import { useAmenities } from "@/api/recommendation/amenities";
import { getIconForOffering, getOfferingGroupName, reportError } from "@/libs/utils";

export default function Amenities() {
  const title = "Amenities";
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: amenities, isLoading, error } = useAmenities(slug);

  // Use the crossfade hook for title animation
  const {
    titleRef,
    offsetY,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: title,
  });

  // Single setOptions call using hook-provided options; no headerRight on this screen
  React.useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
    });
  }, [navigation, getHeaderOptions]);

  // Group amenities by category
  const groupedAmenities = useMemo(() => {
    if (!amenities) return {};

    return amenities.reduce((groups: Record<string, string[]>, amenity) => {
      const groupName = getOfferingGroupName(amenity);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(amenity);
      return groups;
    }, {});
  }, [amenities]);

  useEffect(() => {
    if (error) {
      reportError(error, {
        component: "RecommendationAmenities",
        action: "Load Amenities",
        extra: { slug },
      });
      Alert.alert("Error", error.message, [
        {
          text: "Try Again",
          onPress: () => window.location.reload(),
        },
        {
          text: "Ok",
        },
      ]);
    }
  }, [error]);

  if (isLoading) {
    return <AmenitiesSkeleton />;
  }

  if (!amenities || amenities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTextIcon}>🥺🥲</Text>
        <Text style={styles.emptyText}>No amenities available</Text>
      </View>
    );
  }

  const renderAmenity = (amenity: string) => (
    <View style={styles.amenityItem} key={amenity}>
      <View style={styles.amenityIconContainer}>
        {getIconForOffering(amenity)}
      </View>
      <View style={styles.amenityTextContainer}>
        <Text style={styles.amenityName}>{amenity}</Text>
      </View>
    </View>
  );

  const renderGroup = (groupName: string, amenitiesList: string[]) => (
    <View style={styles.groupContainer} key={groupName}>
      <Text style={styles.groupTitle}>{groupName}</Text>
      <View style={styles.amenitiesList}>
        {amenitiesList.map(renderAmenity)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        data={Object.entries(groupedAmenities)}
        keyExtractor={([groupName]) => groupName}
        ListHeaderComponent={
          <LargeTitle
            ref={titleRef}
            offsetY={offsetY}
            currentTitle={title}
            onLayout={measureTitle}
            opacity={largeTitleOpacity}
          />
        }
        contentContainerStyle={[styles.listContainer, { paddingTop: headerHeight + 16 }]}
        renderItem={({ item: [groupName, amenitiesList] }) => renderGroup(groupName, amenitiesList)}
      />
    </View>
  );
}

// Skeleton Component
const AmenitiesSkeleton = () => {
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.title}>Amenities</Text>}
        data={[1, 2, 3]} // Mock data for skeleton
        renderItem={() => (
          <View style={styles.groupContainer}>
            <View style={styles.skeletonGroupTitle} />
            <View style={styles.amenitiesList}>
              {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={styles.amenityItem}>
                  <View style={styles.skeletonIcon} />
                  <View style={styles.skeletonText} />
                </View>
              ))}
            </View>
          </View>
        )}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={[styles.listContainer, { paddingTop: headerHeight + 16 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 25,
    color: '#222',
    fontWeight: '700',
    marginBottom: 20,
  },
  listContainer: {
    gap: 20,
    paddingBottom: 30,
  },
  groupContainer: {
    marginBottom: 30,
  },
  groupTitle: {
    fontSize: 17,
    color: '#222',
    marginBottom: 20,
    fontWeight: '600',
  },
  amenitiesList: {
    gap: 0,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  amenityIconContainer: {
    width: 40,
    marginRight: 16,
    alignItems: 'center',
  },
  amenityTextContainer: {
    flex: 1,
  },
  amenityName: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  skeletonGroupTitle: {
    height: 18,
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    marginBottom: 16,
    width: '40%',
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 10,
    backgroundColor: '#E5E5E5',
  },
  skeletonText: {
    flex: 0.7,
    height: 15,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  emptyTextIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 17,
    color: '#667',
  },
});
