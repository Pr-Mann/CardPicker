# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # NearbyStores Expo app (iOS + Android)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## NearbyStores Mobile App (`artifacts/mobile`)

A production-ready native mobile app for Android and iOS built with Expo.

### Features
- Location permission flow (foreground, handles iOS/Android/web)
- Google Places API integration for nearby store discovery
- Scrollable list sorted by distance
- Category filter chips (All, Grocery, Gas, Pharmacy, Restaurant, Retail, Gym, Convenience)
- Store cards with name, address, distance, category badge, rating, open/closed status
- Store detail view with "Get Directions" (opens native Maps app)
- 3-slide onboarding screen with skip/next
- Skeleton loading states
- Pull-to-refresh
- Liquid glass tab bar on iOS 26+

### Key Files
- `app/_layout.tsx` — Root layout with fonts, QueryClient, providers
- `app/(tabs)/_layout.tsx` — Tab bar with NativeTabs (iOS 26) / Classic fallback
- `app/(tabs)/index.tsx` — Main screen with location + store list
- `app/onboarding.tsx` — 3-slide onboarding
- `app/store-detail.tsx` — Store detail with directions
- `components/StoreCard.tsx` — Animated store list item
- `components/SkeletonCard.tsx` — Loading skeleton
- `components/CategoryFilter.tsx` — Horizontal filter chips
- `hooks/useNearbyStores.ts` — Google Places API hook + category detection
- `constants/colors.ts` — Color theme
- `PRIVACY_POLICY.md` — App Store / Play Store compliant privacy policy

### Environment Variables
- `GOOGLE_MAPS_API_KEY` — Secret (stored in Replit Secrets)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — Public env var passed to Expo app

### Setup Instructions for Google API Keys
1. Go to https://console.cloud.google.com
2. Create a project (or select existing)
3. Enable: **Places API** and **Maps SDK for Android** / **Maps SDK for iOS**
4. Create an API key under APIs & Services → Credentials
5. Restrict the key to Places API for security
6. Add to Replit Secrets as `GOOGLE_MAPS_API_KEY`

## TypeScript & Composite Projects

- **Always typecheck from the root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — cross-package imports resolve correctly

## Root Scripts

- `pnpm run build` — typecheck then recursively build all packages
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/` use `@workspace/api-zod` for validation.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client.
