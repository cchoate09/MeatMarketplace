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
  const { data: slots } = listingIds.length > 0 ? await supabase.from("pickup_slots").select("*").in("listing_id", listingIds) : { data: [] as any[] };
  const { data: reviews } = listingIds.length > 0 ? await supabase.from("reviews").select("*").in("listing_id", listingIds) : { data: [] as any[] };

  return (listings ?? []).map((entry) =>
    mapListingRecord(
      entry,
      images?.filter((image) => image.listing_id === entry.id) ?? [],
      slots?.filter((slot) => slot.listing_id === entry.id) ?? [],
      reviews?.filter((review) => review.listing_id === entry.id) ?? []
    )
  );
}

export async function createListing(listing: Omit<Listing, "id" | "reviews">) {
  if (!hasSupabaseConfig) {
    return createMockListing(listing);
  }

  const supabase = requireSupabase();
  const { data: farm } = await supabase.from("farms").select("id").eq("owner_user_id", listing.farmerId).maybeSingle();
  const { data, error } = await supabase.from("listings").insert({
    farm_id: farm?.id ?? null,
    farmer_id: listing.farmerId,
    farmer_name: listing.farmerName,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    cut: listing.cut,
    price: listing.price,
    unit: listing.unit,
    quantity_available: listing.quantityAvailable,
    low_stock_threshold: listing.lowStockThreshold,
    pickup_available: listing.pickupAvailable,
    shipping_available: listing.shippingAvailable,
    shipping_fee: listing.shippingFee,
    location_name: listing.locationName,
    distance_miles: listing.distanceMiles,
    available_on: listing.availableOn,
    processing_days: listing.processingDays,
    pickup_instructions: listing.pickupInstructions,
    shipping_regions: listing.shippingRegions,
    minimum_order: listing.minimumOrder ?? null,
    image_label: listing.imageLabel,
    breed: listing.breed,
    packaging_details: listing.packagingDetails,
    storage_details: listing.storageDetails,
    cooking_tip: listing.cookingTip,
    tags: listing.tags
  }).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create listing.");
  }

  if (listing.pickupSlots.length > 0) {
    const { error: slotError } = await supabase.from("pickup_slots").insert(
      listing.pickupSlots.map((entry) => ({
        id: entry.id,
        listing_id: data.id,
        label: entry.label,
        start_at: entry.startAt,
        end_at: entry.endAt
      }))
    );

    if (slotError) {
      throw new Error(slotError.message);
    }
  }

  if (listing.imageGallery.length > 0) {
    const { error: imageError } = await supabase.from("listing_images").insert(
      listing.imageGallery.map((entry, index) => ({
        listing_id: data.id,
        label: entry,
        storage_path: null,
        public_url: null,
        display_order: index
      }))
    );

    if (imageError) {
      throw new Error(imageError.message);
    }
  }

  return mapListingRecord(
    data,
    listing.imageGallery.map((entry, index) => ({
      id: `${data.id}-image-${index}`,
      label: entry,
      public_url: null,
      storage_path: null
    })),
    listing.pickupSlots,
    []
  );
}

export async function addReview(listingId: string, review: Omit<Review, "id" | "createdAt">, customerId?: string, orderId?: string) {
  if (!hasSupabaseConfig) {
    return addMockReview(listingId, review);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.from("reviews").insert({
    listing_id: listingId,
    customer_id: customerId,
    order_id: orderId ?? null,
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
