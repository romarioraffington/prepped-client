// External Dependencies
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

// Internal Dependencies
import { Colors } from '@/libs/constants';

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
        headerStyle: styles.headerStyle,
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
        name="recipes/[slug]/index"
        options={{
          headerBackTitle: 'Home',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="cookbooks/[slug]/index"
        options={{
          headerTransparent: true,
          headerBackTitle: "Cookbooks",
        }}
      />
      <Stack.Screen
        name="cookbooks/[slug]/edit"
        options={{
          headerShown: true,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerStyle: {
    backgroundColor: Colors.background,
  },
});
