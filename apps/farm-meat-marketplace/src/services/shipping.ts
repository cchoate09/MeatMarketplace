/**
 * Shipping service — stub for cold-chain carrier integration.
 *
 * Intended integration: a cold-chain freight carrier API (e.g. UPS Freight,
 * FedEx Custom Critical, or a regional meat-transport broker). The service
 * should be able to:
 *   1. Estimate shipping cost given origin, destination, and lot weight
 *   2. Create a shipment label for an awarded lot
 *   3. Return a tracking URL / tracking number for in-app status updates
 *
 * Recommended Phase 4 work:
 *   1. Choose a carrier (or a multi-carrier aggregator like EasyPost)
 *   2. Add carrier credentials to .env and Supabase secrets
 *   3. Create a Supabase Edge Function that proxies label creation so that
 *      carrier credentials never touch the mobile app
 *   4. Replace the stubs below with calls to that Edge Function
 */

import { Listing, Order } from "../types";

export interface ShippingEstimate {
  available: boolean;
  fee: number | undefined;
  carrierLabel: string;
  estimatedTransitDays?: number;
}

export interface ShipmentResult {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrierId: string;
  estimatedDeliveryDate: string;
}

/**
 * Returns a shipping cost estimate for a listing.
 * In mock mode returns a placeholder; replace with a real carrier rate-quote
 * API call (proxied through an Edge Function) when going live.
 */
export async function estimateShipping(listing: Listing): Promise<ShippingEstimate> {
  return {
    available: listing.shippingAvailable ?? false,
    fee: listing.shippingFee,
    carrierLabel: listing.shippingAvailable ? "Mock cold-chain regional shipping" : "Unavailable",
    estimatedTransitDays: listing.shippingAvailable ? 2 : undefined
  };
}

/**
 * Creates a shipment label for an awarded order.
 *
 * TODO: replace this stub with a call to the carrier Edge Function.
 * The Edge Function should:
 *   - Accept the order ID and origin/destination addresses
 *   - Call the carrier API to generate a label
 *   - Store the tracking number and label URL on the awards table
 *   - Return the ShipmentResult
 */
export async function createShipmentForOrder(_order: Order): Promise<ShipmentResult> {
  throw new Error(
    "Shipping label creation is not yet implemented. " +
      "Connect a cold-chain carrier API via a Supabase Edge Function and replace this stub."
  );
}
