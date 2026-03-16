import { mockListings, mockNotifications, mockOrders, mockUsers } from "../data/mockData";
import { clearMockSessionUserId, loadMockSessionUserId, persistMockSessionUserId } from "../storage/sessionStorage";
import { Listing, ListingFilters, NotificationItem, Order, Review, User, UserRole } from "../types";

type MockCredentials = Record<string, { password: string; userId: string }>;

const state: {
  users: User[];
  listings: Listing[];
  awards: Order[];
  notifications: NotificationItem[];
  credentials: MockCredentials;
  currentUserId: string | null;
} = {
  users: clone(mockUsers),
  listings: clone(mockListings),
  awards: clone(mockOrders),
  notifications: clone(mockNotifications),
  credentials: {
    "slaughterhouse@example.com": { password: "password123", userId: "slaughterhouse-1" },
    "processor@example.com": { password: "password123", userId: "slaughterhouse-2" },
    "farmer@example.com": { password: "password123", userId: "farmer-1" }
  },
  currentUserId: null
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function getCurrentUserOrThrow() {
  const user = getMockCurrentUser();

  if (!user) {
    throw new Error("No mock user is signed in.");
  }

  return user;
}

function getUserById(userId: string) {
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}

function ensureAuctionState(listing: Listing): Listing {
  const now = Date.now();
  const start = new Date(listing.auctionStartAt).getTime();
  const end = new Date(listing.auctionEndAt).getTime();

  if (end <= now) {
    return listing.reserveMet && listing.currentLeaderId ? { ...listing, auctionStatus: "awarded" } : { ...listing, auctionStatus: "closed" };
  }

  if (start > now) {
    return { ...listing, auctionStatus: "scheduled" };
  }

  return { ...listing, auctionStatus: "live" };
}

function syncAuctionClosures() {
  state.listings = state.listings.map((entry) => ensureAuctionState(entry));

  state.listings.forEach((listing) => {
    const alreadyAwarded = state.awards.some((award) => award.listingId === listing.id);

    if (listing.auctionStatus === "awarded" && listing.currentLeaderId && !alreadyAwarded) {
      state.awards = [
        {
          id: `award-${listing.id}`,
          listingId: listing.id,
          listingTitle: listing.title,
          farmerId: listing.farmerId,
          farmerName: listing.farmerName,
          customerId: listing.currentLeaderId,
          customerName: listing.currentLeaderName ?? "Winning slaughterhouse",
          finalBid: listing.currentBid,
          reservePrice: listing.reservePrice,
          reserveMet: listing.reserveMet,
          bidCount: listing.bids.length,
          totalWeightLbs: listing.totalWeightLbs,
          paymentMethodLabel: "Settlement pending",
          paymentIntentId: undefined,
          createdAt: nowIso(),
          status: "pending_settlement"
        },
        ...state.awards
      ];

      state.notifications = [
        {
          id: `notification-${Date.now()}-award-farmer`,
          userId: listing.farmerId,
          title: "Auction awarded",
          body: `${listing.title} closed at $${listing.currentBid.toFixed(2)}/lb to ${listing.currentLeaderName}.`,
          createdAt: nowIso(),
          read: false
        },
        {
          id: `notification-${Date.now()}-award-buyer`,
          userId: listing.currentLeaderId,
          title: "Winning bid",
          body: `You won ${listing.title} at $${listing.currentBid.toFixed(2)}/lb.`,
          createdAt: nowIso(),
          read: false
        },
        ...state.notifications
      ];
    }
  });
}

function getStrategyMaxBid(user: User, listingId: string) {
  return user.customerProfile?.strategies.find((entry) => entry.listingId === listingId)?.maxBid ?? 0;
}

function getStrategyTimestamp(user: User, listingId: string) {
  return user.customerProfile?.strategies.find((entry) => entry.listingId === listingId)?.updatedAt ?? "9999-12-31T23:59:59Z";
}

/**
 * recalculateAuction implements proxy (auto) bidding for a listing.
 *
 * Algorithm — MUST be replicated exactly in the Supabase RPC (place_bid_atomic)
 * before going live:
 *
 *   1. Collect every slaughterhouse that has a saved strategy with maxBid >=
 *      the listing's openingBid. Only strategies on this listingId are considered.
 *
 *   2. Sort participants descending by maxBid. Ties are broken by strategy
 *      updatedAt ASCENDING — the buyer who committed to their ceiling first
 *      wins, never the later bidder. This rule must be documented in the
 *      buyer-facing Terms of Service before launch.
 *
 *   3. The winner is participants[0]. The runner-up is participants[1].
 *
 *   4. The visible (displayed) current bid is:
 *        min(winner.maxBid, max(openingBid, runnerUp.maxBid + minimumIncrement))
 *      When no runner-up exists, the visible bid is openingBid so the winner
 *      does not pay more than necessary.
 *
 *   5. reserveMet is set to true if winner.maxBid >= reservePrice.
 *
 * Important: the visible bid intentionally conceals the winner's true ceiling.
 * Manual bids placed above the visible bid will trigger a recalculation where
 * the manual bidder becomes the runner-up and may be outbid automatically if
 * the winner's ceiling is higher.
 */
function recalculateAuction(listingId: string) {
  const listing = state.listings.find((entry) => entry.id === listingId);

  if (!listing) {
    throw new Error("Auction listing not found.");
  }

  const participants = state.users
    .filter((user) => user.role === "slaughterhouse")
    .map((user) => ({
      user,
      maxBid: getStrategyMaxBid(user, listingId),
      timestamp: getStrategyTimestamp(user, listingId)
    }))
    .filter((entry) => entry.maxBid >= listing.openingBid);

  if (participants.length === 0) {
    return { ...listing, currentBid: listing.openingBid, reserveMet: false, currentLeaderId: undefined, currentLeaderName: undefined };
  }

  // Primary sort: highest maxBid wins. Tie-break: earliest strategy timestamp wins.
  participants.sort((left, right) => {
    if (right.maxBid !== left.maxBid) {
      return right.maxBid - left.maxBid;
    }

    return left.timestamp.localeCompare(right.timestamp);
  });

  const winner = participants[0];
  const runnerUp = participants[1];
  // Visible bid is only as high as needed to beat the runner-up by one increment.
  const visibleBid = runnerUp
    ? Math.min(winner.maxBid, Math.max(listing.openingBid, runnerUp.maxBid + listing.minimumIncrement))
    : listing.openingBid;

  return {
    ...listing,
    currentBid: Number(visibleBid.toFixed(2)),
    reserveMet: winner.maxBid >= listing.reservePrice,
    currentLeaderId: winner.user.id,
    currentLeaderName: winner.user.customerProfile?.facilityName ?? winner.user.name
  };
}

export async function hydrateMockSession() {
  state.currentUserId = await loadMockSessionUserId();
  syncAuctionClosures();
}

export function getMockCurrentUser() {
  return state.users.find((entry) => entry.id === state.currentUserId) ?? null;
}

export async function mockSignIn(email: string, password: string) {
  const credentials = state.credentials[email.toLowerCase()];

  if (!credentials || credentials.password !== password) {
    throw new Error("Invalid email or password.");
  }

  state.currentUserId = credentials.userId;
  await persistMockSessionUserId(credentials.userId);
  return getMockCurrentUser();
}

export async function mockSignUp(name: string, email: string, password: string, role: UserRole) {
  const normalizedEmail = email.toLowerCase();

  if (state.credentials[normalizedEmail]) {
    throw new Error("An account with this email already exists.");
  }

  const id = `${role}-${Date.now()}`;
  const user: User = {
    id,
    name,
    email: normalizedEmail,
    role,
    locationLabel: role === "farmer" ? "Farm location pending" : "Plant location pending",
    favorites: [],
    customerProfile:
      role === "slaughterhouse"
        ? {
            facilityName: name,
            buyerCode: `BUY-${Date.now().toString().slice(-4)}`,
            inspectionRegions: [],
            procurementNotes: "",
            savedAddress: {
              label: "Primary",
              street: "",
              city: "",
              state: "",
              postalCode: ""
            },
            paymentMethods: [],
            strategies: []
          }
        : undefined,
    farmProfile:
      role === "farmer"
        ? {
            farmName: name,
            story: "",
            practices: [],
            certifications: [],
            contactEmail: normalizedEmail,
            contactPhone: "",
            pickupAddress: "",
            verified: false
          }
        : undefined,
    farmerOnboarding:
      role === "farmer"
        ? {
            legalName: "",
            identityVerified: false,
            payoutAccountLabel: "",
            payoutReady: false
          }
        : undefined
  };

  state.users = [user, ...state.users];
  state.credentials[normalizedEmail] = { password, userId: id };
  state.currentUserId = id;
  await persistMockSessionUserId(id);
  return user;
}

export async function mockSignInAs(role: UserRole) {
  const user = state.users.find((entry) => entry.role === role) ?? null;

  if (!user) {
    throw new Error(`No mock user configured for role: ${role}`);
  }

  state.currentUserId = user.id;
  await persistMockSessionUserId(user.id);
  return user;
}

export async function mockSignOut() {
  state.currentUserId = null;
  await clearMockSessionUserId();
}

export function listMockUsers() {
  return clone(state.users);
}

export function listMockListings(filters?: ListingFilters) {
  syncAuctionClosures();
  const listings = filters
    ? state.listings.filter((listing) => {
        if (filters.category !== "all" && listing.category !== filters.category) {
          return false;
        }

        if (filters.cut !== "all" && listing.cut !== filters.cut) {
          return false;
        }

        if (filters.auctionStatus === "ending_soon") {
          return listing.auctionStatus === "live" && new Date(listing.auctionEndAt).getTime() - Date.now() <= 1000 * 60 * 60 * 6;
        }

        if (filters.auctionStatus !== "all" && listing.auctionStatus !== filters.auctionStatus) {
          return false;
        }

        return listing.distanceMiles <= filters.maxRadiusMiles;
      })
    : state.listings;

  return clone(listings);
}

export function listMockOrders() {
  syncAuctionClosures();
  return clone(state.awards);
}

export function listMockNotifications(userId?: string) {
  const notifications = userId ? state.notifications.filter((entry) => entry.userId === userId) : state.notifications;
  return clone(notifications);
}

export function createMockListing(listing: Omit<Listing, "id" | "reviews" | "bids" | "currentBid" | "auctionStatus" | "reserveMet">) {
  const created: Listing = {
    ...listing,
    id: `listing-${Date.now()}`,
    reviews: [],
    bids: [],
    currentBid: listing.openingBid,
    auctionStatus: "scheduled",
    reserveMet: false
  };

  state.listings = [created, ...state.listings];
  return clone(created);
}

export function updateMockUser(userId: string, updater: (user: User) => User) {
  const currentUser = state.users.find((entry) => entry.id === userId);

  if (!currentUser) {
    throw new Error("User not found.");
  }

  const nextUser = updater(currentUser);
  state.users = state.users.map((entry) => (entry.id === userId ? nextUser : entry));
  return clone(nextUser);
}

export function addMockReview(listingId: string, review: Omit<Review, "id" | "createdAt">) {
  const createdReview: Review = {
    ...review,
    id: `review-${Date.now()}`,
    createdAt: nowIso()
  };

  state.listings = state.listings.map((entry) =>
    entry.id === listingId ? { ...entry, reviews: [createdReview, ...entry.reviews] } : entry
  );

  return clone(createdReview);
}

export function configureMockAutoBid(userId: string, listingId: string, maxBid: number, increment: number) {
  const user = getUserById(userId);

  if (user.role !== "slaughterhouse") {
    throw new Error("Only slaughterhouses can set bidding strategies.");
  }

  state.users = state.users.map((entry) =>
    entry.id === userId
      ? {
          ...entry,
          customerProfile: {
            ...entry.customerProfile!,
            strategies: [
              ...(entry.customerProfile?.strategies.filter((strategy) => strategy.listingId !== listingId) ?? []),
              {
                listingId,
                mode: "auto",
                maxBid,
                increment,
                updatedAt: nowIso()
              }
            ]
          }
        }
      : entry
  );

  const updatedListing = recalculateAuction(listingId);
  state.listings = state.listings.map((entry) => (entry.id === listingId ? updatedListing : entry));

  return clone(updatedListing);
}

export function placeMockBid(userId: string, listingId: string, amount: number, strategy: "manual" | "auto" = "manual", maxBid?: number) {
  syncAuctionClosures();
  const currentUser = getUserById(userId);

  if (currentUser.role !== "slaughterhouse") {
    throw new Error("Only slaughterhouses can place bids.");
  }

  const listing = state.listings.find((entry) => entry.id === listingId);

  if (!listing) {
    throw new Error("Auction listing not found.");
  }

  if (ensureAuctionState(listing).auctionStatus !== "live") {
    throw new Error("This auction is not currently accepting bids.");
  }

  const minimumRequired = listing.currentLeaderId ? listing.currentBid + listing.minimumIncrement : listing.openingBid;
  const effectiveMax = strategy === "auto" ? maxBid ?? amount : amount;

  if (effectiveMax < minimumRequired) {
    throw new Error(`Bid must be at least $${minimumRequired.toFixed(2)}/lb.`);
  }

  const updatedUser = updateMockUser(userId, (user) => ({
    ...user,
    customerProfile: {
      ...user.customerProfile!,
      strategies: [
        ...(user.customerProfile?.strategies.filter((entry) => entry.listingId !== listingId) ?? []),
        {
          listingId,
          mode: strategy,
          maxBid: effectiveMax,
          increment: listing.minimumIncrement,
          updatedAt: nowIso()
        }
      ]
    }
  }));

  const submittedBid = {
    id: `bid-${Date.now()}`,
    listingId,
    slaughterhouseId: userId,
    slaughterhouseName: updatedUser.customerProfile?.facilityName ?? updatedUser.name,
    amount,
    createdAt: nowIso(),
    mode: strategy,
    maxBid: strategy === "auto" ? effectiveMax : undefined
  };

  state.listings = state.listings.map((entry) =>
    entry.id === listingId ? { ...entry, bids: [submittedBid, ...entry.bids] } : entry
  );

  const recalculated = recalculateAuction(listingId);
  state.listings = state.listings.map((entry) => (entry.id === listingId ? recalculated : entry));

  if (recalculated.currentLeaderId === userId) {
    state.notifications = [
      {
        id: `notification-${Date.now()}-leader`,
        userId,
        title: "You are leading",
        body: `You are now leading ${listing.title} at $${recalculated.currentBid.toFixed(2)}/lb.`,
        createdAt: nowIso(),
        read: false
      },
      ...state.notifications
    ];
  } else if (recalculated.currentLeaderId) {
    state.notifications = [
      {
        id: `notification-${Date.now()}-outbid`,
        userId,
        title: "Outbid",
        body: `Another processor moved ahead on ${listing.title}. Your max is still saved.`,
        createdAt: nowIso(),
        read: false
      },
      ...state.notifications
    ];
  }

  return clone(recalculated);
}

export function closeMockAuction(listingId: string) {
  const listing = state.listings.find((entry) => entry.id === listingId);

  if (!listing) {
    throw new Error("Auction listing not found.");
  }

  state.listings = state.listings.map((entry) =>
    entry.id === listingId
      ? {
          ...entry,
          auctionEndAt: nowIso(),
          auctionStatus: entry.reserveMet && entry.currentLeaderId ? "awarded" : "closed"
        }
      : entry
  );

  syncAuctionClosures();
}

export function updateMockAwardStatus(orderId: string, status: Order["status"]) {
  state.awards = state.awards.map((entry) => (entry.id === orderId ? { ...entry, status } : entry));
}

export function createMockNotification(userId: string, title: string, body: string) {
  const notification: NotificationItem = {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    body,
    createdAt: nowIso(),
    read: false
  };

  state.notifications = [notification, ...state.notifications];
  return clone(notification);
}

export function markMockNotificationRead(notificationId: string) {
  state.notifications = state.notifications.map((entry) => (entry.id === notificationId ? { ...entry, read: true } : entry));
}

export function getMockActiveUser() {
  return getCurrentUserOrThrow();
}

/**
 * Extends the end time of a live auction by the given number of minutes.
 * This simulates an "anti-sniping" extension when bids arrive near close.
 * The live implementation should be a server-side RPC (extend_auction_end)
 * so the new end time is authoritative and all clients see it.
 */
export function extendMockAuction(listingId: string, extraMinutes: number) {
  const listing = state.listings.find((entry) => entry.id === listingId);

  if (!listing) {
    throw new Error("Auction listing not found.");
  }

  if (ensureAuctionState(listing).auctionStatus !== "live") {
    throw new Error("Only live auctions can be extended.");
  }

  const currentEnd = new Date(listing.auctionEndAt).getTime();
  const newEnd = new Date(currentEnd + extraMinutes * 60 * 1000).toISOString();

  state.listings = state.listings.map((entry) => (entry.id === listingId ? { ...entry, auctionEndAt: newEnd } : entry));
}

/**
 * Awards a listing to the current leader even though the reserve was not met.
 * Used when the farmer chooses to accept a below-reserve offer after the
 * auction closes without an automatic award.
 * The live implementation should be a server-side RPC (accept_below_reserve)
 * so the state transition is atomic and audited.
 */
export function acceptMockBelowReserve(listingId: string) {
  syncAuctionClosures();
  const listing = state.listings.find((entry) => entry.id === listingId);

  if (!listing) {
    throw new Error("Auction listing not found.");
  }

  if (listing.auctionStatus !== "closed") {
    throw new Error("Below-reserve acceptance is only available on closed (no-award) auctions.");
  }

  if (!listing.currentLeaderId) {
    throw new Error("There is no current leader to award.");
  }

  state.listings = state.listings.map((entry) =>
    entry.id === listingId ? { ...entry, auctionStatus: "awarded" as const } : entry
  );

  syncAuctionClosures();
}
