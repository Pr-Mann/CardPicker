# EXECUTE.md

## 1. Project Overview

**NearbyStores** is a production-ready native mobile application for Android and iOS that helps users discover stores near their current GPS location in real time. It uses the Google Places API (New) to fetch nearby places and presents them in a clean, sorted, filterable list.

### Main Features Implemented

- GPS location detection with permission handling (iOS, Android, Web fallback)
- Real-time nearby store discovery via Google Places API (New)
- Scrollable store list sorted by distance
- Category filter chips (All, Grocery, Gas, Pharmacy, Restaurant, Retail, Gym, Convenience)
- Live search bar with dynamic location/search action button
- Credit card recommendation placeholder widget (fintech-style phone mockup with card preview)
- Store detail view with "Get Directions" (opens native Maps app)
- 3-slide onboarding screen with animated dot pagination
- Skeleton loading states and pull-to-refresh
- Liquid glass tab bar on iOS 26+ (NativeTabs), BlurView fallback on older iOS, Material 3 on Android
- Error states for denied permissions, network failures, and invalid API keys
- Privacy policy compliant with App Store and Google Play requirements

### Target Platforms

- **iOS** (primary) — tested via Expo Go, targets iOS 15+, supports iOS 26 liquid glass
- **Android** (primary) — tested via Expo Go, targets Android 12+
- **Web** — functional with browser Geolocation API as fallback

### High-Level Architecture

```
User Device (Expo Go / Production Build)
       │
       ├── expo-location → GPS coordinates
       │
       └── Google Places API (New)
               https://places.googleapis.com/v1/places:searchNearby
               POST with X-Goog-Api-Key header + X-Goog-FieldMask
               │
               └── Results → sorted, categorized, displayed in FlatList
```

The app is entirely client-side. There is no custom backend server required for the mobile app itself. The shared monorepo includes an Express API server (`artifacts/api-server`) for future extensibility.

---

## 2. Development Standards

### Code Structure and Modular Architecture

- One responsibility per file: hooks handle data fetching, components handle rendering, screens handle composition
- All reusable UI is extracted into `/components/` — never write repeated JSX inline across screens
- Business logic (API calls, distance calculations, category detection) lives in `/hooks/`
- Theme values (colors, spacing) live in `/constants/` — never hardcode colors in component files

### Naming Conventions

| Item             | Convention                      | Example                             |
| ---------------- | ------------------------------- | ----------------------------------- |
| Components       | PascalCase                      | `StoreCard.tsx`, `SearchWidget.tsx` |
| Hooks            | camelCase with `use` prefix     | `useNearbyStores.ts`                |
| Constants        | camelCase default export        | `colors.ts`                         |
| Screens          | PascalCase file, default export | `app/(tabs)/index.tsx`              |
| Types/Interfaces | PascalCase                      | `NearbyStore`, `StoreCategory`      |
| Style objects    | camelCase keys                  | `styles.cardTopRow`                 |

### Error Handling Strategy

- Every async operation is wrapped in `try/catch`
- API errors surface a user-visible error state with a Retry button — never silent failures
- Permission denials show a dedicated UI state with actionable guidance
- The `ErrorBoundary` class component catches unexpected render errors and shows a reload prompt
- HTTP errors from Google APIs are inspected for status codes (403/400) to give specific messages

### Logging Strategy

- Development: `console.error` for caught exceptions, Expo Metro logs visible in terminal
- Production: no sensitive data (coordinates, API keys) is logged
- API key is never logged or exposed in error messages shown to users

### Security Considerations

