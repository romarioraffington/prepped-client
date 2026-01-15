// External Dependencies
import React from "react";
import { router } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { BackgroundCycler } from "@/components";

export default function Setup() {
  const insets = useSafeAreaInsets();

  const handleTikTokSelection = () => {
    router.push("/(onboarding)/(tiktok)/add-to-sharesheet");
  };

  const handleInstagramSelection = () => {
    // Instagram is coming soon - could show a toast or do nothing
    console.log("Instagram coming soon");
  };

  const handleYouTubeSelection = () => {
    // YouTube is coming soon - could show a toast or do nothing
    console.log("YouTube coming soon");
  };

  const handleWebBrowserSelection = () => {
    // Web Browser is coming soon - could show a toast or do nothing
    console.log("Web Browser coming soon");
  };

  return (
    <BackgroundCycler>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>

        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <FontAwesome5 name="share" size={24} color="white" />
            <Text style={styles.title}>Start Sharing</Text>
          </View>
          <Text style={styles.subtitle}>
            Learn how to share travel recommendations to TripSpire from your favorite apps!
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* TikTok */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTikTokSelection}
            style={[styles.button, styles.primaryButton]}
          >
            <Ionicons name="logo-tiktok" size={17} color="#000" />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              TikTok
            </Text>
          </TouchableOpacity>

          {/* Instagram */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, styles.comingSoonButton]}
            onPress={handleInstagramSelection}
            disabled={true}
          >
            <Ionicons name="logo-instagram" size={16} color="white" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Instagram
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          {/* YouTube */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, styles.comingSoonButton]}
            onPress={handleYouTubeSelection}
            disabled={true}
          >
            <Ionicons name="logo-youtube" size={16} color="white" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              YouTube
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          {/* Web Browser */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, styles.comingSoonButton]}
            onPress={handleWebBrowserSelection}
            disabled={true}
          >
            <Ionicons name="globe" size={16} color="white" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Web
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundCycler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 37,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: "white",
    fontWeight: "300",
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
    flexDirection: 'column',
  },
  button: {
    gap: 8,
    borderRadius: 25,
    position: 'relative',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  primaryButton: {
    backgroundColor: "white",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "black",
  },
  secondaryButtonText: {
    color: "white",
  },
  comingSoonButton: {
    opacity: 0.8,
  },
  comingSoonBadge: {
    top: -8,
    right: 12,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    position: "absolute",
    backgroundColor: "#374151",
  },
  comingSoonBadgeText: {
    fontSize: 9,
    color: "white",
    fontWeight: "600",
  },
});
