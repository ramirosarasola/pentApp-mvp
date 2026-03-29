import { tabs } from "@/app/constants/data";
import { colors, components } from "@/app/constants/theme";
import { Tabs } from "expo-router";
import type { FC } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabBar = components.tabBar;

const TabIcon = ({
  focused,
  Icon,
  label,
}: {
  focused: boolean;
  Icon: FC<SvgProps>;
  label: string;
}) => {
  const glyphColor = focused ? colors.tabBarActive : colors.tabBarInactive;
  return (
    <View style={styles.tabCell}>
      <View style={[styles.pill, focused && styles.pillActive]}>
        <Icon width={tabBar.iconSize} height={tabBar.iconSize} fill={glyphColor} color={glyphColor} />
        <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const TabLayout = () => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, tabBar.horizontalInset);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: tabBar.horizontalInset,
          right: tabBar.horizontalInset,
          bottom: bottomOffset,
          height: tabBar.height,
          paddingHorizontal: 4,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.tabBarBackground,
          borderRadius: tabBar.radius,
          borderWidth: 1,
          borderColor: colors.tabBarBorder,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
        },
        tabBarIconStyle: {
          flex: 1,
          width: "100%",
          height: "100%",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon focused={focused} Icon={tab.Icon} label={tab.title} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  tabCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  pill: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    minWidth: 64,
  },
  pillActive: {
    backgroundColor: colors.tabBarPillActive,
    ...Platform.select({
      ios: {
        shadowColor: colors.tabBarActive,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: "600",
    textAlign: "center",
  },
  labelActive: {
    color: colors.tabBarActive,
  },
  labelInactive: {
    color: colors.tabBarInactive,
  },
});
