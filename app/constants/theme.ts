export const colors = {
  background: "#fff9e3",
  foreground: "#081126",
  card: "#fff8e7",
  muted: "#f6eecf",
  mutedForeground: "rgba(0, 0, 0, 0.6)",
  primary: "#081126",
  accent: "#ea7a53",
  border: "rgba(0, 0, 0, 0.1)",
  success: "#16a34a",
  destructive: "#dc2626",
  subscription: "#8fd1bd",
  /** Bottom tab bar (dark chrome) */
  tabBarBackground: "#12161f",
  tabBarBorder: "rgba(99, 102, 241, 0.45)",
  tabBarActive: "#2dd4bf",
  tabBarInactive: "#8b92a3",
  tabBarPillActive: "rgba(45, 212, 191, 0.14)",
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
  30: 120,
} as const;

export const components = {
  tabBar: {
    height: 78,
    horizontalInset: spacing[4],
    radius: 20,
    iconSize: 22,
    itemPaddingVertical: spacing[2],
  },
} as const;

export const theme = {
  colors,
  spacing,
  components,
} as const;
