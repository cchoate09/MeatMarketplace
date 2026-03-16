import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Listing } from "../types";
import { colors, spacing } from "../theme";
import { SectionCard } from "./SectionCard";

function useCountdown(endAt: string) {
  const [msRemaining, setMsRemaining] = useState(() => new Date(endAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setMsRemaining(new Date(endAt).getTime() - Date.now());
    }, 30_000); // refresh every 30 s — fine granularity for a bidding card

    return () => clearInterval(id);
  }, [endAt]);

  return Math.max(0, msRemaining);
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Closing...";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function ListingCard({
  listing,
  hasAutoBid = false,
  onPress
}: {
  listing: Listing;
  /** True when the signed-in slaughterhouse has an active auto-bid strategy on this lot. */
  hasAutoBid?: boolean;
  onPress: () => void;
}) {
  const msRemaining = useCountdown(listing.auctionEndAt);
  const endDate = new Date(listing.auctionEndAt);

  const averageRating =
    listing.reviews.length > 0
      ? (listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length).toFixed(1)
      : "New";

  const isLive = listing.auctionStatus === "live";
  const isEndingSoon = isLive && msRemaining <= 1000 * 60 * 60 * 6; // < 6 h

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
              {listing.farmerName} — {listing.locationName}
            </Text>
            <Text style={styles.meta}>
              {listing.distanceMiles} mi away · {averageRating} ★
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.badges}>
          {/* Auction status badge */}
          <View style={[styles.badge, statusBadgeStyle(listing.auctionStatus)]}>
            <Text style={[styles.badgeText, statusTextStyle(listing.auctionStatus)]}>
              {listing.auctionStatus === "live" ? "LIVE" : listing.auctionStatus.toUpperCase()}
            </Text>
          </View>

          {/* Reserve met / not met badge */}
          <View style={[styles.badge, listing.reserveMet ? styles.reserveMetBadge : styles.reserveNotMetBadge]}>
            <Text style={[styles.badgeText, listing.reserveMet ? styles.reserveMetText : styles.reserveNotMetText]}>
              {listing.reserveMet ? "Reserve met" : "Reserve not met"}
            </Text>
          </View>

          {/* Auto-bid active indicator */}
          {hasAutoBid ? (
            <View style={[styles.badge, styles.autoBidBadge]}>
              <Text style={[styles.badgeText, styles.autoBidText]}>Auto-bid on</Text>
            </View>
          ) : null}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{listing.breed}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{listing.totalWeightLbs} lb lot</Text>
          </View>
          {listing.tags.map((tag) => (
            <View key={tag} style={styles.badge}>
              <Text style={styles.badgeText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>
              ${listing.currentBid.toFixed(2)}/{listing.unit}
            </Text>
            <Text style={styles.meta}>{listing.bids.length} bid{listing.bids.length !== 1 ? "s" : ""}</Text>
          </View>
          {/* Show live countdown (urgent styling < 6 h), otherwise show close date */}
          {isLive ? (
            <Text style={[styles.timer, isEndingSoon ? styles.timerUrgent : undefined]}>{formatCountdown(msRemaining)}</Text>
          ) : (
            <Text style={styles.meta}>{endDate.toLocaleDateString()}</Text>
          )}
        </View>
      </SectionCard>
    </Pressable>
  );
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case "live":
      return styles.liveBadge;
    case "scheduled":
      return styles.scheduledBadge;
    case "awarded":
      return styles.awardedBadge;
    default:
      return undefined;
  }
}

function statusTextStyle(status: string) {
  switch (status) {
    case "live":
      return styles.liveText;
    case "scheduled":
      return styles.scheduledText;
    case "awarded":
      return styles.awardedText;
    default:
      return undefined;
  }
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
  // Status badges
  liveBadge: {
    backgroundColor: "#DFFAE8"
  },
  liveText: {
    color: colors.success
  },
  scheduledBadge: {
    backgroundColor: "#FFF5E0"
  },
  scheduledText: {
    color: colors.warning
  },
  awardedBadge: {
    backgroundColor: colors.primarySoft
  },
  awardedText: {
    color: colors.primary
  },
  // Reserve badges
  reserveMetBadge: {
    backgroundColor: "#DFFAE8"
  },
  reserveMetText: {
    color: colors.success
  },
  reserveNotMetBadge: {
    backgroundColor: "#FFF5E0"
  },
  reserveNotMetText: {
    color: colors.warning
  },
  // Auto-bid badge
  autoBidBadge: {
    backgroundColor: "#E8EAF6"
  },
  autoBidText: {
    color: "#3949AB"
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
  },
  timer: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600"
  },
  timerUrgent: {
    color: colors.danger,
    fontWeight: "800"
  }
});
