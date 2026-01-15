import type { ExpoConfig, ConfigContext } from "expo/config";

const SPLASH_BACKGROUND_COLOR = "#9e00ff";
const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "tripspire",
  version: "1.0.3",
  scheme: "tripspire",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/afb60485-2cc7-4ae8-8e95-8f5877500c42",
    fallbackToCacheTimeout: 0,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: getUniqueIdentifier(),
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: getIcon(),
    entitlements: {
      "com.apple.developer.applesignin": ["Default"],
    },
  },
  android: {
    package: getUniqueIdentifier(),
  },
  androidStatusBar: {
    backgroundColor: SPLASH_BACKGROUND_COLOR,
  },
  extra: {
    APP_STORE_ID: "6753126737",
    TRIPSPIRE_API_BASE_URL:
      process.env.TRIPSPIRE_API_BASE_URL || "http://127.0.0.1:8000",
    SENTRY_DSN: process.env.SENTRY_DSN,
    GOOGLE_CLIENT_ID_IOS: process.env.GOOGLE_CLIENT_ID_IOS,
    REVENUECAT_API_KEY_IOS: process.env.REVENUECAT_API_KEY_IOS,
    eas: {
      projectId: "afb60485-2cc7-4ae8-8e95-8f5877500c42",
    },
  },
  plugins: [
    "expo-font",
    "expo-router",
    "expo-web-browser",
    "expo-secure-store",
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "tripspire",
        organization: "fd-labs",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-share-intent",
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        imageWidth: "115",
        resizeMode: "cover",
        backgroundColor: SPLASH_BACKGROUND_COLOR,
        image: "./assets/images/app/splash-screen-icon.png",
      },
    ],
    "expo-apple-authentication",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: `com.googleusercontent.apps.${process.env.GOOGLE_CLIENT_ID_IOS?.replace(".apps.googleusercontent.com", "")}`,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});

const getUniqueIdentifier = () => {
  return "app.tripspire.tripspire";
};

const getAppName = () => {
  return "TripSpire";
};

const getIcon = () => {
  return "./assets/icon.icon";
};
