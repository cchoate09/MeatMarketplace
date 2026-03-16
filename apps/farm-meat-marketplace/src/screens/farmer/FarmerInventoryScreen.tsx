import React from "react";
import { Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

export function FarmerInventoryScreen() {
  const { currentUser, listings } = useAppContext();
  const inventory = listings.filter((listing) => listing.farmerId === currentUser?.id);
  const liveListings = inventory.filter((listing) => listing.auctionStatus === "live");
  const endingSoon = liveListings.filter((listing) => new Date(listing.auctionEndAt).getTime() - Date.now() <= 1000 * 60 * 60 * 6);
  const reserveMetCount = inventory.filter((listing) => listing.reserveMet).length;

  return (
    <ScreenShell title="Auction inventory" subtitle="Watch live lots, reserve performance, and upcoming closes from one place.">
      <SectionCard>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Total auctions</Text>
          <Text style={styles.statValue}>{inventory.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Live now</Text>
          <Text style={styles.statValue}>{liveListings.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Ending soon</Text>
          <Text style={styles.statValue}>{endingSoon.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Reserve met</Text>
          <Text style={styles.statValue}>{reserveMetCount}</Text>
        </View>
      </SectionCard>

      {inventory.length === 0 ? (
        <EmptyState title="No auctions yet" body="Create your first lot to start collecting competitive bids." />
      ) : (
        inventory.map((listing) => (
          <SectionCard key={listing.id}>
            <Text style={styles.sectionTitle}>{listing.title}</Text>
            <Text style={styles.paragraph}>
              {listing.cut} - {listing.totalWeightLbs} lb - {listing.auctionStatus}
            </Text>
            <Text style={styles.metaText}>Opening bid: ${listing.openingBid.toFixed(2)}/{listing.unit}</Text>
            <Text style={styles.metaText}>Current bid: ${listing.currentBid.toFixed(2)}/{listing.unit}</Text>
            <Text style={styles.metaText}>Reserve price: ${listing.reservePrice.toFixed(2)}/{listing.unit}</Text>
            <Text style={styles.metaText}>Bid count: {listing.bids.length}</Text>
            <Text style={styles.metaText}>Leader: {listing.currentLeaderName ?? "No bids yet"}</Text>
            <Text style={styles.metaText}>Closes: {new Date(listing.auctionEndAt).toLocaleString()}</Text>
          </SectionCard>
        ))
      )}
    </ScreenShell>
  );
}
