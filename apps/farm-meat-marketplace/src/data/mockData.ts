import { Listing, NotificationItem, Order, User } from "../types";

function isoOffset(hoursOffset: number) {
  return new Date(Date.now() + hoursOffset * 60 * 60 * 1000).toISOString();
}

export const mockUsers: User[] = [
  {
    id: "slaughterhouse-1",
    name: "North Country Meats",
    email: "slaughterhouse@example.com",
    role: "slaughterhouse",
    locationLabel: "Burlington, VT",
    favorites: ["listing-1", "listing-3"],
    customerProfile: {
      facilityName: "North Country Meats",
      buyerCode: "NCM-441",
      inspectionRegions: ["VT", "NY", "NH"],
      procurementNotes: "Interested in finished cattle lots with fast pickup windows.",
      savedAddress: {
        label: "Plant",
        street: "87 Industrial Lane",
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
      ],
      strategies: [
        {
          listingId: "listing-1",
          mode: "auto",
          maxBid: 7.8,
          increment: 0.1,
          updatedAt: isoOffset(-2.5)
        },
        {
          listingId: "listing-3",
          mode: "manual",
          maxBid: 3.1,
          increment: 0.05,
          updatedAt: isoOffset(-0.75)
        }
      ]
    }
  },
  {
    id: "slaughterhouse-2",
    name: "Empire Harvest Processing",
    email: "processor@example.com",
    role: "slaughterhouse",
    locationLabel: "Rutland, VT",
    favorites: ["listing-1", "listing-2"],
    customerProfile: {
      facilityName: "Empire Harvest Processing",
      buyerCode: "EHP-212",
      inspectionRegions: ["VT", "NY", "MA"],
      procurementNotes: "Strong on hog lots and mixed freezer beef contracts.",
      savedAddress: {
        label: "Main Plant",
        street: "500 Packing House Road",
        city: "Rutland",
        state: "VT",
        postalCode: "05701"
      },
      paymentMethods: [],
      strategies: [
        {
          listingId: "listing-1",
          mode: "auto",
          maxBid: 7.6,
          increment: 0.1,
          updatedAt: isoOffset(-2.75)
        },
        {
          listingId: "listing-2",
          mode: "manual",
          maxBid: 5.6,
          increment: 0.1,
          updatedAt: isoOffset(-1.5)
        }
      ]
    }
  },
  {
    id: "farmer-1",
    name: "Maple Ridge Farm",
    email: "farmer@example.com",
    role: "farmer",
    locationLabel: "Shelburne, VT",
    favorites: [],
    farmProfile: {
      farmName: "Maple Ridge Farm",
      story: "A family livestock operation focused on transparent, pasture-based finishing and direct processor relationships.",
      practices: ["Pasture-raised", "No routine antibiotics", "Consistent lot records"],
      certifications: ["Animal Welfare Approved", "State inspected"],
      contactEmail: "hello@mapleridgefarm.example",
      contactPhone: "(802) 555-0144",
      pickupAddress: "88 County Road, Shelburne, VT 05482",
      verified: true
    },
    farmerOnboarding: {
      legalName: "Maple Ridge Farm LLC",
      identityVerified: true,
      payoutAccountLabel: "Operating account ending in 1221",
      payoutReady: true
    }
  }
];

