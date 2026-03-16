import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "./components/AppButton";
import { LoadingScreen } from "./components/LoadingScreen";
import { useAppContext } from "./context/AppContext";
import { AuthScreen } from "./screens/AuthScreen";
import { CustomerBrowseScreen } from "./screens/customer/CustomerBrowseScreen";
import { CustomerOrdersScreen } from "./screens/customer/CustomerOrdersScreen";
import { CustomerProfileScreen } from "./screens/customer/CustomerProfileScreen";
import { FarmerInventoryScreen } from "./screens/farmer/FarmerInventoryScreen";
import { FarmerNewListingScreen } from "./screens/farmer/FarmerNewListingScreen";
import { FarmerProfileScreen } from "./screens/farmer/FarmerProfileScreen";
import { FarmerSalesScreen } from "./screens/farmer/FarmerSalesScreen";
import { colors, spacing } from "./theme";

type SlaughterhouseTab = "auctions" | "bids" | "profile";
type FarmerTab = "inventory" | "newAuction" | "results" | "farm";

export function RootApp() {
  const { isHydrated, currentUser, logout, currentLocationLabel, unreadCount } = useAppContext();
  const [slaughterhouseTab, setSlaughterhouseTab] = useState<SlaughterhouseTab>("auctions");
  const [farmerTab, setFarmerTab] = useState<FarmerTab>("inventory");

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  const slaughterhouseNeedsOnboarding =
    currentUser.role === "slaughterhouse" &&
    (!currentUser.customerProfile?.facilityName ||
      !currentUser.customerProfile?.buyerCode ||
      !currentUser.customerProfile?.savedAddress.street);
  const farmerNeedsOnboarding =
    currentUser.role === "farmer" && (!currentUser.farmProfile || !currentUser.farmerOnboarding?.payoutReady);

  return (
    <View style={styles.screenShell}>
      <View style={styles.topBar}>
        <View style={styles.topBarCopy}>
          <Text style={styles.topBarTitle}>
            {currentUser.role === "slaughterhouse"
              ? `Procurement desk: ${currentUser.customerProfile?.facilityName ?? currentUser.name}`
              : "Farm auction desk"}
          </Text>
          <Text style={styles.topBarSubtitle}>{currentLocationLabel}</Text>
        </View>
        <AppButton label="Log Out" kind="secondary" onPress={() => void logout()} />
      </View>

      {currentUser.role === "slaughterhouse" ? (
        <>
          <View style={styles.tabRow}>
            <TabButton label="Auctions" active={slaughterhouseTab === "auctions"} onPress={() => setSlaughterhouseTab("auctions")} />
            <TabButton label="Bids" active={slaughterhouseTab === "bids"} badge={unreadCount} onPress={() => setSlaughterhouseTab("bids")} />
            <TabButton label="Profile" active={slaughterhouseTab === "profile"} onPress={() => setSlaughterhouseTab("profile")} />
          </View>
          {slaughterhouseNeedsOnboarding ? <CustomerProfileScreen /> : null}
          {!slaughterhouseNeedsOnboarding && slaughterhouseTab === "auctions" ? <CustomerBrowseScreen /> : null}
          {!slaughterhouseNeedsOnboarding && slaughterhouseTab === "bids" ? <CustomerOrdersScreen /> : null}
          {!slaughterhouseNeedsOnboarding && slaughterhouseTab === "profile" ? <CustomerProfileScreen /> : null}
        </>
      ) : (
        <>
          <View style={styles.tabRow}>
            <TabButton label="Inventory" active={farmerTab === "inventory"} onPress={() => setFarmerTab("inventory")} />
            <TabButton label="New Auction" active={farmerTab === "newAuction"} onPress={() => setFarmerTab("newAuction")} />
            <TabButton label="Results" active={farmerTab === "results"} badge={unreadCount} onPress={() => setFarmerTab("results")} />
            <TabButton label="Farm" active={farmerTab === "farm"} onPress={() => setFarmerTab("farm")} />
          </View>
          {farmerNeedsOnboarding ? <FarmerProfileScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "inventory" ? <FarmerInventoryScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "newAuction" ? <FarmerNewListingScreen onCreated={() => setFarmerTab("inventory")} /> : null}
          {!farmerNeedsOnboarding && farmerTab === "results" ? <FarmerSalesScreen /> : null}
          {!farmerNeedsOnboarding && farmerTab === "farm" ? <FarmerProfileScreen /> : null}
        </>
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  badge,
  onPress
}: {
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <View style={styles.tabButtonWrapper}>
      <AppButton label={label} onPress={onPress} kind={active ? "primary" : "secondary"} style={styles.tabButton} />
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : String(badge)}</Text>
        </View>
      ) : null}
    </View>
  );
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
  tabButtonWrapper: {
    flex: 1,
    position: "relative"
  },
  tabButton: {
    flex: 1
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800"
  }
});
