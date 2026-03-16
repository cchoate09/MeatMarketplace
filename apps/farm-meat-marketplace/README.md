# Farm Meat Marketplace

React Native / Expo app scaffold for a two-sided meat marketplace connecting farmers and customers on Android and iOS.

## What is production-ready now

- Local Node.js installed directly in the workspace under `.tools/node`
- Dependencies installed with a lockfile
- TypeScript typecheck passing
- Persistent session role storage with AsyncStorage
- Domain validation with Zod for listings, reviews, and checkout quantity
- Separated screen structure for customer and farmer flows
- Real device location hook with Expo Location and a safe fallback
- Service boundaries for auth, payments, notifications, shipping, and geocoding

## Design doc

- Auction marketplace design doc: `docs/auction-marketplace-design-doc.md`

## Main flows included

- Farmers can log in and:
  - create listings
  - define category and cut
  - set pickup or shipping
  - enter pricing and inventory
  - add pickup instructions
  - specify availability date, processing time, and shipping regions
- Customers can log in and:
  - browse listings
  - filter by delivery method, category, cut, and pickup radius
  - choose pickup or shipping
  - place mock in-app orders
  - leave ratings and short reviews

## Architecture

- `App.tsx`: app entry
- `src/RootApp.tsx`: root layout and role-aware tab switching
- `src/context/AppContext.tsx`: app state, persistence, validation, and business actions
- `src/screens/`: split screens by role and flow
- `src/components/`: reusable UI blocks
- `src/services/`: integration boundaries for backend/platform providers
- `src/storage/sessionStorage.ts`: local session persistence
- `src/schemas/marketplace.ts`: runtime validation
- `src/config/appConfig.ts`: app-level configuration

## Backend setup

The app is now wired for Supabase first, with a built-in mock fallback when environment variables are missing.

## UI demo mode

The app is currently set up to prefer mock data for UI testing.

1. Copy `.env.example` to `.env`.
2. Leave `EXPO_PUBLIC_USE_MOCK_SERVICES=true`.
3. Run the app normally and it will use seeded local users, listings, orders, reviews, and notifications.
4. When you are ready to reactivate live Supabase and Stripe, change `EXPO_PUBLIC_USE_MOCK_SERVICES=false` and keep the live keys in place.

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_USE_MOCK_SERVICES=false`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
4. Enable email/password auth in Supabase Auth.
5. Deploy the Supabase Edge Function in `supabase/functions/stripe-payment-sheet` and add its Stripe secrets in Supabase.
6. Use a development build for live Stripe checkout. Expo Go is fine for most UI work, but Stripe native payments require a dev build.

## Important hooks left for backend work

- `src/services/payments.ts`: Stripe PaymentSheet is wired in, but payouts, webhooks, and saved processor syncing still need to be completed
- `src/services/notifications.ts`: add external push, SMS, or email delivery on top of in-app notifications
- `src/services/shipping.ts`: add cold-chain rates, labels, and tracking
- `src/services/location.ts`: current location works, but address search and richer geocoding can be expanded
- `src/services/mediaService.ts`: connect real image selection/upload UI to Supabase Storage

## Running the app in this workspace

Use the local portable Node that was installed into the repo:

```powershell
.\.tools\node\npm.cmd install
.\.tools\node\npm.cmd run typecheck
.\.tools\node\npm.cmd run start
```

## Android builds

The project is configured for EAS Android builds now:

- `npm run build:android:apk` creates a shareable internal APK profile
- `npm run build:android:aab` creates a production AAB profile

Important notes:

- The current EAS profiles force `EXPO_PUBLIC_USE_MOCK_SERVICES=true`, so the build stays on mock marketplace data for UI testing.
- Stripe and Supabase code are still included in the app, but live services stay disabled until you flip that env var later.
- To actually run the cloud build, you need to log in to Expo first with `eas login`.

## Recommended next production steps

1. Apply the migration to a real Supabase project and point the app at it with `.env`.
2. Replace payment and payout placeholders with Stripe customer vaulting and Stripe Connect.
3. Add a Stripe webhook to sync payment events and save processor references more completely.
4. Add image-picker UI and wire it to `src/services/mediaService.ts` for real storage uploads.
5. Extend order lifecycle with refunds, cancellations, and dispute handling.
6. Add compliance workflows for shipping restrictions, taxes, and food safety documentation.
7. Add analytics, crash reporting, and operational monitoring.
