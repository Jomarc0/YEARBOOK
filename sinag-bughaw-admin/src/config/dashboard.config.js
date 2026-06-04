// src/config/dashboard.js

export const DASHBOARD_API_PATH = "/admin/dashboard";
export const AUDIT_LOGS_PATH    = "/audit-logs";
export const LOCALE             = "en-PH";

export const METRIC_CARDS = [
  {
    label:         "Total Students",
    metricKey:     "total_students",
    sub:           "Live from user records",
    subColorClass: "text-emerald-700",
    subBgClass:    "bg-emerald-50",
    icon:          "Users",
    iconBgClass:   "bg-blue-50 text-blue-700",
  },
  {
    label:         "Faculty Members",
    metricKey:     "faculty_members",
    sub:           "Active in system",
    subColorClass: "text-violet-700",
    subBgClass:    "bg-violet-50",
    icon:          "Faculty",
    iconBgClass:   "bg-violet-50 text-violet-700",
  },
  {
    label:         "Gallery Photos",
    metricKey:     "gallery_photos",
    sub:           "Across all albums",
    subColorClass: "text-amber-700",
    subBgClass:    "bg-amber-50",
    icon:          "Photos",
    iconBgClass:   "bg-amber-50 text-amber-700",
  },
  {
    label:         "Active Subscriptions",
    metricKey:     "active_subscriptions",
    sub:           "Premium users",
    subColorClass: "text-emerald-700",
    subBgClass:    "bg-emerald-50",
    icon:          "Premium",
    iconBgClass:   "bg-emerald-50 text-emerald-700",
  },
  {
    label:         "System Alerts",
    metricKey:     "system_alerts",
    // sub, subColorClass, subBgClass, iconBgClass are computed dynamically
    // based on the value — see buildMetricCards() below
    icon:          "Alerts",
  },
];

/**
 * Builds the final metric card props array from live metric data.
 * Call this inside your component after data loads.
 *
 * @param {object} metrics  - data.metrics from the API response
 * @returns {Array}         - array of props ready to spread into <MetricCard>
 */
export function buildMetricCards(metrics = {}) {
  return METRIC_CARDS.map((card) => {
    const raw = metrics[card.metricKey] ?? 0;

    if (card.metricKey === "system_alerts") {
      const hasAlerts = raw > 0;
      return {
        ...card,
        value:         String(raw),
        sub:           hasAlerts ? "Failed actions today" : "All systems normal",
        subColorClass: hasAlerts ? "text-red-700"     : "text-emerald-700",
        subBgClass:    hasAlerts ? "bg-red-50"        : "bg-emerald-50",
        iconBgClass:   hasAlerts ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
      };
    }

    return { ...card, value: raw };
  });
}