import { Listing, Order, User } from "../types";
import {
  acceptMockBelowReserve,
  closeMockAuction,
  configureMockAutoBid,
  extendMockAuction,
  listMockOrders,
  placeMockBid,
  updateMockAwardStatus
} from "./mockBackend";
import { hasSupabaseConfig, requireSupabase } from "./supabase";

export async function listAwards(): Promise<Order[]> {
  if (!hasSupabaseConfig) {
    return listMockOrders();
  }

  // TODO Phase 2: query the awards table from Supabase.
  // const supabase = requireSupabase();
  // const { data, error } = await supabase.from("awards").select("*").order("created_at", { ascending: false });
  // if (error) throw new Error(error.message);
  // return data.map(mapOrderRecord);
  return [];
}

export async function placeBid(
  currentUser: User,
  listingId: string,
  amount: number,
  mode: "manual" | "auto",
  maxBid?: number
): Promise<Listing> {
  if (!hasSupabaseConfig) {
    return placeMockBid(currentUser.id, listingId, amount, mode, maxBid);
  }

  // Phase 2: call the place_bid_atomic RPC.
  // The RPC enforces bid minimums server-side and returns the updated listing.
  //
  // const supabase = requireSupabase();
  // const { data, error } = await supabase.rpc("place_bid_atomic", {
  //   p_listing_id: listingId,
  //   p_slaughterhouse_id: currentUser.id,
  //   p_slaughterhouse_name: currentUser.customerProfile?.facilityName ?? currentUser.name,
  //   p_bid_amount: amount,
  //   p_bid_mode: mode,
  //   p_max_bid: maxBid ?? null
  // });
  // if (error) throw new Error(error.message);
  // return mapListingRecord(data);

  throw new Error("Live auction bidding is not wired yet. Switch to mock mode or migrate the auction backend schema.");
}

export async function configureAutoBid(currentUser: User, listingId: string, maxBid: number, increment: number): Promise<Listing> {
  if (!hasSupabaseConfig) {
    return configureMockAutoBid(currentUser.id, listingId, maxBid, increment);
  }

  // Phase 2: upsert into the auto_bid_strategies table, then call recalc RPC.
  //
  // const supabase = requireSupabase();
  // const { error } = await supabase.from("auto_bid_strategies").upsert({
  //   listing_id: listingId,
  //   slaughterhouse_id: currentUser.id,
  //   max_bid: maxBid,
  //   increment,
  //   updated_at: new Date().toISOString()
  // });
  // if (error) throw new Error(error.message);
  // const { data: listing, error: recalcError } = await supabase.rpc("recalculate_auction", { p_listing_id: listingId });
  // if (recalcError) throw new Error(recalcError.message);
  // return mapListingRecord(listing);

  throw new Error("Live auto-bid configuration is not wired yet. Switch to mock mode or migrate the auction backend schema.");
}

export async function closeAuction(listingId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    closeMockAuction(listingId);
    return;
  }

  // Phase 2: call the close_auction_atomic RPC.
  // This RPC atomically sets auction_status, creates the award row if
  // reserve is met, and dispatches notifications to both parties.
  //
  // const supabase = requireSupabase();
  // const { error } = await supabase.rpc("close_auction_atomic", { p_listing_id: listingId });
  // if (error) throw new Error(error.message);

  throw new Error("Live auction closing is not wired yet. Switch to mock mode or migrate the auction backend schema.");
}

/**
 * Extends the auction end time by the given number of minutes.
 * Use this for anti-sniping logic (e.g. add 5 minutes when a bid arrives
 * in the final 2 minutes of the auction).
 *
 * Phase 2: replace with a call to the extend_auction_end RPC.
 */
export async function extendAuction(listingId: string, extraMinutes: number): Promise<void> {
  if (!hasSupabaseConfig) {
    extendMockAuction(listingId, extraMinutes);
    return;
  }

  // const supabase = requireSupabase();
  // const { error } = await supabase.rpc("extend_auction_end", {
  //   p_listing_id: listingId,
  //   p_extra_minutes: extraMinutes
  // });
  // if (error) throw new Error(error.message);

  throw new Error("Live auction extension is not wired yet.");
}

/**
 * Awards the lot to the current leader even though the reserve was not met.
 * Only valid on auctions that closed without an automatic award.
 *
 * Phase 2: replace with a call to the accept_below_reserve RPC.
 */
export async function acceptBelowReserve(listingId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    acceptMockBelowReserve(listingId);
    return;
  }

  // const supabase = requireSupabase();
  // const { error } = await supabase.rpc("accept_below_reserve", { p_listing_id: listingId });
  // if (error) throw new Error(error.message);

  throw new Error("Live below-reserve acceptance is not wired yet.");
}

export async function updateAwardStatus(orderId: string, status: Order["status"]): Promise<void> {
  if (!hasSupabaseConfig) {
    updateMockAwardStatus(orderId, status);
    return;
  }

  // Phase 2: call advance_award_status RPC which validates the transition
  // and records an audit entry in award_status_history.
  //
  // const supabase = requireSupabase();
  // const { error } = await supabase.rpc("advance_award_status", {
  //   p_award_id: orderId,
  //   p_new_status: status
  // });
  // if (error) throw new Error(error.message);

  throw new Error("Live award settlement updates are not wired yet. Switch to mock mode or migrate the auction backend schema.");
}
