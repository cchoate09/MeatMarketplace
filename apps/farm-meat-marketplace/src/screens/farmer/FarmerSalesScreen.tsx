import React from "react";
import { Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { OrderStatus } from "../../types";
import { styles } from "../sharedStyles";

const statusFlow: OrderStatus[] = ["new", "confirmed", "ready", "picked_up", "shipped", "delivered"];

export function FarmerSalesScreen() {
  const { currentUser, orders, updateOrderStatus, notifications } = useAppContext();
  const sales = orders.filter((order) => order.farmerId === currentUser?.id);
  const userNotifications = notifications.filter((entry) => entry.userId === currentUser?.id);
  const grossSales = sales.reduce((sum, order) => sum + order.totalPrice, 0);
  const estimatedPayout = grossSales * (1 - 0.08);

  function advanceStatus(orderId: string, currentStatus: OrderStatus) {
    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus = statusFlow[Math.min(statusFlow.length - 1, currentIndex + 1)];
    updateOrderStatus(orderId, nextStatus);
  }

  return (
    <ScreenShell title="Sales and payouts" subtitle="Manage orders, customer notifications, and estimated payouts.">
      <SectionCard>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Gross sales</Text>
          <Text style={styles.statValue}>${grossSales.toFixed(2)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Estimated payout</Text>
          <Text style={styles.statValue}>${estimatedPayout.toFixed(2)}</Text>
        </View>
        <Text style={styles.metaText}>Payout account: {currentUser?.farmerOnboarding?.payoutAccountLabel ?? "Not connected"}</Text>
      </SectionCard>

      {sales.length === 0 ? (
        <EmptyState title="No sales yet" body="Sales will appear here after customers complete checkout." />
      ) : (
        sales.map((order) => (
          <SectionCard key={order.id}>
            <Text style={styles.sectionTitle}>{order.listingTitle}</Text>
            <Text style={styles.paragraph}>
              Buyer: {order.customerName} - {order.quantity} unit(s)
            </Text>
            <Text style={styles.metaText}>Payment: {order.paymentMethodLabel}</Text>
            <Text style={styles.metaText}>
              {order.deliveryMethod} - ${order.totalPrice.toFixed(2)} - {order.status}
            </Text>
            {order.pickupSlotLabel ? <Text style={styles.metaText}>Pickup slot: {order.pickupSlotLabel}</Text> : null}
            {order.status !== "delivered" ? (
              <AppButton label="Advance Status" kind="secondary" onPress={() => advanceStatus(order.id, order.status)} />
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
