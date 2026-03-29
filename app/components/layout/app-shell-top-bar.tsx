import { colors, spacing } from "@/app/constants/theme";
import { Feather } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface AppShellTopBarProps {
  readonly topInset: number;
  readonly profileImageSource: ImageSourcePropType | null;
  readonly onPressMenu: () => void;
  readonly onPressProfile: () => void;
}

export default function AppShellTopBar(props: AppShellTopBarProps) {
  return (
    <View style={[styles.container, { paddingTop: props.topInset + spacing[3] }]}>
      <Pressable accessibilityRole="button" onPress={props.onPressMenu} style={styles.iconButton}>
        <Feather name="menu" size={20} color={colors.tertiary} />
      </Pressable>
      <Text style={styles.brandText}>AutoLibreAI</Text>
      <Pressable accessibilityRole="button" onPress={props.onPressProfile} style={styles.avatarButton}>
        {props.profileImageSource ? (
          <Image source={props.profileImageSource} style={styles.avatarImage} />
        ) : (
          <Feather name="user" size={18} color={colors.white} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBarBorder,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: colors.tertiary,
    fontFamily: "sans-bold",
    fontSize: 30,
    letterSpacing: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
});
