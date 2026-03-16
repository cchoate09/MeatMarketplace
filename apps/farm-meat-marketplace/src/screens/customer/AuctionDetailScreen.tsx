import React, { useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { Listing, User } from "../../types";
import { styles } from "../sharedStyles";

/**
 * Full detail view for a single auction lot.
 * Displayed when the user taps a ListingCard in CustomerBrowseScreen.
 * Contains: lot summary, bid panel, auto-bid panel, bid history, farm profile,
 * review form, and existing reviews.
 */
export function AuctionDetailScreen({
  listing,
  farmer,
  onBack
}: {
  listing: Listing;
  farmer: User | undefined;
  onBack: () => void;
}) {
  const { currentUser, placeBid, configureAutoBid, addReview, toggleFavorite } = useAppContext();

  const [manualBid, setManualBid] = useState("");
  const [autoBidMax, setAutoBidMax] = useState("");
  const [autoBidIncrement, setAutoBidIncrement] = useState("0.05");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");

  const myStrategy = useMemo(
    () => currentUser?.customerProfile?.strategies.find((entry) => entry.listingId === listing.id),
    [currentUser?.customerProfile?.strategies, listing.id]
  );

  const isFavorited = currentUser?.favorites.includes(listing.id) ?? false;
  const isLive = listing.auctionStatus === "live";

  async function handleManualBid() {
    const amount = Number(manualBid) || 0;
    const minimum = listing.currentLeaderId
      ? listing.currentBid + listing.minimumIncrement
      : listing.openingBid;

    if (amount < minimum) {
      Alert.alert("Bid too low", `Minimum bid is $${minimum.toFixed(2)}/${listing.unit}.`);
      return;
    }

    try {
      await placeBid(listing.id, amount, "manual");
      setManualBid("");
      Alert.alert("Bid submitted", `Your bid on ${listing.title} has been recorded.`);
    } catch (error) {
      Alert.alert("Unable to bid", error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function handleAutoBid() {
    const maxBidValue = Number(autoBidMax) || 0;
    const incrementValue = Number(autoBidIncrement) || listing.minimumIncrement;

    if (maxBidValue <= 0) {
      Alert.alert("Invalid ceiling", "Enter a maximum bid greater than zero.");
      return;
    }

    try {
      await configureAutoBid(listing.id, maxBidValue, incrementValue);
      Alert.alert("Auto-bid saved", `Your ceiling for ${listing.title} is $${maxBidValue.toFixed(2)}/${listing.unit}.`);
    } catch (error) {
      Alert.alert("Unable to save auto-bid", error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function handleReviewSubmit() {
    if (!currentUser) return;

    const rating = Math.min(5, Math.max(1, Number(reviewRating) || 5));

    try {
      await addReview(listing.id, {
        customerName: currentUser.customerProfile?.facilityName ?? currentUser.name,
        rating,
        comment: reviewComment.trim() || "Reliable lot and smooth settlement."
      });
      setReviewComment("");
      setReviewRating("5");
      Alert.alert("Review saved", "Your rating has been added.");
    } catch (error) {
      Alert.alert("Unable to save review", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return (
    <ScreenShell title={listing.title} subtitle={`${listing.farmerName} · ${listing.locationName} · ${listing.distanceMiles} mi away`}>
      <SectionCard>
        {/* Lot summary */}
        <Text style={styles.paragraph}>{listing.description}</Text>

        <View style={styles.badgeRow}>
          {listing.imageGallery.map((item) => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.metaText}>
          Status: <Text style={{ fontWeight: "700" }}>{listing.auctionStatus.toUpperCase()}</Text>
        </Text>
        <Text style={styles.metaText}>
          Current bid: <Text style={{ fontWeight: "700" }}>${listing.currentBid.toFixed(2)}/{listing.unit}</Text>
          {listing.reserveMet ? "  ✓ Reserve met" : "  Reserve not yet met"}
        </Text>
        <Text style={styles.metaText}>Opening bid: ${listing.openingBid.toFixed(2)}/{listing.unit}</Text>
        <Text style={styles.metaText}>Reserve price: ${listing.reservePrice.toFixed(2)}/{listing.unit}</Text>
        <Text style={styles.metaText}>Minimum increment: ${listing.minimumIncrement.toFixed(2)}/{listing.unit}</Text>
        <Text style={styles.metaText}>Lot: {listing.totalWeightLbs} lb across {listing.headCount} head</Text>
        <Text style={styles.metaText}>Grade: {listing.qualityGrade}</Text>
        <Text style={styles.metaText}>Estimated yield: {listing.estimatedYieldPercent}%</Text>
        <Text style={styles.metaText}>Packaging: {listing.packagingDetails}</Text>
        <Text style={styles.metaText}>Handling: {listing.handlingDetails}</Text>
        <Text style={styles.metaText}>Payment terms: {listing.paymentTerms}</Text>
        <Text style={styles.metaText}>Current leader: {listing.currentLeaderName ?? "No bids yet"}</Text>
        <Text style={styles.metaText}>Total bids: {listing.bids.length}</Text>
        <Text style={styles.metaText}>
          Auction closes: {new Date(listing.auctionEndAt).toLocaleString()}
        </Text>
      </SectionCard>

      {/* Farm profile */}
      {farmer?.farmProfile ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>{farmer.farmProfile.farmName}</Text>
          {farmer.farmProfile.story ? (
            <Text style={styles.paragraph}>{farmer.farmProfile.story}</Text>
          ) : null}
          {farmer.farmProfile.practices.length > 0 ? (
            <Text style={styles.metaText}>Practices: {farmer.farmProfile.practices.join(", ")}</Text>
          ) : null}
          {farmer.farmProfile.certifications.length > 0 ? (
            <Text style={styles.metaText}>Certifications: {farmer.farmProfile.certifications.join(", ")}</Text>
          ) : null}
          <Text style={styles.metaText}>Pickup address: {farmer.farmProfile.pickupAddress}</Text>
          <Text style={styles.metaText}>Contact: {farmer.farmProfile.contactEmail}</Text>
          {farmer.farmProfile.verified ? (
            <Text style={[styles.metaText, { color: "#3A6B35", fontWeight: "700" }]}>Verified farm profile</Text>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Bid panel */}
      {isLive ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Place a manual bid</Text>
          <TextInput
            value={manualBid}
            onChangeText={setManualBid}
            keyboardType="numeric"
            style={styles.input}
            placeholder={`Minimum: $${(listing.currentLeaderId ? listing.currentBid + listing.minimumIncrement : listing.openingBid).toFixed(2)}/${listing.unit}`}
          />
          <AppButton label="Submit Manual Bid" onPress={() => void handleManualBid()} />
        </SectionCard>
      ) : null}

      {/* Auto-bid panel */}
      {isLive && listing.allowAutoBids ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Auto-bid strategy</Text>
          <Text style={styles.paragraph}>
            Set the highest price your plant will pay. The system increments only as needed to keep you competitive.
          </Text>
          {myStrategy ? (
            <Text style={[styles.metaText, { fontWeight: "700" }]}>
              Active ceiling: ${myStrategy.maxBid.toFixed(2)}/{listing.unit} · +${myStrategy.increment.toFixed(2)} per round
            </Text>
          ) : (
            <Text style={styles.metaText}>No auto-bid configured for this lot.</Text>
          )}
          <TextInput
            value={autoBidMax}
            onChangeText={setAutoBidMax}
            keyboardType="numeric"
            style={styles.input}
            placeholder="Maximum bid per lb"
          />
          <TextInput
            value={autoBidIncrement}
            onChangeText={setAutoBidIncrement}
            keyboardType="numeric"
            style={styles.input}
            placeholder="Increment per bidding round"
          />
          <AppButton label={myStrategy ? "Update Auto-Bid" : "Save Auto-Bid"} onPress={() => void handleAutoBid()} />
        </SectionCard>
      ) : null}

      {/* Bid history */}
      <SectionCard>
        <Text style={styles.sectionTitle}>Bid history ({listing.bids.length})</Text>
        {listing.bids.length === 0 ? (
          <Text style={styles.paragraph}>No bids yet — be the first.</Text>
        ) : (
          listing.bids.map((bid, index) => (
            <View key={bid.id} style={[styles.reviewRow, index === 0 ? { borderTopWidth: 0 } : undefined]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.reviewHeading}>
                  {bid.slaughterhouseName}
                </Text>
                <Text style={[styles.metaText, { fontWeight: "700" }]}>
                  ${bid.amount.toFixed(2)}/{listing.unit}
                </Text>
              </View>
              <Text style={styles.metaText}>
                {bid.mode === "auto" ? "Auto-bid" : "Manual"} · {new Date(bid.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </SectionCard>

      {/* Actions */}
      <SectionCard>
        <View style={styles.row}>
          <AppButton
            label={isFavorited ? "Remove from saved" : "Save auction"}
            kind="secondary"
            onPress={() => void toggleFavorite(listing.id)}
            style={styles.flexButton}
          />
          <AppButton label="Back to board" kind="secondary" onPress={onBack} style={styles.flexButton} />
        </View>
      </SectionCard>

      {/* Review form */}
      <SectionCard>
        <Text style={styles.sectionTitle}>Leave a review</Text>
        <TextInput value={reviewRating} onChangeText={setReviewRating} keyboardType="numeric" style={styles.input} placeholder="Rating 1–5" />
        <TextInput
          value={reviewComment}
          onChangeText={setReviewComment}
          style={[styles.input, styles.multiline]}
          placeholder="Short comment about this lot or the transaction"
          multiline
        />
        <AppButton label="Submit Review" kind="secondary" onPress={() => void handleReviewSubmit()} />
      </SectionCard>

      {/* Existing reviews */}
      {listing.reviews.length > 0 ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Reviews ({listing.reviews.length})</Text>
          {listing.reviews.map((review) => (
            <View key={review.id} style={styles.reviewRow}>
              <Text style={styles.reviewHeading}>
                {review.customerName} · {review.rating}/5
              </Text>
              <Text style={styles.paragraph}>{review.comment}</Text>
              <Text style={styles.metaText}>{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}