- **API key is stored as a Replit Secret** (`GOOGLE_MAPS_API_KEY`) and exposed to Expo only via `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — never hardcoded in source
- The key is sent in the `X-Goog-Api-Key` header (not in the URL query string) per Google's recommendation for the Places API (New)
- Location data is never persisted — used only in-memory per session for the API request
- No user accounts, no data storage on any server

### Performance Best Practices

- `FlatList` used for all lists (virtualised rendering, not `ScrollView` + `.map()`)
- Animations use `react-native-reanimated` with native driver where possible
- Skeleton shimmer uses `withRepeat` + `withSequence` rather than JS-thread `Animated`
- `useCallback` on `onRefresh` to prevent unnecessary re-renders
- Store filtering is done in-memory on the already-fetched result set — no extra API call per filter/search change
- `FadeInDown.delay(index * 35)` staggers list animations without blocking the UI thread

### API Design Practices

- Uses **Google Places API (New)** (`places.googleapis.com/v1`) — not the deprecated legacy API
- Field mask (`X-Goog-FieldMask`) is specified to request only required fields, minimising response size and billing
- `maxResultCount: 20` caps results per request to control cost
- `includedTypes` array scopes the search to store-relevant place types only
- Distance is computed client-side with the Haversine formula — avoids a Distance Matrix API call

### UI/UX Design Principles

- Follows **Apple Human Interface Guidelines** and **Material Design 3**
- Safe area insets via `useSafeAreaInsets()` — never hardcoded padding values
- Web platform gets explicit `paddingTop: 67` and `paddingBottom: 34` overrides
- Haptic feedback on all interactive actions (`expo-haptics`)
- Every interactive element has press feedback (scale spring animation)
- Empty, loading, error, and success states are all designed — no blank screens
- Icons from `@expo/vector-icons` only — no emojis anywhere in the UI

---

## 3. Technology Stack

| Technology                                    | Version  | Why Chosen                                                                  |
| --------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| **Expo**                                      | ~54.0.27 | Unified iOS/Android/Web build toolchain; Expo Go for instant device testing |
| **Expo Router**                               | ~6.0.17  | File-based routing (like Next.js) — zero boilerplate navigation setup       |
| **React Native**                              | 0.81.5   | Cross-platform native UI with JS/TS                                         |
| **TypeScript**                                | ~5.9.2   | Type safety across the entire codebase                                      |
| **React Native Reanimated**                   | ~4.1.1   | 60fps animations on the UI thread via worklets                              |
| **expo-location**                             | ~19.0.8  | Native GPS permission and location API                                      |
| **expo-linear-gradient**                      | ~15.0.8  | Fintech-grade gradient cards and headers                                    |
| **expo-haptics**                              | ~15.0.8  | Tactile feedback for press interactions                                     |
| **expo-blur**                                 | ~15.0.8  | BlurView for iOS tab bar background                                         |
| **expo-glass-effect**                         | ~0.1.4   | Liquid glass tab bar on iOS 26+                                             |
| **@tanstack/react-query**                     | catalog  | Server state management (ready for API calls)                               |
| **@react-native-async-storage/async-storage** | 2.2.0    | Persist onboarding completion flag locally                                  |
| **@expo/vector-icons**                        | ^15.0.3  | Ionicons, MaterialCommunityIcons, Feather                                   |
| **@expo-google-fonts/inter**                  | ^0.4.0   | Inter font family — clean, legible, modern                                  |
| **react-native-safe-area-context**            | ~5.6.0   | Correct insets for notch, Dynamic Island, Android status bar                |
| **pnpm**                                      | 10.x     | Fast, disk-efficient monorepo package manager                               |
| **Google Places API (New)**                   | v1       | Real-time nearby store data with rich place types                           |

---

## 4. Project Structure

```
/                                  → Monorepo root
├── EXECUTE.md                     → This file
├── replit.md                      → Project memory and architecture notes
├── package.json                   → Root workspace scripts and dev dependencies
├── pnpm-workspace.yaml            → Workspace package discovery and catalog versions
├── tsconfig.json                  → Root TypeScript solution file (lib references only)
├── tsconfig.base.json             → Shared strict TypeScript defaults

