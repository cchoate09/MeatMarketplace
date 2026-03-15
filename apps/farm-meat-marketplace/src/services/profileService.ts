import { User } from "../types";
import { mapNotificationRecord, mapUserRecord } from "./mappers";
import { createMockNotification, listMockNotifications, listMockUsers, markMockNotificationRead, updateMockUser } from "./mockBackend";
import { hasSupabaseConfig, requireSupabase } from "./supabase";

export async function listUsers() {
  if (!hasSupabaseConfig) {
    return listMockUsers();
  }

  const supabase = requireSupabase();
  const { data: profiles, error } = await supabase.from("profiles").select("*");

  if (error) {
    throw new Error(error.message);
  }

  const { data: customerProfiles } = await supabase.from("customer_profiles").select("*");
  const { data: paymentAccounts } = await supabase.from("payment_accounts").select("*");
  const { data: farms } = await supabase.from("farms").select("*");
  const { data: onboardingRows } = await supabase.from("farmer_onboarding").select("*");
  const { data: favorites } = await supabase.from("favorites").select("*");

  return (profiles ?? []).map((profile) =>
    mapUserRecord(
      profile,
      customerProfiles?.find((entry) => entry.user_id === profile.id),
      paymentAccounts?.filter((entry) => entry.user_id === profile.id) ?? [],
      farms?.find((entry) => entry.owner_user_id === profile.id),
      onboardingRows?.find((entry) => entry.user_id === profile.id),
      favorites?.filter((entry) => entry.user_id === profile.id) ?? []
    )
  );
}

export async function updateCustomerProfile(userId: string, updater: (user: User) => User) {
  if (!hasSupabaseConfig) {
    return updateMockUser(userId, updater);
  }

  const supabase = requireSupabase();
  const users = await listUsers();
  const current = users.find((entry) => entry.id === userId);

  if (!current) {
    throw new Error("User not found.");
  }

  const nextUser = updater(current);

  const { error: profileError } = await supabase.from("profiles").update({
    name: nextUser.name,
    location_label: nextUser.locationLabel
  }).eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (nextUser.customerProfile) {
    const { error: customerError } = await supabase.from("customer_profiles").upsert(
      {
        user_id: userId,
        saved_address: nextUser.customerProfile.savedAddress
      },
      { onConflict: "user_id" }
    );

    if (customerError) {
      throw new Error(customerError.message);
    }

    const { error: deletePaymentError } = await supabase.from("payment_accounts").delete().eq("user_id", userId).eq("account_type", "customer");

    if (deletePaymentError) {
      throw new Error(deletePaymentError.message);
    }

    if (nextUser.customerProfile.paymentMethods.length > 0) {
      const { error: paymentError } = await supabase.from("payment_accounts").insert(
        nextUser.customerProfile.paymentMethods.map((entry) => ({
          id: entry.id,
          user_id: userId,
          account_type: "customer",
          provider: "mock",
          brand: entry.brand,
          last4: entry.last4,
          expiry: entry.expiry,
          is_default: entry.isDefault,
          processor_reference: null
        }))
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }
    }
  }

  if (nextUser.farmProfile) {
    const { error: farmError } = await supabase.from("farms").upsert(
      {
        owner_user_id: userId,
        farm_name: nextUser.farmProfile.farmName,
        story: nextUser.farmProfile.story,
        practices: nextUser.farmProfile.practices,
        certifications: nextUser.farmProfile.certifications,
        contact_email: nextUser.farmProfile.contactEmail,
        contact_phone: nextUser.farmProfile.contactPhone,
        pickup_address: nextUser.farmProfile.pickupAddress,
        verified: nextUser.farmProfile.verified
      },
      { onConflict: "owner_user_id" }
    );

    if (farmError) {
      throw new Error(farmError.message);
    }
  }

  if (nextUser.farmerOnboarding) {
    const { error: onboardingError } = await supabase.from("farmer_onboarding").upsert(
      {
        user_id: userId,
        legal_name: nextUser.farmerOnboarding.legalName,
        identity_verified: nextUser.farmerOnboarding.identityVerified,
        payout_account_label: nextUser.farmerOnboarding.payoutAccountLabel,
        payout_ready: nextUser.farmerOnboarding.payoutReady
      },
      { onConflict: "user_id" }
    );

    if (onboardingError) {
      throw new Error(onboardingError.message);
    }
  }

  const { error: deleteFavoritesError } = await supabase.from("favorites").delete().eq("user_id", userId);

  if (deleteFavoritesError) {
    throw new Error(deleteFavoritesError.message);
  }

  if (nextUser.favorites.length > 0) {
    const { error: favoriteError } = await supabase.from("favorites").insert(
      nextUser.favorites.map((listingId) => ({
        user_id: userId,
        listing_id: listingId
      }))
    );

    if (favoriteError) {
      throw new Error(favoriteError.message);
    }
  }

  return nextUser;
}

export async function listNotifications(userId: string) {
  if (!hasSupabaseConfig) {
    return listMockNotifications(userId);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapNotificationRecord);
}

export async function createNotification(userId: string, title: string, body: string) {
  if (!hasSupabaseConfig) {
    return createMockNotification(userId, title, body);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    read: false
  }).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapNotificationRecord(data);
}

export async function markNotificationRead(notificationId: string) {
  if (!hasSupabaseConfig) {
    markMockNotificationRead(notificationId);
    return;
  }

  const supabase = requireSupabase();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);

  if (error) {
    throw new Error(error.message);
  }
}
