import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerTintColor: "#fff",
        headerShadowVisible: false,
        headerTransparent: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="get-started"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="setup"
        options={{
          headerShown: true,
          headerBackTitle: "Get Started",
        }}
      />
      <Stack.Screen
        name="(tiktok)"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
