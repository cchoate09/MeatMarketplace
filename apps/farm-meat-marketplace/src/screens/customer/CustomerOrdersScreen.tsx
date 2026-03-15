import React from "react";
import { Alert, Text } from "react-native";
import { AppButton } from "../../components/AppButton";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

export function CustomerOrdersScreen() {
  const { currentUser, orders, reorderOrder } = useAppContext();
  const customerOrders = orders.filter((order) => order.customerId === currentUser?.id);

  async function handleReorder(orderId: string) {
    try {
      const order = await reorderOrder(orderId);
      Alert.alert("Reorder placed", `${order.listingTitle} has been reordered.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to reorder", message);
    }
  }

  return (
    <ScreenShell title="Your orders" subtitle="Track statuses and quickly reorder your favorite products.">
      {customerOrders.length === 0 ? (
        <EmptyState title="No orders yet" body="Your completed purchases will show up here." />
      ) : (
        customerOrders.map((order) => (
          <SectionCard key={order.id}>
            <Text style={styles.sectionTitle}>{order.listingTitle}</Text>
            <Text style={styles.paragraph}>
              {order.quantity} unit(s) - {order.deliveryMethod} - ${order.totalPrice.toFixed(2)}
            </Text>
            <Text style={styles.metaText}>Farmer: {order.farmerName}</Text>
            <Text style={styles.metaText}>Payment: {order.paymentMethodLabel}</Text>
            {order.pickupSlotLabel ? <Text style={styles.metaText}>Pickup slot: {order.pickupSlotLabel}</Text> : null}
            <Text style={styles.metaText}>Status: {order.status}</Text>
            <AppButton label="Reorder" kind="secondary" onPress={() => void handleReorder(order.id)} />
          </SectionCard>
        ))
      )}
    </ScreenShell>
  );
}
