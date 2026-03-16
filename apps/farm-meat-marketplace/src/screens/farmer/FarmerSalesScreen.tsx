import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

const statusFlow = ["pending_settlement", "contract_sent", "ready_for_pickup", "completed", "closed"] as const;

const statusLabels: Record<string, string> = {
  pending_settlement: "Pending settlement",
  contract_sent: "Contract sent",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  closed: "Closed"
};

const nextStatusLabels: Record<string, string> = {
  pending_settlement: "Send contract",
  contract_sent: "Mark ready for pickup",
  ready_for_pickup: "Mark completed",
  completed: "Close"
};

export function FarmerSalesScreen() {
  const { currentUser, orders, listings, updateOrderStatus, notifications, closeAuction, extendAuction, acceptBelowReserve } = useAppContext();
  const [extendMinutes, setExtendMinutes] = useState("10");

  const sales = orders.filter((order) => order.farmerId === currentUser?.id);
  const liveAuctions = listings.filter(
    (listing) => listing.farmerId === currentUser?.id && listing.auctionStatus === "live"
  );
  const closedNoAward = listings.filter(
    (listing) => listing.farmerId === currentUser?.id && listing.auctionStatus === "closed" && listing.currentLeaderId
  );
  const userNotifications = notifications.filter((entry) => entry.userId === currentUser?.id);
  const grossSales = sales.reduce((sum, order) => sum + order.finalBid * order.totalWeightLbs, 0);
  const estimatedPayout = grossSales * (1 - 0.08);

  function confirmAdvanceStatus(orderId: string, currentStatus: (typeof statusFlow)[number]) {
    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus = statusFlow[Math.min(statusFlow.length - 1, currentIndex + 1)];
    const actionLabel = nextStatusLabels[currentStatus] ?? "Advance";
    Alert.alert(
      actionLabel,
      `Move this award to "${statusLabels[nextStatus]}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: actionLabel, onPress: () => void updateOrderStatus(orderId, nextStatus) }
      ]
    );
  }

  function confirmCloseAuction(listingId: string) {
    Alert.alert(
      "Close auction",
      "Close this auction now? If reserve is met the winning bid will be awarded. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close now", style: "destructive", onPress: () => void closeAuction(listingId) }
      ]
    );
  }

  function confirmExtendAuction(listingId: string) {
    const minutes = Number(extendMinutes) || 10;
    Alert.alert(
      "Extend auction",
      `Add ${minutes} minutes to this auction?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Add ${minutes} min`,
          onPress: () =>
            void extendAuction(listingId, minutes).catch((err: Error) =>
              Alert.alert("Unable to extend", err.message)
            )
        }
      ]
    );
  }

  function confirmAcceptBelowReserve(listingId: string) {
    Alert.alert(
      "Accept below reserve",
      "Award this lot to the current leader even though the reserve was not met?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept offer",
          onPress: () =>
            void acceptBelowReserve(listingId).catch((err: Error) =>
              Alert.alert("Unable to accept", err.message)
            )
        }
      ]
    );
  }

  return (
    <ScreenShell title="Results and settlements" subtitle="Close auctions, review winners, and move awarded lots through settlement.">
      <SectionCard>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Awarded revenue</Text>
          <Text style={styles.statValue}>${grossSales.toFixed(2)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Estimated payout</Text>
          <Text style={styles.statValue}>${estimatedPayout.toFixed(2)}</Text>
        </View>
        <Text style={styles.metaText}>Payout account: {currentUser?.farmerOnboarding?.payoutAccountLabel ?? "Not connected"}</Text>
        <Text style={styles.metaText}>Platform fee: 8%</Text>
      </SectionCard>

      {liveAuctions.length > 0 ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Live auctions</Text>
          <View style={styles.row}>
            <TextInput
              value={extendMinutes}
              onChangeText={setExtendMinutes}
              keyboardType="numeric"
              style={[styles.input, styles.flexButton]}
              placeholder="Extend by (min)"
            />
          </View>
          {liveAuctions.map((listing) => (
            <View key={listing.id} style={styles.reviewRow}>
              <Text style={styles.reviewHeading}>{listing.title}</Text>
              <Text style={styles.paragraph}>
                ${listing.currentBid.toFixed(2)}/{listing.unit} led by {listing.currentLeaderName ?? "no one yet"}
                {listing.reserveMet ? "  Reserve met" : ""}
              </Text>
              <Text style={styles.metaText}>Ends: {new Date(listing.auctionEndAt).toLocaleString()}</Text>
              <View style={styles.row}>
                <AppButton label="Close Now" kind="secondary" style={styles.flexButton} onPress={() => confirmCloseAuction(listing.id)} />
                <AppButton label={`Extend +${extendMinutes || "10"}m`} kind="secondary" style={styles.flexButton} onPress={() => confirmExtendAuction(listing.id)} />
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {closedNoAward.length > 0 ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Closed - reserve not met</Text>
          <Text style={styles.paragraph}>These auctions closed without an award. You can accept the leading offer below reserve.</Text>
          {closedNoAward.map((listing) => (
            <View key={listing.id} style={styles.reviewRow}>
              <Text style={styles.reviewHeading}>{listing.title}</Text>
              <Text style={styles.paragraph}>
                Best offer: ${listing.currentBid.toFixed(2)}/{listing.unit} from {listing.currentLeaderName}
              </Text>
              <AppButton label="Accept below reserve" kind="secondary" onPress={() => confirmAcceptBelowReserve(listing.id)} />
            </View>
          ))}
        </SectionCard>
      ) : null}

      {sales.length === 0 ? (
        <EmptyState title="No awarded auctions yet" body="Winning slaughterhouse awards will appear here after auctions close." />
      ) : (
        sales.map((order) => (
          <SectionCard key={order.id}>
            <Text style={styles.sectionTitle}>{order.listingTitle}</Text>
            <Text style={styles.paragraph}>Buyer: {order.customerName} - {order.totalWeightLbs} lb</Text>
            <Text style={styles.metaText}>Winning bid: ${order.finalBid.toFixed(2)}/lb</Text>
            <Text style={styles.metaText}>Gross: ${(order.finalBid * order.totalWeightLbs).toFixed(2)}</Text>
            {order.reserveMet ? null : (
              <Text style={[styles.metaText, { color: "#B76E1D", fontWeight: "700" }]}>Accepted below reserve</Text>
            )}
            <Text style={styles.metaText}>Settlement: {statusLabels[order.status] ?? order.status}</Text>
            {order.contractUrl ? <Text style={styles.metaText}>Contract: {order.contractUrl}</Text> : null}
            {order.status !== "closed" ? (
              <AppButton
                label={nextStatusLabels[order.status] ?? "Advance status"}
                kind="secondary"
                onPress={() => confirmAdvanceStatus(order.id, order.status)}
              />
            ) : null}
          </SectionCard>
        ))
      )}

      <SectionCard>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {userNotifications.length === 0 ? (
          <Text style={styles.paragraph}>No notifications yet.</Text>
        ) : (
          userNotifications.map((entry) => (
            <View key={entry.id} style={styles.reviewRow}>
              <Text style={styles.reviewHeading}>{entry.title}</Text>
              <Text style={styles.paragraph}>{entry.body}</Text>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}
