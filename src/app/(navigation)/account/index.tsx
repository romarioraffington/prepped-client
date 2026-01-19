// External Imports
import Animated from "react-native-reanimated";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState, useLayoutEffect, } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, useNavigation } from "expo-router";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";

// Internal Imports
import { Colors } from "@/libs/constants";
import { useLargeTitleCrossfade } from "@/hooks";
import { useAuth, useSubscription } from "@/contexts";
import { reportError, reportWarning } from "@/libs/utils/errorReporting";
import { ProfileIcon, ListItem, ChevronForward, SubscriptionStatus, LargeTitle } from "@/components";
import { APP_VERSION, APP_BUILD_NUMBER, APP_STORE_ID, QUERY_KEYS, LEGAL_ROUTES } from "@/libs/constants";

export default function Account() {
  const title = "Account";
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();
  const { isAuthenticated, user, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshSubscriptionStatus } = useSubscription();

  // Use the crossfade hook for title animation
  const {
    offsetY,
    titleRef,
    largeTitleOpacity,
    measureTitle,
    scrollHandler,
    getHeaderOptions,
  } = useLargeTitleCrossfade({
    currentTitle: title,
  });

  // Single setOptions call using hook-provided options;
  useLayoutEffect(() => {
    navigation.setOptions({
      ...getHeaderOptions(),
    });
  }, [navigation, getHeaderOptions]);

  let displayName = null;
  if (user?.firstName && user.lastName) {
    displayName = `${user.firstName} ${user.lastName}`;
  }

  if (user?.firstName) {
    displayName = `${user.firstName}`;
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);


  const handleProfilePress = () => {
    router.push("/account/profile");
  };

  const handlePrivacyPolicyPress = () => {
    router.push(LEGAL_ROUTES.PRIVACY_POLICY);
  };

  const handleTermsOfServicePress = () => {
    router.push(LEGAL_ROUTES.TERMS_OF_SERVICE);
  };

  const handleReviewPress = async () => {
    try {

      const url = `itms-apps://itunes.apple.com/app/${APP_STORE_ID}?action=write-review`;
      const fallbackUrl = `https://apps.apple.com/app/${APP_STORE_ID}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web URL if deep link doesn't work
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reportWarning(errorMessage, {
        component: "AccountScreen",
        action: "Open App Store for Review",
      });
      Alert.alert(
        "Oops!",
        "Something went wrong. Please visit the App Store to leave a review!"
      );
    }
  };

  const handleLogoutPress = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      reportError(error, {
        component: "AccountScreen",
        action: "Logout",
      });
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh subscription status
      await refreshSubscriptionStatus();

      // Refresh quota status
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPE_QUOTA] });
    } catch (error) {
      reportError(error, {
        component: "AccountScreen",
        action: "Refresh Subscription Status",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingTop: headerHeight + 16 }]}
        refreshControl={
          <RefreshControl
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Header */}
        <LargeTitle
          ref={titleRef}
          offsetY={offsetY}
          currentTitle={title}
          onLayout={measureTitle}
          opacity={largeTitleOpacity}
        />

        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={handleProfilePress}
        >
          <View style={styles.profileInfo}>
            <ProfileIcon
              size={60}
              onPress={handleProfilePress}
              imageUrl={
                user?.profileImage
                  ? { uri: user.profileImage }
                  : require("~/assets/images/welcome/leaning-tower-of-pisa-in-pisa-italy.webp")
              }
            />
            <View>
              {displayName ? (
                <Text style={styles.profileName}>{displayName}</Text>
              ) : (
                <Text style={[styles.profileName, { fontSize: 15 }]}>{user?.email}</Text>
              )}
              <Text style={styles.profileAction}>Show profile</Text>
            </View>
          </View>
          <ChevronForward />
        </TouchableOpacity>

        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Support Section */}
        <View>
          <Text style={styles.sectionTitle}>Support</Text>

          <ListItem
            icon="star-outline"
            title="Leave a review"
            onPress={handleReviewPress}
          />

          <ListItem
            icon="flag"
            iconSize={23}
            IconComponent={AntDesign}
            title="Report a problem"
            onPress={() => router.push("/feedback/report?returnTo=account")}
          />

          <ListItem
            icon="chatbubble-outline"
            title="Send feedback"
            onPress={() => router.push("/feedback?returnTo=account")}
          />

        </View>

        {/* Legal Section */}
        <View>
          <Text style={styles.sectionTitle}>Legal</Text>
          <ListItem
            icon="lock-closed-outline"
            title="Privacy Policy"
            onPress={handlePrivacyPolicyPress}
          />
          <ListItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={handleTermsOfServicePress}
          />
        </View>

        {/* Log out */}
        <TouchableOpacity onPress={handleLogoutPress}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>VERSION {APP_VERSION} ({APP_BUILD_NUMBER})</Text>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: 25,
    paddingBottom: 30,
    paddingHorizontal: 16,
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "600",
  },

  // Profile
  profileSection: {
    paddingRight: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileInfo: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "400",
  },
  profileAction: {
    fontSize: 15,
    color: "#717171",
    marginTop: 4,
  },


  // Other
  sectionTitle: {
    fontSize: 23,
    fontWeight: "500",
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "500",
  },
  versionText: {
    fontSize: 14,
    color: "#717171",
  },
});
