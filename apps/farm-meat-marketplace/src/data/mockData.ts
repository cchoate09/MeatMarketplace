import { Listing, NotificationItem, Order, User } from "../types";

export const mockUsers: User[] = [
  {
    id: "customer-1",
    name: "Jordan Carter",
    email: "customer@example.com",
    role: "customer",
    locationLabel: "Burlington, VT",
    favorites: ["listing-1"],
    customerProfile: {
      savedAddress: {
        label: "Home",
        street: "123 Maple Street",
        city: "Burlington",
        state: "VT",
        postalCode: "05401"
      },
      paymentMethods: [
        {
          id: "pm-1",
          brand: "Visa",
          last4: "4242",
          expiry: "08/28",
          isDefault: true,
          processorReference: "pm_mock_4242"
        }
      ]
    }
  },
  {
    id: "farmer-1",
    name: "Maple Ridge Farm",
    email: "farmer@example.com",
    role: "farmer",
    locationLabel: "Montpelier, VT",
    favorites: [],
    farmProfile: {
      farmName: "Maple Ridge Farm",
      story: "A family farm focused on pasture-raised livestock, transparent practices, and direct relationships with our buyers.",
      practices: ["Pasture-raised", "No routine antibiotics", "Dry-aged beef"],
      certifications: ["Animal Welfare Approved", "State inspected"],
      contactEmail: "hello@mapleridgefarm.example",
      contactPhone: "(802) 555-0144",
      pickupAddress: "88 County Road, Montpelier, VT 05602",
      verified: true
    },
    farmerOnboarding: {
      legalName: "Maple Ridge Farm LLC",
      identityVerified: true,
      payoutAccountLabel: "Bank account ending in 1221",
      payoutReady: true
    }
  }
];

export const mockListings: Listing[] = [
  {
    id: "listing-1",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Grass-Fed Ribeye Steaks",
    description: "Dry-aged ribeyes from pasture-raised cattle, vacuum sealed and frozen.",
    category: "beef",
    cut: "ribeye",
    price: 24,
    unit: "lb",
    quantityAvailable: 18,
    lowStockThreshold: 5,
    pickupAvailable: true,
    shippingAvailable: true,
    shippingFee: 18,
    locationName: "Montpelier, VT",
    distanceMiles: 22,
    availableOn: "2026-03-18",
    processingDays: 2,
    pickupInstructions: "Pickup Fridays from 2-6 PM at the farm store.",
    pickupSlots: [
      {
        id: "slot-1",
        label: "Friday 2:00 PM - 4:00 PM",
        startAt: "2026-03-20T14:00:00-04:00",
        endAt: "2026-03-20T16:00:00-04:00"
      },
      {
        id: "slot-2",
        label: "Friday 4:00 PM - 6:00 PM",
        startAt: "2026-03-20T16:00:00-04:00",
        endAt: "2026-03-20T18:00:00-04:00"
      }
    ],
    shippingRegions: ["VT", "NH", "NY"],
    minimumOrder: 2,
    imageLabel: "Ribeye",
    imageGallery: ["Front cut photo", "Packaged steaks", "Grill finish"],
    breed: "Angus cross",
    packagingDetails: "Vacuum sealed in 2-steak packs.",
    storageDetails: "Keep frozen. Best used within 10 months.",
    cookingTip: "Reverse sear for best crust and even doneness.",
    tags: ["grass-fed", "dry-aged", "vacuum sealed"],
    reviews: [
      {
        id: "review-1",
        customerName: "Alex",
        rating: 5,
        comment: "Excellent marbling and very fresh.",
        createdAt: "2026-03-01"
      }
    ]
  },
  {
    id: "listing-2",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Pasture-Raised Pork Chops",
    description: "Bone-in chops from heritage hogs with pickup or regional shipping.",
    category: "pork",
    cut: "pork chops",
    price: 14,
    unit: "lb",
    quantityAvailable: 30,
    lowStockThreshold: 6,
    pickupAvailable: true,
    shippingAvailable: false,
    shippingFee: 0,
    locationName: "Montpelier, VT",
    distanceMiles: 22,
    availableOn: "2026-03-16",
    processingDays: 1,
    pickupInstructions: "Message the farm to confirm a pickup window.",
    pickupSlots: [
      {
        id: "slot-3",
        label: "Saturday 9:00 AM - 11:00 AM",
        startAt: "2026-03-21T09:00:00-04:00",
        endAt: "2026-03-21T11:00:00-04:00"
      }
    ],
    shippingRegions: [],
    imageLabel: "Pork",
    imageGallery: ["Pork chop tray", "Freezer-ready pack"],
    breed: "Berkshire",
    packagingDetails: "2 chops per pack, frozen.",
    storageDetails: "Keep frozen. Thaw in refrigerator overnight.",
    cookingTip: "Brine briefly before pan searing.",
    tags: ["heritage breed", "bone-in"],
    reviews: []
  },
  {
    id: "listing-3",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Whole Chickens",
    description: "Air-chilled birds, processed weekly and sold whole.",
    category: "chicken",
    cut: "whole chicken",
    price: 6,
    unit: "lb",
    quantityAvailable: 12,
    lowStockThreshold: 4,
    pickupAvailable: true,
    shippingAvailable: true,
    shippingFee: 12,
    locationName: "Montpelier, VT",
    distanceMiles: 22,
    availableOn: "2026-03-15",
    processingDays: 3,
    pickupInstructions: "Pickup Saturdays near the processing shed.",
    pickupSlots: [
      {
        id: "slot-4",
        label: "Saturday 10:00 AM - Noon",
        startAt: "2026-03-21T10:00:00-04:00",
        endAt: "2026-03-21T12:00:00-04:00"
      }
    ],
    shippingRegions: ["VT", "MA", "CT"],
    imageLabel: "Chicken",
    imageGallery: ["Whole chicken", "Farm pickup cooler"],
    breed: "Freedom Ranger",
    packagingDetails: "Whole birds, bagged and labeled by weight.",
    storageDetails: "Keep refrigerated for 2 days or frozen for 9 months.",
    cookingTip: "Dry the skin overnight for a crisp roast.",
    tags: ["air-chilled", "pasture-raised"],
    reviews: [
      {
        id: "review-2",
        customerName: "Taylor",
        rating: 4,
        comment: "Pickup was easy and quality was great.",
        createdAt: "2026-02-20"
      }
    ]
  }
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    listingId: "listing-1",
    listingTitle: "Grass-Fed Ribeye Steaks",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    customerId: "customer-1",
    customerName: "Jordan Carter",
    quantity: 2,
    deliveryMethod: "pickup",
    pickupSlotLabel: "Friday 2:00 PM - 4:00 PM",
    paymentMethodLabel: "Visa ending in 4242",
    paymentIntentId: "pi_mock_confirmed",
    subtotal: 48,
    shippingFee: 0,
    totalPrice: 48,
    createdAt: "2026-03-10T09:00:00Z",
    status: "confirmed"
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    userId: "customer-1",
    title: "Order confirmed",
    body: "Your ribeye order has been confirmed by Maple Ridge Farm.",
    createdAt: "2026-03-10T09:30:00Z",
    read: false
  },
  {
    id: "notification-2",
    userId: "farmer-1",
    title: "New order received",
    body: "Jordan Carter placed an order for Grass-Fed Ribeye Steaks.",
    createdAt: "2026-03-10T09:05:00Z",
    read: false
  }
];
