import { z } from "zod";

const meatCategoryEnum = z.enum(["beef", "pork", "chicken", "lamb", "turkey", "goat"]);
const meatCutEnum = z.enum([
  "ribeye",
  "ground beef",
  "brisket",
  "pork chops",
  "bacon",
  "whole chicken",
  "chicken breast",
  "lamb chops",
  "turkey breast",
  "goat stew meat"
]);

// Auction listing creation — fields match the FarmerNewListingScreen form.
export const createListingSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters."),
    description: z.string().trim().min(12, "Description must be at least 12 characters."),
    category: meatCategoryEnum,
    cut: meatCutEnum,
    totalWeightLbs: z.number().positive("Total weight must be greater than zero."),
    headCount: z.number().int().positive("Head count must be at least 1."),
    openingBid: z.number().positive("Opening bid must be greater than zero."),
    reservePrice: z.number().positive("Reserve price must be greater than zero."),
    minimumIncrement: z.number().positive("Minimum increment must be greater than zero."),
    auctionDurationHours: z.number().int().positive("Auction duration must be at least 1 hour."),
    breed: z.string().trim().min(2, "Breed is required."),
    qualityGrade: z.string().trim().min(2, "Quality grade is required."),
    packagingDetails: z.string().trim().min(6, "Packaging details are required."),
    handlingDetails: z.string().trim().min(6, "Handling details are required."),
    estimatedYieldPercent: z.number().min(0).max(100, "Yield must be between 0 and 100."),
    paymentTerms: z.string().trim().min(6, "Payment terms are required."),
    allowAutoBids: z.boolean()
  })
  .refine((data) => data.reservePrice >= data.openingBid, {
    message: "Reserve price must be at least the opening bid.",
    path: ["reservePrice"]
  });

// Manual or auto bid placement.
export const placeBidSchema = z
  .object({
    amount: z.number().positive("Bid amount must be greater than zero."),
    mode: z.enum(["manual", "auto"]),
    maxBid: z.number().positive().optional()
  })
  .refine((data) => data.mode !== "auto" || data.maxBid !== undefined, {
    message: "Auto-bid requires a maximum bid ceiling.",
    path: ["maxBid"]
  });

// Filter panel — validates the filters object before applying.
export const listingFiltersSchema = z.object({
  category: z.union([meatCategoryEnum, z.literal("all")]),
  cut: z.union([meatCutEnum, z.literal("all")]),
  auctionStatus: z.enum(["all", "scheduled", "live", "awarded", "closed", "ending_soon"]),
  maxRadiusMiles: z.number().int().min(1).max(5000)
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(2, "Please add a short comment.")
});

export const purchaseSchema = z.object({
  quantity: z.number().int().positive("Quantity must be greater than zero."),
  paymentMethodId: z.string().trim().min(1, "A payment method is required."),
  pickupSlotId: z.string().trim().optional()
});

export const customerOnboardingSchema = z.object({
  street: z.string().trim().min(4, "Street is required."),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  postalCode: z.string().trim().min(5, "Postal code is required."),
  paymentBrand: z.string().trim().min(2, "Payment brand is required."),
  paymentLast4: z.string().trim().length(4, "Enter the last four digits."),
  paymentExpiry: z.string().trim().min(4, "Expiry is required.")
});

export const farmerOnboardingSchema = z.object({
  legalName: z.string().trim().min(3, "Legal name is required."),
  farmName: z.string().trim().min(3, "Farm name is required."),
  story: z.string().trim().min(20, "Farm story is required."),
  contactEmail: z.string().trim().email("Enter a valid contact email."),
  contactPhone: z.string().trim().min(7, "Contact phone is required."),
  pickupAddress: z.string().trim().min(8, "Pickup address is required."),
  payoutAccountLabel: z.string().trim().min(6, "Payout account label is required.")
});
