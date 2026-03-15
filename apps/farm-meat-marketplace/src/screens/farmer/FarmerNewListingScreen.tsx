import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { MeatCategory, MeatCut } from "../../types";
import { styles } from "../sharedStyles";

const meatCategories: MeatCategory[] = ["beef", "pork", "chicken", "lamb", "turkey", "goat"];
const meatCuts: MeatCut[] = [
  "ribeye",
  "ground beef",
  "brisket",
  "pork chops",
  "bacon",
  "whole chicken",
  "chicken breast",
  "lamb chops",
  "turkey breast",
  "goat stew meat"
];

export function FarmerNewListingScreen({ onCreated }: { onCreated: () => void }) {
  const { currentUser, createListing } = useAppContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MeatCategory>("beef");
  const [cut, setCut] = useState<MeatCut>("ribeye");
  const [price, setPrice] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [shippingFee, setShippingFee] = useState("0");
  const [availableOn, setAvailableOn] = useState("2026-03-21");
  const [processingDays, setProcessingDays] = useState("2");
  const [pickupInstructions, setPickupInstructions] = useState("Pickup Saturdays from 9 AM to noon.");
  const [pickupSlots, setPickupSlots] = useState("Saturday 9:00 AM - 11:00 AM,Saturday 11:00 AM - 1:00 PM");
  const [shippingRegions, setShippingRegions] = useState("VT,NH,NY");
  const [imageGallery, setImageGallery] = useState("Front cut photo,Packaged order,Farm pickup");
  const [breed, setBreed] = useState("Angus cross");
  const [packagingDetails, setPackagingDetails] = useState("Vacuum sealed.");
  const [storageDetails, setStorageDetails] = useState("Keep frozen.");
  const [cookingTip, setCookingTip] = useState("Sear over high heat.");

  function submitListing() {
    if (!currentUser) {
      return;
    }

    try {
      createListing({
        farmerId: currentUser.id,
        farmerName: currentUser.farmProfile?.farmName ?? currentUser.name,
        title,
        description,
        category,
        cut,
        price: Number(price),
        unit: "lb",
        quantityAvailable: Number(quantityAvailable),
        lowStockThreshold: Number(lowStockThreshold),
        pickupAvailable,
        shippingAvailable,
        shippingFee: Number(shippingFee) || 0,
        locationName: currentUser.locationLabel,
        distanceMiles: 0,
        availableOn,
        processingDays: Number(processingDays) || 0,
        pickupInstructions,
        pickupSlots: pickupSlots
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry, index) => ({
            id: `slot-${Date.now()}-${index}`,
            label: entry,
            startAt: new Date().toISOString(),
            endAt: new Date().toISOString()
          })),
        shippingRegions: shippingRegions
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        imageLabel: category.toUpperCase(),
        imageGallery: imageGallery
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        breed,
        packagingDetails,
        storageDetails,
        cookingTip,
        tags: ["new listing"]
      });

      setTitle("");
      setDescription("");
      setPrice("");
      setQuantityAvailable("");
      Alert.alert("Listing posted", "Your offering has been added to the marketplace.");
      onCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to publish", message);
    }
  }

  return (
    <ScreenShell title="Post a new offering" subtitle="Add richer product details, pickup slots, and low-stock protection.">
      <SectionCard>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Listing title" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          placeholder="Description, farm practices, packaging, etc."
          multiline
        />
        <Text style={styles.label}>Category</Text>
        <View style={styles.rowWrap}>
          {meatCategories.map((entry) => (
            <AppButton key={entry} label={entry} kind={category === entry ? "primary" : "secondary"} onPress={() => setCategory(entry)} />
          ))}
        </View>
        <Text style={styles.label}>Cut</Text>
        <View style={styles.rowWrap}>
          {meatCuts.map((entry) => (
            <AppButton key={entry} label={entry} kind={cut === entry ? "primary" : "secondary"} onPress={() => setCut(entry)} />
          ))}
        </View>
        <View style={styles.row}>
          <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Price per lb" />
          <TextInput
            value={quantityAvailable}
            onChangeText={setQuantityAvailable}
            keyboardType="numeric"
            style={[styles.input, styles.flexButton]}
            placeholder="Quantity"
          />
        </View>
        <TextInput
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Low-stock threshold"
        />
        <TextInput value={availableOn} onChangeText={setAvailableOn} style={styles.input} placeholder="Available on (YYYY-MM-DD)" />
        <TextInput
          value={processingDays}
          onChangeText={setProcessingDays}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Processing time in days"
        />
        <TextInput value={breed} onChangeText={setBreed} style={styles.input} placeholder="Breed or variety" />
        <TextInput value={packagingDetails} onChangeText={setPackagingDetails} style={styles.input} placeholder="Packaging details" />
        <TextInput value={storageDetails} onChangeText={setStorageDetails} style={styles.input} placeholder="Storage details" />
        <TextInput value={cookingTip} onChangeText={setCookingTip} style={styles.input} placeholder="Cooking tip" />
        <TextInput value={imageGallery} onChangeText={setImageGallery} style={styles.input} placeholder="Photo labels, comma-separated" />
        <TextInput
          value={pickupInstructions}
          onChangeText={setPickupInstructions}
          style={[styles.input, styles.multiline]}
          placeholder="Pickup instructions"
          multiline
        />
        <TextInput value={pickupSlots} onChangeText={setPickupSlots} style={styles.input} placeholder="Pickup slots, comma-separated" />
        <TextInput value={shippingRegions} onChangeText={setShippingRegions} style={styles.input} placeholder="Shipping regions, comma-separated" />
        <View style={styles.row}>
          <AppButton
            label={pickupAvailable ? "Pickup On" : "Pickup Off"}
            kind={pickupAvailable ? "primary" : "secondary"}
            onPress={() => setPickupAvailable((current) => !current)}
            style={styles.flexButton}
          />
          <AppButton
            label={shippingAvailable ? "Shipping On" : "Shipping Off"}
            kind={shippingAvailable ? "primary" : "secondary"}
            onPress={() => setShippingAvailable((current) => !current)}
            style={styles.flexButton}
          />
        </View>
        <TextInput value={shippingFee} onChangeText={setShippingFee} keyboardType="numeric" style={styles.input} placeholder="Shipping fee" />
        <AppButton label="Publish Listing" onPress={submitListing} />
      </SectionCard>
    </ScreenShell>
  );
}
