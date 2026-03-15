import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

export function TogglePill({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  text: {
    color: colors.text,
    textTransform: "capitalize",
    fontWeight: "600"
  },
  selectedText: {
    color: colors.white
  }
});
