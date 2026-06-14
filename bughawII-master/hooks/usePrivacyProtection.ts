import { useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export function usePrivacyProtection() {
  const [hidden, setHidden] = useState(AppState.currentState !== "active");

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      setHidden(state !== "active");
    };

    const subscriptions = [
      AppState.addEventListener("change", handleAppStateChange),
      AppState.addEventListener("blur", () => setHidden(true)),
      AppState.addEventListener("focus", () => setHidden(AppState.currentState !== "active")),
    ];

    if (Platform.OS !== "web" || typeof document === "undefined") {
      return () => subscriptions.forEach((subscription) => subscription.remove());
    }

    const hide = () => setHidden(true);
    const show = () => {
      if (!document.hidden && document.hasFocus()) setHidden(false);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) hide();
      else show();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
    };
  }, []);

  return hidden;
}
