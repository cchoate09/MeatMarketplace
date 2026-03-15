export type UserRole = "customer" | "farmer";

export type DeliveryMethod = "pickup" | "shipping";

export type MeatCategory = "beef" | "pork" | "chicken" | "lamb" | "turkey" | "goat";

export type MeatCut =
  | "ribeye"
  | "ground beef"
  | "brisket"
  | "pork chops"
  | "bacon"
  | "whole chicken"
  | "chicken breast"
  | "lamb chops"
  | "turkey breast"
  | "goat stew meat";

export type OrderStatus = "new" | "confirmed" | "ready" | "picked_up" | "shipped" | "delivered";

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PickupSlot {
  id: string;
  label: string;
  startAt: string;
  endAt: string;
}

export interface FarmProfile {
  farmName: string;
  story: string;
  practices: string[];
  certifications: string[];
  contactEmail: string;
  contactPhone: string;
  pickupAddress: string;
  verified: boolean;
}

export interface FarmerOnboarding {
  legalName: string;
  identityVerified: boolean;
  payoutAccountLabel: string;
  payoutReady: boolean;
}

export interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  processorReference?: string;
}

export interface CustomerProfile {
  savedAddress: Address;
  paymentMethods: PaymentMethod[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName: string;
  title: string;
  description: string;
  category: MeatCategory;
  cut: MeatCut;
  price: number;
  unit: string;
  quantityAvailable: number;
  lowStockThreshold: number;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  shippingFee: number;
  locationName: string;
  distanceMiles: number;
  availableOn: string;
  processingDays: number;
  pickupInstructions: string;
  pickupSlots: PickupSlot[];
  shippingRegions: string[];
  minimumOrder?: number;
  imageLabel: string;
  imageGallery: string[];
  breed: string;
  packagingDetails: string;
  storageDetails: string;
  cookingTip: string;
  tags: string[];
  reviews: Review[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locationLabel: string;
  favorites: string[];
  customerProfile?: CustomerProfile;
  farmProfile?: FarmProfile;
  farmerOnboarding?: FarmerOnboarding;
}

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  farmerId: string;
  farmerName: string;
  customerId: string;
  customerName: string;
  quantity: number;
  deliveryMethod: DeliveryMethod;
  pickupSlotLabel?: string;
  paymentMethodLabel: string;
  paymentIntentId?: string;
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
  createdAt: string;
  status: OrderStatus;
}

export interface ListingFilters {
  category: MeatCategory | "all";
  cut: MeatCut | "all";
  deliveryMethod: DeliveryMethod | "all";
  maxRadiusMiles: number;
}
