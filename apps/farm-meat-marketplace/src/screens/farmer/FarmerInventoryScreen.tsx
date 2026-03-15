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
  const lowStockListings = inventory.filter((listing) => listing.quantityAvailable <= listing.lowStockThreshold);

  return (
    <ScreenShell title="Inventory" subtitle="Manage published offerings, low-stock protection, and farm trust signals.">
      <SectionCard>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Active listings</Text>
          <Text style={styles.statValue}>{inventory.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.sectionTitle}>Low-stock alerts</Text>
          <Text style={styles.statValue}>{lowStockListings.length}</Text>
        </View>
      </SectionCard>

      {inventory.length === 0 ? (
        <EmptyState title="No listings yet" body="Create your first offering to start selling." />
      ) : (
        inventory.map((listing) => (
          <SectionCard key={listing.id}>
            <Text style={styles.sectionTitle}>{listing.title}</Text>
            <Text style={styles.paragraph}>
              {listing.cut} - ${listing.price}/{listing.unit}
            </Text>
            <Text style={styles.metaText}>Available inventory: {listing.quantityAvailable}</Text>
            <Text style={styles.metaText}>Low-stock threshold: {listing.lowStockThreshold}</Text>
            <Text style={styles.metaText}>Available on: {listing.availableOn}</Text>
            {listing.quantityAvailable <= listing.lowStockThreshold ? (
              <Text style={styles.metaText}>Low-stock warning: consider updating or pausing this listing.</Text>
            ) : null}
          </SectionCard>
        ))
      )}
    </ScreenShell>
  );
}
