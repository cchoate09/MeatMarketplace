import { mockListings, mockNotifications, mockOrders, mockUsers } from "../data/mockData";
import { clearMockSessionUserId, loadMockSessionUserId, persistMockSessionUserId } from "../storage/sessionStorage";
import {
  DeliveryMethod,
  Listing,
  NotificationItem,
  Order,
  OrderStatus,
  Review,
  User,
  UserRole
} from "../types";

type MockCredentials = Record<string, { password: string; userId: string }>;

const state: {
  users: User[];
  listings: Listing[];
  orders: Order[];
  notifications: NotificationItem[];
  credentials: MockCredentials;
  currentUserId: string | null;
} = {
  users: clone(mockUsers),
  listings: clone(mockListings),
  orders: clone(mockOrders),
  notifications: clone(mockNotifications),
  credentials: {
    "customer@example.com": { password: "password123", userId: "customer-1" },
    "farmer@example.com": { password: "password123", userId: "farmer-1" }
  },
  currentUserId: null
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function hydrateMockSession() {
  state.currentUserId = await loadMockSessionUserId();
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
    locationLabel: role === "farmer" ? "Farm location pending" : "Customer location pending",
    favorites: [],
    customerProfile:
      role === "customer"
        ? {
            savedAddress: {
              label: "Primary",
              street: "",
              city: "",
              state: "",
              postalCode: ""
            },
            paymentMethods: []
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

export function listMockListings() {
  return clone(state.listings);
}

export function listMockOrders() {
  return clone(state.orders);
}

export function listMockNotifications(userId?: string) {
  const notifications = userId ? state.notifications.filter((entry) => entry.userId === userId) : state.notifications;
  return clone(notifications);
}

export function createMockListing(listing: Omit<Listing, "id" | "reviews">) {
  const created: Listing = {
    ...listing,
    id: `listing-${Date.now()}`,
    reviews: []
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
    createdAt: new Date().toISOString()
  };

  state.listings = state.listings.map((entry) =>
    entry.id === listingId ? { ...entry, reviews: [createdReview, ...entry.reviews] } : entry
  );

  return clone(createdReview);
}

export function createMockOrder(
  currentUser: User,
  listing: Listing,
  quantity: number,
  deliveryMethod: DeliveryMethod,
  paymentMethodId: string,
  pickupSlotId?: string,
  paymentMethodLabelOverride?: string,
  paymentIntentId?: string
) {
  const paymentMethod = currentUser.customerProfile?.paymentMethods.find((entry) => entry.id === paymentMethodId);

  if (!paymentMethod && !paymentMethodLabelOverride) {
    throw new Error("Selected payment method was not found.");
  }

  const pickupSlot = pickupSlotId ? listing.pickupSlots.find((entry) => entry.id === pickupSlotId) : undefined;
  const subtotal = quantity * listing.price;
  const shippingFee = deliveryMethod === "shipping" ? listing.shippingFee : 0;
  const order: Order = {
    id: `order-${Date.now()}`,
    listingId: listing.id,
    listingTitle: listing.title,
    farmerId: listing.farmerId,
    farmerName: listing.farmerName,
    customerId: currentUser.id,
    customerName: currentUser.name,
    quantity,
    deliveryMethod,
    pickupSlotLabel: pickupSlot?.label,
    paymentMethodLabel: paymentMethodLabelOverride ?? `${paymentMethod?.brand} ending in ${paymentMethod?.last4}`,
    paymentIntentId,
    subtotal,
    shippingFee,
    totalPrice: subtotal + shippingFee,
    createdAt: new Date().toISOString(),
    status: "new"
  };

  state.orders = [order, ...state.orders];
  state.listings = state.listings.map((entry) =>
    entry.id === listing.id ? { ...entry, quantityAvailable: Math.max(0, entry.quantityAvailable - quantity) } : entry
  );

  return clone(order);
}

export function updateMockOrderStatus(orderId: string, status: OrderStatus) {
  state.orders = state.orders.map((entry) => (entry.id === orderId ? { ...entry, status } : entry));
}

export function createMockNotification(userId: string, title: string, body: string) {
  const notification: NotificationItem = {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false
  };

  state.notifications = [notification, ...state.notifications];
  return clone(notification);
}

export function markMockNotificationRead(notificationId: string) {
  state.notifications = state.notifications.map((entry) => (entry.id === notificationId ? { ...entry, read: true } : entry));
}
