// External Dependencies
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

// Extended screen options type thatp includes headerTitleContainerStyle
// This is supported by React Navigation at runtime but not fully typed
type ExtendedScreenOptions = NativeStackNavigationOptions & {
  headerTitleContainerStyle?: object;
};

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerTintColor: '#000',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: styles.contentStyle,
        headerBackButtonDisplayMode: 'minimal',
      } as ExtendedScreenOptions}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="imports/[slug]/index"
        options={{
          headerBackTitle: 'Home',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="imports/[slug]/recommendations"
        options={{
          headerBackTitle: 'Imports',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="collections/[slug]/index"
        options={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="collections/[slug]/recommendations"
        options={{
          headerShown: true,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="collections/[slug]/options"
        options={{
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.19],
          sheetCornerRadius: 30,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
