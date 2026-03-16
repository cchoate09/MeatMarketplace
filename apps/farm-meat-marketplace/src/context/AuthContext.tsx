import React, { createContext, useContext, useEffect, useState } from "react";
import { appConfig } from "../config/appConfig";
import { getCurrentSignedInUser, hydrateAuth, SignUpInput, signIn, signInAs, signOut, signUp } from "../services/auth";
import { updateCustomerProfile } from "../services/profileService";
import { getCurrentUserLocation } from "../services/location";
import { User, UserRole } from "../types";

interface SlaughterhouseOnboardingInput {
  facilityName: string;
  buyerCode: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  inspectionRegions: string;
  procurementNotes: string;
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

export interface AuthContextValue {
  isHydrated: boolean;
  currentUser: User | null;
  currentLocationLabel: string;
  login: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  refreshCurrentUser: () => Promise<User | null>;
  submitCustomerOnboarding: (input: SlaughterhouseOnboardingInput) => Promise<void>;
  submitFarmerOnboarding: (input: FarmerOnboardingInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLocationLabel, setCurrentLocationLabel] = useState(appConfig.locationFallbackLabel);

  useEffect(() => {
    async function hydrate() {
      try {
        await hydrateAuth();
        await refreshLocation();
        const user = await refreshCurrentUser();
        setCurrentUser(user);
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

  async function refreshCurrentUser() {
    const user = await getCurrentSignedInUser();
    setCurrentUser(user);
    return user;
  }

  async function login(email: string, password: string) {
    const user = await signIn(email, password);
    setCurrentUser(user);
  }

  async function register(input: SignUpInput) {
    const user = await signUp(input);
    setCurrentUser(user);
  }

  async function loginAsDemo(role: UserRole) {
    const user = await signInAs(role);
    setCurrentUser(user);
  }

  async function logoutUser() {
    await signOut();
    setCurrentUser(null);
  }

  async function submitCustomerOnboarding(input: SlaughterhouseOnboardingInput) {
    if (!currentUser) throw new Error("A user must be logged in.");

    await updateCustomerProfile(currentUser.id, (user) => ({
      ...user,
      customerProfile: {
        facilityName: input.facilityName,
        buyerCode: input.buyerCode,
        inspectionRegions: input.inspectionRegions
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        procurementNotes: input.procurementNotes,
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
            : user.customerProfile?.paymentMethods ?? [],
        strategies: user.customerProfile?.strategies ?? []
      }
    }));

    await refreshCurrentUser();
  }

  async function submitFarmerOnboarding(input: FarmerOnboardingInput) {
    if (!currentUser) throw new Error("A user must be logged in.");

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

    await refreshCurrentUser();
  }

  const value: AuthContextValue = {
    isHydrated,
    currentUser,
    currentLocationLabel,
    login,
    signUp: register,
    loginAsDemo,
    logout: logoutUser,
    refreshLocation,
    refreshCurrentUser,
    submitCustomerOnboarding,
    submitFarmerOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
