// External Dependencies
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

// Internal Dependencies
import type { Platform as PlatformType } from "@/libs/types";
import { reportWarning } from "@/libs/utils/errorReporting";

/**
 * Gets the platform type based on a URL
 * @param url - The URL to analyze
 * @returns The platform type or "unknown" if not recognized
 */
export const getPlatformFromUrl = (url: string): PlatformType => {
  if (url.includes("tiktok.com")) {
    return "tiktok";
  }
  if (url.includes("instagram.com")) {
    return "instagram";
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  return "unknown";
};

/**
 * Gets the Ionic icon name for a given platform
 * @param platform - The platform type
 * @returns The Ionic icon name as a string
 */
export const getIonicPlatformIcon = (platform: PlatformType): string => {
  switch (platform) {
    case "tiktok":
      return "logo-tiktok";
    case "instagram":
      return "logo-instagram";
    case "youtube":
      return "logo-youtube";
    default:
      return "globe-outline";
  }
};

/**
 * Determines if the device has a home button
 * @returns boolean - true if device has a home button, false otherwise
 */
export const hasHomeButton = (): boolean => {
  try {
    const model = DeviceInfo.getModel();

    // iPhone SE models (1st, 2nd, 3rd generation) have home buttons
    // These devices use the smaller modal detent (0.43) for better UX
    const seModels = [
      "iPhone SE",
      "iPhone SE (2nd generation)",
      "iPhone SE (3rd generation)",
    ];

    // iPhone 8 and earlier models have home buttons
    // iPhone X introduced gesture-based navigation (no home button)
    const homeButtonModels = [
      "iPhone",
      "iPhone 3G",
      "iPhone 3GS",
      "iPhone 4",
      "iPhone 4S",
      "iPhone 5",
      "iPhone 5c",
      "iPhone 5s",
      "iPhone 6",
      "iPhone 6 Plus",
      "iPhone 6s",
      "iPhone 6s Plus",
      "iPhone 7",
      "iPhone 7 Plus",
      "iPhone 8",
      "iPhone 8 Plus",
    ];

    // Return true if device has a home button (uses smaller modal)
    // Return false if device uses gesture navigation (uses larger modal)
    return seModels.includes(model) || homeButtonModels.includes(model);
  } catch (error) {
    reportWarning("Error detecting home button", {
      component: "Platform",
      action: "Has Home Button",
      extra: { error },
    });
    return false; // Default to no home button for safety
  }
};

/**
 * Determines if the device is an iPad
 * @returns boolean - true if device is an iPad, false otherwise
 */
export const isIPad = (): boolean => {
  try {
    const model = DeviceInfo.getModel();

    return model.toLocaleLowerCase().includes("ipad");
  } catch (error) {
    reportWarning("Error detecting iPad", {
      component: "Platform",
      action: "Is iPad",
      extra: { error },
    });
    return false; // Default to not iPad for safety
  }
};
