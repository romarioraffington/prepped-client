import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackgroundCycler } from "@/components";
// Internal Dependencies
import { useAuth } from "@/contexts";
import { LEGAL_URLS } from "@/libs/constants";
import { reportError } from "@/libs/utils";

export default function Login() {
  const insets = useSafeAreaInsets();
  const [isSigningInWithApple, setIsSigningInWithApple] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const { signInWithGoogle, signInWithApple, isLoading, error } = useAuth();

  const handleAppleSignIn = async () => {
    try {
      setIsSigningInWithApple(true);
      await signInWithApple();
    } finally {
      setIsSigningInWithApple(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningInWithGoogle(true);
      await signInWithGoogle();
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleTermsOfServicePress = async () => {
    try {
      await Linking.openURL(LEGAL_URLS.TERMS_OF_SERVICE);
    } catch (error) {
      reportError(error, {
        component: "Login",
        action: "Open Terms of Service",
      });
    }
  };

  const handlePrivacyPolicyPress = async () => {
    try {
      await Linking.openURL(LEGAL_URLS.PRIVACY_POLICY);
    } catch (error) {
      reportError(error, {
        component: "Login",
        action: "Open Privacy Policy",
      });
    }
  };

  return (
    <BackgroundCycler>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>
              Curate, save places, and discover inspiring destinations for your
              next trip.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (isLoading || isSigningInWithApple) && styles.disabledButton,
              ]}
              activeOpacity={0.85}
              onPress={handleAppleSignIn}
              disabled={isLoading || isSigningInWithApple}
            >
              {isSigningInWithApple ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="logo-apple" size={20} color="#000" />
              )}
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {isSigningInWithApple ? "Signing in..." : "Continue with Apple"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                (isLoading || isSigningInWithGoogle) && styles.disabledButton,
              ]}
              onPress={handleGoogleSignIn}
              disabled={isLoading || isSigningInWithGoogle}
            >
              {isSigningInWithGoogle ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <Ionicons name="logo-google" size={20} color="#111" />
              )}
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {isSigningInWithGoogle
                  ? "Signing in..."
                  : "Continue with Google"}
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View>
            <Text style={styles.termsText}>
              By continuing you agree to TripSpire's{" "}
              <Text
                style={styles.termsLink}
                onPress={handleTermsOfServicePress}
              >
                terms
              </Text>{" "}
              and{" "}
              <Text style={styles.termsLink} onPress={handlePrivacyPolicyPress}>
                privacy
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </BackgroundCycler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 37,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
    fontWeight: "300",
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
    flexDirection: "column",
  },
  button: {
    gap: 12,
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 40,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "white",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButtonText: {
    color: "black",
  },
  secondaryButtonText: {
    color: "white",
  },
  termsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 30,
  },
  termsLink: {
    color: "white",
    textDecorationLine: "underline",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
  },
});