├── artifacts/
│   ├── mobile/                    → NearbyStores Expo app (PRIMARY ARTIFACT)
│   │   ├── app/                   → Expo Router screens (file-based routes)
│   │   │   ├── _layout.tsx        → Root layout: fonts, QueryClient, providers, ErrorBoundary
│   │   │   ├── onboarding.tsx     → 3-slide onboarding screen
│   │   │   ├── store-detail.tsx   → Store detail with Get Directions
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx    → Tab bar (NativeTabs iOS 26 / Classic fallback)
│   │   │       └── index.tsx      → Main home screen (search, widget, store list)
│   │   ├── components/            → Reusable UI components
│   │   │   ├── SearchWidget.tsx   → Search bar + credit card placeholder widget
│   │   │   ├── StoreCard.tsx      → Animated store list item card
│   │   │   ├── SkeletonCard.tsx   → Shimmer loading placeholder
│   │   │   ├── CategoryFilter.tsx → Horizontal scrollable filter chips
│   │   │   ├── ErrorBoundary.tsx  → Class component error boundary
│   │   │   └── ErrorFallback.tsx  → Error UI with reload button
│   │   ├── hooks/
│   │   │   └── useNearbyStores.ts → Google Places API (New) hook + category detection + Haversine
│   │   ├── constants/
│   │   │   └── colors.ts          → App color palette (light theme)
│   │   ├── assets/
│   │   │   └── images/            → App icon, splash screen
│   │   ├── app.json               → Expo configuration (permissions, bundle IDs, plugins)
│   │   ├── package.json           → Mobile app dependencies
│   │   └── PRIVACY_POLICY.md      → App Store / Play Store compliant privacy policy
│   │
│   ├── api-server/                → Express 5 API server (shared backend, extensible)
│   │   └── src/
│   │       ├── app.ts             → Express app setup (CORS, JSON, routes)
│   │       ├── index.ts           → Server entry (PORT env var)
│   │       └── routes/            → Route handlers
│   │
│   └── mockup-sandbox/            → Isolated Vite UI prototyping sandbox (design only)

├── lib/
│   ├── api-spec/                  → OpenAPI 3.1 spec + Orval codegen config
│   │   └── openapi.yaml           → Single source of truth for API contracts
│   ├── api-client-react/          → Generated React Query hooks (from codegen)
│   ├── api-zod/                   → Generated Zod validation schemas (from codegen)
│   └── db/                        → Drizzle ORM + PostgreSQL connection

