import React, { useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { hasStripeConfig } from "../../services/payments";
import { styles } from "../sharedStyles";

export function CustomerProfileScreen() {
  const { currentUser, currentLocationLabel, refreshLocation, notifications, markNotificationRead, submitCustomerOnboarding } = useAppContext();
  const [street, setStreet] = useState(currentUser?.customerProfile?.savedAddress.street ?? "");
  const [city, setCity] = useState(currentUser?.customerProfile?.savedAddress.city ?? "");
  const [state, setState] = useState(currentUser?.customerProfile?.savedAddress.state ?? "");
  const [postalCode, setPostalCode] = useState(currentUser?.customerProfile?.savedAddress.postalCode ?? "");
  const [paymentBrand, setPaymentBrand] = useState(currentUser?.customerProfile?.paymentMethods[0]?.brand ?? "Visa");
  const [paymentLast4, setPaymentLast4] = useState(currentUser?.customerProfile?.paymentMethods[0]?.last4 ?? "");
  const [paymentExpiry, setPaymentExpiry] = useState(currentUser?.customerProfile?.paymentMethods[0]?.expiry ?? "");

  const userNotifications = useMemo(
    () => notifications.filter((entry) => entry.userId === currentUser?.id),
    [currentUser?.id, notifications]
  );

  async function handleSave() {
    try {
      await submitCustomerOnboarding({ street, city, state, postalCode, paymentBrand, paymentLast4, paymentExpiry });
      Alert.alert("Profile updated", hasStripeConfig ? "Saved address has been updated. Stripe will collect payment at checkout." : "Saved address and payment method have been updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to save profile", message);
    }
  }

  return (
    <ScreenShell title="Customer profile" subtitle="Manage address, payment setup, and order notifications.">
      <SectionCard>
        <Text style={styles.sectionTitle}>{currentUser?.name}</Text>
        <Text style={styles.paragraph}>{currentUser?.email}</Text>
        <Text style={styles.paragraph}>Marketplace location: {currentLocationLabel}</Text>
        <AppButton label="Refresh device location" kind="secondary" onPress={() => void refreshLocation()} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>{hasStripeConfig ? "Saved address and checkout defaults" : "Saved address and payment"}</Text>
        <TextInput value={street} onChangeText={setStreet} style={styles.input} placeholder="Street" />
        <View style={styles.row}>
          <TextInput value={city} onChangeText={setCity} style={[styles.input, styles.flexButton]} placeholder="City" />
          <TextInput value={state} onChangeText={setState} style={[styles.input, styles.flexButton]} placeholder="State" />
        </View>
        <TextInput value={postalCode} onChangeText={setPostalCode} style={styles.input} placeholder="Postal code" />
        {hasStripeConfig ? (
          <Text style={styles.paragraph}>Stripe PaymentSheet will securely collect and store the live card at checkout. The fields below are optional fallback labels for demo or manual use.</Text>
        ) : null}
        <View style={styles.row}>
          <TextInput value={paymentBrand} onChangeText={setPaymentBrand} style={[styles.input, styles.flexButton]} placeholder="Card brand" />
          <TextInput value={paymentLast4} onChangeText={setPaymentLast4} style={[styles.input, styles.flexButton]} placeholder="Last 4" />
        </View>
        <TextInput value={paymentExpiry} onChangeText={setPaymentExpiry} style={styles.input} placeholder="Expiry (MM/YY)" />
        <AppButton label="Save Customer Setup" onPress={() => void handleSave()} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {userNotifications.length === 0 ? (
          <Text style={styles.paragraph}>No notifications yet.</Text>
        ) : (
          userNotifications.map((entry) => (
            <View key={entry.id} style={styles.reviewRow}>
              <Text style={styles.reviewHeading}>{entry.title}</Text>
              <Text style={styles.paragraph}>{entry.body}</Text>
              {!entry.read ? <AppButton label="Mark Read" kind="secondary" onPress={() => markNotificationRead(entry.id)} /> : null}
            </View>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}
