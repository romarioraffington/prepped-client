import { Stack } from 'expo-router';

export default function TikTokLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="add-to-sharesheet" />
      <Stack.Screen name="sharing-from-tiktok" />
    </Stack>
  );
}
