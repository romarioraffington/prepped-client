import React from "react";
import * as Haptics from "expo-haptics";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking, Alert, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

import { reportError } from "@/libs/utils";

const ICON_COLOR = "#687076";

interface QuickActionButtonsProps {
  phone?: string | null;
  menuUrl?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  directionsUrl?: string | null;
  onOpenHoursClick?: () => void;
}

export function QuickActionButtons({
  phone,
  menuUrl,
  websiteUrl,
  instagramUrl,
  facebookUrl,
  directionsUrl,
  onOpenHoursClick,
}: QuickActionButtonsProps) {
  // Handle phone call
  const handlePhoneCall = async () => {
    try {
      // Format the phone number by removing spaces and special characters
      const formattedNumber = phone
        ?.replace(/\s+/g, "")
        .replace(/[()-]/g, "");
      const phoneUrl = `tel:${formattedNumber}`;

      // Check if the device can handle the URL scheme first
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // This will happen on simulators or devices that can't make calls
        Alert.alert(
          "Cannot Make Call",
          `This device cannot make phone calls. Phone number: ${phone}`,
        );
      }
    } catch (error) {
      reportError(error, {
        component: "QuickActionButtons",
        action: "Phone Call",
        extra: { phone },
      });
      Alert.alert(
        "Error",
        `Could not open phone app. Please dial manually: ${phone}`,
      );
    }
  };

  // Handle Open Link
  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Check if the URL has http/https prefix, add if not
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
      await Linking.openURL(formattedUrl);
    } catch (error) {
      reportError(error, {
        component: "QuickActionButtons",
        action: "Open Link",
        extra: { url },
      });
      Alert.alert("Error", "Could not open website");
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickActionButtons}
    >
      {menuUrl && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleOpenLink(menuUrl as string)}
        >
          <Ionicons size={16} name="restaurant-outline" color={ICON_COLOR} style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Menu</Text>
        </TouchableOpacity>
      )}

      {directionsUrl && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleOpenLink(directionsUrl as string)}
        >
          <FontAwesome5 name="directions" size={16} color={ICON_COLOR} style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Directions</Text>
        </TouchableOpacity>
      )}

      {phone && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handlePhoneCall}
        >
          <MaterialCommunityIcons name="phone" size={17} color={ICON_COLOR} style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Call</Text>
        </TouchableOpacity>
      )}

      {instagramUrl && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleOpenLink(instagramUrl as string)}
        >
          <Ionicons size={16} color={ICON_COLOR} name="logo-instagram" style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Instagram</Text>
        </TouchableOpacity>
      )}

      {websiteUrl && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleOpenLink(websiteUrl as string)}
        >
          <MaterialCommunityIcons name="web" size={16} color={ICON_COLOR} style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Website</Text>
        </TouchableOpacity>
      )}

      {facebookUrl && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleOpenLink(facebookUrl as string)}
        >
          <Ionicons size={16} color={ICON_COLOR} name="logo-facebook" style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Facebook</Text>
        </TouchableOpacity>
      )}

      {onOpenHoursClick && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onOpenHoursClick}
        >
          <FontAwesome5 name="clock" size={16} color={ICON_COLOR} style={styles.quickActionButtonIcon} />
          <Text style={styles.quickActionButtonText}>Opening Hours</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickActionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionButtonIcon: {
    marginRight: 8,
  },
  quickActionButtonText: {
    fontSize: 14,
    color: "#11181C",
    fontWeight: "500",
    letterSpacing: -0.1,
  },
});
