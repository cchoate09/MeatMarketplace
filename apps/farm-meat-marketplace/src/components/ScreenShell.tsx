import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function ScreenShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
    gap: spacing.md
  },
  header: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  }
});
