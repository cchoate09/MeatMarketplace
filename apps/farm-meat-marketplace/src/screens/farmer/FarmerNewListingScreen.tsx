/**
 * FarmerNewListingScreen — create and publish a new auction lot.
 *
 * Image picker: requires expo-image-picker.
 * Install with: npx expo install expo-image-picker
 * Then add "expo-image-picker" to the plugins array in app.json and
 * request media-library permissions in your app config.
 */
import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, View } from "react-native";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — expo-image-picker is an optional peer dependency. Install with: npx expo install expo-image-picker
import * as ImagePicker from "expo-image-picker";
import { AppButton } from "../../components/AppButton";
import { ScreenShell } from "../../components/ScreenShell";
import { SectionCard } from "../../components/SectionCard";
import { useAppContext } from "../../context/AppContext";
import { uploadListingImage } from "../../services/mediaService";
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
  const [totalWeightLbs, setTotalWeightLbs] = useState("");
  const [headCount, setHeadCount] = useState("1");
  const [openingBid, setOpeningBid] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [minimumIncrement, setMinimumIncrement] = useState("0.05");
  const [auctionLengthHours, setAuctionLengthHours] = useState("24");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [breed, setBreed] = useState("Angus cross");
  const [qualityGrade, setQualityGrade] = useState("Choice");
  const [packagingDetails, setPackagingDetails] = useState("Harvest-ready loadout, boxed and labeled by lot.");
  const [handlingDetails, setHandlingDetails] = useState("Pickup with refrigerated trailer and appointment confirmation.");
  const [estimatedYieldPercent, setEstimatedYieldPercent] = useState("62");
  const [paymentTerms, setPaymentTerms] = useState("Settlement due within 2 business days of award.");
  const [allowAutoBids, setAllowAutoBids] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  async function pickImages() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUris((prev) => [...prev, ...result.assets.map((a: { uri: string }) => a.uri)]);
      }
    } catch {
      Alert.alert("Image picker unavailable", "Install expo-image-picker (npx expo install expo-image-picker) to enable photo uploads.");
    }
  }

  function removeImage(uri: string) {
    setImageUris((prev) => prev.filter((u) => u !== uri));
  }

  async function submitListing() {
    if (!currentUser) return;

    try {
      setIsUploading(imageUris.length > 0);
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + (Number(auctionLengthHours) || 24) * 60 * 60 * 1000);
      const tempListingId = `listing-${Date.now()}`;

      // Upload picked images and collect public URLs.
      const uploadedUrls: string[] = [];
      for (const uri of imageUris) {
        const filename = uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        const result = await uploadListingImage(tempListingId, uri, filename);
        uploadedUrls.push(result.publicUrl);
      }

      setIsUploading(false);

      await createListing({
        farmerId: currentUser.id,
        farmerName: currentUser.farmProfile?.farmName ?? currentUser.name,
        title,
        description,
        category,
        cut,
        unit: "lb",
        locationName: currentUser.locationLabel,
        distanceMiles: 0,
        imageLabel: category.toUpperCase(),
        imageGallery: uploadedUrls.length > 0 ? uploadedUrls : ["Photo pending"],
        breed,
        tags: ["auction lot", qualityGrade.toLowerCase()],
        totalWeightLbs: Number(totalWeightLbs) || 0,
        headCount: Number(headCount) || 1,
        reservePrice: Number(reservePrice) || 0,
        openingBid: Number(openingBid) || 0,
        minimumIncrement: Number(minimumIncrement) || 0.05,
        auctionStartAt: startAt.toISOString(),
        auctionEndAt: endAt.toISOString(),
        qualityGrade,
        packagingDetails,
        handlingDetails,
        estimatedYieldPercent: Number(estimatedYieldPercent) || 0,
        paymentTerms,
        allowAutoBids
      });

      setTitle("");
      setDescription("");
      setTotalWeightLbs("");
      setOpeningBid("");
      setReservePrice("");
      setImageUris([]);
      Alert.alert("Auction posted", "Your lot has been added to the auction board.");
      onCreated();
    } catch (error) {
      setIsUploading(false);
      Alert.alert("Unable to publish", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return (
    <ScreenShell title="Post a new auction" subtitle="List a lot, set your reserve, and let slaughterhouses compete for the best price.">
      <SectionCard>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Auction title" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          placeholder="Lot description, handling notes, grade targets, and anything buyers should know"
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
          <TextInput value={totalWeightLbs} onChangeText={setTotalWeightLbs} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Total weight (lb)" />
          <TextInput value={headCount} onChangeText={setHeadCount} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Head count" />
        </View>
        <View style={styles.row}>
          <TextInput value={openingBid} onChangeText={setOpeningBid} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Opening bid / lb" />
          <TextInput value={reservePrice} onChangeText={setReservePrice} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Reserve / lb" />
        </View>
        <View style={styles.row}>
          <TextInput value={minimumIncrement} onChangeText={setMinimumIncrement} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Minimum increment" />
          <TextInput value={auctionLengthHours} onChangeText={setAuctionLengthHours} keyboardType="numeric" style={[styles.input, styles.flexButton]} placeholder="Auction length (hours)" />
        </View>
        <TextInput value={breed} onChangeText={setBreed} style={styles.input} placeholder="Breed or variety" />
        <TextInput value={qualityGrade} onChangeText={setQualityGrade} style={styles.input} placeholder="Quality grade" />
        <TextInput value={packagingDetails} onChangeText={setPackagingDetails} style={styles.input} placeholder="Packaging details" />
        <TextInput value={handlingDetails} onChangeText={setHandlingDetails} style={styles.input} placeholder="Handling or pickup details" />
        <TextInput value={estimatedYieldPercent} onChangeText={setEstimatedYieldPercent} keyboardType="numeric" style={styles.input} placeholder="Estimated yield %" />
        <TextInput value={paymentTerms} onChangeText={setPaymentTerms} style={styles.input} placeholder="Payment terms" />

        <Text style={styles.label}>Lot photos</Text>
        {imageUris.length > 0 ? (
          <View style={styles.rowWrap}>
            {imageUris.map((uri) => (
              <View key={uri} style={{ alignItems: "center", gap: 4 }}>
                <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10 }} />
                <AppButton label="Remove" kind="secondary" onPress={() => removeImage(uri)} />
              </View>
            ))}
          </View>
        ) : null}
        <AppButton
          label={isUploading ? "Uploading photos..." : "Add Photos"}
          kind="secondary"
          onPress={() => void pickImages()}
          disabled={isUploading}
        />

        <AppButton
          label={allowAutoBids ? "Auto-bids Allowed" : "Auto-bids Disabled"}
          kind={allowAutoBids ? "primary" : "secondary"}
          onPress={() => setAllowAutoBids((current) => !current)}
        />
        <AppButton label={isUploading ? "Publishing..." : "Publish Auction"} onPress={() => void submitListing()} disabled={isUploading} />
      </SectionCard>
    </ScreenShell>
  );
}
