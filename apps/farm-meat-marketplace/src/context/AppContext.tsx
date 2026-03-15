import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "../config/appConfig";
import {
  getCurrentSignedInUser,
  hydrateAuth,
  SignUpInput,
  signIn,
  signInAs,
  signOut,
  signUp
} from "../services/auth";
import { listListings, createListing as persistListing, addReview as persistReview } from "../services/listingService";
import { getCurrentUserLocation } from "../services/location";
import { createNotification, listNotifications, listUsers, markNotificationRead as persistNotificationRead, updateCustomerProfile } from "../services/profileService";
import { createOrder, listOrders, updateOrderStatus as persistOrderStatus } from "../services/orderService";
import { hasSupabaseConfig } from "../services/supabase";
import {
  DeliveryMethod,
  Listing,
  ListingFilters,
  NotificationItem,
  Order,
  OrderStatus,
  Review,
  User,
  UserRole
} from "../types";

interface CustomerOnboardingInput {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  paymentBrand?: string;
  paymentLast4?: string;
  paymentExpiry?: string;
}

interface FarmerOnboardingInput {
  legalName: string;
  farmName: string;
  story: string;
  contactEmail: string;
  contactPhone: string;
  pickupAddress: string;
  payoutAccountLabel: string;
}

interface AppContextValue {
  isHydrated: boolean;
  currentUser: User | null;
  users: User[];
  listings: Listing[];
  orders: Order[];
  filters: ListingFilters;
  notifications: NotificationItem[];
  currentLocationLabel: string;
  login: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  setFilters: (filters: ListingFilters) => void;
  createListing: (listing: Omit<Listing, "id" | "reviews">) => Promise<void>;
  purchaseListing: (
    listing: Listing,
    quantity: number,
    deliveryMethod: DeliveryMethod,
    paymentMethodId: string,
    pickupSlotId?: string,
    paymentMethodLabelOverride?: string,
    paymentIntentId?: string
  ) => Promise<Order>;
  addReview: (listingId: string, review: Omit<Review, "id" | "createdAt">) => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  reorderOrder: (orderId: string) => Promise<Order>;
  submitCustomerOnboarding: (input: CustomerOnboardingInput) => Promise<void>;
  submitFarmerOnboarding: (input: FarmerOnboardingInput) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
}

