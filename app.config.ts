import type { ConfigContext, ExpoConfig } from "expo/config";

const SPLASH_BACKGROUND_COLOR = "#9e00ff";
const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "prepped",
  version: "0.0.1",
  scheme: "prepped",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: {
    policy: "appVersion",
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
    API_SERVER_BASE_URL:
      process.env.API_SERVER_BASE_URL || "http://127.0.0.1:8000",
    SENTRY_DSN: process.env.SENTRY_DSN,
    GOOGLE_CLIENT_ID_IOS: process.env.GOOGLE_CLIENT_ID_IOS,
    REVENUECAT_API_KEY_IOS: process.env.REVENUECAT_API_KEY_IOS,
    eas: {
      projectId: "afb60485-2cc7-4ae8-8e95-8f5877500c42", // to change
    },
  },
  plugins: [
    [
      "expo-font",
      {
        fonts: [
          // Manrope - for body text
          "node_modules/@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf",
          "node_modules/@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf",
          "node_modules/@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf",
          "node_modules/@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf",

          // Bricolage Grotesque - for headings
          "node_modules/@expo-google-fonts/bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.ttf",
          "node_modules/@expo-google-fonts/bricolage-grotesque/500Medium/BricolageGrotesque_500Medium.ttf",
          "node_modules/@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf",
          "node_modules/@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf",
        ],
      },
    ],
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
  return "recipes.prepped";
};

const getAppName = () => {
  return "Prepped";
};

const getIcon = () => {
  return "./assets/icon.icon";
};
