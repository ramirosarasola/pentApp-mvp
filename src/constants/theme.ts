/** Alineado con @theme en global.css */
export const colors = {
  primary: "#0d1321",
  secondary: "#191f2e",
  tertiary: "#00daf3",
  quaternary: "#c1c6d7",
  background: "#0d1321",
  foreground: "#c1c6d7",
  card: "#191f2e",
  mutedForeground: "rgba(193, 198, 215, 0.55)",
  accent: "#00daf3",
  border: "rgba(193, 198, 215, 0.14)",
  success: "#2ff801",
  destructive: "#93000a",
  warning: "#f1c100",
  white: "#dde2f6",
  subscription: "rgba(0, 218, 243, 0.14)",
  tabBarBorder: "rgba(193, 198, 215, 0.14)",
  tabBarActive: "#00daf3",
  tabBarInactive: "rgba(193, 198, 215, 0.45)",
  tabBarPillActive: "rgba(0, 218, 243, 0.14)",
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
  /**
   * Altura del bloque bajo el notch en `AppShellTopBar`: spacing[3] + fila 40px + spacing[3].
   * Debe coincidir con el layout de ese componente para que el contenido de las tabs no quede bajo la barra.
   */
  appShellTopBar: {
    heightBelowInset: spacing[3] + 40 + spacing[3],
  },
  tabBar: {
    height: 78,
    /** Misma base horizontal que `px-5` en pantallas (20px). */
    horizontalInset: spacing[5],
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
