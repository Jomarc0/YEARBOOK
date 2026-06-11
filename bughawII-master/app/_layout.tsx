import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MaintenanceNotice from "../components/MaintenanceNotice";
import { getAppConfig, unwrap } from "../lib/api";

export default function RootLayout() {
  const [config, setConfig] = useState<any>(null);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      try {
        const payload = await getAppConfig();
        const nextConfig = unwrap(payload);
        const maintenanceOn = Boolean(nextConfig?.features?.maintenance_mode || nextConfig?.maintenance_mode === true || nextConfig?.maintenance_mode === "1" || nextConfig?.maintenance_mode === 1);
        if (active) {
          setConfig(nextConfig);
          setMaintenance(maintenanceOn);
        }
      } catch {
        if (active) setMaintenance(false);
      }
    };
    loadConfig();
    const interval = setInterval(loadConfig, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (maintenance) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MaintenanceNotice config={config} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
