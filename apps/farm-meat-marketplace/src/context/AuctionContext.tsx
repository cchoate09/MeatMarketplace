import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "../config/appConfig";
import {
  closeAuction as persistCloseAuction,
  configureAutoBid as persistAutoBid,
  listAwards,
  placeBid as persistBid,
  updateAwardStatus as persistAwardStatus,
  acceptBelowReserve as persistAcceptBelowReserve,
  extendAuction as persistExtendAuction
} from "../services/auctionService";
import { listListings, createListing as persistListing, addReview as persistReview } from "../services/listingService";
import { listUsers, updateCustomerProfile } from "../services/profileService";
import { trackBidPlaced, trackAutoBidConfigured, trackListingCreated, trackAuctionClosed, trackAwardStatusAdvanced, trackReviewSubmitted } from "../services/analyticsService";
import { Listing, ListingFilters, Order, Review, User } from "../types";
import { useAuthContext } from "./AuthContext";

export interface AuctionContextValue {
  users: User[];
  listings: Listing[];
  orders: Order[];
  filters: ListingFilters;
  setFilters: (filters: ListingFilters) => void;
  createListing: (listing: Omit<Listing, "id" | "reviews" | "bids" | "currentBid" | "auctionStatus" | "reserveMet">) => Promise<void>;
  placeBid: (listingId: string, amount: number, mode: "manual" | "auto", maxBid?: number) => Promise<void>;
  configureAutoBid: (listingId: string, maxBid: number, increment: number) => Promise<void>;
  closeAuction: (listingId: string) => Promise<void>;
  extendAuction: (listingId: string, extraMinutes: number) => Promise<void>;
  acceptBelowReserve: (listingId: string) => Promise<void>;
  addReview: (listingId: string, review: Omit<Review, "id" | "createdAt">) => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  /**
   * Subscribe to live bid updates for a single listing.
   * Returns an unsubscribe function.
   *
   * TODO Phase 2: wire to Supabase Realtime channel on the bids table.
   * Example implementation once the bids table is live:
   *
   *   const channel = supabase
   *     .channel(`listing:${listingId}`)
   *     .on('postgres_changes', {
   *       event: 'INSERT', schema: 'public', table: 'bids',
   *       filter: `listing_id=eq.${listingId}`
   *     }, () => void refreshMarketplace())
   *     .subscribe();
   *
   *   return () => { void supabase.removeChannel(channel); };
   */
  subscribeToListingUpdates: (listingId: string, onUpdate: (listing: Listing) => void) => () => void;
}

const defaultFilters: ListingFilters = {
  category: "all",
  cut: "all",
  auctionStatus: "all",
  maxRadiusMiles: appConfig.defaultRadiusMiles
};

const AuctionContext = createContext<AuctionContextValue | undefined>(undefined);

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, refreshCurrentUser } = useAuthContext();

  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<ListingFilters>(defaultFilters);

  // Refresh market data whenever the current user changes (login / logout).
  useEffect(() => {
    void refreshMarketplace();
  }, [currentUser?.id]);

  async function refreshMarketplace() {
    const [loadedUsers, loadedListings, loadedAwards] = await Promise.all([listUsers(), listListings(), listAwards()]);
    setUsers(loadedUsers);
    setListings(loadedListings);
    setOrders(loadedAwards);
  }

  async function createListing(listing: Omit<Listing, "id" | "reviews" | "bids" | "currentBid" | "auctionStatus" | "reserveMet">) {
    const created = await persistListing(listing);
    trackListingCreated(created.id, listing.category);
    await refreshMarketplace();
  }

  async function placeBid(listingId: string, amount: number, mode: "manual" | "auto", maxBid?: number) {
    if (!currentUser || currentUser.role !== "slaughterhouse") {
      throw new Error("A slaughterhouse account must be logged in to bid.");
    }

    // Optimistically update the listing's currentBid so the UI responds
    // immediately. The real value is reconciled after the server call.
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId && amount > listing.currentBid
          ? { ...listing, currentBid: amount }
          : listing
      )
    );

    try {
      await persistBid(currentUser, listingId, amount, mode, maxBid);
      trackBidPlaced(listingId, amount, mode);
      await refreshMarketplace();
      await refreshCurrentUser();
    } catch (err) {
      // Roll back optimistic update on error.
      await refreshMarketplace();
      throw err;
    }
  }

  async function configureAutoBid(listingId: string, maxBid: number, increment: number) {
    if (!currentUser || currentUser.role !== "slaughterhouse") {
      throw new Error("A slaughterhouse account must be logged in to configure auto-bids.");
    }

    await persistAutoBid(currentUser, listingId, maxBid, increment);
    trackAutoBidConfigured(listingId, maxBid);
    await refreshMarketplace();
    await refreshCurrentUser();
  }

  async function closeAuction(listingId: string) {
    await persistCloseAuction(listingId);
    const listing = listings.find((l) => l.id === listingId);
    trackAuctionClosed(listingId, listing?.reserveMet ?? false, listing?.currentBid ?? 0);
    await refreshMarketplace();
  }

  async function extendAuction(listingId: string, extraMinutes: number) {
    await persistExtendAuction(listingId, extraMinutes);
    await refreshMarketplace();
  }

  async function acceptBelowReserve(listingId: string) {
    await persistAcceptBelowReserve(listingId);
    const listing = listings.find((l) => l.id === listingId);
    trackAuctionClosed(listingId, false, listing?.currentBid ?? 0);
    await refreshMarketplace();
  }

  async function addReview(listingId: string, review: Omit<Review, "id" | "createdAt">) {
    await persistReview(listingId, review, currentUser?.id);
    trackReviewSubmitted(listingId, review.rating);
    await refreshMarketplace();
  }

  async function toggleFavorite(listingId: string) {
    if (!currentUser) throw new Error("A user must be logged in.");

    await updateCustomerProfile(currentUser.id, (user) => ({
      ...user,
      favorites: user.favorites.includes(listingId)
        ? user.favorites.filter((entry) => entry !== listingId)
        : [listingId, ...user.favorites]
    }));

    await refreshCurrentUser();
    await refreshMarketplace();
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    await persistAwardStatus(orderId, status);
    trackAwardStatusAdvanced(orderId, status);
    await refreshMarketplace();
  }

  function subscribeToListingUpdates(_listingId: string, _onUpdate: (listing: Listing) => void) {
    // No-op stub — wire to Supabase Realtime in Phase 2.
    // See JSDoc on AuctionContextValue.subscribeToListingUpdates for the
    // intended implementation.
    return () => {};
  }

  const value = useMemo<AuctionContextValue>(
    () => ({
      users,
      listings,
      orders,
      filters,
      setFilters,
      createListing,
      placeBid,
      configureAutoBid,
      closeAuction,
      extendAuction,
      acceptBelowReserve,
      addReview,
      toggleFavorite,
      updateOrderStatus,
      subscribeToListingUpdates
    }),
    [users, listings, orders, filters, currentUser]
  );

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
}

export function useAuctionContext() {
  const context = useContext(AuctionContext);

  if (!context) {
    throw new Error("useAuctionContext must be used within AuctionProvider");
  }

  return context;
}
