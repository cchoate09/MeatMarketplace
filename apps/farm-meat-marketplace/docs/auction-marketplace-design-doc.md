# Farmer-to-Slaughterhouse Auction Marketplace Design Doc

## Document purpose

This document describes the product, architecture, data model, user flows, and delivery plan for the auction-based mobile marketplace in this repository. It is intended to be shareable with collaborators, designers, engineers, and stakeholders who need a clear picture of what the app is, how it works today, and how it should evolve toward production.

The current implementation lives on the `codex/auction` branch and uses mock data by default for UI testing, while preserving Supabase and Stripe integration hooks for later reactivation.

## Product summary

The app connects livestock and meat-lot farmers with slaughterhouses through an auction workflow rather than fixed-price checkout. Farmers create auction listings for meat or livestock lots, define reserve prices and timing, and allow competing slaughterhouses to place manual or automated bids. The highest compliant bid at close wins the lot, then the parties move into settlement, contract, and pickup coordination.

The experience is closer to eBay than a direct marketplace:

- farmers control the lot structure, reserve, and auction timing
- slaughterhouses compete against each other
- buyers can use bidding strategies with maximum ceilings
- awarded auctions move into a post-auction settlement flow

## Goals

### Primary goals

- Help farmers receive better pricing through competitive bidding
- Help slaughterhouses source lots efficiently within a target radius
- Make the auction state legible and fast to act on from a mobile device
- Preserve a clean path to production with database, auth, and payment hooks

### Secondary goals

- Provide a convincing demo mode with realistic seeded activity
- Keep the app testable in Expo Go while live integrations are still incomplete
- Support future expansion into contracts, logistics, compliance, and payouts

## Non-goals for the current phase

- Full live auction backend in production
- Real-time websocket bidding
- Completed Stripe Connect payout flow
- Full compliance automation for licensing, inspection, and transport
- A desktop web application

## User roles

### Farmer

The farmer lists auction lots and controls the sale parameters.

Responsibilities:

- create lots
- define reserve price
- define opening bid and minimum increment
- choose auction duration
- supply lot details, quality indicators, and handling expectations
- review live auction progress
- close auctions early if needed
- move awarded lots through settlement and pickup stages

### Slaughterhouse

The slaughterhouse is the buyer role in the marketplace.

Responsibilities:

- browse and filter active lots
- watch auctions within a sourcing radius
- place manual bids
- configure auto-bid strategies with a maximum price ceiling
- track active bids and awarded lots
- complete settlement after winning
- leave reviews after the transaction

## Product principles

- Mobile-first: the most important actions should be available within a few taps
- Auction clarity: current price, reserve state, leader, and time remaining should be obvious
- Farmer control: farmers should feel that they set the terms of the sale
- Buyer efficiency: slaughterhouses should be able to act quickly across multiple auctions
- Progressive productionization: mock mode should feel realistic while live hooks stay intact

## Core use cases

### 1. Farmer creates an auction lot

The farmer creates a listing with:

- title
- description
- category and cut
- lot size in total weight and head count
- opening bid
- reserve price
- minimum increment
- auction duration
- quality grade
- estimated yield
- handling notes
- payment terms
- images or image placeholders

The listing enters either `scheduled` or `live` state depending on timing.

### 2. Slaughterhouse bids manually

The buyer opens a lot, reviews current bid and reserve state, and places a manual bid above the required minimum.

### 3. Slaughterhouse uses auto-bid

The buyer sets a maximum price ceiling and increment. The system automatically keeps that buyer competitive up to the maximum, similar to proxy bidding on eBay.

### 4. Auction closes

At close:

- if reserve is met and there is a leader, the auction becomes `awarded`
- if reserve is not met, the auction becomes `closed`
- the winner and farmer receive notifications
- an award record is created for settlement tracking

### 5. Post-award settlement

The farmer and slaughterhouse move through a settlement lifecycle:

- `pending_settlement`
- `contract_sent`
- `ready_for_pickup`
- `completed`
- `closed`

## Functional requirements

### Authentication and identity

- email/password authentication
- role-based account types: `farmer` and `slaughterhouse`
- demo sign-in paths for mock mode
- separate onboarding information per role

### Farmer functionality

- create and publish auction listings
- see live inventory and reserve performance
- see current leader and bid count
- close auctions early
- manage farm profile and payout setup
- monitor awarded lots and advance settlement status

