import AppShellDrawer from "@/app/components/layout/app-shell-drawer";
import AppShellTopBar from "@/app/components/layout/app-shell-top-bar";
import { tabs } from "@/app/constants/data";
import { colors, components } from "@/app/constants/theme";
import { useAssistantChat } from "@/app/hooks/use-assistant-chat";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useMemo, useState, type FC } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

const tabBar = components.tabBar;

const tabNavigatorTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    border: colors.tabBarBorder,
    text: colors.quaternary,
    primary: colors.tertiary,
  },
};

const TabIcon = ({ focused, Icon, label }: { focused: boolean; Icon: FC<SvgProps>; label: string }) => {
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

function InsetTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const hInset = tabBar.horizontalInset;
  const bottomPad = Math.max(insets.bottom, hInset);
  return (
    <View
      pointerEvents="box-none"
      style={{
        width: "100%",
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
        paddingLeft: insets.left + hInset,
        paddingRight: insets.right + hInset,
        paddingBottom: bottomPad,
      }}
    >
      <View
        style={[
          styles.tabBarCard,
          Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 12 },
            default: {},
          }),
        ]}
      >
        <BottomTabBar {...props} />
      </View>
    </View>
  );
}

const TabLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const headerOffsetTop: number = insets.top + components.appShellTopBar.heightBelowInset;
  const profileImageSource = user?.imageUrl ? { uri: user.imageUrl } : null;

  const { chats, executeSelectChat, executeNewChat } = useAssistantChat();

  const chatHistorySection = useMemo(
    () => ({
      chats,
      onSelectChat: (chatId: string) => {
        void executeSelectChat(chatId);
        router.push("/(tabs)/assistant");
      },
      onNewChat: () => {
        void executeNewChat();
        router.push("/(tabs)/assistant");
      },
    }),
    [chats, executeSelectChat, executeNewChat, router],
  );

  const drawerItems = useMemo(
    () => [
      {
        label: "Home",
        iconName: "home" as const,
        onPress: () => {
          setIsDrawerVisible(false);
          router.push("/(tabs)");
        },
      },
      {
        label: "Garage",
        iconName: "truck" as const,
        onPress: () => {
          setIsDrawerVisible(false);
          router.push("/(tabs)/garage");
        },
      },
      {
        label: "Connect",
        iconName: "link" as const,
        onPress: () => {
          setIsDrawerVisible(false);
          router.push("/(tabs)/connect");
        },
      },
      {
        label: "Assistant",
        iconName: "cpu" as const,
        onPress: () => {
          setIsDrawerVisible(false);
          router.push("/(tabs)/assistant");
        },
      },
      {
        label: "Sign out",
        iconName: "log-out" as const,
        onPress: () => {
          setIsDrawerVisible(false);
          void signOut();
        },
      },
    ],
    [router, signOut],
  );

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={styles.screenRoot}>
      <ThemeProvider value={tabNavigatorTheme}>
        <Tabs
          tabBar={(props) => <InsetTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            sceneStyle: {
              flex: 1,
              backgroundColor: colors.background,
              paddingTop: headerOffsetTop,
            },
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 0,
              elevation: 0,
              height: tabBar.height,
              paddingHorizontal: 4,
              paddingTop: 8,
              paddingBottom: 8,
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
                tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon focused={focused} Icon={tab.Icon} label={tab.title} />,
              }}
            />
          ))}
        </Tabs>
      </ThemeProvider>
      <View style={styles.topBarLayer}>
        <AppShellTopBar topInset={insets.top} profileImageSource={profileImageSource} onPressMenu={() => setIsDrawerVisible(true)} onPressProfile={() => setIsDrawerVisible(true)} />
      </View>
      <AppShellDrawer isVisible={isDrawerVisible} topInset={insets.top} drawerItems={drawerItems} onClose={() => setIsDrawerVisible(false)} chatHistorySection={chatHistorySection} />
    </View>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBarLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
  },
  tabBarCard: {
    borderRadius: tabBar.radius,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
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
    fontFamily: "sans-semibold",
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: "400",
    textAlign: "center",
  },
  labelActive: {
    color: colors.tabBarActive,
  },
  labelInactive: {
    color: colors.tabBarInactive,
  },
});
