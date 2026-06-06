import React, { useEffect, useState } from "react";
import {
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
import { colors } from "./webTheme";
import { getMessagesUnreadCount, getNotifications, unwrap } from "../lib/api";

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
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.includes(route.name));
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;

    const loadBadges = async () => {
      try {
        const [messagePayload, notificationPayload] = await Promise.allSettled([
          getMessagesUnreadCount(),
          getNotifications(),
        ]);

        if (!active) return;

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
        if (active) {
          setUnreadMessages(0);
          setUnreadNotifications(0);
        }
      }
    };

    loadBadges();
    const timer = setInterval(loadBadges, 45000);

    return () => {
      active = false;
      clearInterval(timer);
    };
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
    <View style={styles.tabBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/notifications");
          }}
          activeOpacity={0.86}
        >
          <FontAwesome name="bell" size={15} color="rgba(255,255,255,0.7)" />
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
          <FontAwesome name="commenting" size={15} color="rgba(255,255,255,0.7)" />
          {renderBadge(unreadMessages)}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    backgroundColor: colors.navy,
    borderTopWidth: 0,
    paddingLeft: 10,
    paddingRight: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 12,
  },
  navContent: {
    alignItems: "center",
    gap: 5,
    paddingRight: 10,
  },
  tabItem: {
    minWidth: 64,
    height: 50,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.11)",
  },
  label: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
  },
  labelActive: {
    color: colors.gold,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.12)",
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.navy,
    fontSize: 8,
    fontWeight: "900",
  },
});
