import { colors, spacing } from "@/app/constants/theme";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DrawerItem {
  readonly label: string;
  readonly iconName: keyof typeof Feather.glyphMap;
  readonly onPress: () => void;
}

interface AppShellDrawerProps {
  readonly isVisible: boolean;
  readonly topInset: number;
  readonly drawerItems: DrawerItem[];
  readonly onClose: () => void;
}

export default function AppShellDrawer(props: AppShellDrawerProps) {
  if (!props.isVisible) {
    return null;
  }
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <SafeAreaView style={[styles.panel, { paddingTop: props.topInset + spacing[4] }]}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.itemsContainer}>
          {props.drawerItems.map((item) => (
            <Pressable key={item.label} style={styles.itemButton} onPress={item.onPress}>
              <Feather name={item.iconName} size={18} color={colors.tertiary} />
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  panel: {
    width: 274,
    backgroundColor: colors.secondary,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing[4],
  },
  title: {
    color: colors.tertiary,
    fontFamily: "sans-bold",
    fontSize: 24,
    marginBottom: spacing[4],
  },
  itemsContainer: {
    gap: spacing[2],
  },
  itemButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  itemLabel: {
    color: colors.white,
    fontFamily: "sans-semibold",
    fontSize: 14,
  },
});
