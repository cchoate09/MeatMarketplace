import React, { useState } from "react";
import { Alert, Text, TextInput } from "react-native";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { styles } from "../sharedStyles";

export function FarmerProfileScreen() {
  const { currentUser, submitFarmerOnboarding } = useAppContext();
  const [legalName, setLegalName] = useState(currentUser?.farmerOnboarding?.legalName ?? "");
  const [farmName, setFarmName] = useState(currentUser?.farmProfile?.farmName ?? currentUser?.name ?? "");
  const [story, setStory] = useState(currentUser?.farmProfile?.story ?? "");
  const [contactEmail, setContactEmail] = useState(currentUser?.farmProfile?.contactEmail ?? currentUser?.email ?? "");
  const [contactPhone, setContactPhone] = useState(currentUser?.farmProfile?.contactPhone ?? "");
  const [pickupAddress, setPickupAddress] = useState(currentUser?.farmProfile?.pickupAddress ?? "");
  const [payoutAccountLabel, setPayoutAccountLabel] = useState(currentUser?.farmerOnboarding?.payoutAccountLabel ?? "");

  function handleSave() {
    try {
      submitFarmerOnboarding({ legalName, farmName, story, contactEmail, contactPhone, pickupAddress, payoutAccountLabel });
      Alert.alert("Farm profile saved", "Farmer onboarding, farm profile, and payout details are updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to save farm profile", message);
    }
  }

  return (
    <ScreenShell title="Farm profile and onboarding" subtitle="Manage verification, farm story, pickup address, and payout setup.">
      <SectionCard>
        <Text style={styles.sectionTitle}>Onboarding status</Text>
        <Text style={styles.metaText}>Identity verified: {currentUser?.farmerOnboarding?.identityVerified ? "Yes" : "No"}</Text>
        <Text style={styles.metaText}>Payout ready: {currentUser?.farmerOnboarding?.payoutReady ? "Yes" : "No"}</Text>
        <Text style={styles.metaText}>Farm verified: {currentUser?.farmProfile?.verified ? "Yes" : "No"}</Text>
      </SectionCard>

      <SectionCard>
        <TextInput value={legalName} onChangeText={setLegalName} style={styles.input} placeholder="Legal business name" />
        <TextInput value={farmName} onChangeText={setFarmName} style={styles.input} placeholder="Farm name" />
        <TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} placeholder="Contact email" />
        <TextInput value={contactPhone} onChangeText={setContactPhone} style={styles.input} placeholder="Contact phone" />
        <TextInput value={pickupAddress} onChangeText={setPickupAddress} style={styles.input} placeholder="Pickup address" />
        <TextInput
          value={story}
          onChangeText={setStory}
          style={[styles.input, styles.multiline]}
          placeholder="Farm story and practices"
          multiline
        />
        <TextInput value={payoutAccountLabel} onChangeText={setPayoutAccountLabel} style={styles.input} placeholder="Payout account label" />
        <AppButton label="Save Farmer Setup" onPress={handleSave} />
      </SectionCard>
    </ScreenShell>
  );
}
