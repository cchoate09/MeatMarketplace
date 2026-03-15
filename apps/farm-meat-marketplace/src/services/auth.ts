import { mockUsers } from "../data/mockData";
import { clearMockSessionUserId } from "../storage/sessionStorage";
import { User, UserRole } from "../types";
import { mapUserRecord } from "./mappers";
import { getMockCurrentUser, hydrateMockSession, mockSignIn, mockSignInAs, mockSignOut, mockSignUp } from "./mockBackend";
import { hasSupabaseConfig, requireSupabase } from "./supabase";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function hydrateAuth() {
  if (!hasSupabaseConfig) {
    await hydrateMockSession();
  }
}

export async function getCurrentSignedInUser() {
  if (!hasSupabaseConfig) {
    return getMockCurrentUser();
  }

  const supabase = requireSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;

  if (!authUser) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();

  if (!profile) {
    return null;
  }

  const { data: customerProfile } = await supabase.from("customer_profiles").select("*").eq("user_id", authUser.id).maybeSingle();
  const { data: paymentAccounts } = await supabase.from("payment_accounts").select("*").eq("user_id", authUser.id);
  const { data: farms } = await supabase.from("farms").select("*").eq("owner_user_id", authUser.id).limit(1);
  const { data: onboarding } = await supabase.from("farmer_onboarding").select("*").eq("user_id", authUser.id).maybeSingle();
  const { data: favorites } = await supabase.from("favorites").select("listing_id").eq("user_id", authUser.id);

  return mapUserRecord(profile, customerProfile ?? undefined, paymentAccounts ?? [], farms?.[0], onboarding ?? undefined, favorites ?? []);
}

export async function signIn(email: string, password: string) {
  if (!hasSupabaseConfig) {
    return mockSignIn(email, password);
  }

  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  return getCurrentSignedInUser();
}

export async function signUp(input: SignUpInput) {
  if (!hasSupabaseConfig) {
    return mockSignUp(input.name, input.email, input.password, input.role);
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role
      }
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create account.");
  }

  const userId = data.user.id;
  const email = data.user.email ?? input.email;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    name: input.name,
    email,
    role: input.role,
    location_label: input.role === "farmer" ? "Farm location pending" : "Customer location pending"
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (input.role === "customer") {
    const { error: customerError } = await supabase.from("customer_profiles").insert({
      user_id: userId,
      saved_address: {
        label: "Primary",
        street: "",
        city: "",
        state: "",
        postalCode: ""
      }
    });

    if (customerError) {
      throw new Error(customerError.message);
    }
  } else {
    const { error: farmError } = await supabase.from("farms").insert({
      owner_user_id: userId,
      farm_name: input.name,
      story: "",
      practices: [],
      certifications: [],
      contact_email: email,
      contact_phone: "",
      pickup_address: "",
      verified: false
    });

    if (farmError) {
      throw new Error(farmError.message);
    }

    const { error: onboardingError } = await supabase.from("farmer_onboarding").insert({
      user_id: userId,
      legal_name: "",
      identity_verified: false,
      payout_account_label: "",
      payout_ready: false
    });

    if (onboardingError) {
      throw new Error(onboardingError.message);
    }
  }

  return getCurrentSignedInUser();
}

export async function signInAs(role: UserRole) {
  if (!hasSupabaseConfig) {
    return mockSignInAs(role);
  }

  const user = mockUsers.find((entry) => entry.role === role);

  if (!user) {
    throw new Error(`No demo user configured for role: ${role}`);
  }

  return signIn(user.email, "password123");
}

export async function signOut() {
  if (!hasSupabaseConfig) {
    await mockSignOut();
    await clearMockSessionUserId();
    return true;
  }

  const supabase = requireSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
