import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ListingFilters, MeatCategory, MeatCut } from "../types";
import { colors, spacing } from "../theme";
import { SectionCard } from "./SectionCard";
import { TogglePill } from "./TogglePill";

const categories: Array<MeatCategory | "all"> = ["all", "beef", "pork", "chicken", "lamb", "turkey", "goat"];
const cuts: Array<MeatCut | "all"> = [
  "all",
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
const auctionStatuses: Array<ListingFilters["auctionStatus"]> = ["all", "live", "scheduled", "awarded", "closed", "ending_soon"];

export function FilterPanel({
  filters,
  onChange
}: {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}) {
  return (
    <SectionCard>
      <Text style={styles.label}>Auction status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {auctionStatuses.map((status) => (
          <TogglePill
            key={status}
            label={status.replace("_", " ")}
            selected={filters.auctionStatus === status}
            onPress={() => onChange({ ...filters, auctionStatus: status })}
          />
        ))}
      </ScrollView>

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {categories.map((category) => (
          <TogglePill key={category} label={category} selected={filters.category === category} onPress={() => onChange({ ...filters, category })} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Cut</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {cuts.map((cut) => (
          <TogglePill key={cut} label={cut} selected={filters.cut === cut} onPress={() => onChange({ ...filters, cut })} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Sourcing radius (miles)</Text>
      <TextInput
        keyboardType="numeric"
        value={String(filters.maxRadiusMiles)}
        onChangeText={(text) => onChange({ ...filters, maxRadiusMiles: Number(text) || 0 })}
        style={styles.input}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  scrollRow: {
    gap: spacing.sm
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap"
  }
});
