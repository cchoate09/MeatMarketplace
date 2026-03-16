import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { FilterPanel } from "../../components/FilterPanel";
import { ListingCard } from "../../components/ListingCard";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { Listing } from "../../types";
import { AuctionDetailScreen } from "./AuctionDetailScreen";
import { styles } from "../sharedStyles";

export function CustomerBrowseScreen() {
  const { currentUser, users, listings, filters, setFilters } = useAppContext();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const autoBidListingIds = useMemo(
    () => new Set(currentUser?.customerProfile?.strategies.map((s) => s.listingId) ?? []),
    [currentUser?.customerProfile?.strategies]
  );

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        if (filters.category !== "all" && listing.category !== filters.category) return false;
        if (filters.cut !== "all" && listing.cut !== filters.cut) return false;

        if (filters.auctionStatus === "ending_soon") {
          return listing.auctionStatus === "live" && new Date(listing.auctionEndAt).getTime() - Date.now() <= 1000 * 60 * 60 * 6;
        }

        if (filters.auctionStatus !== "all" && listing.auctionStatus !== filters.auctionStatus) return false;

        return listing.distanceMiles <= filters.maxRadiusMiles;
      }),
    [filters, listings]
  );

  const scheduledListings = useMemo(
    () =>
      filters.auctionStatus === "all" || filters.auctionStatus === "scheduled"
        ? filteredListings.filter((l) => l.auctionStatus === "scheduled")
        : [],
    [filteredListings, filters.auctionStatus]
  );

  const liveListings = useMemo(
    () => filteredListings.filter((l) => l.auctionStatus === "live"),
    [filteredListings]
  );

  const otherListings = useMemo(
    () => filteredListings.filter((l) => l.auctionStatus !== "live" && l.auctionStatus !== "scheduled"),
    [filteredListings]
  );

  const favoriteListings = useMemo(
    () => listings.filter((listing) => currentUser?.favorites.includes(listing.id)),
    [currentUser?.favorites, listings]
  );

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId]
  );

  const selectedFarmer = useMemo(
    () => users.find((entry) => entry.id === selectedListing?.farmerId),
    [selectedListing?.farmerId, users]
  );

  function renderCard(listing: Listing) {
    return (
      <ListingCard
        key={listing.id}
        listing={listing}
        hasAutoBid={autoBidListingIds.has(listing.id)}
        onPress={() => setSelectedListingId(listing.id)}
      />
    );
  }

  if (selectedListing) {
    return (
      <AuctionDetailScreen
        listing={selectedListing}
        farmer={selectedFarmer}
        onBack={() => setSelectedListingId(null)}
      />
    );
  }

  return (
    <ScreenShell title="Auction board" subtitle="Browse farmer lots, compare reserve targets, and deploy manual or auto-bids.">
      {favoriteListings.length > 0 ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Saved auctions</Text>
          {favoriteListings.map((listing) => (
            <Text
              key={listing.id}
              style={[styles.paragraph, { color: "#3949AB" }]}
              onPress={() => setSelectedListingId(listing.id)}
            >
              {listing.title} — ${listing.currentBid.toFixed(2)}/{listing.unit} · {listing.auctionStatus}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      <FilterPanel filters={filters} onChange={setFilters} />

      {scheduledListings.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 8 }]}>
            Upcoming auctions ({scheduledListings.length})
          </Text>
          {scheduledListings.map(renderCard)}
        </View>
      ) : null}

      {liveListings.length > 0 ? (
        <View>
          {scheduledListings.length > 0 ? (
            <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 8 }]}>
              Live now ({liveListings.length})
            </Text>
          ) : null}
          {liveListings.map(renderCard)}
        </View>
      ) : null}

      {otherListings.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 8 }]}>Other results</Text>
          {otherListings.map(renderCard)}
        </View>
      ) : null}

      {filteredListings.length === 0 ? (
        <EmptyState title="No auctions found" body="Try widening the sourcing radius or removing a filter." />
      ) : null}
    </ScreenShell>
  );
}
