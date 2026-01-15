const { getDefaultConfig } = require("expo/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Get the default Expo metro config first
const expoConfig = getDefaultConfig(__dirname);

// Get Sentry's metro config
const sentryConfig = getSentryExpoConfig(__dirname);

// Manually merge configs, ensuring Expo's base config is preserved
// and Sentry's modifications are applied on top
const config = {
  ...expoConfig,
  ...sentryConfig,
  resolver: {
    ...expoConfig.resolver,
    ...sentryConfig.resolver,
  },
  transformer: {
    ...expoConfig.transformer,
    ...sentryConfig.transformer,
  },
  serializer: {
    ...expoConfig.serializer,
    ...sentryConfig.serializer,
  },
  // Preserve Expo's cacheStores if Sentry doesn't override it
  cacheStores: sentryConfig.cacheStores || expoConfig.cacheStores,
};

module.exports = config;
