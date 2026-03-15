import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { SafeAreaView, StatusBar } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { AppProvider } from "./src/context/AppContext";
import { RootApp } from "./src/RootApp";
import { hasStripeConfig } from "./src/services/payments";
import { colors } from "./src/theme";

export default function App() {
  const app = (
    <AppProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ExpoStatusBar style="dark" />
        <RootApp />
      </SafeAreaView>
    </AppProvider>
  );

  if (!hasStripeConfig) {
    return app;
  }

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string} merchantIdentifier="merchant.com.farmmeatmarketplace">
      {app}
    </StripeProvider>
  );
}
