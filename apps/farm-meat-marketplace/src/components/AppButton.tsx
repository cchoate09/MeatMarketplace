import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, spacing } from "../theme";

export function AppButton({
  label,
  onPress,
  kind = "primary",
  style,
  disabled
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary";
  style?: ViewStyle;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, kind === "secondary" ? styles.secondary : styles.primary, disabled && styles.disabled, style]}
    >
      <Text style={[styles.label, kind === "secondary" ? styles.secondaryLabel : styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 15,
    fontWeight: "800"
  },
  primaryLabel: {
    color: colors.white
  },
  secondaryLabel: {
    color: colors.text
  }
});
