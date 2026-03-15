import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "./components/AppButton";
import { LoadingScreen } from "./components/LoadingScreen";
import { useAppContext } from "./context/AppContext";
import { hasStripeConfig } from "./services/payments";
import { AuthScreen } from "./screens/AuthScreen";
import { CustomerBrowseScreen } from "./screens/customer/CustomerBrowseScreen";
import { CustomerOrdersScreen } from "./screens/customer/CustomerOrdersScreen";
import { CustomerProfileScreen } from "./screens/customer/CustomerProfileScreen";
import { FarmerInventoryScreen } from "./screens/farmer/FarmerInventoryScreen";
import { FarmerNewListingScreen } from "./screens/farmer/FarmerNewListingScreen";
import { FarmerProfileScreen } from "./screens/farmer/FarmerProfileScreen";
import { FarmerSalesScreen } from "./screens/farmer/FarmerSalesScreen";
import { colors, spacing } from "./theme";

type CustomerTab = "browse" | "orders" | "profile";
type FarmerTab = "inventory" | "newListing" | "sales" | "farm";

export function RootApp() {
  const { isHydrated, currentUser, logout, currentLocationLabel } = useAppContext();
  const [customerTab, setCustomerTab] = useState<CustomerTab>("browse");
  const [farmerTab, setFarmerTab] = useState<FarmerTab>("inventory");

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  const customerNeedsOnboarding =
    currentUser.role === "customer" &&
    (!currentUser.customerProfile?.savedAddress.street ||
      (!hasStripeConfig && !currentUser.customerProfile?.paymentMethods.length));
  const farmerNeedsOnboarding =
    currentUser.role === "farmer" && (!currentUser.farmProfile || !currentUser.farmerOnboarding?.payoutReady);

  return (
    <View style={styles.screenShell}>
      <View style={styles.topBar}>
        <View style={styles.topBarCopy}>
          <Text style={styles.topBarTitle}>{currentUser.role === "customer" ? `Welcome, ${currentUser.name}` : "Farm dashboard"}</Text>
          <Text style={styles.topBarSubtitle}>{currentLocationLabel}</Text>
        </View>
        <AppButton label="Log Out" kind="secondary" onPress={() => void logout()} />
      </View>

      {currentUser.role === "customer" ? (
        <>
          <View style={styles.tabRow}>
            <TabButton label="Browse" active={customerTab === "browse"} onPress={() => setCustomerTab("browse")} />
            <TabButton label="Orders" active={customerTab === "orders"} onPress={() => setCustomerTab("orders")} />
            <TabButton label="Profile" active={customerTab === "profile"} onPress={() => setCustomerTab("profile")} />
          </View>
          {customerNeedsOnboarding ? <CustomerProfileScreen /> : null}
          {!customerNeedsOnboarding && customerTab === "browse" ? <CustomerBrowseScreen /> : null}
          {!customerNeedsOnboarding && customerTab === "orders" ? <CustomerOrdersScreen /> : null}
          {!customerNeedsOnboarding && customerTab === "profile" ? <CustomerProfileScreen /> : null}
        </>
      ) : (
        <>
          <View style={styles.tabRow}>
            <TabButton label="Inventory" active={farmerTab === "inventory"} onPress={() => setFarmerTab("inventory")} />
            <TabButton label="New Listing" active={farmerTab === "newListing"} onPress={() => setFarmerTab("newListing")} />
            <TabButton label="Sales" active={farmerTab === "sales"} onPress={() => setFarmerTab("sales")} />
            <TabButton label="Farm" active={farmerTab === "farm"} onPress={() => setFarmerTab("farm")} />
          </View>
          {farmerNeedsOnboarding ? <FarmerProfileScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "inventory" ? <FarmerInventoryScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "newListing" ? <FarmerNewListingScreen onCreated={() => setFarmerTab("inventory")} /> : null}
          {!farmerNeedsOnboarding && farmerTab === "sales" ? <FarmerSalesScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "farm" ? <FarmerProfileScreen /> : null}
        </>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <AppButton label={label} onPress={onPress} kind={active ? "primary" : "secondary"} style={styles.tabButton} />;
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md
  },
  topBarCopy: {
    flex: 1
  },
  topBarTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 20
  },
  topBarSubtitle: {
    color: colors.textMuted,
    fontSize: 13
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm
  },
  tabButton: {
    flex: 1
  }
});
