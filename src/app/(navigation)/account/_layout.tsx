import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerTintColor: '#000',
        headerShadowVisible: false,
        contentStyle: styles.contentStyle,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          headerTitle: 'Account',
          headerBackTitle: 'Account',
        }}
      />
      <Stack.Screen
        name="(legal)/privacy-policy"
        options={{
          headerShown: true,
          headerTitle: 'Privacy Policy',
          headerBackTitle: 'Account',
        }}
      />
      <Stack.Screen
        name="(legal)/terms-of-service"
        options={{
          headerShown: true,
          headerTitle: 'Terms of Service',
          headerBackTitle: 'Account',
        }}
      />
      <Stack.Screen
        name="(subscription)/manage-subscription"
        options={{
          headerShown: true,
          headerTitle: 'Subscriptions',
          headerBackTitle: 'Account',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    backgroundColor: 'white',
  },
});
