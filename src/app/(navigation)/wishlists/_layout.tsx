// External Dependencies
import { Stack } from "expo-router";

export default function WishlistLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#000",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Wishlists",
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#fff",
            paddingHorizontal: 8,
          },
        }}
      />
      <Stack.Screen
        name="[slug]/index"
        options={{
          headerBackTitle: "Wishlists",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="[slug]/options"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.29],
          sheetCornerRadius: 30,
          contentStyle: {
            backgroundColor: "#fff",
          },
        }}
      />
      <Stack.Screen
        name="[slug]/recommendations/[slug]/note/index"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.34],
          sheetCornerRadius: 30,
        }}
      />
      <Stack.Screen
        name="[slug]/recommendations/[slug]/note/[id]"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.34],
          sheetCornerRadius: 30,
        }}
      />
      <Stack.Screen
        name="[slug]/edit-wishlist"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.34],
          sheetCornerRadius: 30,
        }}
      />
      <Stack.Screen
        name="[slug]/recommendations"
        options={{
          headerTitle: "",
          headerBackTitle: "Wishlists",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
