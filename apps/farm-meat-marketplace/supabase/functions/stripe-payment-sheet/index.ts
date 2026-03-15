// @ts-nocheck
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripeApiBase = "https://api.stripe.com/v1";
const stripeVersion = "2024-06-20";

function asFormData(values: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params;
}

async function stripeRequest(path: string, body: URLSearchParams) {
  const response = await fetch(`${stripeApiBase}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Stripe-Version": stripeVersion,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Stripe request failed.");
  }

  return payload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Missing Stripe or Supabase secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const {
      customerId,
      customerEmail,
      customerName,
      listingId,
      listingTitle,
      farmerId,
      quantity,
      deliveryMethod,
      subtotal,
      shipping,
      total,
      currency
    } = body;

    if (userData.user.id !== customerId) {
      return new Response(JSON.stringify({ error: "Customer mismatch." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: customerProfile } = await serviceClient
      .from("customer_profiles")
      .select("processor_customer_id")
      .eq("user_id", customerId)
      .maybeSingle();

    let stripeCustomerId = customerProfile?.processor_customer_id ?? null;

    if (!stripeCustomerId) {
      const createdCustomer = await stripeRequest(
        "/customers",
        asFormData({
          email: customerEmail,
          name: customerName,
          "metadata[user_id]": customerId
        })
      );

      stripeCustomerId = createdCustomer.id;

      await serviceClient.from("customer_profiles").upsert(
        {
          user_id: customerId,
          processor_customer_id: stripeCustomerId
        },
        { onConflict: "user_id" }
      );
    }

    const ephemeralKey = await stripeRequest(
      "/ephemeral_keys",
      asFormData({
        customer: stripeCustomerId
      })
    );

    const paymentIntent = await stripeRequest(
      "/payment_intents",
      asFormData({
        amount: Math.round(Number(total) * 100),
        currency: currency ?? "usd",
        customer: stripeCustomerId,
        "automatic_payment_methods[enabled]": "true",
        "metadata[listing_id]": listingId,
        "metadata[listing_title]": listingTitle,
        "metadata[farmer_id]": farmerId,
        "metadata[customer_id]": customerId,
        "metadata[quantity]": quantity,
        "metadata[delivery_method]": deliveryMethod,
        "metadata[subtotal]": subtotal,
        "metadata[shipping_fee]": shipping
      })
    );

    return new Response(
      JSON.stringify({
        customerId: stripeCustomerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
        paymentIntentClientSecret: paymentIntent.client_secret,
        merchantDisplayName: "Farm Meat Marketplace"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
