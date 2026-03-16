import React, { useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

export function CustomerProfileScreen() {
  const { currentUser, currentLocationLabel, refreshLocation, notifications, markNotificationRead, submitCustomerOnboarding } = useAppContext();
  const [facilityName, setFacilityName] = useState(currentUser?.customerProfile?.facilityName ?? currentUser?.name ?? "");
  const [buyerCode, setBuyerCode] = useState(currentUser?.customerProfile?.buyerCode ?? "");
  const [street, setStreet] = useState(currentUser?.customerProfile?.savedAddress.street ?? "");
  const [city, setCity] = useState(currentUser?.customerProfile?.savedAddress.city ?? "");
  const [state, setState] = useState(currentUser?.customerProfile?.savedAddress.state ?? "");
  const [postalCode, setPostalCode] = useState(currentUser?.customerProfile?.savedAddress.postalCode ?? "");
  const [inspectionRegions, setInspectionRegions] = useState((currentUser?.customerProfile?.inspectionRegions ?? []).join(", "));
  const [procurementNotes, setProcurementNotes] = useState(currentUser?.customerProfile?.procurementNotes ?? "");
  const [paymentBrand, setPaymentBrand] = useState(currentUser?.customerProfile?.paymentMethods[0]?.brand ?? "Visa");
  const [paymentLast4, setPaymentLast4] = useState(currentUser?.customerProfile?.paymentMethods[0]?.last4 ?? "");
  const [paymentExpiry, setPaymentExpiry] = useState(currentUser?.customerProfile?.paymentMethods[0]?.expiry ?? "");

  const userNotifications = useMemo(
    () => notifications.filter((entry) => entry.userId === currentUser?.id),
    [currentUser?.id, notifications]
  );

  async function handleSave() {
    try {
      await submitCustomerOnboarding({
        facilityName,
        buyerCode,
        street,
        city,
        state,
        postalCode,
        inspectionRegions,
        procurementNotes,
        paymentBrand,
        paymentLast4,
        paymentExpiry
      });
      Alert.alert("Profile updated", "Procurement profile, sourcing regions, and settlement defaults have been updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to save profile", message);
    }
  }

  return (
    <ScreenShell title="Slaughterhouse profile" subtitle="Manage procurement identity, sourcing footprint, and auction notifications.">
      <SectionCard>
        <Text style={styles.sectionTitle}>{currentUser?.customerProfile?.facilityName ?? currentUser?.name}</Text>
        <Text style={styles.paragraph}>{currentUser?.email}</Text>
        <Text style={styles.paragraph}>Procurement location: {currentLocationLabel}</Text>
        <AppButton label="Refresh device location" kind="secondary" onPress={() => void refreshLocation()} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Facility setup</Text>
        <TextInput value={facilityName} onChangeText={setFacilityName} style={styles.input} placeholder="Facility name" />
        <TextInput value={buyerCode} onChangeText={setBuyerCode} style={styles.input} placeholder="Buyer code" />
        <TextInput value={street} onChangeText={setStreet} style={styles.input} placeholder="Street" />
        <View style={styles.row}>
          <TextInput value={city} onChangeText={setCity} style={[styles.input, styles.flexButton]} placeholder="City" />
          <TextInput value={state} onChangeText={setState} style={[styles.input, styles.flexButton]} placeholder="State" />
        </View>
        <TextInput value={postalCode} onChangeText={setPostalCode} style={styles.input} placeholder="Postal code" />
        <TextInput value={inspectionRegions} onChangeText={setInspectionRegions} style={styles.input} placeholder="Inspection regions, comma-separated" />
        <TextInput
          value={procurementNotes}
          onChangeText={setProcurementNotes}
          style={[styles.input, styles.multiline]}
          placeholder="Weight, grade, logistics, or scheduling notes"
          multiline
        />
        <Text style={styles.paragraph}>Stripe and Supabase settlement hooks remain in place for later. These card fields are demo labels while the UI stays in mock mode.</Text>
        <View style={styles.row}>
          <TextInput value={paymentBrand} onChangeText={setPaymentBrand} style={[styles.input, styles.flexButton]} placeholder="Card brand" />
          <TextInput value={paymentLast4} onChangeText={setPaymentLast4} style={[styles.input, styles.flexButton]} placeholder="Last 4" />
        </View>
        <TextInput value={paymentExpiry} onChangeText={setPaymentExpiry} style={styles.input} placeholder="Expiry (MM/YY)" />
        <AppButton label="Save Slaughterhouse Setup" onPress={() => void handleSave()} />
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
              {!entry.read ? <AppButton label="Mark Read" kind="secondary" onPress={() => void markNotificationRead(entry.id)} /> : null}
            </View>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}
