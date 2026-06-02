/**
 * SettingsPage.jsx
 * NU Lipa / Sinag-Bughaw — Admin Panel
 *
 * Sections: General | Storage & Uploads | Features | Security | Danger Zone
 *
 * API:
 *   GET  /api/admin/settings
 *   POST /api/admin/settings
 */

import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

const T = {
  bg: "#f0f4ff", surface: "#ffffff", border: "#e2e8f5",
  text: "#1a2540", muted: "#5b6784", primary: "#4254c5",
  success: "#16a34a", successBg: "#dcfce7",
  danger: "#ef4444", dangerBg: "#fee2e2",
  warning: "#d97706", warningBg: "#fef3c7",
  shadow: "0 2px 12px rgba(66,84,197,.07)",
  shadowMd: "0 4px 24px rgba(66,84,197,.13)",
};

const Sk = ({ w = "100%", h = 14, r = 6, style = {} }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#e8edf8 25%,#f4f6fc 50%,#e8edf8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite linear", ...style }} />
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding: "12px 18px", borderRadius: 12, fontWeight: 600, fontSize: "0.88rem", background: t.type === "error" ? T.dangerBg : T.successBg, color: t.type === "error" ? T.danger : T.success, border: `1px solid ${t.type === "error" ? "#fca5a5" : "#86efac"}`, boxShadow: T.shadowMd, animation: "fadeIn .2s ease" }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 999, background: value ? T.primary : "#d1d5db", cursor: disabled ? "not-allowed" : "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }} />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: T.shadow, overflow: "hidden", marginBottom: 22 }}>
      <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: "1rem", color: T.text }}>{title}</span>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({ label, description, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, paddingBottom: 18, marginBottom: 18, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.text, marginBottom: 3 }}>{label}</div>
        {description && <div style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: "0.86rem", color: T.text, background: T.bg, fontFamily: "inherit", outline: "none", width: 220 };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const { toasts, push: toast } = useToast();

  // Defaults so the page renders even before API responds
  const DEFAULTS = {
    site_name:               "Sinag-Bughaw Digital Yearbook",
    site_tagline:            "NU Lipa College of Computing and Information Technology",
    contact_email:           "",
    maintenance_mode:        "0",
    allow_registration:      "1",
    require_email_verification: "1",
    max_upload_size_mb:      "10",
    allowed_file_types:      "jpg,jpeg,png,mp4,mp3,pdf",
    storage_limit_free_mb:   "500",
    storage_limit_premium_mb:"5120",
    enable_ai_recognition:   "1",
    enable_voice_notes:      "1",
    enable_subscriptions:    "1",
    enable_yearbook_flipbook:"1",
    ai_confidence_threshold: "80",
    session_lifetime_minutes:"120",
    max_login_attempts:      "5",
  };

  useEffect(() => {
    api.get("/admin/settings")
      .then(r => setSettings({ ...DEFAULTS, ...(r.data?.data ?? r.data ?? {}) }))
      .catch(() => setSettings(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setSettings(p => ({ ...p, [key]: val }));
  const bool = key => settings[key] === "1" || settings[key] === true;
  const toggleSetting = key => set(key, bool(key) ? "0" : "1");

  const save = async (keys) => {
    setSaving(true);
    try {
      const payload = keys
        ? Object.fromEntries(keys.map(k => [k, settings[k]]))
        : settings;
      await api.post("/admin/settings", payload);
      toast("Settings saved successfully.");
    } catch {
      toast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const SaveBtn = ({ keys, label = "Save Changes" }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
      <button onClick={() => save(keys)} disabled={saving || loading}
        style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: (saving || loading) ? "not-allowed" : "pointer", opacity: (saving || loading) ? 0.7 : 1, fontFamily: "inherit" }}>
        {saving ? "Saving…" : label}
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: "28px 24px 60px", background: T.bg, minHeight: "100vh", animation: "fadeIn .3s ease" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: T.text, margin: 0 }}>Settings</h1>
          <p style={{ color: T.muted, fontSize: "0.9rem", margin: "6px 0 0" }}>Configure system-wide settings for the Sinag-Bughaw platform.</p>
        </div>

        {/* ── General ── */}
        <SectionCard title="General" icon="⚙️">
          {loading ? <><Sk h={14} style={{ marginBottom: 14 }} /><Sk w="70%" h={14} style={{ marginBottom: 14 }} /><Sk w="50%" h={14} /></> : <>
            <SettingRow label="Site Name" description="The name displayed across the platform.">
              <input value={settings.site_name ?? ""} onChange={e => set("site_name", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Tagline" description="Subtitle shown on login and landing pages.">
              <input value={settings.site_tagline ?? ""} onChange={e => set("site_tagline", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Contact Email" description="Admin contact email for system alerts.">
              <input type="email" value={settings.contact_email ?? ""} onChange={e => set("contact_email", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Maintenance Mode" description="Temporarily disable access for all users except admins.">
              <Toggle value={bool("maintenance_mode")} onChange={() => toggleSetting("maintenance_mode")} />
            </SettingRow>
            <SettingRow label="Allow Registration" description="Allow new users to create accounts.">
              <Toggle value={bool("allow_registration")} onChange={() => toggleSetting("allow_registration")} />
            </SettingRow>
            <div style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
              <SettingRow label="Require Email Verification" description="Users must verify their email before accessing the platform.">
                <Toggle value={bool("require_email_verification")} onChange={() => toggleSetting("require_email_verification")} />
              </SettingRow>
            </div>
            <SaveBtn keys={["site_name","site_tagline","contact_email","maintenance_mode","allow_registration","require_email_verification"]} />
          </>}
        </SectionCard>

        {/* ── Storage & Uploads ── */}
        <SectionCard title="Storage & Uploads" icon="☁️">
          {loading ? <Sk h={14} /> : <>
            <SettingRow label="Max Upload Size (MB)" description="Maximum file size allowed per upload.">
              <input type="number" value={settings.max_upload_size_mb ?? "10"} onChange={e => set("max_upload_size_mb", e.target.value)} style={{ ...inputStyle, width: 100 }} min={1} max={500} />
            </SettingRow>
            <SettingRow label="Allowed File Types" description="Comma-separated extensions (e.g. jpg,png,mp4).">
              <input value={settings.allowed_file_types ?? ""} onChange={e => set("allowed_file_types", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Free Tier Storage (MB)" description="Storage quota for free users.">
              <input type="number" value={settings.storage_limit_free_mb ?? "500"} onChange={e => set("storage_limit_free_mb", e.target.value)} style={{ ...inputStyle, width: 120 }} />
            </SettingRow>
            <div style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
              <SettingRow label="Premium Tier Storage (MB)" description="Storage quota for premium subscribers.">
                <input type="number" value={settings.storage_limit_premium_mb ?? "5120"} onChange={e => set("storage_limit_premium_mb", e.target.value)} style={{ ...inputStyle, width: 120 }} />
              </SettingRow>
            </div>
            <SaveBtn keys={["max_upload_size_mb","allowed_file_types","storage_limit_free_mb","storage_limit_premium_mb"]} />
          </>}
        </SectionCard>

        {/* ── Features ── */}
        <SectionCard title="Feature Toggles" icon="🚀">
          {loading ? <Sk h={14} /> : <>
            <SettingRow label="AI Facial Recognition" description="Enable AWS Rekognition auto-tagging of photos.">
              <Toggle value={bool("enable_ai_recognition")} onChange={() => toggleSetting("enable_ai_recognition")} />
            </SettingRow>
            <SettingRow label="Voice Notes" description="Allow users to send voice memory notes.">
              <Toggle value={bool("enable_voice_notes")} onChange={() => toggleSetting("enable_voice_notes")} />
            </SettingRow>
            <SettingRow label="Subscriptions" description="Enable premium subscription payments via PayMongo.">
              <Toggle value={bool("enable_subscriptions")} onChange={() => toggleSetting("enable_subscriptions")} />
            </SettingRow>
            <div style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
              <SettingRow label="Yearbook Flipbook" description="Enable the interactive React PageFlip yearbook viewer.">
                <Toggle value={bool("enable_yearbook_flipbook")} onChange={() => toggleSetting("enable_yearbook_flipbook")} />
              </SettingRow>
            </div>
            <SaveBtn keys={["enable_ai_recognition","enable_voice_notes","enable_subscriptions","enable_yearbook_flipbook"]} />
          </>}
        </SectionCard>

        {/* ── Security ── */}
        <SectionCard title="Security" icon="🔒">
          {loading ? <Sk h={14} /> : <>
            <SettingRow label="AI Confidence Threshold (%)" description="Minimum confidence for auto-approving AI face tags.">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min={50} max={99} value={settings.ai_confidence_threshold ?? "80"} onChange={e => set("ai_confidence_threshold", e.target.value)} style={{ width: 140, accentColor: T.primary }} />
                <span style={{ fontWeight: 700, color: T.primary, minWidth: 36 }}>{settings.ai_confidence_threshold ?? 80}%</span>
              </div>
            </SettingRow>
            <SettingRow label="Session Lifetime (minutes)" description="How long admin sessions stay active without activity.">
              <input type="number" value={settings.session_lifetime_minutes ?? "120"} onChange={e => set("session_lifetime_minutes", e.target.value)} style={{ ...inputStyle, width: 100 }} min={15} max={1440} />
            </SettingRow>
            <div style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
              <SettingRow label="Max Login Attempts" description="Failed attempts before temporary lockout.">
                <input type="number" value={settings.max_login_attempts ?? "5"} onChange={e => set("max_login_attempts", e.target.value)} style={{ ...inputStyle, width: 80 }} min={1} max={20} />
              </SettingRow>
            </div>
            <SaveBtn keys={["ai_confidence_threshold","session_lifetime_minutes","max_login_attempts"]} />
          </>}
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div style={{ background: T.surface, border: `2px solid ${T.danger}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid #fecaca`, display: "flex", alignItems: "center", gap: 12, background: "#fff5f5" }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: T.danger }}>Danger Zone</span>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.text, marginBottom: 3 }}>Clear Audit Logs</div>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Permanently delete all audit log records. This cannot be undone.</div>
              </div>
              <button
                style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${T.danger}`, background: "none", color: T.danger, fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                onClick={() => { if (window.confirm("Are you sure? This will permanently delete all audit logs.")) { api.delete("/admin/settings/clear-audit-logs").then(() => toast("Audit logs cleared.")).catch(() => toast("Failed.", "error")); } }}>
                Clear Logs
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, paddingTop: 18 }}>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.text, marginBottom: 3 }}>Reset All Settings</div>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Restore all settings to their factory defaults.</div>
              </div>
              <button
                style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: T.dangerBg, color: T.danger, fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                onClick={() => { if (window.confirm("Are you sure? All settings will be reset to defaults.")) { api.post("/admin/settings/reset").then(() => { toast("Settings reset."); setSettings(DEFAULTS); }).catch(() => toast("Failed.", "error")); } }}>
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}