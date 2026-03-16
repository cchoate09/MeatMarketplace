/**
 * Analytics service — stub for production instrumentation.
 *
 * Wire this to a real provider (Segment, PostHog, Amplitude, etc.) before
 * going live. The function signatures here define the canonical event surface.
 * Do not add ad-hoc tracking calls elsewhere in the app; route them through
 * this service so the provider can be swapped without touching screen code.
 *
 * Recommended Phase 4 work:
 *   1. Install the provider SDK (e.g. `npx expo install @segment/analytics-react-native`)
 *   2. Replace the stubs below with real `track()` / `identify()` calls
 *   3. Add crash reporting (Sentry, Bugsnag) alongside analytics
 */

import { appConfig } from "../config/appConfig";
import { AwardStatus, UserRole } from "../types";

function shouldTrack() {
  // In mock/demo mode we skip external calls to avoid polluting production data.
  return !appConfig.useMockServices;
}

// ── Identity ──────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, role: UserRole) {
  if (!shouldTrack()) return;
  // TODO: provider.identify(userId, { role })
}

export function resetIdentity() {
  if (!shouldTrack()) return;
  // TODO: provider.reset()
}

// ── Authentication ─────────────────────────────────────────────────────────────

export function trackLogin(role: UserRole) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Login", { role })
}

export function trackSignUp(role: UserRole) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Sign Up", { role })
}

// ── Auction browsing ──────────────────────────────────────────────────────────

export function trackAuctionViewed(listingId: string, auctionStatus: string) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Auction Viewed", { listingId, auctionStatus })
}

export function trackFilterApplied(filterKey: string, filterValue: string) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Filter Applied", { filterKey, filterValue })
}

// ── Bidding ───────────────────────────────────────────────────────────────────

export function trackBidPlaced(listingId: string, amount: number, mode: "manual" | "auto") {
  if (!shouldTrack()) return;
  // TODO: provider.track("Bid Placed", { listingId, amount, mode })
}

export function trackAutoBidConfigured(listingId: string, maxBid: number) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Auto-Bid Configured", { listingId, maxBid })
}

// ── Listings ──────────────────────────────────────────────────────────────────

export function trackListingCreated(listingId: string, category: string) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Listing Created", { listingId, category })
}

export function trackAuctionClosed(listingId: string, reserveMet: boolean, finalBid: number) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Auction Closed", { listingId, reserveMet, finalBid })
}

// ── Settlement ────────────────────────────────────────────────────────────────

export function trackAwardStatusAdvanced(orderId: string, newStatus: AwardStatus) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Award Status Advanced", { orderId, newStatus })
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export function trackReviewSubmitted(listingId: string, rating: number) {
  if (!shouldTrack()) return;
  // TODO: provider.track("Review Submitted", { listingId, rating })
}
