import { InitPaymentSheetResult, PresentPaymentSheetResult, RetrievePaymentIntentResult } from "@stripe/stripe-react-native";
import { appConfig } from "../config/appConfig";
import { Listing, User } from "../types";
import { requireSupabase } from "./supabase";

export interface PaymentIntentRequest {
  currentUser: User;
  listing: Listing;
  finalBidPerUnit: number;
  totalWeightLbs: number;
}

export interface CompletedPayment {
  status: "paid";
  subtotal: number;
  shipping: number;
  total: number;
  transactionId: string;
  paymentMethodLabel: string;
}

interface StripeCheckoutSession {
  customerId: string;
  customerEphemeralKeySecret: string;
  paymentIntentClientSecret: string;
  publishableKey?: string;
  merchantDisplayName?: string;
}

interface StripeClientApi {
  initPaymentSheet: (params: {
    customerId: string;
    customerEphemeralKeySecret: string;
    merchantDisplayName: string;
    paymentIntentClientSecret: string;
    allowsDelayedPaymentMethods?: boolean;
    defaultBillingDetails?: {
      name?: string;
      email?: string;
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        postalCode?: string;
        state?: string;
      };
    };
  }) => Promise<InitPaymentSheetResult>;
  presentPaymentSheet: () => Promise<PresentPaymentSheetResult>;
  retrievePaymentIntent: (clientSecret: string) => Promise<RetrievePaymentIntentResult>;
}

export const hasStripeConfig = !appConfig.useMockServices && Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function calculateTotals(request: PaymentIntentRequest) {
  const subtotal = request.finalBidPerUnit * request.totalWeightLbs;
  const shipping = 0;

  return {
    subtotal,
    shipping,
    total: subtotal + shipping
  };
}

export async function processMockPayment(request: PaymentIntentRequest) {
  const { subtotal, shipping, total } = calculateTotals(request);

  return {
    status: "paid" as const,
    subtotal,
    shipping,
    total,
    transactionId: `txn-${Date.now()}`,
    paymentMethodLabel: "Mock settlement"
  };
}

export async function createStripePaymentSheetSession(request: PaymentIntentRequest) {
  const supabase = requireSupabase();
  const { subtotal, shipping, total } = calculateTotals(request);
  const { data, error } = await supabase.functions.invoke<StripeCheckoutSession>("stripe-payment-sheet", {
    body: {
      listingId: request.listing.id,
      listingTitle: request.listing.title,
      farmerId: request.listing.farmerId,
      customerId: request.currentUser.id,
      customerEmail: request.currentUser.email,
      customerName: request.currentUser.name,
      quantity: request.totalWeightLbs,
      deliveryMethod: "settlement",
      subtotal,
      shipping,
      total,
      currency: appConfig.currency.toLowerCase()
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.paymentIntentClientSecret || !data.customerEphemeralKeySecret || !data.customerId) {
    throw new Error("Stripe checkout session is incomplete.");
  }

  return data;
}

export async function processStripePayment(stripe: StripeClientApi, request: PaymentIntentRequest): Promise<CompletedPayment> {
  const { subtotal, shipping, total } = calculateTotals(request);
  const session = await createStripePaymentSheetSession(request);
  const defaultAddress = request.currentUser.customerProfile?.savedAddress;
  const initResult = await stripe.initPaymentSheet({
    customerId: session.customerId,
    customerEphemeralKeySecret: session.customerEphemeralKeySecret,
    merchantDisplayName: session.merchantDisplayName ?? appConfig.appName,
    paymentIntentClientSecret: session.paymentIntentClientSecret,
    allowsDelayedPaymentMethods: false,
    defaultBillingDetails: {
      name: request.currentUser.name,
      email: request.currentUser.email,
      address: {
        line1: defaultAddress?.street,
        city: defaultAddress?.city,
        state: defaultAddress?.state,
        postalCode: defaultAddress?.postalCode,
        country: "US"
      }
    }
  });

  if (initResult.error) {
    throw new Error(initResult.error.message);
  }

  const presentResult = await stripe.presentPaymentSheet();

  if (presentResult.error) {
    throw new Error(presentResult.error.message);
  }

  const paymentIntentResult = await stripe.retrievePaymentIntent(session.paymentIntentClientSecret);

  if (paymentIntentResult.error || !paymentIntentResult.paymentIntent) {
    throw new Error(paymentIntentResult.error?.message ?? "Unable to verify the Stripe payment.");
  }

  return {
    status: "paid",
    subtotal,
    shipping,
    total,
    transactionId: paymentIntentResult.paymentIntent.id,
    paymentMethodLabel: "Stripe settlement"
  };
}
