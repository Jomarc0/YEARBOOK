import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
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
    return () => { active = false; };
  }, []);

  if (maintenance) {
    return <MaintenanceNotice config={config} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="sso/callback" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="alumni" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="voice-notes" />
      <Stack.Screen name="transcripts" />
      <Stack.Screen name="yearbook" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
