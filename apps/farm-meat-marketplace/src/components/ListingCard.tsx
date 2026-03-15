import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Listing } from "../types";
import { colors, spacing } from "../theme";
import { SectionCard } from "./SectionCard";

export function ListingCard({
  listing,
  onPress
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const averageRating =
    listing.reviews.length > 0
      ? (listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length).toFixed(1)
      : "New";

  return (
    <Pressable onPress={onPress}>
      <SectionCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageLabel}>{listing.imageLabel}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.meta}>
              {listing.farmerName} - {listing.locationName}
            </Text>
            <Text style={styles.meta}>
              {listing.distanceMiles} mi away - {averageRating} stars
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{listing.description}</Text>
        <View style={styles.badges}>
          {listing.quantityAvailable <= listing.lowStockThreshold ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>low stock</Text>
            </View>
          ) : null}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{listing.breed}</Text>
          </View>
          {listing.tags.map((tag) => (
            <View key={tag} style={styles.badge}>
              <Text style={styles.badgeText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.price}>
            ${listing.price}/{listing.unit}
          </Text>
          <Text style={styles.meta}>
            {listing.pickupAvailable ? "Pickup" : ""}
            {listing.pickupAvailable && listing.shippingAvailable ? " + " : ""}
            {listing.shippingAvailable ? "Shipping" : ""}
          </Text>
        </View>
      </SectionCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  imageLabel: {
    color: colors.primary,
    fontWeight: "700"
  },
  flex: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  price: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 18
  }
});
