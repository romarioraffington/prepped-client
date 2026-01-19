// External Dependencies
import { Tabs } from "expo-router";
import { Animated } from "react-native";
import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
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
              paddingHorizontal: 8,
            },
            tabBarLabelStyle: {
              fontSize: 10,
            },
            sceneStyle: {
              backgroundColor: Colors.background,
            },
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: Colors.primary,
            tabBarBackground: () => (
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: -insets.bottom,
                  backgroundColor: Colors.background,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
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
              paddingHorizontal: 30,
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
            title: "Kitchen",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons size={20} name="chef-hat" color={color} />
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
            title: "Grocery",
            tabBarIcon: ({ color }) => (
              <MaterialIcons size={20} name="shopping-cart" color={color} />
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
              <MaterialIcons size={22} name="person" color={color} />

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