### Slaughterhouse functionality

- browse active, scheduled, and awarded auctions
- filter by category, cut, auction status, and sourcing radius
- save favorite auctions
- place manual bids
- set auto-bid ceilings
- review bid history
- manage slaughterhouse profile and sourcing preferences
- see active pursuits and awarded lots

### Reviews and trust

- post-transaction rating from 1 to 5 stars
- short review comments
- farm story and certifications
- verified profile indicators for demo realism

### Notifications

- lead status notifications
- reserve-met notifications
- outbid notifications
- awarded-lot notifications
- in-app notification center

## Current implementation status

### Implemented in the current branch

- role-aware mobile app shell
- mock auth and session persistence
- auction listing model
- manual bid flow
- auto-bid strategy flow
- auction closing and award generation in mock mode
- slaughterhouse dashboard for bids and awards
- farmer dashboard for inventory and results
- seeded mock auction activity
- Supabase service boundaries preserved
- Stripe settlement hooks preserved

### Intentionally left as hooks

- live Supabase-backed auction bidding
- live Supabase award reads and updates
- real-time bid broadcasting
- Stripe settlement capture and reconciliation
- Stripe Connect farmer payouts
- image upload UI wired to storage
- push notifications outside the app

## Information architecture

### Slaughterhouse side

- Auctions
  - filter auctions
  - open lot detail
  - bid manually
  - configure auto-bid
  - favorite lot
  - leave review
- Bids
  - active pursuits
  - awarded lots
- Profile
  - facility setup
  - sourcing preferences
  - payment labels
  - notifications

### Farmer side

- Inventory
  - all lots
  - live auctions
  - reserve-met count
  - ending soon count
- New Auction
  - create a lot
- Results
  - live auctions with current leaders
  - awarded lots
  - settlement lifecycle
- Farm
  - farm profile
  - contact information
  - payout readiness

## Screen design notes

### Auction listing card

The auction card should show:

- title
- farm and location
- distance
- current bid
- reserve-met state
- lot size
- auction status
- time remaining or close date

### Auction detail screen

The detail screen should show:

- large lot summary
- current bid and reserve price
- opening bid and increment
- total weight and head count
- quality and handling details
- bid history
- farm profile
- manual bid form
- auto-bid form
- favorite action
- review form

### Farmer results screen

The results screen should show:

- current live auctions and their leaders
- ability to close a live auction manually
- awarded lots with settlement status
- estimated revenue and payout summary

## Auction logic

### States

- `scheduled`: auction exists but has not opened yet
- `live`: auction is actively accepting bids
- `awarded`: reserve was met and a winner exists
- `closed`: auction closed without an award

### Bid rules

- a bid must be at least the opening bid or current bid plus minimum increment
- auto-bid stores a maximum willingness to pay
- visible bid should increase only as much as needed to keep the current leader ahead
- ties are resolved by earlier strategy timestamp in the current mock implementation

### Award logic

When the auction end time passes or the farmer closes it manually:

- if reserve is met and a leader exists, create an award
- if reserve is not met, close without award
- notify both sides

## Technical architecture

### Frontend stack

- React Native
- Expo SDK 54
- TypeScript
- Context-based app state for current prototype

### Directory structure

- `App.tsx`: app bootstrap
- `src/RootApp.tsx`: role-based shell and tab routing
- `src/context/AppContext.tsx`: app state and business actions
- `src/screens/`: farmer and slaughterhouse screens
- `src/components/`: reusable UI building blocks
- `src/services/`: backend and platform boundaries
- `src/data/mockData.ts`: seeded demo content
- `supabase/`: database and function scaffolding

### Mock mode versus live mode

The app supports two operating modes:

- mock mode: seeded in-memory data, used for UI testing and demos
- live mode: intended to use Supabase and Stripe services

This is controlled by `EXPO_PUBLIC_USE_MOCK_SERVICES`.

## Data model overview

### User

- shared identity
- role
- favorites
- optional slaughterhouse profile
- optional farm profile
- optional farmer onboarding state

### Slaughterhouse profile

- facility name
- buyer code
- inspection regions
- procurement notes
- saved address
- payment labels
- auto-bid strategies

### Listing

- farmer reference
- title and description
- category and cut
- lot size
- reserve and opening pricing
- increment
- auction timing
- current leader
- quality metadata
- handling metadata
- payment terms
- list of bids
- list of reviews

