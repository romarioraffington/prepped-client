# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TripSpire (formerly Brompton App) is a cross-platform mobile application built with Expo SDK 54 and React Native 0.81.4. The app allows users to save and organize travel recommendations from social media platforms (TikTok, Instagram) into collections, with features for importing content, viewing recommendations, and managing subscriptions.

## Essential Commands

### Development
```bash
# Install dependencies
yarn

# Start development server
yarn start

# Platform-specific development
yarn ios      # iOS simulator
yarn android  # Android emulator
yarn web      # Web browser

# Generate native projects
yarn prebuild  # Runs: expo prebuild --no-install --clean
```

### Code Quality
```bash
# Linting (uses Biome, NOT ESLint/Prettier)
yarn lint

# TypeScript runs in strict mode during development
# No dedicated typecheck script - handled by IDE/build process
```

### Testing
```bash
yarn test  # Runs Jest in watch mode
```

### iOS-specific
```bash
cd ios && pod install  # Install CocoaPods dependencies after native module changes
```

## Architecture Overview

### Directory Structure
- **src/app/** - Expo Router pages (file-based routing)
  - **(onboarding)/** - Onboarding flow including TikTok share setup
  - **(navigation)/** - Protected routes (requires authentication)
    - **(home)/(tabs)/** - Bottom tab navigation (collections, imports)
    - **account/** - User profile, subscription, legal pages
    - **create/** - Content creation screens
  - **(modal)/** - Modal overlays (create import modal)
  - **feedback/** - User feedback flows
  - **login.tsx** - Authentication screen
- **src/api/** - React Query hooks for data fetching
- **src/components/** - Reusable UI components
- **src/contexts/** - React Context providers (AuthContext, SubscriptionContext, ImportProgressContext)
- **src/stores/** - Zustand stores (authStore, subscriptionStore)
- **src/hooks/** - Custom React hooks
- **src/libs/** - Utilities, constants, type definitions, API client

### Key Technical Stack
- **Routing**: Expo Router v6 with typed routes and file-based routing
- **State Management**:
  - Zustand for global state (auth, subscription)
  - React Context for scoped state (import progress)
  - React Query (@tanstack/react-query) for server state
- **Data Fetching**: React Query with 5-minute stale time, 3 retries default
- **Authentication**:
  - Secure storage via expo-secure-store
  - Zustand persist middleware for auth state
  - Google Sign-In and Apple Authentication
- **Styling**: React Native StyleSheet (no CSS-in-JS library)
- **Image Loading**: expo-image (NOT react-native-fast-image)
- **Code Formatting**: Biome 1.9.4 (replaces ESLint/Prettier)
- **Error Tracking**: Sentry with React Native integration
- **Subscriptions**: RevenueCat (react-native-purchases)
- **Animations**: react-native-reanimated
- **Bottom Sheets**: @gorhom/bottom-sheet
- **Maps**: react-native-maps with Google Maps API

### Navigation Flow & Route Protection

**Route Protection Logic** (src/app/_layout.tsx):
- Unauthenticated users → `/login`
- Authenticated but not onboarded → `/get-started`
- Authenticated and onboarded → `/(navigation)` routes
- Protection implemented via useSegments + useEffect pattern

**Navigation Structure**:
```
Root (_layout.tsx)
├── login.tsx (public)
├── (onboarding)
│   ├── get-started.tsx
│   ├── setup.tsx
│   └── (tiktok)
│       ├── sharing-from-tiktok.tsx
│       └── add-to-sharesheet.tsx
├── (navigation) [Protected - requires auth]
│   ├── (home)
│   │   └── (tabs)
│   │       ├── index.tsx           # Collections list
│   │       └── imports.tsx         # Imports list
│   ├── (home)/collections/[slug]
│   │   ├── index.tsx               # Collection detail
│   │   └── recommendations.tsx     # Collection recommendations
│   ├── (home)/imports/[slug]
│   │   ├── index.tsx               # Import detail
│   │   └── recommendations.tsx     # Import recommendations
│   ├── (home)/recommendations/[slug]
│   │   ├── index.tsx               # Recommendation detail
│   │   ├── photos.tsx              # Photo gallery
│   │   └── amenities.tsx           # Amenities list
│   ├── account
│   │   ├── index.tsx               # Account overview
│   │   ├── profile/
│   │   ├── (subscription)/manage-subscription.tsx
│   │   └── (legal)/ (privacy-policy, terms-of-service)
│   └── create/index.tsx
├── (modal)/create.tsx              # Import creation modal
└── feedback                        # Feedback flow (fullScreenModal)
```

### Environment Configuration

**Environment Variables** (set in `.env`, exposed via `app.config.ts`):
- `TRIPSPIRE_API_BASE_URL` - Backend API URL (default: http://127.0.0.1:8000)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for iOS
- `SENTRY_DSN` - Sentry error tracking DSN
- `GOOGLE_CLIENT_ID_IOS` - Google Sign-In client ID
- `REVENUECAT_API_KEY_IOS` - RevenueCat API key for subscriptions
- `APP_VARIANT` - Set to "development" for dev builds (changes bundle ID and icon)

**Accessing Environment Variables**:
```typescript
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.TRIPSPIRE_API_BASE_URL;
```

### API Architecture

**API Client** (src/libs/api/client.ts):
- Axios-based client with automatic token injection
- Retry logic for transient failures
- Error handling with custom error types

**API Endpoints** (src/libs/constants/api.ts):
- Centralized endpoint definitions using template literals
- Dynamic base URL from environment config

**React Query Patterns** (src/api/):
- Query hooks for GET requests (e.g., `useImportQuota`)
- Mutation hooks for POST/PUT/DELETE
- Prefetching on authentication (quota data)

### State Management Patterns

**Zustand Stores**:
- `authStore` (src/stores/authStore.ts):
  - Persisted to secure storage via expo-secure-store
  - Stores user, tokens, auth status
  - Actions: setAuthenticatedUser, clearAuthentication, updateUser
- `subscriptionStore` (src/stores/subscriptionStore.ts):
  - Subscription status, entitlements

**React Context**:
- `AuthProvider` - Wraps authStore, provides useAuth hook
- `SubscriptionProvider` - RevenueCat integration
- `ImportProgressProvider` - Manages import progress UI state

**Data Fetching with React Query**:
- Query client configured in src/app/_layout.tsx
- 5-minute stale time, 3 retries default
- Invalidation on mutations for cache consistency

### Share Extension Flow

**iOS Share Extension** (expo-share-intent):
1. User shares URL from TikTok/Instagram → Share sheet
2. Share Intent captures URL via `expo-share-intent` plugin
3. `ShareIntentHandler` component processes intent
4. Triggers import creation via API
5. `ImportProgressManager` displays progress UI

**Configuration**:
- Activation rules in app.config.ts (web URLs, max count 1)
- `resetOnBackground: true` to clear intents when app backgrounds

## Important Technical Notes

1. **Image Components**: Always use `expo-image` Image component, NOT `react-native-fast-image`
2. **Linting**: Run `yarn lint` (uses Biome, not ESLint)
3. **Path Aliases**:
   - `@/*` → `src/*`
   - `~/*` → project root
4. **TypeScript**: Strict mode enabled, typed routes via `experiments.typedRoutes`
5. **Pod Dependencies**: After adding/updating native iOS modules, run `cd ios && pod install`
6. **Patch Package**: Uses patch-package (runs on postinstall) for package patches
7. **New Architecture**: Expo's new architecture enabled (`newArchEnabled: true`)
8. **Platform Detection**: Use `src/libs/utils/platform.ts` for device feature detection (e.g., `hasHomeButton()`)

## Common Patterns

### Component Structure
```typescript
// Functional component with TypeScript
interface Props {
  // Props interface at top
}

export function MyComponent({ prop }: Props) {
  // Hooks
  // Event handlers
  // Render
  return <View style={styles.container}>...</View>;
}

// Styles at bottom with StyleSheet.create()
const styles = StyleSheet.create({
  container: { ... }
});
```

### Authentication Flow
1. User logs in via Google/Apple
2. Token stored in authStore (persisted to secure storage)
3. API client injects token in Authorization header
4. Route protection redirects based on auth/onboarding status

### Creating New API Endpoints
1. Add endpoint constant to `src/libs/constants/api.ts`
2. Create React Query hook in `src/api/[feature]/`
3. Use hook in component via `useQuery` or `useMutation`

### Asset Management
- Images: `assets/images/`
- Fonts: `assets/fonts/` (loaded via expo-font)
- Videos: `assets/videos/`
- Icons: Use `@expo/vector-icons` or `expo-symbols`