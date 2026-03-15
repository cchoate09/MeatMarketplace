import { DeliveryMethod, Listing, Order, OrderStatus, User } from "../types";
import { mapOrderRecord } from "./mappers";
import { createMockNotification, createMockOrder, listMockOrders, updateMockOrderStatus } from "./mockBackend";
import { hasSupabaseConfig, requireSupabase } from "./supabase";

export async function listOrders() {
  if (!hasSupabaseConfig) {
    return listMockOrders();
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapOrderRecord);
}

export async function createOrder(
  currentUser: User,
  listing: Listing,
  quantity: number,
  deliveryMethod: DeliveryMethod,
  paymentMethodId: string,
  pickupSlotId?: string,
  paymentMethodLabelOverride?: string,
  paymentIntentId?: string
) {
  if (!hasSupabaseConfig) {
    return createMockOrder(currentUser, listing, quantity, deliveryMethod, paymentMethodId, pickupSlotId, paymentMethodLabelOverride, paymentIntentId);
  }

  const supabase = requireSupabase();
  const paymentMethod = currentUser.customerProfile?.paymentMethods.find((entry) => entry.id === paymentMethodId);
  const pickupSlot = pickupSlotId ? listing.pickupSlots.find((entry) => entry.id === pickupSlotId) : undefined;

  if (!paymentMethod && !paymentMethodLabelOverride) {
    throw new Error("Selected payment method was not found.");
  }

  const { data, error } = await supabase.rpc("create_order_with_inventory", {
    p_listing_id: listing.id,
    p_listing_title: listing.title,
    p_farmer_id: listing.farmerId,
    p_farmer_name: listing.farmerName,
    p_customer_id: currentUser.id,
    p_customer_name: currentUser.name,
    p_quantity: quantity,
    p_delivery_method: deliveryMethod,
    p_pickup_slot_id: pickupSlotId ?? null,
    p_pickup_slot_label: pickupSlot?.label ?? null,
    p_payment_method_label: paymentMethodLabelOverride ?? `${paymentMethod?.brand} ending in ${paymentMethod?.last4}`,
    p_payment_intent_id: paymentIntentId ?? null,
    p_subtotal: quantity * listing.price,
    p_shipping_fee: deliveryMethod === "shipping" ? listing.shippingFee : 0,
    p_total_price: quantity * listing.price + (deliveryMethod === "shipping" ? listing.shippingFee : 0)
  });

  if (error) {
    throw new Error(error.message);
  }

  return mapOrderRecord(data);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabaseConfig) {
    updateMockOrderStatus(orderId, status);
    return;
  }

  const supabase = requireSupabase();
  const { error } = await supabase.rpc("advance_order_status", {
    p_order_id: orderId,
    p_new_status: status
  });

  if (error) {
    throw new Error(error.message);
  }
}
