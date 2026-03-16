import React from "react";
import { Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

export function CustomerOrdersScreen() {
  const { currentUser, orders, listings } = useAppContext();
  const slaughterhouseAwards = orders.filter((order) => order.customerId === currentUser?.id);
  const activeBids = listings.filter(
    (listing) =>
      listing.bids.some((bid) => bid.slaughterhouseId === currentUser?.id) ||
      currentUser?.customerProfile?.strategies.some((strategy) => strategy.listingId === listing.id)
  );

  return (
    <ScreenShell title="Bids and awards" subtitle="Track live pursuits, saved bidding strategies, and awarded lots.">
      <SectionCard>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Active pursuits</Text>
          <Text style={styles.statValue}>{activeBids.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Awarded lots</Text>
          <Text style={styles.statValue}>{slaughterhouseAwards.length}</Text>
        </View>
      </SectionCard>

      {activeBids.length === 0 ? (
        <EmptyState title="No active bids yet" body="Your watched auctions and submitted bids will show up here." />
      ) : (
        activeBids.map((listing) => {
          const myBids = listing.bids.filter((bid) => bid.slaughterhouseId === currentUser?.id);
          const strategy = currentUser?.customerProfile?.strategies.find((entry) => entry.listingId === listing.id);

          return (
            <SectionCard key={listing.id}>
              <Text style={styles.sectionTitle}>{listing.title}</Text>
              <Text style={styles.paragraph}>
                Current bid ${listing.currentBid.toFixed(2)}/{listing.unit} with reserve {listing.reserveMet ? "met" : "not met"}
              </Text>
              <Text style={styles.metaText}>Your latest bid: {myBids[0] ? `$${myBids[0].amount.toFixed(2)}/${listing.unit}` : "None yet"}</Text>
              <Text style={styles.metaText}>Auto-bid ceiling: {strategy ? `$${strategy.maxBid.toFixed(2)}/${listing.unit}` : "Not set"}</Text>
              <Text style={styles.metaText}>Leader: {listing.currentLeaderName ?? "No bids yet"}</Text>
              <Text style={styles.metaText}>Ends: {new Date(listing.auctionEndAt).toLocaleString()}</Text>
            </SectionCard>
          );
        })
      )}

      {slaughterhouseAwards.length === 0 ? (
        <EmptyState title="No awarded lots" body="Won auctions will move here for settlement and pickup coordination." />
      ) : (
        slaughterhouseAwards.map((order) => (
          <SectionCard key={order.id}>
            <Text style={styles.sectionTitle}>{order.listingTitle}</Text>
            <Text style={styles.paragraph}>
              Won at ${order.finalBid.toFixed(2)}/lb for {order.totalWeightLbs} lb
            </Text>
            <Text style={styles.metaText}>Farmer: {order.farmerName}</Text>
            <Text style={styles.metaText}>Reserve: {order.reserveMet ? "Met" : "Not met"}</Text>
            <Text style={styles.metaText}>Settlement: {order.paymentMethodLabel ?? "Pending"}</Text>
            <Text style={styles.metaText}>Status: {order.status}</Text>
          </SectionCard>
        ))
      )}
    </ScreenShell>
  );
}
