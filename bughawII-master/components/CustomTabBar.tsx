import React, { useEffect, useState } from "react";
import {
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "./webTheme";
import { getAppConfig, getMessagesUnreadCount, getNotifications, unwrap } from "../lib/api";

const VISIBLE_TABS = ["home", "directory", "faculty", "gallery", "sections", "discovery", "analytics"];
const TAB_ICONS: Record<string, any> = {
  home: "home",
  directory: "users",
  faculty: "briefcase",
  gallery: "image",
  sections: "graduation-cap",
  discovery: "compass",
  analytics: "bar-chart",
};

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const features = config?.features || {};
  const directoryEnabled = features.enable_student_directory_search !== false;
  const yearbookName = config?.yearbook_name || "Sinag-Bughaw";
  const schoolName = config?.school_name || "National University Lipa";
  const visibleRoutes = state.routes.filter((route) => {
    if (!VISIBLE_TABS.includes(route.name)) return false;
    if (route.name === "directory") return directoryEnabled;
    return true;
  });

  const loadBadges = React.useCallback(async () => {
    try {
      const [messagePayload, notificationPayload] = await Promise.allSettled([
        getMessagesUnreadCount(),
        getNotifications(),
      ]);

      if (messagePayload.status === "fulfilled") {
        const data = unwrap(messagePayload.value);
        setUnreadMessages(Number(data?.count ?? data?.unread_count ?? data ?? 0) || 0);
      }

      if (notificationPayload.status === "fulfilled") {
        const data = unwrap(notificationPayload.value);
        const list = Array.isArray(data) ? data : data?.data || [];
        setUnreadNotifications(
          list.filter((item: any) => !item?.read_at && item?.read !== true && item?.is_read !== true).length
        );
      }
    } catch {
      setUnreadMessages(0);
      setUnreadNotifications(0);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadBadges();
    }, [loadBadges])
  );

  useEffect(() => {
    loadBadges();
    const timer = setInterval(loadBadges, 45000);
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") loadBadges();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadBadges]);

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((payload) => {
        if (active) setConfig(unwrap(payload));
      })
      .catch(() => {
        if (active) setConfig(null);
      });

    return () => { active = false; };
  }, []);

  const renderBadge = (count: number) => {
    if (!count) return null;
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.navbar} edges={["top", "left", "right"]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.brand}
          activeOpacity={0.86}
          onPress={() => navigation.navigate("home")}
        >
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>NU</Text>
          </View>
          <View>
            <Text style={styles.brandTitle} numberOfLines={1}>{yearbookName.replace(/\s*Digital Yearbook/i, "").toUpperCase()}</Text>
            <Text style={styles.brandSub} numberOfLines={1}>{schoolName.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications");
            }}
            activeOpacity={0.86}
          >
            <FontAwesome name="bell" size={15} color={colors.navy} />
            {renderBadge(unreadNotifications)}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/messages");
            }}
            activeOpacity={0.86}
          >
            <FontAwesome name="commenting" size={15} color={colors.navy} />
            {renderBadge(unreadMessages)}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContent}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.86}
            >
              <FontAwesome
                name={TAB_ICONS[route.name] || "circle"}
                size={18}
                color={isFocused ? colors.gold : "rgba(255,255,255,0.68)"}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: colors.navy,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  brand: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(253,184,19,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  brandSub: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 1,
  },
  navContent: {
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabItem: {
    minWidth: 78,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(253,184,19,0.32)",
  },
  label: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "800",
  },
  labelActive: {
    color: colors.gold,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },
  actionButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.navy,
    fontSize: 8,
    fontWeight: "900",
  },
});
