import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors, spacing } from "../theme";

export function SectionCard({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  }
});
