export type UserRole = "slaughterhouse" | "farmer";

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

export type AuctionStatus = "scheduled" | "live" | "awarded" | "closed";

export type BidStrategyMode = "manual" | "auto";

export type AwardStatus = "pending_settlement" | "contract_sent" | "ready_for_pickup" | "completed" | "closed";

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
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

export interface AuctionStrategy {
  listingId: string;
  mode: BidStrategyMode;
  maxBid: number;
  increment: number;
  updatedAt: string;
}

// Kept as customerProfile internally so existing persistence hooks remain easy to adapt later.
export interface CustomerProfile {
  facilityName: string;
  buyerCode: string;
  inspectionRegions: string[];
  procurementNotes: string;
  savedAddress: Address;
  paymentMethods: PaymentMethod[];
  strategies: AuctionStrategy[];
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

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface Bid {
  id: string;
  listingId: string;
  slaughterhouseId: string;
  slaughterhouseName: string;
  amount: number;
  createdAt: string;
  mode: BidStrategyMode;
  maxBid?: number;
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName: string;
  title: string;
  description: string;
  category: MeatCategory;
  cut: MeatCut;
  unit: string;
  locationName: string;
  distanceMiles: number;
  imageLabel: string;
  imageGallery: string[];
  breed: string;
  tags: string[];
  reviews: Review[];
  totalWeightLbs: number;
  headCount: number;
  reservePrice: number;
  openingBid: number;
  currentBid: number;
  minimumIncrement: number;
  auctionStartAt: string;
  auctionEndAt: string;
  auctionStatus: AuctionStatus;
  reserveMet: boolean;
  currentLeaderId?: string;
  currentLeaderName?: string;
  winningBidId?: string;
  qualityGrade: string;
  packagingDetails: string;
  handlingDetails: string;
  estimatedYieldPercent: number;
  paymentTerms: string;
  allowAutoBids: boolean;
  bids: Bid[];
  // Legacy-compatible optional fields preserved so backend/payment hooks can be adapted later.
  price?: number;
  quantityAvailable?: number;
  lowStockThreshold?: number;
  pickupAvailable?: boolean;
  shippingAvailable?: boolean;
  shippingFee?: number;
  availableOn?: string;
  processingDays?: number;
  pickupInstructions?: string;
  shippingRegions?: string[];
  minimumOrder?: number;
  storageDetails?: string;
  cookingTip?: string;
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

// Kept as Order internally to preserve the payment/settlement hook surface for later.
export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  farmerId: string;
  farmerName: string;
  customerId: string;
  customerName: string;
  finalBid: number;
  reservePrice: number;
  reserveMet: boolean;
  bidCount: number;
  totalWeightLbs: number;
  paymentMethodLabel?: string;
  paymentIntentId?: string;
  // Contract and settlement tracking. contractUrl is set when a PDF or link is
  // shared during the contract_sent stage. contractSentAt records when that
  // happened for audit purposes.
  contractUrl?: string;
  contractSentAt?: string;
  createdAt: string;
  status: AwardStatus;
}

export interface ListingFilters {
  category: MeatCategory | "all";
  cut: MeatCut | "all";
  auctionStatus: AuctionStatus | "all" | "ending_soon";
  maxRadiusMiles: number;
}