const defaultFilters: ListingFilters = {
  category: "all",
  cut: "all",
  deliveryMethod: "all",
  maxRadiusMiles: appConfig.defaultRadiusMiles
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<ListingFilters>(defaultFilters);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentLocationLabel, setCurrentLocationLabel] = useState(appConfig.locationFallbackLabel);

  useEffect(() => {
    async function hydrate() {
      try {
        await hydrateAuth();
        await refreshLocation();
        await refreshAppData();
      } finally {
        setIsHydrated(true);
      }
    }

    void hydrate();
  }, []);

  async function refreshLocation() {
    const location = await getCurrentUserLocation();
    setCurrentLocationLabel(location.label);
  }

  async function refreshAppData(explicitUser?: User | null) {
    const resolvedUser = explicitUser === undefined ? await getCurrentSignedInUser() : explicitUser;
    const [loadedUsers, loadedListings, loadedOrders] = await Promise.all([listUsers(), listListings(), listOrders()]);

    setUsers(loadedUsers);
    setListings(loadedListings);
    setOrders(loadedOrders);

    const refreshedUser = resolvedUser ? loadedUsers.find((entry) => entry.id === resolvedUser.id) ?? resolvedUser : null;
    setCurrentUser(refreshedUser);

    if (refreshedUser) {
      setNotifications(await listNotifications(refreshedUser.id));
    } else {
      setNotifications([]);
    }
  }

  async function login(email: string, password: string) {
    const user = await signIn(email, password);
    await refreshAppData(user);
  }

  async function register(input: SignUpInput) {
    const user = await signUp(input);
    await refreshAppData(user);
  }

  async function loginAsDemo(role: UserRole) {
    const user = await signInAs(role);
    await refreshAppData(user);
  }

  async function logoutUser() {
    await signOut();
    await refreshAppData(null);
  }

  async function createListing(listing: Omit<Listing, "id" | "reviews">) {
    await persistListing(listing);
    await refreshAppData(currentUser);
  }

  async function purchaseListing(
    listing: Listing,
    quantity: number,
    deliveryMethod: DeliveryMethod,
    paymentMethodId: string,
    pickupSlotId?: string,
    paymentMethodLabelOverride?: string,
    paymentIntentId?: string
  ) {
    if (!currentUser || currentUser.role !== "customer") {
      throw new Error("A customer must be logged in to place an order.");
    }

    const order = await createOrder(
      currentUser,
      listing,
      quantity,
      deliveryMethod,
      paymentMethodId,
      pickupSlotId,
      paymentMethodLabelOverride,
      paymentIntentId
    );

    if (!hasSupabaseConfig) {
      await createNotification(currentUser.id, "Order placed", `${listing.title} has been placed for $${order.totalPrice.toFixed(2)}.`);
      await createNotification(listing.farmerId, "New order received", `${currentUser.name} ordered ${listing.title}.`);
    }

    await refreshAppData(currentUser);
    return order;
  }

  async function addReview(listingId: string, review: Omit<Review, "id" | "createdAt">) {
    await persistReview(listingId, review, currentUser?.id);
    await refreshAppData(currentUser);
  }

  async function toggleFavorite(listingId: string) {
    if (!currentUser) {
      throw new Error("A user must be logged in.");
    }

    await updateCustomerProfile(currentUser.id, (user) => ({
      ...user,
      favorites: user.favorites.includes(listingId)
        ? user.favorites.filter((entry) => entry !== listingId)
        : [listingId, ...user.favorites]
    }));

    await refreshAppData(currentUser);
  }

  async function reorderOrder(orderId: string) {
    if (!currentUser || currentUser.role !== "customer") {
      throw new Error("A customer must be logged in.");
    }

    const priorOrder = orders.find((entry) => entry.id === orderId && entry.customerId === currentUser.id);

    if (!priorOrder) {
      throw new Error("Order not found.");
    }

    const listing = listings.find((entry) => entry.id === priorOrder.listingId);
    const defaultPaymentMethod = currentUser.customerProfile?.paymentMethods.find((entry) => entry.isDefault);

    if (!listing || !defaultPaymentMethod) {
      throw new Error("Listing or payment method unavailable for reorder.");
    }

    const pickupSlotId =
      priorOrder.deliveryMethod === "pickup"
        ? listing.pickupSlots.find((entry) => entry.label === priorOrder.pickupSlotLabel)?.id ?? listing.pickupSlots[0]?.id
        : undefined;

    return purchaseListing(listing, priorOrder.quantity, priorOrder.deliveryMethod, defaultPaymentMethod.id, pickupSlotId);
  }

  async function submitCustomerOnboarding(input: CustomerOnboardingInput) {
    if (!currentUser) {
      throw new Error("A user must be logged in.");
    }

    await updateCustomerProfile(currentUser.id, (user) => ({
      ...user,
      customerProfile: {
        savedAddress: {
          label: "Primary",
          street: input.street,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode
        },
        paymentMethods:
          input.paymentBrand && input.paymentLast4 && input.paymentExpiry
            ? [
                {
                  id: user.customerProfile?.paymentMethods[0]?.id ?? `pm-${Date.now()}`,
                  brand: input.paymentBrand,
                  last4: input.paymentLast4,
                  expiry: input.paymentExpiry,
                  isDefault: true
                }
              ]
            : user.customerProfile?.paymentMethods ?? []
      }
    }));

    await refreshAppData(currentUser);
  }

  async function submitFarmerOnboarding(input: FarmerOnboardingInput) {
    if (!currentUser) {
      throw new Error("A user must be logged in.");
    }

    await updateCustomerProfile(currentUser.id, (user) => ({
      ...user,
      name: input.farmName,
      farmProfile: {
        farmName: input.farmName,
        story: input.story,
        practices: user.farmProfile?.practices ?? ["Pasture-raised"],
        certifications: user.farmProfile?.certifications ?? ["Self-reported"],
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        pickupAddress: input.pickupAddress,
        verified: true
      },
      farmerOnboarding: {
        legalName: input.legalName,
        identityVerified: true,
        payoutAccountLabel: input.payoutAccountLabel,
        payoutReady: true
      }
    }));

    await refreshAppData(currentUser);
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const targetOrder = orders.find((entry) => entry.id === orderId);
    await persistOrderStatus(orderId, status);

    if (!hasSupabaseConfig && targetOrder) {
      await createNotification(targetOrder.customerId, "Order update", `${targetOrder.listingTitle} is now ${status.replace("_", " ")}.`);
    }

    await refreshAppData(currentUser);
  }

  async function markNotificationRead(notificationId: string) {
    await persistNotificationRead(notificationId);
    await refreshAppData(currentUser);
  }

  const value = useMemo(
    () => ({
      isHydrated,
      currentUser,
      users,
      listings,
      orders,
      filters,
      notifications,
      currentLocationLabel,
      login,
      signUp: register,
      loginAsDemo,
      logout: logoutUser,
      refreshLocation,
      setFilters,
      createListing,
      purchaseListing,
      addReview,
      toggleFavorite,
      reorderOrder,
      submitCustomerOnboarding,
      submitFarmerOnboarding,
      updateOrderStatus,
      markNotificationRead
    }),
    [isHydrated, currentUser, users, listings, orders, filters, notifications, currentLocationLabel]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}
