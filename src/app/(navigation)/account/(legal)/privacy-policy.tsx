// External Dependencies
import { useState } from "react";
import WebView from "react-native-webview";
import { View, StyleSheet, ActivityIndicator } from "react-native";

// Internal Dependencies
import { LEGAL_URLS } from "@/libs/constants";

export default function PrivacyPolicy() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        source={{ uri: LEGAL_URLS.PRIVACY_POLICY }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
