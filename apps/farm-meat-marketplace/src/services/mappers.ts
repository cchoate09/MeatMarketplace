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
          facilityName: customerProfile.facility_name ?? profile.name,
          buyerCode: customerProfile.buyer_code ?? "",
          inspectionRegions: customerProfile.inspection_regions ?? [],
          procurementNotes: customerProfile.procurement_notes ?? "",
          savedAddress: customerProfile.saved_address ?? {
            label: "Primary",
            street: "",
            city: "",
            state: "",
            postalCode: ""
          },
          paymentMethods: paymentAccounts
            .filter((entry) => entry.account_type === "customer")
            .map((entry) => ({
              id: entry.id,
              brand: entry.brand ?? "Card",
              last4: entry.last4 ?? "0000",
              expiry: entry.expiry ?? "",
              isDefault: entry.is_default ?? false,
              processorReference: entry.processor_reference ?? undefined
            })),
          strategies: []
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

export function mapListingRecord(record: any, images: any[] = [], _slots: any[] = [], reviews: any[] = []): Listing {
  return {
    id: record.id,
    farmerId: record.farmer_id,
    farmerName: record.farmer_name,
    title: record.title,
    description: record.description,
    category: record.category,
    cut: record.cut,
    unit: record.unit ?? "lb live weight",
    locationName: record.location_name ?? "",
    distanceMiles: Number(record.distance_miles ?? 0),
    imageLabel: record.image_label ?? "Lot",
    imageGallery: images.map((entry) => entry.label ?? entry.public_url ?? entry.storage_path).filter(Boolean),
    breed: record.breed ?? "",
    tags: record.tags ?? [],
    reviews: reviews.map((entry) => ({
      id: entry.id,
      customerName: entry.customer_name,
      rating: entry.rating,
      comment: entry.comment,
      createdAt: entry.created_at
    })),
    totalWeightLbs: Number(record.total_weight_lbs ?? record.quantity_available ?? 0),
    headCount: Number(record.head_count ?? 0),
    reservePrice: Number(record.reserve_price ?? record.price ?? 0),
    openingBid: Number(record.opening_bid ?? record.price ?? 0),
    currentBid: Number(record.current_bid ?? record.price ?? 0),
    minimumIncrement: Number(record.minimum_increment ?? 0.1),
    auctionStartAt: record.auction_start_at ?? record.available_on ?? new Date().toISOString(),
    auctionEndAt: record.auction_end_at ?? new Date().toISOString(),
    auctionStatus: record.auction_status ?? "scheduled",
    reserveMet: Boolean(record.reserve_met),
    currentLeaderId: record.current_leader_id ?? undefined,
    currentLeaderName: record.current_leader_name ?? undefined,
    winningBidId: record.winning_bid_id ?? undefined,
    qualityGrade: record.quality_grade ?? "Processor lot",
    packagingDetails: record.packaging_details ?? "",
    handlingDetails: record.handling_details ?? record.pickup_instructions ?? "",
    estimatedYieldPercent: Number(record.estimated_yield_percent ?? 0),
    paymentTerms: record.payment_terms ?? "Settlement terms pending",
    allowAutoBids: record.allow_auto_bids ?? true,
    bids: [],
    price: Number(record.price ?? 0),
    quantityAvailable: record.quantity_available ?? undefined,
    lowStockThreshold: record.low_stock_threshold ?? undefined,
    pickupAvailable: record.pickup_available ?? undefined,
    shippingAvailable: record.shipping_available ?? undefined,
    shippingFee: Number(record.shipping_fee ?? 0),
    availableOn: record.available_on ?? undefined,
    processingDays: record.processing_days ?? undefined,
    pickupInstructions: record.pickup_instructions ?? undefined,
    shippingRegions: record.shipping_regions ?? undefined,
    minimumOrder: record.minimum_order ?? undefined,
    storageDetails: record.storage_details ?? undefined,
    cookingTip: record.cooking_tip ?? undefined
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
    finalBid: Number(record.final_bid ?? record.total_price ?? 0),
    reservePrice: Number(record.reserve_price ?? 0),
    reserveMet: Boolean(record.reserve_met ?? true),
    bidCount: Number(record.bid_count ?? 0),
    totalWeightLbs: Number(record.total_weight_lbs ?? record.quantity ?? 0),
    paymentMethodLabel: record.payment_method_label ?? undefined,
    paymentIntentId: record.payment_intent_id ?? undefined,
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
