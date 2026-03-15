import { Listing, NotificationItem, Order, User } from "../types";

export function mapUserRecord(
  profile: any,
  customerProfile?: any,
  paymentAccounts: any[] = [],
  farm?: any,
  onboarding?: any,
  favorites: any[] = []
): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    locationLabel: profile.location_label ?? "",
    favorites: favorites.map((entry) => entry.listing_id),
    customerProfile: customerProfile
      ? {
          savedAddress: customerProfile.saved_address,
          paymentMethods: paymentAccounts
            .filter((entry) => entry.account_type === "customer")
            .map((entry) => ({
              id: entry.id,
              brand: entry.brand ?? "Card",
              last4: entry.last4 ?? "0000",
              expiry: entry.expiry ?? "",
              isDefault: entry.is_default ?? false,
              processorReference: entry.processor_reference ?? undefined
            }))
        }
      : undefined,
    farmProfile: farm
      ? {
          farmName: farm.farm_name,
          story: farm.story,
          practices: farm.practices ?? [],
          certifications: farm.certifications ?? [],
          contactEmail: farm.contact_email,
          contactPhone: farm.contact_phone,
          pickupAddress: farm.pickup_address,
          verified: farm.verified ?? false
        }
      : undefined,
    farmerOnboarding: onboarding
      ? {
          legalName: onboarding.legal_name,
          identityVerified: onboarding.identity_verified ?? false,
          payoutAccountLabel: onboarding.payout_account_label ?? "",
          payoutReady: onboarding.payout_ready ?? false
        }
      : undefined
  };
}

export function mapListingRecord(record: any, images: any[] = [], slots: any[] = [], reviews: any[] = []): Listing {
  return {
    id: record.id,
    farmerId: record.farmer_id,
    farmerName: record.farmer_name,
    title: record.title,
    description: record.description,
    category: record.category,
    cut: record.cut,
    price: Number(record.price),
    unit: record.unit,
    quantityAvailable: record.quantity_available,
    lowStockThreshold: record.low_stock_threshold,
    pickupAvailable: record.pickup_available,
    shippingAvailable: record.shipping_available,
    shippingFee: Number(record.shipping_fee),
    locationName: record.location_name,
    distanceMiles: Number(record.distance_miles ?? 0),
    availableOn: record.available_on,
    processingDays: record.processing_days,
    pickupInstructions: record.pickup_instructions,
    pickupSlots: slots.map((entry) => ({
      id: entry.id,
      label: entry.label,
      startAt: entry.start_at,
      endAt: entry.end_at
    })),
    shippingRegions: record.shipping_regions ?? [],
    minimumOrder: record.minimum_order ?? undefined,
    imageLabel: record.image_label,
    imageGallery: images.map((entry) => entry.label ?? entry.public_url ?? entry.storage_path),
    breed: record.breed,
    packagingDetails: record.packaging_details,
    storageDetails: record.storage_details,
    cookingTip: record.cooking_tip,
    tags: record.tags ?? [],
    reviews: reviews.map((entry) => ({
      id: entry.id,
      customerName: entry.customer_name,
      rating: entry.rating,
      comment: entry.comment,
      createdAt: entry.created_at
    }))
  };
}

export function mapOrderRecord(record: any): Order {
  return {
    id: record.id,
    listingId: record.listing_id,
    listingTitle: record.listing_title,
    farmerId: record.farmer_id,
    farmerName: record.farmer_name,
    customerId: record.customer_id,
    customerName: record.customer_name,
    quantity: record.quantity,
    deliveryMethod: record.delivery_method,
    pickupSlotLabel: record.pickup_slot_label ?? undefined,
    paymentMethodLabel: record.payment_method_label,
    paymentIntentId: record.payment_intent_id ?? undefined,
    subtotal: Number(record.subtotal),
    shippingFee: Number(record.shipping_fee),
    totalPrice: Number(record.total_price),
    createdAt: record.created_at,
    status: record.status
  };
}

export function mapNotificationRecord(record: any): NotificationItem {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    body: record.body,
    createdAt: record.created_at,
    read: record.read
  };
}
