import React from "react";
import { StyleSheet, Text } from "react-native";
import { colors } from "../theme";
import { SectionCard } from "./SectionCard";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <SectionCard>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 17
  },
  body: {
    color: colors.textMuted,
    lineHeight: 21
  }
});
