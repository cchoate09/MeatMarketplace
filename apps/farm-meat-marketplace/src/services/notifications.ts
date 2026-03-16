/**
 * External notification service — stub for push/SMS/email delivery.
 *
 * In-app notifications are handled by the notifications table in Supabase
 * (see profileService.ts). This service handles out-of-app delivery.
 *
 * Recommended Phase 2 work:
 *   1. Install expo-notifications and configure push credentials in EAS
 *   2. Store the Expo push token on the profiles table on first app load
 *   3. Create a Supabase Edge Function triggered by a Postgres webhook on the
 *      awards table that calls the Expo Push API, Twilio SMS, or email
 *   4. Replace sendRealSaleNotification below with the Edge Function call
 *
 * Never call external notification APIs directly from the app — use a
 * server-side Edge Function so credentials stay off the client.
 */

import { Order } from "../types";

export interface NotificationDeliveryResult {
  delivered: boolean;
  channel: "in-app" | "push" | "sms" | "email";
  message: string;
}

/** Mock in demo mode — returns a success placeholder with no real delivery. */
export async function notifyFarmerOfSale(order: Order): Promise<NotificationDeliveryResult> {
  return {
    delivered: true,
    channel: "in-app",
    message: `Mock notification sent to farmer for order ${order.id}`
  };
}

/**
 * Triggers an out-of-app notification for an award event.
 *
 * TODO: replace with a Supabase Edge Function call that fans out to Expo Push,
 * Twilio SMS, or email. Ideally trigger via a Postgres webhook on the awards
 * table so notifications fire even when the app is backgrounded.
 */
export async function sendRealSaleNotification(_order: Order): Promise<NotificationDeliveryResult> {
  throw new Error(
    "External notification delivery is not yet implemented. " +
      "Create a Supabase Edge Function triggered by a Postgres webhook on the awards table."
  );
}
