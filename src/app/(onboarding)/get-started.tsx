// External Components
import type React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Entypo,
  Ionicons,
  Foundation,
  FontAwesome6,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  runOnJS,
  useSharedValue,
  useAnimatedReaction,
} from "react-native-reanimated";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

// Internal Components
import { useDebounce } from "@/hooks";
import { isIPad } from "@/libs/utils/platform";
import { Marquee, _itemWidth, ImageBg } from "@/components";

export default function GetStarted() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [debouncedActiveIndex] = useDebounce(activeIndex, 500);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollOffsetX = useSharedValue(0);
  const allItemsWidth = welcomeSlides.length * _itemWidth;

  useAnimatedReaction(
    () => scrollOffsetX.value,
    (currentValue) => {
      const normalizedOffset =
        ((currentValue % allItemsWidth) + allItemsWidth) % allItemsWidth;
      const shift = width / 2;
      const activeItemIndex = Math.abs(
        Math.floor((normalizedOffset + shift) / _itemWidth),
      );

      if (activeItemIndex === welcomeSlides.length) {
        runOnJS(setActiveIndex)(0);
      }

      if (
        activeItemIndex >= 0 &&
        activeItemIndex < welcomeSlides.length &&
        activeItemIndex !== activeIndex
      ) {
        runOnJS(setActiveIndex)(activeItemIndex);
      }
    },
  );

  const handleGetStarted = () => {
    router.push("/setup");
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <ImageBg
        itemKey={debouncedActiveIndex.toString()}
        source={welcomeSlides[debouncedActiveIndex].image}
      />
      <View style={styles.marqueeContainer}>
        <Marquee events={welcomeSlides} scrollOffsetX={scrollOffsetX} />
      </View>
      <View style={styles.bottomContainer}>
        {/*
          TODO:Apple reviewer is testing on iPad Air (5th generation) and I can't reproduce this.
          For now, we'll hide the title and description on iPad.
        */}
        {!isIPad() && (
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Save travel ideas {"\n"}with ease</Text>
              <Text style={styles.description}>
                Turn any travel content into your {"\n"}personal itinerary.
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e293b",
  },
  marqueeContainer: {
    flex: 1,
    minHeight: 360,
    maxHeight: 440,
    paddingTop: 40,
  },
  bottomContainer: {
    gap: 30,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "flex-end",
  },
  titleContainer: {
    gap: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    fontWeight: "300",
  },
  button: {
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 40,
    backgroundColor: "white",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
});

const slides = [
  {
    image: require("~/assets/images/welcome/leaning-tower-of-pisa-in-pisa-italy.webp"),
    renderFooter: () => (
      <>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View
            style={{
              zIndex: 2,
              padding: 6,
              right: -7,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(255, 255, 255)",
            }}
          >
            <Ionicons name="logo-youtube" size={13} color="red" />
          </View>
          <View
            style={{
              padding: 6,
              zIndex: 1,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(255, 255, 255)",
            }}
          >
            <Ionicons name="logo-tiktok" size={14} color="black" />
          </View>
          <View
            style={{
              padding: 6,
              zIndex: 2,
              left: -8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(255, 255, 255)",
            }}
          >
            <Ionicons name="logo-instagram" size={14} color="red" />
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text
            style={{
              fontSize: 24,
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Travel Inspo!
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "white",
              fontWeight: "300",
              textAlign: "center",
            }}
          >
            Import from socials and websites {"\n"}in seconds.
          </Text>
        </View>
      </>
    ),
  },
  {
    image: require("~/assets/images/welcome/automatic-sorting.webp"),
    renderFooter: () => (
      <>
        <View
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              zIndex: 2,
              right: -10,
              paddingVertical: 8,
              paddingHorizontal: 9,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgba(212, 180, 141)",
            }}
          >
            <FontAwesome6 name="building-columns" size={10} color="white" />
          </View>

          <View
            style={{
              zIndex: 1,
              padding: 4,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgba(212, 180, 141)",
            }}
          >
            <MaterialCommunityIcons
              name="eiffel-tower"
              size={17}
              color="white"
            />
          </View>

          <View
            style={{
              zIndex: 2,
              left: -9,
              padding: 6,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgba(212, 180, 141)",
            }}
          >
            <MaterialCommunityIcons
              name="city-variant"
              size={14}
              color="white"
            />
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text
            style={{
              fontSize: 23,
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Automatic Sorting
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "white",
              fontWeight: "300",
              textAlign: "center",
            }}
          >
            Sorts each saved place by its country, city and category.
          </Text>
        </View>
      </>
    ),
  },

  {
    image: require("~/assets/images/welcome/key-insights.webp"),
    renderFooter: () => (
      <>
        <View
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              zIndex: 2,
              right: -10,
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(45, 84, 110)",
            }}
          >
            <Foundation name="dollar" size={18} color="white" />
          </View>

          <View
            style={{
              zIndex: 1,
              padding: 7,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(45, 84, 110)",
            }}
          >
            <MaterialIcons name="location-pin" size={14} color="white" />
          </View>

          <View
            style={{
              zIndex: 2,
              left: -10,
              padding: 8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(45, 84, 110)",
            }}
          >
            <Ionicons name="star" size={12} color="white" />
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text
            style={{
              fontSize: 23,
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Key Insights
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "white",
              fontWeight: "300",
              textAlign: "center",
            }}
          >
            See photos, reviews, opening hours — all pulled automatically.
          </Text>
        </View>
      </>
    ),
  },
  {
    image: require("~/assets/images/welcome/map.webp"),
    renderFooter: () => (
      <>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View
            style={{
              zIndex: 2,
              padding: 6,
              right: -7,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(89, 166, 192)",
            }}
          >
            <MaterialCommunityIcons name="map-search" size={16} color="white" />
          </View>
          <View
            style={{
              padding: 6,
              zIndex: 1,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(89, 166, 192)",
            }}
          >
            <MaterialCommunityIcons
              name="map-marker-multiple"
              size={16}
              color="white"
            />
          </View>
          <View
            style={{
              padding: 6,
              zIndex: 2,
              left: -8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(89, 166, 192)",
            }}
          >
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={16}
              color="white"
            />
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text
            style={{
              fontSize: 24,
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Pinned it!
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "white",
              fontWeight: "300",
              textAlign: "center",
            }}
          >
            Imported places are automatically pinned on the map.
          </Text>
        </View>
      </>
    ),
  },
  {
    image: require("~/assets/images/welcome/auto-tagging.webp"),
    renderFooter: () => (
      <>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View
            style={{
              zIndex: 2,
              right: -9,
              padding: 8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(135, 118, 60)",
            }}
          >
            <MaterialIcons name="local-hotel" size={10} color="white" />
          </View>

          <View
            style={{
              zIndex: 1,
              padding: 8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(135, 118, 60)",
            }}
          >
            <Entypo name="drink" size={11} color="white" />
          </View>

          <View
            style={{
              left: -9,
              zIndex: 2,
              padding: 8,
              borderRadius: 100,
              position: "relative",
              backgroundColor: "rgb(135, 118, 60)",
            }}
          >
            <FontAwesome6 name="person-swimming" size={11} color="white" />
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text
            style={{
              fontSize: 23,
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Smart Tags
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "white",
              fontWeight: "300",
              textAlign: "center",
            }}
          >
            Auto-tagged as restaurant, activity, accommodation, etc.
          </Text>
        </View>
      </>
    ),
  },
];

const welcomeSlides: {
  image: number | { uri: string; cachePolicy?: string };
  renderFooter: () => React.ReactNode;
}[] = [...slides];
