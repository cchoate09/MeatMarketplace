import { Listing } from "../types";

export async function estimateShipping(listing: Listing) {
  return {
    available: listing.shippingAvailable,
    fee: listing.shippingFee,
    carrierLabel: listing.shippingAvailable ? "Mock cold-chain regional shipping" : "Unavailable"
  };
}

export async function createShipmentForOrder() {
  throw new Error("TODO: connect shipping carrier");
}
