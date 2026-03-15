import { StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

export const styles = StyleSheet.create({
  kicker: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  heroBanner: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  paragraph: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13
  },
  label: {
    color: colors.text,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  flexButton: {
    flex: 1
  },
  reviewRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs
  },
  reviewHeading: {
    color: colors.text,
    fontWeight: "700"
  },
  dividerTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm
  },
  statValue: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "800"
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  pill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 12
  }
});
