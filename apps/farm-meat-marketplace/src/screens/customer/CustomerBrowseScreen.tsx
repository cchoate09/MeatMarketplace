import React, { useMemo, useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { EmptyState } from "../../components/EmptyState";
import { FilterPanel } from "../../components/FilterPanel";
import { ListingCard } from "../../components/ListingCard";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { hasStripeConfig, processMockPayment, processStripePayment } from "../../services/payments";
import { DeliveryMethod } from "../../types";
import { styles } from "../sharedStyles";

export function CustomerBrowseScreen() {
  const { currentUser, users, listings, filters, setFilters, purchaseListing, addReview, toggleFavorite } = useAppContext();
  const stripe = useStripe();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(currentUser?.customerProfile?.paymentMethods[0]?.id ?? "");
  const [pickupSlotId, setPickupSlotId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (filters.category !== "all" && listing.category !== filters.category) {
        return false;
      }

      if (filters.cut !== "all" && listing.cut !== filters.cut) {
        return false;
      }

      if (filters.deliveryMethod === "pickup" && !listing.pickupAvailable) {
        return false;
      }

      if (filters.deliveryMethod === "shipping" && !listing.shippingAvailable) {
        return false;
      }

      if (filters.deliveryMethod === "pickup" && listing.distanceMiles > filters.maxRadiusMiles) {
        return false;
      }

      if (filters.deliveryMethod === "all" && !listing.shippingAvailable && listing.distanceMiles > filters.maxRadiusMiles) {
        return false;
      }

      return true;
    });
  }, [filters, listings]);

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

  async function handlePurchase() {
    if (!selectedListing) {
      return;
    }

    try {
      if (!currentUser) {
        throw new Error("A customer must be logged in.");
      }

      setIsProcessingPayment(true);
      const parsedQuantity = Number(quantity) || 1;
      const paymentResult = hasStripeConfig
        ? await processStripePayment(stripe, {
            currentUser,
            listing: selectedListing,
            quantity: parsedQuantity,
            deliveryMethod
          })
        : await processMockPayment({
            currentUser,
            listing: selectedListing,
            quantity: parsedQuantity,
            deliveryMethod
          });

      const order = await purchaseListing(
        selectedListing,
        parsedQuantity,
        deliveryMethod,
        paymentMethodId,
        pickupSlotId || undefined,
        paymentResult.paymentMethodLabel,
        paymentResult.transactionId
      );
      Alert.alert("Order placed", `${order.listingTitle} has been ordered for $${order.totalPrice.toFixed(2)}.`);
      setSelectedListingId(null);
      setQuantity("1");
      setPickupSlotId("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to order", message);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  function handleReviewSubmit() {
    if (!selectedListing || !currentUser) {
      return;
    }

    try {
      addReview(selectedListing.id, {
        customerName: currentUser.name,
        rating: Math.min(5, Math.max(1, Number(reviewRating) || 5)),
        comment: reviewComment.trim() || "Great order."
      });
      setReviewComment("");
      setReviewRating("5");
      Alert.alert("Review saved", "Your rating has been added to the listing.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to save review", message);
    }
  }

  return (
    <ScreenShell title="Browse listings" subtitle="Filter by cut, fulfillment, farm profile, and reorder-friendly details.">
      {favoriteListings.length > 0 ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favoriteListings.map((listing) => (
            <Text key={listing.id} style={styles.paragraph}>
              {listing.title} - ${listing.price}/{listing.unit}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      <FilterPanel filters={filters} onChange={setFilters} />

      {selectedListing ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>{selectedListing.title}</Text>
          <Text style={styles.paragraph}>{selectedListing.description}</Text>
          <View style={styles.badgeRow}>
            {selectedListing.imageGallery.map((item) => (
              <View key={item} style={styles.pill}>
                <Text style={styles.pillText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.metaText}>
            ${selectedListing.price}/{selectedListing.unit} - {selectedListing.quantityAvailable} available
          </Text>
          <Text style={styles.metaText}>Breed: {selectedListing.breed}</Text>
          <Text style={styles.metaText}>Packaging: {selectedListing.packagingDetails}</Text>
          <Text style={styles.metaText}>Storage: {selectedListing.storageDetails}</Text>
          <Text style={styles.metaText}>Cooking tip: {selectedListing.cookingTip}</Text>
          <Text style={styles.metaText}>Available on: {selectedListing.availableOn}</Text>
          <Text style={styles.metaText}>Processing time: {selectedListing.processingDays} day(s)</Text>
          <Text style={styles.metaText}>Pickup: {selectedListing.pickupInstructions}</Text>
          <Text style={styles.metaText}>
            Shipping regions: {selectedListing.shippingRegions.length > 0 ? selectedListing.shippingRegions.join(", ") : "Pickup only"}
          </Text>

          {selectedFarmer?.farmProfile ? (
            <View style={styles.dividerTop}>
              <Text style={styles.sectionTitle}>Farm profile</Text>
              <Text style={styles.paragraph}>{selectedFarmer.farmProfile.story}</Text>
              <Text style={styles.metaText}>Practices: {selectedFarmer.farmProfile.practices.join(", ")}</Text>
              <Text style={styles.metaText}>Certifications: {selectedFarmer.farmProfile.certifications.join(", ")}</Text>
              <Text style={styles.metaText}>Contact: {selectedFarmer.farmProfile.contactEmail}</Text>
            </View>
          ) : null}

          <TextInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} placeholder="Quantity" />
          <View style={styles.row}>
            <AppButton
              label="Pickup"
              kind={deliveryMethod === "pickup" ? "primary" : "secondary"}
              onPress={() => setDeliveryMethod("pickup")}
              style={styles.flexButton}
              disabled={!selectedListing.pickupAvailable}
            />
            <AppButton
              label="Shipping"
              kind={deliveryMethod === "shipping" ? "primary" : "secondary"}
              onPress={() => setDeliveryMethod("shipping")}
              style={styles.flexButton}
              disabled={!selectedListing.shippingAvailable}
            />
          </View>

          {deliveryMethod === "pickup" ? (
            <>
              <Text style={styles.label}>Pickup time slots</Text>
              <View style={styles.rowWrap}>
                {selectedListing.pickupSlots.map((slot) => (
                  <AppButton
                    key={slot.id}
                    label={slot.label}
                    kind={pickupSlotId === slot.id ? "primary" : "secondary"}
                    onPress={() => setPickupSlotId(slot.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {hasStripeConfig ? (
            <View style={styles.dividerTop}>
              <Text style={styles.sectionTitle}>Secure checkout</Text>
              <Text style={styles.paragraph}>This order will open Stripe PaymentSheet so the customer can pay with a live card, Apple Pay, or Google Pay where supported.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Payment method</Text>
              <View style={styles.rowWrap}>
                {(currentUser?.customerProfile?.paymentMethods ?? []).map((method) => (
                  <AppButton
                    key={method.id}
                    label={`${method.brand} ${method.last4}`}
                    kind={paymentMethodId === method.id ? "primary" : "secondary"}
                    onPress={() => setPaymentMethodId(method.id)}
                  />
                ))}
              </View>
            </>
          )}

          <View style={styles.row}>
            <AppButton
              label={currentUser?.favorites.includes(selectedListing.id) ? "Remove Favorite" : "Save Favorite"}
              kind="secondary"
              onPress={() => toggleFavorite(selectedListing.id)}
              style={styles.flexButton}
            />
            <AppButton
              label={isProcessingPayment ? "Processing..." : hasStripeConfig ? "Pay with Stripe" : "Purchase"}
              onPress={() => void handlePurchase()}
              style={styles.flexButton}
              disabled={isProcessingPayment}
            />
          </View>
          <AppButton label="Back to Listings" kind="secondary" onPress={() => setSelectedListingId(null)} />

          <Text style={styles.sectionTitle}>Leave a review</Text>
          <TextInput value={reviewRating} onChangeText={setReviewRating} keyboardType="numeric" style={styles.input} placeholder="1-5" />
          <TextInput
            value={reviewComment}
            onChangeText={setReviewComment}
            style={[styles.input, styles.multiline]}
            placeholder="Short comment"
            multiline
          />
          <AppButton label="Submit Review" kind="secondary" onPress={handleReviewSubmit} />

          <Text style={styles.sectionTitle}>Recent reviews</Text>
          {selectedListing.reviews.length === 0 ? (
            <Text style={styles.paragraph}>No reviews yet.</Text>
          ) : (
            selectedListing.reviews.map((review) => (
              <View key={review.id} style={styles.reviewRow}>
                <Text style={styles.reviewHeading}>
                  {review.customerName} - {review.rating}/5
                </Text>
                <Text style={styles.paragraph}>{review.comment}</Text>
              </View>
            ))
          )}
        </SectionCard>
      ) : filteredListings.length === 0 ? (
        <EmptyState title="No listings found" body="Try widening the pickup radius or removing a filter." />
      ) : (
        filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} onPress={() => setSelectedListingId(listing.id)} />)
      )}
    </ScreenShell>
  );
}
