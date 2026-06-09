import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "./webTheme";
import { fetchCurrentUser, imageUrl } from "../lib/api";
import { Image } from "expo-image";

const VISIBLE_TABS = ["home", "directory", "discovery", "gallery", "profile"];
const TAB_ICONS: Record<string, any> = {
  home: "home",
  directory: "users",
  discovery: "compass",
  gallery: "image",
  profile: "th-large",
};

const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NU";

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.includes(route.name));

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((nextUser) => {
        if (active) setUser(nextUser);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const go = (route: any) => {
    setMoreOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const profilePhoto = imageUrl(user?.profile_picture || user?.profile_pic || user?.student_record?.photo);

  return (
    <>
      <SafeAreaView style={styles.navbar} edges={["bottom", "left", "right"]}>
        <View style={styles.navContent}>
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
            if (route.name === "profile") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMoreOpen(true);
              return;
            }

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
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <FontAwesome
                name={TAB_ICONS[route.name] || "circle"}
                size={21}
                color={isFocused ? colors.gold : "rgba(255,255,255,0.68)"}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
          })}
        </View>
      </SafeAreaView>

      <Modal visible={moreOpen} transparent animationType="slide" onRequestClose={() => setMoreOpen(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setMoreOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <TouchableOpacity style={styles.profileRow} onPress={() => go("/profile")}>
              {profilePhoto ? (
                <Image source={profilePhoto} style={styles.sheetAvatar} contentFit="cover" />
              ) : (
                <View style={styles.sheetAvatarFallback}>
                  <Text style={styles.sheetAvatarText}>{initials(user?.name || "Student")}</Text>
                </View>
              )}
              <View style={styles.profileCopy}>
                <Text style={styles.profileName} numberOfLines={1}>{user?.name || "Student"}</Text>
                <Text style={styles.profileRole} numberOfLines={1}>{user?.role || user?.course || "Yearbook profile"}</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />
            <SheetRow icon="briefcase" label="Faculty" onPress={() => go("/faculty")} />
            <SheetRow icon="graduation-cap" label="Sections" onPress={() => go("/sections")} />
            <View style={styles.divider} />
            <SheetRow icon="gear" label="Settings" onPress={() => go({ pathname: "/profile", params: { sheet: "settings" } } as any)} />
          </View>
        </View>
      </Modal>
    </>
  );
};

function SheetRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sheetRow} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.sheetIcon}>
        <FontAwesome name={icon} size={17} color={colors.gold} />
      </View>
      <Text style={styles.sheetLabel}>{label}</Text>
      <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: "#1A2547",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 18,
  },
  navContent: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabItem: {
    width: 64,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: "rgba(245,166,35,0.12)",
  },
  label: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "800",
  },
  labelActive: {
    color: "#F5A623",
    fontWeight: "900",
  },
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  grabber: { width: 42, height: 5, borderRadius: 999, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 10 },
  profileRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12 },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8ECF4" },
  sheetAvatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1A2547", alignItems: "center", justifyContent: "center" },
  sheetAvatarText: { color: "#F5A623", fontWeight: "900", fontSize: 13 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: "#1A2547", fontSize: 16, fontWeight: "900" },
  profileRole: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  sheetRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 },
  sheetIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#1A2547", alignItems: "center", justifyContent: "center" },
  sheetLabel: { flex: 1, color: "#1A2547", fontSize: 16, fontWeight: "900" },
});
