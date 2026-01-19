// External Dependencies
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Host } from 'react-native-portalize';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ShareIntentProvider } from 'expo-share-intent';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';

// Internal Dependencies
import { useImportQuota } from '@/api';
import { useAppUpdates } from '@/hooks';
import { reportWarning } from '@/libs/utils';
import { hasHomeButton, isIPad } from '@/libs/utils/platform';
import { setupConsoleErrorInterceptor } from '@/libs/utils/consoleInterceptor';
import { ImportProgressManager, ShareIntentHandler, ErrorFallback, ActionToast } from '@/components';
import { ImportProgressProvider, AuthProvider, SubscriptionProvider, ActionToastProvider, useAuth } from '@/contexts';

// Get environment configuration
const isDev = __DEV__;

// Only initialize Sentry in production
if (!isDev) {
  Sentry.init({
    dsn: Constants.expoConfig?.extra?.SENTRY_DSN,

    // Environment configuration
    environment: 'production',

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs - needed for error tracking in all environments
    enableLogs: true,

    // Performance monitoring
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.mobileReplayIntegration(),
    ],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });

  // Setup console.error interceptor as a safety net
  // This catches errors that might slip through explicit reportError calls
  // Errors are tagged with source: 'console.error' for filtering in Sentry
  setupConsoleErrorInterceptor();
}

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      // Global error handler for unhandled errors
      onError: (error, variables, context) => {
        // Always log to Sentry
        Sentry.captureException(error);
      },
    },
  },
});


const navigationIntegration = !isDev
  ? Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
  })
  : null;

export default function HomeLayout() {
  const ref = useNavigationContainerRef();
  const { isUpdateAvailable, isUpdatePending, fetchAndReload } = useAppUpdates();

  // Handle splash screen hide with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ref && navigationIntegration) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  // Handle automatic updates with manual fallback
  useEffect(() => {
    if (isUpdateAvailable && !isUpdatePending) {
      // Try to automatically fetch and apply the update
      fetchAndReload().catch((error) => {
        // If automatic update fails, the error is handled in the hook
        // The app will continue running, allowing for manual retry if needed
        reportWarning('Automatic update failed, app will continue with current version', {
          component: 'RootLayout',
          action: 'Automatic Update',
          extra: { error },
        });
      });
    }
  }, [isUpdateAvailable, isUpdatePending, fetchAndReload]);

  const content = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <ShareIntentProvider
            options={{
              debug: false,
              resetOnBackground: false,
            }}
          >
            <ImportProgressProvider>
              <ActionToastProvider>
                <GestureHandlerRootView style={styles.container}>
                  <Host>
                    <RootLayoutNavigator />
                    {
                      // ShareIntentHandler manages share intent imports
                      // ImportProgressManager renders the ImportProgressItem
                      // components. The ImportProgressItem components are used
                      // to render the import progress items UI
                    }
                    <ShareIntentHandler />
                    <ImportProgressManager />
                    <ActionToast />
                  </Host>
                </GestureHandlerRootView>
              </ActionToastProvider>
            </ImportProgressProvider>
          </ShareIntentProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  // Only use Sentry.ErrorBoundary in production
  if (!isDev) {
    return (
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <ErrorFallback error={error as Error} resetError={resetError} />
        )}
        beforeCapture={(scope) => {
          scope.setTag('errorBoundary', 'root');
        }}
      >
        {content}
      </Sentry.ErrorBoundary>
    );
  }

  return content;
}

// Component to handle route protection
function RootLayoutNavigator() {
  // Prefetch quota data when user is authenticated
  useImportQuota();

  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const [modalDetent, setModalDetent] = useState<number>(0.42);

  useEffect(() => {
    const loadDetent = () => {
      try {
        const hasButton = hasHomeButton();

        // iPhone SE and older devices: use smaller modal (42% of screen)
        // iPhone X and newer devices: use larger modal (56% of screen)
        setModalDetent(hasButton || isIPad() ? 0.56 : 0.42);
      } catch (error) {
        reportWarning('Error detecting device type', {
          component: 'ModalConfigScreen',
          action: 'Load Detent',
          extra: { error },
        });
        // Keep default value (0.42) if detection fails
      }
    };

    loadDetent();
  }, []);

  // Set mounted state after component mounts
  // This ensures the root layout (<Slot />)
  // is fully rendered before navigation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Authentication disabled - allow all routes without auth check
  // useEffect(() => {
  //   // Don't redirect while auth is loading or
  //   // component not mounted isMounted prevents
  //   // "Attempted to navigate before mounting"
  //   // error by ensuring the navigation system
  //   // is ready before calling router.replace()
  //   if (isLoading || !isMounted) return;

  //   // Everything except login is in the auth group (protected)
  //   const isLoginRoute = segments[0] === 'login';
  //   const isProtectedRoute = !isLoginRoute;
  //   const isOnboardingRoute = segments[0] === '(onboarding)' || segments.some(segment => segment === 'get-started');

  //   if (!isAuthenticated && isProtectedRoute) {
  //     // User is not authenticated and trying to access protected routes
  //     router.replace('/login');
  //   } else if (isAuthenticated && isLoginRoute) {
  //     // User is authenticated but on login page, redirect based on onboarding status
  //     if (user?.hasCompletedOnboarding) {
  //       router.replace('/');
  //     } else {
  //       router.replace('/get-started');
  //     }
  //   } else if (isAuthenticated && !user?.hasCompletedOnboarding && !isOnboardingRoute) {
  //     // User is authenticated, not onboarded, trying to access non-onboarding route → force onboarding
  //     router.replace('/get-started');
  //   }
  //   // Note: Allow onboarded users to manually view /get-started if they want
  // }, [isAuthenticated, isLoading, segments, router, isMounted, user]);

  // Authentication disabled - skip loading screen
  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#000" />
  //     </View>
  //   );
  // }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="(navigation)" />
      <Stack.Screen name="recommendations"
      />
      <Stack.Screen
        name="feedback"
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="(paywall)"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="(modal)/create"
        options={{
          sheetCornerRadius: 20,
          presentation: 'formSheet',
          sheetAllowedDetents: [modalDetent],
        }}
      />
      <Stack.Screen
        name="(modal)/create-wishlist/index"
        options={{
          headerShown: false,
          sheetCornerRadius: 30,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.34],
        }}
      />
      <Stack.Screen
        name="(modal)/save-to-wishlist/index"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="(modal)/delete-from-wishlist/index"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="(modal)/manage-wishlists/index"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