### Bid

- listing reference
- slaughterhouse reference
- bid amount
- bid mode
- optional max ceiling
- timestamp

### Award

- listing reference
- farmer and slaughterhouse references
- final bid
- reserve result
- bid count
- total weight
- settlement status

## Database target architecture

The intended production backend remains Supabase plus Postgres.

Suggested relational model:

- `profiles`
- `customer_profiles` for slaughterhouse profile data
- `farms`
- `farmer_onboarding`
- `payment_accounts`
- `listings`
- `listing_images`
- `pickup_slots` if needed later
- `bids`
- `orders` or `awards`
- `order_status_history`
- `reviews`
- `favorites`
- `notifications`

### Backend responsibilities

- Supabase Auth for identity
- Postgres for relational marketplace data
- Row-level security for role isolation
- Edge functions or RPCs for atomic auction close and settlement logic
- Storage for listing photos

### Recommended live extensions

- `bids` table for persisted bid history
- server-side proxy bidding calculation
- atomic auction close transaction
- notification fanout
- audit trails for auction state changes

## Payment and payout architecture

The app currently preserves Stripe hooks but does not complete live settlement.

### Intended approach

- Stripe PaymentSheet or hosted settlement collection for slaughterhouse payment
- Stripe customer records for buyer-side payment methods
- Stripe Connect for farmer payouts
- payment intent and transfer references stored in database only
- webhook-driven state reconciliation

### Important rule

Do not store raw card or bank details in the application database. Store only processor references and metadata.

## Security and permissions

### Role boundaries

- slaughterhouses can browse lots and manage only their own strategies, favorites, awards, and reviews
- farmers can manage only their own farm data, listings, and awarded lots
- public browsing can be enabled later if desired

### Security considerations

- enforce bid minimums server-side
- prevent auction edits after bidding starts unless explicitly allowed
- prevent spoofing of buyer or farmer identities
- audit all award state transitions
- secure settlement events behind server-side verification

## Demo and testing strategy

### Demo goals

The demo should quickly communicate that:

- multiple live auctions exist
- bidding is already active
- a slaughterhouse can outbid another
- auto-bid strategy changes outcomes
- farmers can see live results and awarded lots

### Current seeded demo scenarios

- multiple live auctions within the default radius
- at least one scheduled auction
- visible bid history
- at least one awarded historical lot
- notifications for both sides

### Suggested manual test pass

- sign in as `slaughterhouse@example.com`
- verify live auctions are visible immediately
- place a manual bid on a live lot
- set an auto-bid ceiling on another lot
- switch to farmer demo account
- verify current leader changes are visible
- close an auction and confirm an award appears

## Risks and open questions

### Product risks

- farmers may want negotiation after reserve misses
- slaughterhouses may need more contract detail than a simple award flow
- bidding fairness and tie-breaking rules must be explicit before launch

### Technical risks

- real-time bidding will need server-side authority, not just client logic
- settlement and payout flows are more complex than the current demo model
- Expo Go is useful for UI demos but not enough for full Stripe-native payment validation

### Open questions

- should auctions support extensions when bids arrive near close
- should farmers be allowed to accept a below-reserve bid manually
- should slaughterhouses be able to submit contingent bids based on delivery windows
- should the app eventually support multi-farm organizations or multi-plant buyers

## Recommended roadmap

### Phase 1: demo refinement

- tighten seeded scenarios
- polish auction cards and detail hierarchy
- improve copy and trust indicators
- stabilize Expo Go testing

### Phase 2: live auction backend

- add `bids` and `awards` to Supabase schema
- move bidding logic to RPCs or edge functions
- enforce row-level security
- persist notifications

### Phase 3: live settlement and payouts

- implement Stripe settlement flow
- add Stripe Connect
- add webhook handling
- sync award status with payment state

### Phase 4: operations and compliance

- messaging
- logistics coordination
- compliance records
- analytics and reporting

## Summary

This app is evolving from a direct marketplace into a two-sided auction exchange where farmers gain leverage and slaughterhouses gain sourcing efficiency. The current branch already demonstrates the core product shape in mock mode: live auctions, auto-bidding, award generation, and role-specific dashboards. The remaining production work is primarily backend authority, payment settlement, and operational tooling rather than a redesign of the user experience.
