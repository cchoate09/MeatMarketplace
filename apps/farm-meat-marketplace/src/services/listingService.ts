import { Listing, Review } from "../types";
import { mapListingRecord } from "./mappers";
import { addMockReview, createMockListing, listMockListings } from "./mockBackend";
import { hasSupabaseConfig, requireSupabase } from "./supabase";

export async function listListings() {
  if (!hasSupabaseConfig) {
    return listMockListings();
  }

  const supabase = requireSupabase();
  const { data: listings, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const listingIds = (listings ?? []).map((entry) => entry.id);
  const { data: images } = listingIds.length > 0 ? await supabase.from("listing_images").select("*").in("listing_id", listingIds) : { data: [] as any[] };
  const { data: reviews } = listingIds.length > 0 ? await supabase.from("reviews").select("*").in("listing_id", listingIds) : { data: [] as any[] };

  return (listings ?? []).map((entry) =>
    mapListingRecord(
      entry,
      images?.filter((image) => image.listing_id === entry.id) ?? [],
      [],
      reviews?.filter((review) => review.listing_id === entry.id) ?? []
    )
  );
}

export async function createListing(
  listing: Omit<Listing, "id" | "reviews" | "bids" | "currentBid" | "auctionStatus" | "reserveMet">
) {
  if (!hasSupabaseConfig) {
    return createMockListing(listing);
  }

  // Hook preserved for the future auction schema migration.
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("listings").insert({
    farmer_id: listing.farmerId,
    farmer_name: listing.farmerName,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    cut: listing.cut,
    unit: listing.unit,
    location_name: listing.locationName,
    distance_miles: listing.distanceMiles,
    image_label: listing.imageLabel,
    breed: listing.breed,
    tags: listing.tags,
    total_weight_lbs: listing.totalWeightLbs,
    head_count: listing.headCount,
    reserve_price: listing.reservePrice,
    opening_bid: listing.openingBid,
    minimum_increment: listing.minimumIncrement,
    auction_start_at: listing.auctionStartAt,
    auction_end_at: listing.auctionEndAt,
    quality_grade: listing.qualityGrade,
    packaging_details: listing.packagingDetails,
    handling_details: listing.handlingDetails,
    estimated_yield_percent: listing.estimatedYieldPercent,
    payment_terms: listing.paymentTerms,
    allow_auto_bids: listing.allowAutoBids
  }).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create auction listing.");
  }

  return mapListingRecord(data);
}

export async function addReview(listingId: string, review: Omit<Review, "id" | "createdAt">, customerId?: string) {
  if (!hasSupabaseConfig) {
    return addMockReview(listingId, review);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.from("reviews").insert({
    listing_id: listingId,
    customer_id: customerId,
    customer_name: review.customerName,
    rating: review.rating,
    comment: review.comment
  }).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to add review.");
  }

  return {
    id: data.id,
    customerName: data.customer_name,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at
  };
}