export const mockListings: Listing[] = [
  {
    id: "listing-1",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Spring Angus Beef Lot",
    description: "Finished Angus-cross cattle offered as a live auction lot with clean weight sheets and a tight pickup window.",
    category: "beef",
    cut: "ribeye",
    unit: "lb hanging weight",
    locationName: "Shelburne, VT",
    distanceMiles: 18,
    imageLabel: "Beef Lot",
    imageGallery: ["Pasture lot", "Weight sheet", "Handling lane"],
    breed: "Angus cross",
    tags: ["finished cattle", "consistent weights", "pasture raised"],
    reviews: [],
    totalWeightLbs: 4800,
    headCount: 8,
    reservePrice: 7.2,
    openingBid: 6.8,
    currentBid: 7.7,
    minimumIncrement: 0.1,
    auctionStartAt: isoOffset(-4),
    auctionEndAt: isoOffset(20),
    auctionStatus: "live",
    reserveMet: true,
    currentLeaderId: "slaughterhouse-1",
    currentLeaderName: "North Country Meats",
    winningBidId: "bid-3",
    qualityGrade: "Choice target finish",
    packagingDetails: "Live lot sale, farm records and weights provided.",
    handlingDetails: "Processor pickup required within 48 hours of award.",
    estimatedYieldPercent: 61,
    paymentTerms: "25% deposit within 24 hours, remainder on verified scale ticket.",
    allowAutoBids: true,
    bids: [
      {
        id: "bid-1",
        listingId: "listing-1",
        slaughterhouseId: "slaughterhouse-2",
        slaughterhouseName: "Empire Harvest Processing",
        amount: 7.3,
        createdAt: isoOffset(-3),
        mode: "manual"
      },
      {
        id: "bid-2",
        listingId: "listing-1",
        slaughterhouseId: "slaughterhouse-2",
        slaughterhouseName: "Empire Harvest Processing",
        amount: 7.6,
        createdAt: isoOffset(-2.75),
        mode: "auto",
        maxBid: 7.6
      },
      {
        id: "bid-3",
        listingId: "listing-1",
        slaughterhouseId: "slaughterhouse-1",
        slaughterhouseName: "North Country Meats",
        amount: 7.7,
        createdAt: isoOffset(-2.5),
        mode: "auto",
        maxBid: 7.8
      }
    ]
  },
  {
    id: "listing-2",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Heritage Hog Group",
    description: "Uniform Berkshire hog group with farm-side weights and a same-day loading window included.",
    category: "pork",
    cut: "pork chops",
    unit: "lb live weight",
    locationName: "Charlotte, VT",
    distanceMiles: 27,
    imageLabel: "Hogs",
    imageGallery: ["Pen overview", "Weight summary"],
    breed: "Berkshire",
    tags: ["heritage hogs", "processor ready"],
    reviews: [],
    totalWeightLbs: 2550,
    headCount: 15,
    reservePrice: 5.2,
    openingBid: 4.8,
    currentBid: 5.4,
    minimumIncrement: 0.1,
    auctionStartAt: isoOffset(-2),
    auctionEndAt: isoOffset(8),
    auctionStatus: "live",
    reserveMet: true,
    currentLeaderId: "slaughterhouse-2",
    currentLeaderName: "Empire Harvest Processing",
    winningBidId: "bid-4",
    qualityGrade: "Market-ready heritage hogs",
    packagingDetails: "Live lot sale with loading support.",
    handlingDetails: "Pickup required with producer notice 12 hours ahead.",
    estimatedYieldPercent: 72,
    paymentTerms: "Settlement within 48 hours by ACH.",
    allowAutoBids: true,
    bids: [
      {
        id: "bid-4",
        listingId: "listing-2",
        slaughterhouseId: "slaughterhouse-2",
        slaughterhouseName: "Empire Harvest Processing",
        amount: 5.4,
        createdAt: isoOffset(-1.5),
        mode: "manual"
      }
    ]
  },
  {
    id: "listing-3",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Broiler Pickup Run",
    description: "Pasture broiler group for processor pickup with same-week slaughter slot preferred.",
    category: "chicken",
    cut: "whole chicken",
    unit: "lb live weight",
    locationName: "Hinesburg, VT",
    distanceMiles: 34,
    imageLabel: "Broilers",
    imageGallery: ["Bird group", "Loading trailer"],
    breed: "Freedom Ranger",
    tags: ["broilers", "short-term run"],
    reviews: [],
    totalWeightLbs: 980,
    headCount: 140,
    reservePrice: 2.9,
    openingBid: 2.6,
    currentBid: 3.0,
    minimumIncrement: 0.05,
    auctionStartAt: isoOffset(-1),
    auctionEndAt: isoOffset(5),
    auctionStatus: "live",
    reserveMet: true,
    currentLeaderId: "slaughterhouse-1",
    currentLeaderName: "North Country Meats",
    winningBidId: "bid-5",
    qualityGrade: "Pasture broilers",
    packagingDetails: "Live bird pickup lot.",
    handlingDetails: "Morning pickup preferred.",
    estimatedYieldPercent: 70,
    paymentTerms: "Full settlement within 24 hours.",
    allowAutoBids: true,
    bids: [
      {
        id: "bid-5",
        listingId: "listing-3",
        slaughterhouseId: "slaughterhouse-1",
        slaughterhouseName: "North Country Meats",
        amount: 3.0,
        createdAt: isoOffset(-0.75),
        mode: "manual"
      }
    ]
  },
  {
    id: "listing-4",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    title: "Late-Week Lamb Lot",
    description: "Small lamb group opening tomorrow morning for buyers that want a lighter-weight reserve test.",
    category: "lamb",
    cut: "lamb chops",
    unit: "lb live weight",
    locationName: "Starksboro, VT",
    distanceMiles: 41,
    imageLabel: "Lamb",
    imageGallery: ["Barn lane", "Sorting pen"],
    breed: "Dorset cross",
    tags: ["scheduled", "small lot"],
    reviews: [],
    totalWeightLbs: 1120,
    headCount: 14,
    reservePrice: 4.5,
    openingBid: 4.1,
    currentBid: 4.1,
    minimumIncrement: 0.05,
    auctionStartAt: isoOffset(10),
    auctionEndAt: isoOffset(34),
    auctionStatus: "scheduled",
    reserveMet: false,
    qualityGrade: "Trim, consistent lambs",
    packagingDetails: "Live lot sale with individual weights available.",
    handlingDetails: "Pickup within 24 hours of award.",
    estimatedYieldPercent: 51,
    paymentTerms: "Settlement due next business day.",
    allowAutoBids: true,
    bids: []
  }
];

export const mockOrders: Order[] = [
  {
    id: "award-1",
    listingId: "listing-0",
    listingTitle: "Winter Finished Steer Lot",
    farmerId: "farmer-1",
    farmerName: "Maple Ridge Farm",
    customerId: "slaughterhouse-1",
    customerName: "North Country Meats",
    finalBid: 7.4,
    reservePrice: 7.1,
    reserveMet: true,
    bidCount: 6,
    totalWeightLbs: 3600,
    paymentMethodLabel: "ACH on file",
    paymentIntentId: "pi_mock_award_1",
    createdAt: isoOffset(-120),
    status: "contract_sent"
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    userId: "slaughterhouse-1",
    title: "You are leading",
    body: "North Country Meats is leading Spring Angus Beef Lot at $7.70/lb.",
    createdAt: isoOffset(-2.5),
    read: false
  },
  {
    id: "notification-2",
    userId: "farmer-1",
    title: "Reserve met",
    body: "Spring Angus Beef Lot crossed reserve and is now at $7.70/lb.",
    createdAt: isoOffset(-2.5),
    read: false
  },
  {
    id: "notification-3",
    userId: "slaughterhouse-2",
    title: "High bid recorded",
    body: "Empire Harvest Processing is currently leading Heritage Hog Group at $5.40/lb.",
    createdAt: isoOffset(-1.5),
    read: false
  }
];
