import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
// External Dependencies
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

// Extended screen options type that includes headerTitleContainerStyle
// This is supported by React Navigation at runtime but not fully typed
type ExtendedScreenOptions = NativeStackNavigationOptions & {
  headerTitleContainerStyle?: object;
};

export default function RecommendationsLayout() {
  return (
    <Stack
      screenOptions={
        {
          headerTitle: "",
          headerTintColor: "#000",
          headerTitleAlign: "center",
          headerTransparent: true,
          headerShadowVisible: false,
          contentStyle: styles.contentStyle,
          headerBackButtonDisplayMode: "minimal",
        } as ExtendedScreenOptions
      }
    >
      <Stack.Screen
        name="[slug]/index"
        options={{
          headerTransparent: true,
          headerTintColor: "#000",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="[slug]/amenities"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: "Recommendation",
        }}
      />
      <Stack.Screen
        name="[slug]/photos"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: "Recommendation",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
