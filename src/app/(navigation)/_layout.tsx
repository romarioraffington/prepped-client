// External Dependencies
import { Tabs } from "expo-router";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Internal Dependencies
import { ProfileIcon } from "@/components";
import { Colors } from "@/libs/constants";
import { useAuth, useSubscription } from "@/contexts";
import { useBottomNavigationAnimation } from "@/hooks";
import { reportWarning } from "@/libs/utils/errorReporting";

const TAB_BAR_HEIGHT = 75;

export default function BottomNavigation() {
  const { user } = useAuth();
  const { refreshSubscriptionStatus } = useSubscription();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={({ route }) => {
          const { tabBarAnimation, scaleAnimation } = useBottomNavigationAnimation({ route });
          const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

          return {
            tabBarItemStyle: {
              marginTop: 5,
            },
            sceneStyle: {
              backgroundColor: "#fff",
            },
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: Colors.primaryPurple,
            tabBarBackground: () => (
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: -insets.bottom,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  opacity: tabBarAnimation,
                  transform: [
                    {
                      translateY: tabBarAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [totalHeight, 0],
                      }),
                    },
                  ],
                }}
              />
            ),
            tabBarStyle: {
              left: 0,
              right: 0,
              bottom: 0,
              borderTopWidth: 0,
              position: "absolute",
              height: TAB_BAR_HEIGHT,
              paddingBottom: insets.bottom,
              backgroundColor: "transparent",
              opacity: tabBarAnimation,
              overflow: "hidden",
              transform: [
                {
                  translateY: tabBarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [totalHeight, 0],
                  }),
                },
                {
                  scale: scaleAnimation,
                },
              ],
            },
          };
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={22} name="home-outline" color={color} />
            ),
          }}
          listeners={() => ({
            tabPress: () => {
              DeviceEventEmitter.emit("tabPress:home");
            },
          })}
        />
        <Tabs.Screen
          name="wishlists"
          options={{
            headerShown: false,
            headerTransparent: true,
            title: "Wishlists",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={22} name="heart-o" color={color} />
            ),
          }}
          listeners={() => ({
            tabPress: () => {
              DeviceEventEmitter.emit("tabPress:wishlists");
            },
          })}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Profile",
            headerTitle: "",
            headerShown: true,
            headerTransparent: true,
            tabBarIcon: ({ color, focused }) => (
              <ProfileIcon
                size={25}
                letter={user?.name?.charAt(0)}
                imageUrl={
                  user?.profileImage
                    ? { uri: user.profileImage }
                    : require("~/assets/images/welcome/leaning-tower-of-pisa-in-pisa-italy.webp")
                }
              />
            ),
          }}
          listeners={() => ({
            tabPress: () => {
              // Refresh subscription status when account tab is clicked
              refreshSubscriptionStatus().catch((error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reportWarning(errorMessage, {
                  component: "BottomNavigation",
                  action: "Refresh Subscription on Tab Press",
                });
              });
              DeviceEventEmitter.emit("tabPress:account");
            },
          })}
        />
      </Tabs>
    </>
  );
}
