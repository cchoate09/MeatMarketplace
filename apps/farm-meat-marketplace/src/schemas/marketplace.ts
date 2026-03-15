import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  description: z.string().trim().min(12, "Description must be at least 12 characters."),
  category: z.enum(["beef", "pork", "chicken", "lamb", "turkey", "goat"]),
  cut: z.enum([
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
  ]),
  price: z.number().positive("Price must be greater than zero."),
  quantityAvailable: z.number().int().positive("Quantity must be greater than zero."),
  lowStockThreshold: z.number().int().min(1, "Low-stock threshold must be at least 1."),
  shippingFee: z.number().min(0, "Shipping fee cannot be negative."),
  availableOn: z.string().trim().min(8, "Availability date is required."),
  processingDays: z.number().int().min(0, "Processing days cannot be negative."),
  pickupInstructions: z.string().trim().min(8, "Pickup instructions are required."),
  breed: z.string().trim().min(2, "Breed is required."),
  packagingDetails: z.string().trim().min(6, "Packaging details are required."),
  storageDetails: z.string().trim().min(6, "Storage details are required."),
  cookingTip: z.string().trim().min(6, "Cooking tip is required.")
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