└── scripts/                       → Utility scripts
```

---

## 5. Development Workflow

### Branch Strategy

```
main          → production-ready, always deployable
feature/*     → new features (e.g. feature/card-recommendations)
fix/*         → bug fixes (e.g. fix/places-api-error-handling)
chore/*       → dependency updates, config changes
```

### Commit Message Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(mobile): add credit card recommendation widget
fix(api): switch to Places API (New) endpoint
chore(deps): update expo to 54.0.27
docs: update EXECUTE.md with deployment notes
refactor(hooks): extract category detection logic
```

### Pull Request Expectations

- One feature or fix per PR
- PR description must explain: what changed, why, and how to test
- Screenshots or screen recordings for any UI changes
- No PR merged with TypeScript errors (`pnpm run typecheck` must pass)

### Code Review Expectations

- Review for: correctness, performance, security, adherence to standards in this document
- All `// TODO` comments must reference a follow-up issue
- No hardcoded strings, colors, or API keys in reviewed code

### Testing Expectations

- Manual testing on a physical Android device via Expo Go before any PR merge
- Test all states: loading, empty, error, location denied, location granted
- Test search bar: empty state, typing, clearing
- Test category filters with real results

### Linting and Formatting

- TypeScript strict mode enforced (`tsconfig.base.json`)
- Run `pnpm run typecheck` before committing
- Prettier configured at root — format on save recommended

---

## 6. Instructions for Other AI Systems

When contributing to this repository, follow these rules strictly:

1. **Do not modify core architecture without updating `replit.md` and this file.** Both files serve as the project's memory.

2. **Maintain modular component structure.** Every new UI element belongs in `artifacts/mobile/components/`. Screens in `app/` should only compose components, not contain inline complex JSX.

3. **Follow naming conventions defined in Section 2.** PascalCase components, `use` prefix hooks, camelCase style keys.

4. **Never hardcode colors.** Always import from `@/constants/colors` and reference theme keys.

5. **Never hardcode padding values for safe areas.** Always use `useSafeAreaInsets()`. For web, use `Platform.OS === "web"` guards with `67` top and `34` bottom insets.

6. **Always handle all states.** Any data-fetching component must handle: loading (skeleton), empty, error, and success.

7. **Use the Places API (New) format.** Never revert to the legacy `maps.googleapis.com/maps/api/place/` endpoint. See `hooks/useNearbyStores.ts` for the correct POST format.

8. **Do not add `react-native-maps` to the `plugins` array in `app.json`** — it causes crashes. The version must remain pinned to `1.18.0` for Expo Go compatibility.

9. **Do not use the `uuid` package.** Use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` or `expo-crypto` for unique IDs.

10. **Do not install libraries outside the Expo Go compatible list** without checking Expo SDK 54 compatibility first.

11. **Do not use `scrollToEnd()` for scrollable lists.** Use inverted `FlatList` for chat-style UIs.

12. **Keep `EXPO_PUBLIC_` prefix** on any environment variable that must be accessible in Expo client code.

13. **Avoid breaking changes to the OpenAPI spec** without running `pnpm --filter @workspace/api-spec run codegen` immediately after.

---

## 7. Environment Setup

### Prerequisites

- Node.js 24+
- pnpm 10+ (`npm install -g pnpm`)
- Expo Go app installed on your Android or iOS device
- Google Cloud account with **Places API (New)** enabled

### Clone and Install

```bash
git clone <repository-url>
cd <project-root>
pnpm install
```

### Configure Environment Variables

Create or configure the following in your environment (Replit Secrets or `.env`):

```bash
# Required — Google Maps / Places API key
# Enable "Places API (New)" in Google Cloud Console
GOOGLE_MAPS_API_KEY=your_api_key_here

# Automatically derived from the above for Expo client access
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Google Cloud Console Setup:**

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Navigate to **APIs & Services → Library**
4. Enable: **Places API (New)**
5. Navigate to **APIs & Services → Credentials**
6. Create an API key
7. (Recommended) Restrict the key to the Places API (New)

### Database Setup (optional — for API server)

```bash
# Provision a PostgreSQL database (Replit provides this automatically)
# Then push the schema:
pnpm --filter @workspace/db run push
```

---

## 8. How to Execute / Run the Project

### Install Dependencies

```bash
pnpm install
```

### Run the Mobile App (Expo)

```bash
pnpm --filter @workspace/mobile run dev
```

Then scan the QR code displayed in the terminal using **Expo Go** on your Android or iOS device.

### Run the API Server

```bash
pnpm --filter @workspace/api-server run dev
```

Server starts on the port defined by the `PORT` environment variable (auto-assigned in Replit).

### Run All Services (Replit)

In Replit, workflows start automatically. Use the workflow panel to start/restart:

- `artifacts/mobile: expo` — Expo dev server
- `artifacts/api-server: API Server` — Express backend

### Build Production Mobile App

```bash
pnpm --filter @workspace/mobile run build
```

### Typecheck Entire Monorepo

```bash
pnpm run typecheck
```

### Run API Codegen (after OpenAPI spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## 9. Deployment Notes

### Mobile App (iOS / Android)

The app uses **Expo** and can be built for production using **EAS Build** (Expo Application Services):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build profiles
eas build:configure

# Build for Android (APK / AAB for Play Store)
eas build --platform android

# Build for iOS (IPA for App Store)
eas build --platform ios
```

**Before submitting to stores:**

- Update `version` in `app.json` following semantic versioning
- Set production `bundleIdentifier` (iOS) and `package` (Android) in `app.json` — never change these after first publish
- Ensure `GOOGLE_MAPS_API_KEY` is configured in EAS Secrets (`eas secret:create`)
- Review `PRIVACY_POLICY.md` and host it at a public URL for store listings
- Add the privacy policy URL to both App Store Connect and Google Play Console

### API Server

The Express API server deploys via Replit's deployment pipeline:

- Run `pnpm --filter @workspace/api-server run build` to produce `dist/index.cjs`
- The production build is a self-contained CJS bundle
- Database migrations run automatically via the post-merge script

### App Store Privacy Requirements

The app declares:

- `NSLocationWhenInUseUsageDescription` (iOS `Info.plist`) — already set in `app.json`
- `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` (Android manifest) — already set in `app.json`
- No background location usage
- Data Safety form (Google Play): location data collected, not shared, not stored
