import { useState } from "react";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Brain,
  Image, MessageSquare, BarChart3, Archive, FileText,
  Settings, Search, Bell, ChevronLeft, Moon,
  CreditCard, Layers, AlertCircle, Eye, HardDrive,
  Zap, Star, Mic, Hash, Lock, Activity,
  MoreVertical, CheckCircle, XCircle, Clock, ArrowUpRight,
  ArrowDownRight, RefreshCw, Download, Plus, Edit3,
  Trash2, ChevronDown, School, Cpu, Camera,
  Award, Globe, X, Shield, Fingerprint, Filter,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ================================================================
// NAV CONFIG
// ================================================================
const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",          icon: LayoutDashboard, badge: null },
  { id: "users",         label: "Users",               icon: Users,           badge: "2.8k" },
  { id: "batches",       label: "Batches",             icon: School,          badge: null },
  { id: "programs",      label: "Programs & Sections", icon: Layers,          badge: null },
  { id: "privacy",       label: "Privacy & Consent",   icon: Shield,          badge: "3" },
  { id: "subscriptions", label: "Subscriptions",       icon: CreditCard,      badge: null },
  { id: "media",         label: "Media Library",       icon: Image,           badge: null },
  { id: "ai",            label: "AI Features",         icon: Brain,           badge: null },
  { id: "yearbooks",     label: "Yearbooks",           icon: BookOpen,        badge: null },
  { id: "graduation",    label: "Graduation",          icon: GraduationCap,   badge: null },
  { id: "messages",      label: "Messages",            icon: MessageSquare,   badge: "12" },
  { id: "analytics",     label: "Analytics",           icon: BarChart3,       badge: null },
  { id: "archives",      label: "Archives",            icon: Archive,         badge: null },
  { id: "reports",       label: "Reports",             icon: FileText,        badge: null },
  { id: "settings",      label: "Settings",            icon: Settings,        badge: null },
];

// ================================================================
// MOCK DATA
// ================================================================
const userGrowthData = [
  { month: "Jan", students: 820, alumni: 340, faculty: 45 },
  { month: "Feb", students: 932, alumni: 390, faculty: 48 },
  { month: "Mar", students: 901, alumni: 430, faculty: 52 },
  { month: "Apr", students: 1034, alumni: 510, faculty: 55 },
  { month: "May", students: 1090, alumni: 580, faculty: 58 },
  { month: "Jun", students: 1200, alumni: 640, faculty: 60 },
  { month: "Jul", students: 1150, alumni: 700, faculty: 62 },
  { month: "Aug", students: 1350, alumni: 780, faculty: 65 },
  { month: "Sep", students: 1420, alumni: 830, faculty: 68 },
  { month: "Oct", students: 1530, alumni: 890, faculty: 70 },
  { month: "Nov", students: 1610, alumni: 950, faculty: 72 },
  { month: "Dec", students: 1720, alumni: 1020, faculty: 75 },
];

const subscriptionData = [
  { month: "Jan", premium: 120, standard: 340, free: 360 },
  { month: "Feb", premium: 145, standard: 380, free: 407 },
  { month: "Mar", premium: 162, standard: 401, free: 338 },
  { month: "Apr", premium: 188, standard: 445, free: 401 },
  { month: "May", premium: 201, standard: 467, free: 422 },
  { month: "Jun", premium: 230, standard: 510, free: 460 },
];

const aiBreakdownData = [
  { name: "Face Recog", value: 4820, color: "#3B82F6" },
  { name: "Transcripts", value: 2340, color: "#F59E0B" },
  { name: "Voice Notes", value: 1560, color: "#10B981" },
  { name: "AI Tags", value: 890, color: "#8B5CF6" },
];

const storageData = [
  { name: "Images", value: 45, color: "#3B82F6" },
  { name: "Videos", value: 29, color: "#F59E0B" },
  { name: "PDFs", value: 15, color: "#10B981" },
  { name: "Audio", value: 11, color: "#EC4899" },
];

const recentActivity = [
  { id: 1, user: "Maria Santos",   action: "uploaded yearbook photos",     time: "2 min ago",  type: "upload",       initials: "MS" },
  { id: 2, user: "Juan dela Cruz", action: "subscribed to Premium",         time: "5 min ago",  type: "subscription", initials: "JC" },
  { id: 3, user: "Ana Reyes",      action: "triggered face recognition",    time: "12 min ago", type: "ai",           initials: "AR" },
  { id: 4, user: "Carlos Gomez",   action: "generated yearbook PDF",        time: "18 min ago", type: "yearbook",     initials: "CG" },
  { id: 5, user: "Lea Valdez",     action: "sent 8 batch notifications",    time: "24 min ago", type: "notification", initials: "LV" },
  { id: 6, user: "Miguel Torres",  action: "requested data deletion",       time: "31 min ago", type: "privacy",      initials: "MT" },
  { id: 7, user: "Rosa Dela Rosa", action: "verified alumni profile",       time: "45 min ago", type: "verify",       initials: "RR" },
];

const usersData = [
  { id: 1, name: "Maria Santos",    email: "m.santos@email.com",    role: "Student", batch: "2024", status: "Active",    sub: "Premium",  joined: "Jan 15, 2024", photos: 48  },
  { id: 2, name: "Juan dela Cruz",  email: "j.delacruz@email.com",  role: "Alumni",  batch: "2022", status: "Active",    sub: "Standard", joined: "Mar 2, 2024",  photos: 123 },
  { id: 3, name: "Ana Reyes",       email: "a.reyes@email.com",     role: "Student", batch: "2024", status: "Suspended", sub: "Free",     joined: "Feb 18, 2024", photos: 12  },
  { id: 4, name: "Carlos Gomez",    email: "c.gomez@email.com",     role: "Alumni",  batch: "2020", status: "Active",    sub: "Premium",  joined: "Dec 5, 2023",  photos: 287 },
  { id: 5, name: "Lea Valdez",      email: "l.valdez@email.com",    role: "Faculty", batch: "—",    status: "Active",    sub: "Free",     joined: "Aug 22, 2023", photos: 64  },
  { id: 6, name: "Miguel Torres",   email: "m.torres@email.com",    role: "Student", batch: "2025", status: "Active",    sub: "Standard", joined: "Jul 10, 2024", photos: 31  },
  { id: 7, name: "Rosa Dela Rosa",  email: "r.delarosa@email.com",  role: "Alumni",  batch: "2019", status: "Inactive",  sub: "Free",     joined: "Nov 12, 2023", photos: 156 },
  { id: 8, name: "Pedro Ramos",     email: "p.ramos@email.com",     role: "Student", batch: "2024", status: "Active",    sub: "Premium",  joined: "Jan 22, 2024", photos: 89  },
];

const batchesData = [
  { id: 1, year: "2024", name: "Batch Pahayag",     students: 342, sections: 8, program: "BSIT", status: "Active",      advisor: "Dr. Santos", pct: 87  },
  { id: 2, year: "2023", name: "Batch Likhain",     students: 318, sections: 7, program: "BSCS", status: "Active",      advisor: "Dr. Reyes",  pct: 100 },
  { id: 3, year: "2022", name: "Batch Liwanag",     students: 295, sections: 7, program: "BSIT", status: "Archived",    advisor: "Prof. Cruz", pct: 100 },
  { id: 4, year: "2021", name: "Batch Sigla",       students: 280, sections: 6, program: "BSCS", status: "Archived",    advisor: "Dr. Santos", pct: 100 },
  { id: 5, year: "2025", name: "Batch Bagong Umaga",students: 201, sections: 5, program: "BSIT", status: "In Progress", advisor: "Prof. Valdez",pct: 34 },
];

const aiLogsData = [
  { id: 1, type: "Face Recognition", user: "Maria Santos",   model: "AWS Rekognition", conf: 98.4, status: "Success",       ts: "2024-12-01 14:23:01" },
  { id: 2, type: "Transcript",        user: "Juan dela Cruz", model: "Groq Whisper",    conf: 94.1, status: "Success",       ts: "2024-12-01 13:45:22" },
  { id: 3, type: "Face Recognition", user: "Ana Reyes",      model: "AWS Rekognition", conf: 67.8, status: "Low Confidence",ts: "2024-12-01 13:12:08" },
  { id: 4, type: "Voice Note",        user: "Carlos Gomez",  model: "Groq Whisper",    conf: 91.2, status: "Success",       ts: "2024-12-01 12:58:44" },
  { id: 5, type: "Face Recognition", user: "Lea Valdez",     model: "AWS Rekognition", conf: 45.2, status: "Failed",        ts: "2024-12-01 12:30:15" },
];

const yearbooksData = [
  { id: 1, title: "Batch Pahayag 2024",     batch: "2024", status: "Published", pages: 248, downloads: 1240, size: "48.2 MB" },
  { id: 2, title: "Batch Likhain 2023",     batch: "2023", status: "Published", pages: 224, downloads: 987,  size: "41.8 MB" },
  { id: 3, title: "Batch Liwanag 2022",     batch: "2022", status: "Archived",  pages: 210, downloads: 654,  size: "38.5 MB" },
  { id: 4, title: "Batch Bagong Umaga 2025",batch: "2025", status: "Draft",     pages: 84,  downloads: 0,    size: "12.1 MB" },
];

// ================================================================
// DESIGN TOKENS (CSS-in-JS to avoid JIT issues)
// ================================================================
const T = {
  bg:        "#070E1C",
  surface:   "#0D1B2E",
  surface2:  "#112039",
  border:    "rgba(148,163,184,0.12)",
  border2:   "rgba(148,163,184,0.2)",
  blue:      "#3B82F6",
  amber:     "#F59E0B",
  emerald:   "#10B981",
  purple:    "#8B5CF6",
  pink:      "#EC4899",
  red:       "#EF4444",
  textPri:   "#E2E8F0",
  textSec:   "#94A3B8",
  textMuted: "#475569",
};

const card = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: 20,
};

// ================================================================
// UTILITY COMPONENTS
// ================================================================
const Badge = ({ children, type = "default" }) => {
  const map = {
    default:      { bg: "rgba(71,85,105,0.5)",   color: "#94A3B8",  border: "rgba(71,85,105,0.3)"  },
    active:       { bg: "rgba(16,185,129,0.15)",  color: "#10B981",  border: "rgba(16,185,129,0.3)" },
    inactive:     { bg: "rgba(71,85,105,0.4)",    color: "#64748B",  border: "rgba(71,85,105,0.2)"  },
    suspended:    { bg: "rgba(239,68,68,0.15)",   color: "#EF4444",  border: "rgba(239,68,68,0.3)"  },
    premium:      { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B",  border: "rgba(245,158,11,0.3)" },
    standard:     { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6",  border: "rgba(59,130,246,0.3)" },
    free:         { bg: "rgba(71,85,105,0.3)",    color: "#64748B",  border: "rgba(71,85,105,0.2)"  },
    success:      { bg: "rgba(16,185,129,0.15)",  color: "#10B981",  border: "rgba(16,185,129,0.3)" },
    warning:      { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B",  border: "rgba(245,158,11,0.3)" },
    danger:       { bg: "rgba(239,68,68,0.15)",   color: "#EF4444",  border: "rgba(239,68,68,0.3)"  },
    info:         { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6",  border: "rgba(59,130,246,0.3)" },
    published:    { bg: "rgba(16,185,129,0.15)",  color: "#10B981",  border: "rgba(16,185,129,0.3)" },
    draft:        { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B",  border: "rgba(245,158,11,0.3)" },
    archived:     { bg: "rgba(71,85,105,0.4)",    color: "#64748B",  border: "rgba(71,85,105,0.2)"  },
    inprogress:   { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6",  border: "rgba(59,130,246,0.3)" },
    alumni:       { bg: "rgba(139,92,246,0.15)",  color: "#8B5CF6",  border: "rgba(139,92,246,0.3)" },
    student:      { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6",  border: "rgba(59,130,246,0.3)" },
    faculty:      { bg: "rgba(20,184,166,0.15)",  color: "#14B8A6",  border: "rgba(20,184,166,0.3)" },
  };
  const s = map[type] || map.default;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  );
};

const AvatarCircle = ({ initials, size = 32 }) => {
  const palettes = ["rgba(59,130,246,0.2)","rgba(245,158,11,0.2)","rgba(16,185,129,0.2)","rgba(139,92,246,0.2)","rgba(236,72,153,0.2)","rgba(239,68,68,0.2)"];
  const textPalettes = [T.blue, T.amber, T.emerald, T.purple, T.pink, T.red];
  const idx = (initials.charCodeAt(0) || 0) % palettes.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: palettes[idx], color: textPalettes[idx], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, border: `1px solid ${textPalettes[idx]}40` }}>
      {initials}
    </div>
  );
};

const Btn = ({ children, variant = "primary", size = "md", onClick, icon: Icon, disabled }) => {
  const styles = {
    primary:   { background: "#2563EB", color: "#fff",      border: "1px solid #2563EB" },
    secondary: { background: T.surface2, color: T.textPri,  border: `1px solid ${T.border2}` },
    danger:    { background: "rgba(239,68,68,0.15)", color: T.red, border: "1px solid rgba(239,68,68,0.3)" },
    success:   { background: "rgba(16,185,129,0.15)", color: T.emerald, border: "1px solid rgba(16,185,129,0.3)" },
    ghost:     { background: "transparent", color: T.textSec, border: "1px solid transparent" },
  };
  const pads = { sm: "6px 12px", md: "8px 16px", lg: "10px 20px" };
  const fs   = { sm: 12, md: 13, lg: 14 };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: pads[size], borderRadius: 10, fontSize: fs[size], fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...styles[variant] }}
    >
      {Icon && <Icon size={fs[size] - 1} />}
      {children}
    </button>
  );
};

const SectionCard = ({ children, style = {} }) => (
  <div style={{ ...card, ...style }}>{children}</div>
);

const PageHdr = ({ title, subtitle, icon: Icon, actions }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {Icon && (
        <div style={{ padding: 10, borderRadius: 12, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
          <Icon size={20} color={T.blue} />
        </div>
      )}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.textPri, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: T.textSec, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
    {actions && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{actions}</div>}
  </div>
);

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const cmap = {
    blue:    { accent: T.blue,    bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.2)"  },
    amber:   { accent: T.amber,   bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.2)"  },
    emerald: { accent: T.emerald, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.2)"  },
    purple:  { accent: T.purple,  bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.2)"  },
    red:     { accent: T.red,     bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.2)"   },
  };
  const c = cmap[color] || cmap.blue;
  const up = change >= 0;
  return (
    <div style={{ ...card, background: c.bg, border: `1px solid ${c.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: T.textPri, margin: "4px 0 0", letterSpacing: "-0.02em" }}>{value}</p>
        </div>
        <div style={{ padding: 10, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={20} color={c.accent} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {up ? <ArrowUpRight size={13} color={T.emerald} /> : <ArrowDownRight size={13} color={T.red} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.emerald : T.red }}>{up ? "+" : ""}{change}%</span>
        <span style={{ fontSize: 12, color: T.textMuted }}>vs last month</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
          <span style={{ color: T.textSec, textTransform: "capitalize" }}>{e.name}:</span>
          <span style={{ color: T.textPri, fontWeight: 700 }}>{e.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.8)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "#0A1628", border: `1px solid ${T.border2}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.textPri, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSec, padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// ================================================================
// DASHBOARD
// ================================================================
const DashboardPage = ({ showToast }) => {
  const stats = [
    { title: "Total Users",           value: "2,847",  change: 12.4,  icon: Users,      color: "blue"    },
    { title: "Active Subscriptions",  value: "641",    change: 8.2,   icon: CreditCard, color: "amber"   },
    { title: "Storage Used",          value: "248 GB", change: -2.1,  icon: HardDrive,  color: "emerald" },
    { title: "AI Processes",          value: "12,394", change: 24.7,  icon: Brain,      color: "purple"  },
  ];
  return (
    <div>
      <PageHdr
        title="Dashboard"
        subtitle="Welcome back, Admin. Platform overview at a glance."
        icon={LayoutDashboard}
        actions={<><Btn variant="secondary" size="sm" icon={RefreshCw}>Refresh</Btn><Btn variant="primary" size="sm" icon={Download}>Export</Btn></>}
      />
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>
      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>
        {/* Area Chart */}
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: 0 }}>User Growth</p>
              <p style={{ fontSize: 12, color: T.textSec, margin: "2px 0 0" }}>Monthly registrations by role</p>
            </div>
            <select style={{ fontSize: 12, background: T.surface2, border: `1px solid ${T.border}`, color: T.textSec, borderRadius: 8, padding: "6px 10px", outline: "none" }}>
              <option>This Year</option><option>Last Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0F2040" />
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} fill="url(#gs)" name="Students" />
              <Area type="monotone" dataKey="alumni"   stroke="#F59E0B" strokeWidth={2} fill="url(#ga)" name="Alumni" />
              <Area type="monotone" dataKey="faculty"  stroke="#10B981" strokeWidth={2} fill="transparent" name="Faculty" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[["#3B82F6","Students"],["#F59E0B","Alumni"],["#10B981","Faculty"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSec }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}
              </div>
            ))}
          </div>
        </SectionCard>
        {/* AI Pie */}
        <SectionCard>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: "0 0 4px" }}>AI Processing</p>
          <p style={{ fontSize: 12, color: T.textSec, margin: "0 0 12px" }}>Operations this month</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={aiBreakdownData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
                {aiBreakdownData.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10 }}>
            {aiBreakdownData.map(item => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: 12, color: T.textSec }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textPri }}>{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Subs Bar */}
        <SectionCard>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: "0 0 4px" }}>Subscriptions</p>
          <p style={{ fontSize: 12, color: T.textSec, margin: "0 0 16px" }}>Plan distribution over 6 months</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={subscriptionData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0F2040" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="premium"  fill="#F59E0B" radius={[4,4,0,0]} name="Premium"  maxBarSize={18} />
              <Bar dataKey="standard" fill="#3B82F6" radius={[4,4,0,0]} name="Standard" maxBarSize={18} />
              <Bar dataKey="free"     fill="#334155" radius={[4,4,0,0]} name="Free"     maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
        {/* Live Feed */}
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: 0 }}>Live Activity</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.emerald }} />
              <span style={{ fontSize: 11, color: T.emerald, fontWeight: 600 }}>Live</span>
            </div>
          </div>
          {recentActivity.map(item => {
            const typeColor = { upload:"#3B82F6", subscription:"#F59E0B", ai:"#8B5CF6", yearbook:"#14B8A6", notification:"#EC4899", privacy:"#EF4444", verify:"#10B981" };
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <AvatarCircle initials={item.initials} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: T.textPri, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong style={{ color: T.textPri }}>{item.user}</strong>{" "}
                    <span style={{ color: typeColor[item.type] }}>{item.action}</span>
                  </p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{item.time}</p>
                </div>
              </div>
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
};

// ================================================================
// USERS
// ================================================================
const UsersPage = ({ showToast }) => {
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [sel, setSel] = useState(null);

  const filtered = usersData.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mr = roleF === "all" || u.role.toLowerCase() === roleF;
    const mst = statusF === "all" || u.status.toLowerCase() === statusF;
    return ms && mr && mst;
  });

  const TH = ({ children }) => (
    <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{children}</th>
  );
  const TD = ({ children }) => (
    <td style={{ padding: "12px 14px", fontSize: 13, color: T.textPri, borderBottom: `1px solid ${T.border}` }}>{children}</td>
  );

  return (
    <div>
      <PageHdr
        title="User Management"
        subtitle={`${usersData.length} registered users · Search, filter, edit, and moderate`}
        icon={Users}
        actions={<><Btn variant="secondary" size="sm" icon={Download}>Export</Btn><Btn variant="primary" size="sm" icon={Plus}>Add User</Btn></>}
      />
      {/* Filter Bar */}
      <SectionCard style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={13} color={T.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.textPri, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {[
            { label: "All Roles", value: roleF, setter: setRoleF, opts: [["all","All Roles"],["student","Student"],["alumni","Alumni"],["faculty","Faculty"]] },
            { label: "All Status", value: statusF, setter: setStatusF, opts: [["all","All Status"],["active","Active"],["suspended","Suspended"],["inactive","Inactive"]] },
          ].map(f => (
            <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
              style={{ padding: "8px 12px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.textSec, outline: "none" }}>
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <Btn variant="ghost" size="sm" icon={Filter}>More Filters</Btn>
        </div>
      </SectionCard>
      {/* Table */}
      <SectionCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User","Role","Batch","Status","Plan","Photos","Actions"].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const roleBadge = u.role === "Alumni" ? "alumni" : u.role === "Student" ? "student" : "faculty";
                const stsBadge = u.status === "Active" ? "active" : u.status === "Suspended" ? "suspended" : "inactive";
                const subBadge = u.sub === "Premium" ? "premium" : u.sub === "Standard" ? "standard" : "free";
                return (
                  <tr key={u.id} style={{ cursor: "pointer" }}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AvatarCircle initials={u.name.split(" ").map(n=>n[0]).join("").slice(0,2)} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, color: T.textPri }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: T.textSec }}>{u.email}</div>
                        </div>
                      </div>
                    </TD>
                    <TD><Badge type={roleBadge}>{u.role}</Badge></TD>
                    <TD><span style={{ color: T.textSec }}>{u.batch}</span></TD>
                    <TD><Badge type={stsBadge}>{u.status}</Badge></TD>
                    <TD><Badge type={subBadge}>{u.sub}</Badge></TD>
                    <TD><span style={{ color: T.textSec }}>{u.photos}</span></TD>
                    <TD>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[
                          { icon: Eye,   title: "View",    action: () => setSel(u),   color: T.blue   },
                          { icon: Edit3, title: "Edit",    action: () => showToast(`Editing ${u.name}`, "info"),    color: T.amber  },
                          { icon: Lock,  title: "Suspend", action: () => showToast(`${u.name} suspended`, "warning"), color: T.red  },
                        ].map(btn => (
                          <button key={btn.title} title={btn.title} onClick={btn.action}
                            style={{ padding: 6, borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, cursor: "pointer", color: T.textMuted, display: "flex" }}>
                            <btn.icon size={13} color={btn.color} />
                          </button>
                        ))}
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Users size={32} color={T.textMuted} style={{ margin: "0 auto 10px" }} />
              <p style={{ color: T.textSec, fontSize: 13 }}>No users match your filters.</p>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Showing {filtered.length} of {usersData.length} users</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm">← Previous</Btn>
            <span style={{ fontSize: 12, color: T.textSec, alignSelf: "center" }}>Page 1 of 1</span>
            <Btn variant="ghost" size="sm">Next →</Btn>
          </div>
        </div>
      </SectionCard>
      {/* Detail Modal */}
      <Modal open={!!sel} onClose={() => setSel(null)} title="User Profile">
        {sel && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <AvatarCircle initials={sel.name.split(" ").map(n=>n[0]).join("").slice(0,2)} size={52} />
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: T.textPri, margin: 0 }}>{sel.name}</h4>
                <p style={{ fontSize: 13, color: T.textSec, margin: "2px 0 6px" }}>{sel.email}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge type={sel.role.toLowerCase()}>{sel.role}</Badge>
                  <Badge type={sel.status === "Active" ? "active" : "suspended"}>{sel.status}</Badge>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[["Batch",sel.batch],["Plan",sel.sub],["Photos Uploaded",sel.photos],["Joined",sel.joined]].map(([l,v]) => (
                <div key={l} style={{ background: T.surface2, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{l}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" size="sm" icon={Edit3}>Edit Profile</Btn>
              <Btn variant="danger"  size="sm" icon={Lock}>Suspend</Btn>
              <Btn variant="secondary" size="sm" icon={Shield}>Consent Logs</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ================================================================
// BATCHES
// ================================================================
const BatchesPage = ({ showToast }) => {
  const TH = ({ children }) => (
    <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{children}</th>
  );
  const TD = ({ children }) => (
    <td style={{ padding: "12px 14px", fontSize: 13, color: T.textPri, borderBottom: `1px solid ${T.border}` }}>{children}</td>
  );
  return (
    <div>
      <PageHdr
        title="Batch Management"
        subtitle="Manage graduation batches, sections, and yearbook generation"
        icon={School}
        actions={<><Btn variant="secondary" size="sm" icon={Zap}>Auto-Generate</Btn><Btn variant="primary" size="sm" icon={Plus}>New Batch</Btn></>}
      />
      {/* Mini KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Batches",  value: batchesData.length, icon: Layers },
          { label: "Active",         value: batchesData.filter(b=>b.status==="Active").length, icon: CheckCircle },
          { label: "Total Students", value: batchesData.reduce((a,b)=>a+b.students,0).toLocaleString(), icon: Users },
          { label: "Total Sections", value: batchesData.reduce((a,b)=>a+b.sections,0), icon: Hash },
        ].map(k => (
          <div key={k.label} style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: 9, borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}><k.icon size={17} color={T.blue} /></div>
            <div><p style={{ fontSize: 11, color: T.textSec, margin: 0 }}>{k.label}</p><p style={{ fontSize: 20, fontWeight: 800, color: T.textPri, margin: "2px 0 0", letterSpacing: "-0.02em" }}>{k.value}</p></div>
          </div>
        ))}
      </div>
      {/* Table */}
      <SectionCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Year","Batch Name","Students","Sections","Program","Status","Profile Completion","Actions"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>
              {batchesData.map(b => {
                const sv = b.status==="Active"?"active":b.status==="In Progress"?"inprogress":"archived";
                return (
                  <tr key={b.id}>
                    <TD><span style={{ color: T.blue, fontWeight: 800, fontSize: 14 }}>{b.year}</span></TD>
                    <TD>
                      <div style={{ fontWeight: 600, color: T.textPri }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{b.advisor}</div>
                    </TD>
                    <TD>{b.students.toLocaleString()}</TD>
                    <TD>{b.sections}</TD>
                    <TD><Badge type="info">{b.program}</Badge></TD>
                    <TD><Badge type={sv}>{b.status}</Badge></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(148,163,184,0.1)", borderRadius: 3, minWidth: 80 }}>
                          <div style={{ height: 6, width: `${b.pct}%`, background: b.pct === 100 ? T.emerald : T.blue, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: T.textSec, minWidth: 32 }}>{b.pct}%</span>
                      </div>
                    </TD>
                    <TD>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[Eye, Edit3, BookOpen].map((Icon, i) => (
                          <button key={i} onClick={() => i===2 && showToast(`Generating yearbook for ${b.name}…`, "success")}
                            style={{ padding: 6, borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, cursor: "pointer", display: "flex" }}>
                            <Icon size={13} color={[T.blue, T.amber, T.emerald][i]} />
                          </button>
                        ))}
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

// ================================================================
// AI FEATURES
// ================================================================
const AIFeaturesPage = ({ showToast }) => {
  const TH = ({ children }) => (
    <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{children}</th>
  );
  const TD = ({ children }) => (
    <td style={{ padding: "12px 14px", fontSize: 13, color: T.textPri, borderBottom: `1px solid ${T.border}` }}>{children}</td>
  );
  return (
    <div>
      <PageHdr title="AI Management" subtitle="Monitor AWS Rekognition & Groq operations, confidence scores, and processing logs" icon={Brain}
        actions={<><Btn variant="secondary" size="sm" icon={RefreshCw}>Sync Logs</Btn><Btn variant="primary" size="sm" icon={Download}>Export</Btn></>}
      />
      {/* AI KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label:"Face Detections", value:"4,820",  icon: Fingerprint, change:"+18%", col: T.blue    },
          { label:"Transcripts",     value:"2,340",  icon: Mic,         change:"+12%", col: T.amber   },
          { label:"Avg Confidence",  value:"94.2%",  icon: Cpu,         change:"+2.1%",col: T.emerald },
          { label:"Failed Ops",      value:"47",     icon: AlertCircle, change:"-8%",  col: T.red     },
        ].map(k => (
          <div key={k.label} style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{k.label}</p>
              <div style={{ padding: 8, borderRadius: 8, background: `${k.col}20`, border: `1px solid ${k.col}40` }}><k.icon size={14} color={k.col} /></div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: T.textPri, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{k.value}</p>
            <p style={{ fontSize: 12, color: k.change.startsWith("+") ? T.emerald : T.red, margin: 0, fontWeight: 600 }}>{k.change} this month</p>
          </div>
        ))}
      </div>
      {/* Logs */}
      <SectionCard style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: 0 }}>AI Operation Logs</p>
          <select style={{ fontSize: 12, background: T.surface2, border: `1px solid ${T.border}`, color: T.textSec, borderRadius: 8, padding: "6px 10px", outline: "none" }}>
            <option>All Types</option><option>Face Recognition</option><option>Transcript</option><option>Voice Note</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Type","User","Model","Confidence","Status","Timestamp",""].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>
              {aiLogsData.map(l => {
                const sv = l.status==="Success"?"success":l.status==="Failed"?"danger":"warning";
                const cc = l.conf>=90 ? T.emerald : l.conf>=70 ? T.amber : T.red;
                const typeIcon = l.type==="Face Recognition"?Camera:l.type==="Transcript"?FileText:Mic;
                const typeColor = l.type==="Face Recognition"?T.blue:l.type==="Transcript"?T.amber:T.emerald;
                return (
                  <tr key={l.id}>
                    <TD>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {(() => { const I = typeIcon; return <I size={13} color={typeColor} />; })()}
                        <span>{l.type}</span>
                      </div>
                    </TD>
                    <TD>{l.user}</TD>
                    <TD><Badge type="info">{l.model}</Badge></TD>
                    <TD><span style={{ fontWeight:700, color:cc }}>{l.conf}%</span></TD>
                    <TD><Badge type={sv}>{l.status}</Badge></TD>
                    <TD><span style={{ color:T.textSec, fontSize:11 }}>{l.ts}</span></TD>
                    <TD><button style={{ padding:6, borderRadius:8, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex" }}><Eye size={13} color={T.blue}/></button></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
      {/* Service Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { name:"AWS Rekognition", desc:"Face detection & indexing", icon:Camera, col:T.blue, latency:"124ms" },
          { name:"Groq (Whisper)",  desc:"Audio transcription",       icon:Mic,    col:T.amber, latency:"89ms" },
        ].map(s => (
          <SectionCard key={s.name}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ padding:10, borderRadius:12, background:`${s.col}20`, border:`1px solid ${s.col}40` }}><s.icon size={20} color={s.col} /></div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:0 }}>{s.name}</p>
                  <p style={{ fontSize:12, color:T.textSec, margin:"2px 0 0" }}>{s.desc}</p>
                </div>
              </div>
              <Badge type="active">Connected</Badge>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[["Latency",s.latency],["Uptime","99.9%"],["Quota Used","84%"]].map(([l,v])=>(
                <div key={l} style={{ background:T.surface2, borderRadius:10, padding:"10px 12px", textAlign:"center", border:`1px solid ${T.border}` }}>
                  <p style={{ fontSize:15, fontWeight:800, color:T.textPri, margin:0 }}>{v}</p>
                  <p style={{ fontSize:11, color:T.textSec, margin:"4px 0 0" }}>{l}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

// ================================================================
// YEARBOOKS
// ================================================================
const YearbooksPage = ({ showToast }) => (
  <div>
    <PageHdr title="Digital Yearbook Management" subtitle="Generate, preview, publish, and archive yearbooks with DomPDF + React PageFlip" icon={BookOpen}
      actions={<><Btn variant="secondary" size="sm" icon={Eye}>Preview Flipbook</Btn><Btn variant="primary" size="sm" icon={Zap} onClick={()=>showToast("Yearbook generation queued!","success")}>Generate Yearbook</Btn></>}
    />
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
      {yearbooksData.map(yb => {
        const sv = yb.status==="Published"?"published":yb.status==="Draft"?"draft":"archived";
        return (
          <div key={yb.id} style={{ ...card }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
              <div style={{ width:44, height:60, borderRadius:8, background:"linear-gradient(135deg,#1D4ED8,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <BookOpen size={20} color="#fff" />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:"0 0 6px" }}>{yb.title} Yearbook</p>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge type={sv}>{yb.status}</Badge>
                  <span style={{ fontSize:11, color:T.textSec }}>Batch {yb.batch}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {[["Pages",yb.pages],["Downloads",yb.downloads.toLocaleString()],["Size",yb.size]].map(([l,v])=>(
                <div key={l} style={{ background:T.surface2, borderRadius:10, padding:"10px 12px", textAlign:"center", border:`1px solid ${T.border}` }}>
                  <p style={{ fontSize:15, fontWeight:800, color:T.textPri, margin:0 }}>{v}</p>
                  <p style={{ fontSize:11, color:T.textSec, margin:"4px 0 0" }}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" size="sm" icon={Eye}>Preview</Btn>
              <Btn variant="secondary" size="sm" icon={Download}>PDF</Btn>
              {yb.status==="Draft" && <Btn variant="success" size="sm" icon={Globe} onClick={()=>showToast(`${yb.title} published!`,"success")}>Publish</Btn>}
              {yb.status==="Published" && <Btn variant="danger" size="sm" icon={AlertCircle} onClick={()=>showToast(`${yb.title} unpublished`,"warning")}>Unpublish</Btn>}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ================================================================
// ANALYTICS
// ================================================================
const AnalyticsPage = () => (
  <div>
    <PageHdr title="Analytics & Engagement" subtitle="Platform performance, user behavior, and trending content metrics" icon={BarChart3}
      actions={<><select style={{ fontSize:12, background:T.surface2, border:`1px solid ${T.border}`, color:T.textSec, borderRadius:8, padding:"8px 12px", outline:"none" }}><option>Last 30 days</option><option>Last 90 days</option><option>This year</option></select><Btn variant="secondary" size="sm" icon={Download}>Export Report</Btn></>}
    />
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
      {[
        { label:"Page Views",    value:"142,840", change:"+18.3%", up:true  },
        { label:"Avg. Session",  value:"4m 32s",  change:"+5.1%",  up:true  },
        { label:"Bounce Rate",   value:"34.2%",   change:"-8.2%",  up:false },
        { label:"Return Rate",   value:"68.4%",   change:"+12.7%", up:true  },
      ].map(m=>(
        <div key={m.label} style={{ ...card }}>
          <p style={{ fontSize:11, color:T.textSec, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 6px" }}>{m.label}</p>
          <p style={{ fontSize:22, fontWeight:800, color:T.textPri, margin:"0 0 6px", letterSpacing:"-0.02em" }}>{m.value}</p>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {m.up ? <ArrowUpRight size={13} color={T.emerald}/> : <ArrowDownRight size={13} color={T.red}/>}
            <span style={{ fontSize:12, fontWeight:700, color:m.up?T.emerald:T.red }}>{m.change}</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:20 }}>
      <SectionCard>
        <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:"0 0 16px" }}>Activity Over Time</p>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F2040" />
            <XAxis dataKey="month" tick={{fill:T.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Line type="monotone" dataKey="students" stroke={T.blue}   strokeWidth={2.5} dot={false} name="Students"/>
            <Line type="monotone" dataKey="alumni"   stroke={T.amber}  strokeWidth={2.5} dot={false} name="Alumni"/>
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>
      <SectionCard>
        <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:"0 0 16px" }}>Storage Distribution</p>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie data={storageData} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value"
              label={({name,value})=>`${name} ${value}%`} labelLine={false}
              style={{fontSize:11}}>
              {storageData.map((e,i)=><Cell key={i} fill={e.color} strokeWidth={0}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
    {/* Top Alumni */}
    <SectionCard>
      <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:"0 0 16px" }}>Most Viewed Alumni Profiles</p>
      {[
        { rank:1, name:"Carlos Gomez",    batch:"2020", views:2847, trend:"+24%", up:true  },
        { rank:2, name:"Maria Santos",    batch:"2024", views:2341, trend:"+12%", up:true  },
        { rank:3, name:"Ana Reyes",       batch:"2022", views:1923, trend:"-3%",  up:false },
        { rank:4, name:"Juan dela Cruz",  batch:"2022", views:1654, trend:"+8%",  up:true  },
        { rank:5, name:"Rosa Dela Rosa",  batch:"2019", views:1421, trend:"+31%", up:true  },
      ].map(u=>(
        <div key={u.rank} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <span style={{ width:20, textAlign:"center", fontSize:13, fontWeight:800, color:u.rank===1?T.amber:u.rank===2?"#94A3B8":u.rank===3?"#92400E":T.textMuted }}>{u.rank}</span>
          <AvatarCircle initials={u.name.split(" ").map(n=>n[0]).join("").slice(0,2)} size={30}/>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:600, color:T.textPri, margin:0 }}>{u.name}</p>
            <p style={{ fontSize:11, color:T.textSec, margin:0 }}>Batch {u.batch}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:13, fontWeight:700, color:T.textPri, margin:0 }}>{u.views.toLocaleString()}</p>
            <p style={{ fontSize:11, color:u.up?T.emerald:T.red, margin:0 }}>{u.trend}</p>
          </div>
        </div>
      ))}
    </SectionCard>
  </div>
);

// ================================================================
// STUB PAGE
// ================================================================
const StubPage = ({ title, desc, icon: Icon, features }) => (
  <div>
    <PageHdr title={title} subtitle={desc} icon={Icon}/>
    <div style={{ ...card, padding:60, textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:18, background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <Icon size={28} color={T.blue}/>
      </div>
      <h3 style={{ fontSize:18, fontWeight:700, color:T.textPri, margin:"0 0 8px" }}>{title} Module</h3>
      <p style={{ fontSize:13, color:T.textSec, maxWidth:400, margin:"0 auto 24px" }}>{desc}</p>
      {features && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:480, margin:"0 auto 28px" }}>
          {features.map(f=>(
            <span key={f} style={{ padding:"6px 12px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:20, fontSize:12, color:T.textSec }}>{f}</span>
          ))}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:T.amber }}/>
        <span style={{ fontSize:13, color:T.amber, fontWeight:600 }}>Ready to implement — send Blade files to convert</span>
      </div>
    </div>
  </div>
);

const STUBS = {
  programs:      { title:"Programs & Sections",   desc:"Manage academic programs and section assignments across batches",         icon:Layers,       features:["BSIT","BSCS","BSBA","Section CRUD","Auto-assign","Faculty mapping"]                       },
  privacy:       { title:"Privacy & Consent",     desc:"GDPR-compliant consent logs, data requests, and audit trail management",  icon:Shield,       features:["Consent logs","GDPR requests","Audit trail","Data deletion","Export logs","Policy mgmt"]   },
  subscriptions: { title:"Subscriptions & Billing",desc:"Monitor PayMongo payments, storage quotas, and revenue overview",       icon:CreditCard,   features:["PayMongo","Cloudinary","Firebase","Quota mgmt","Revenue charts","Invoice export"]            },
  media:         { title:"Media Library",         desc:"Manage all multimedia assets — images, videos, audio, and watermarks",    icon:Image,        features:["Photo library","Video archive","Audio files","Watermarks","CDN stats","Backup status"]       },
  graduation:    { title:"Graduation Module",     desc:"Ceremony management, toga gallery, programs, and archive",                icon:GraduationCap,features:["Programs","Invitations","Toga gallery","Graduation songs","Guest speeches","Archives"]         },
  messages:      { title:"Messaging & Notifications",desc:"Real-time announcements, push notifications, email logs, and OTP",    icon:MessageSquare,features:["Announcements","Push notifs","OTP logs","Email history","Laravel Reverb","Batch send"]        },
  archives:      { title:"Archive & Preservation",desc:"Historical yearbooks, cloud backups, and archive restoration tools",      icon:Archive,      features:["Yearbook archive","Cloud backup","Restore","Timeline","Media preservation","Export"]          },
  reports:       { title:"Reports & Audit Logs",  desc:"Admin activity, login history, content deletions, and system audit",     icon:FileText,     features:["Admin logs","Login history","Content logs","Sub changes","AI logs","PDF export"]             },
  settings:      { title:"System Settings",       desc:"Configure integrations, security, email, storage, and API keys",         icon:Settings,     features:["Integrations","Security","Email SMTP","Storage","API keys","Maintenance mode"]               },
};

// ================================================================
// SIDEBAR
// ================================================================
const Sidebar = ({ page, setPage, collapsed, setCollapsed }) => (
  <aside style={{ position:"fixed", left:0, top:0, height:"100vh", width:collapsed?62:234, background:"#060D1A", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", zIndex:50, transition:"width 0.25s cubic-bezier(0.4,0,0.2,1)", overflow:"hidden" }}>
    {/* Logo */}
    <div style={{ padding:"18px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#2563EB,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 12px rgba(37,99,235,0.4)" }}>
        <Star size={17} color="#fff" />
      </div>
      {!collapsed && (
        <div style={{ overflow:"hidden", whiteSpace:"nowrap" }}>
          <p style={{ fontSize:13, fontWeight:800, color:T.textPri, margin:0, letterSpacing:"-0.01em" }}>Sinag-Bughaw</p>
          <p style={{ fontSize:10, color:T.textMuted, margin:0 }}>Admin Portal</p>
        </div>
      )}
    </div>
    {/* Nav */}
    <nav style={{ flex:1, overflowY:"auto", padding:"8px 8px", overflowX:"hidden" }}>
      {NAV_ITEMS.map(item => {
        const active = page === item.id;
        return (
          <button key={item.id} onClick={()=>setPage(item.id)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"9px 10px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:2, justifyContent:collapsed?"center":"flex-start", background:active?"rgba(37,99,235,0.2)":"transparent", position:"relative", transition:"background 0.15s", whiteSpace:"nowrap" }}>
            <item.icon size={17} color={active?T.blue:T.textMuted} style={{ flexShrink:0 }}/>
            {!collapsed && <span style={{ fontSize:13, fontWeight:active?600:400, color:active?T.textPri:T.textSec }}>{item.label}</span>}
            {!collapsed && item.badge && (
              <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20, background:active?"rgba(37,99,235,0.3)":"rgba(71,85,105,0.4)", color:active?T.blue:T.textMuted }}>{item.badge}</span>
            )}
            {collapsed && item.badge && <div style={{ position:"absolute", top:6, right:6, width:6, height:6, borderRadius:"50%", background:T.blue }}/>}
          </button>
        );
      })}
    </nav>
    {/* Footer */}
    <div style={{ padding:"8px 8px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
      <button onClick={()=>setCollapsed(!collapsed)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:10, border:"none", background:"transparent", cursor:"pointer", color:T.textMuted, justifyContent:collapsed?"center":"flex-start" }}>
        <ChevronLeft size={16} color={T.textMuted} style={{ transform:collapsed?"rotate(180deg)":"none", transition:"transform 0.25s", flexShrink:0 }}/>
        {!collapsed && <span style={{ fontSize:12, color:T.textMuted }}>Collapse</span>}
      </button>
      {!collapsed && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px" }}>
          <AvatarCircle initials="SA" size={28}/>
          <div style={{ overflow:"hidden" }}>
            <p style={{ fontSize:12, fontWeight:600, color:T.textPri, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Super Admin</p>
            <p style={{ fontSize:10, color:T.textMuted, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>admin@sinagbughaw.edu</p>
          </div>
        </div>
      )}
    </div>
  </aside>
);

// ================================================================
// HEADER
// ================================================================
const Header = ({ page, collapsed }) => {
  const left = collapsed ? 62 : 234;
  const item = NAV_ITEMS.find(n => n.id === page);
  return (
    <header style={{ position:"fixed", top:0, left:left, right:0, height:54, background:"rgba(7,14,28,0.9)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:16, zIndex:40, transition:"left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ flex:1, position:"relative", maxWidth:300 }}>
        <Search size={13} color={T.textMuted} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
        <input placeholder={`Search in ${item?.label || "admin"}…`} style={{ width:"100%", paddingLeft:30, paddingRight:12, paddingTop:7, paddingBottom:7, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:9, fontSize:12, color:T.textPri, outline:"none", boxSizing:"border-box" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button style={{ padding:8, borderRadius:10, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", position:"relative" }}>
          <Bell size={16} color={T.textSec}/>
          <div style={{ position:"absolute", top:6, right:6, width:5, height:5, borderRadius:"50%", background:T.red }}/>
        </button>
        <button style={{ padding:8, borderRadius:10, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex" }}>
          <Moon size={16} color={T.textSec}/>
        </button>
        <div style={{ width:1, height:24, background:T.border, margin:"0 4px" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
          <AvatarCircle initials="SA" size={30}/>
          <ChevronDown size={13} color={T.textSec}/>
        </div>
      </div>
    </header>
  );
};

// ================================================================
// TOAST
// ================================================================
const Toast = ({ message, type, onClose }) => {
  const map = {
    success: { border:T.emerald, bg:"rgba(16,185,129,0.12)", color:T.emerald, Icon:CheckCircle },
    error:   { border:T.red,     bg:"rgba(239,68,68,0.12)",  color:T.red,     Icon:XCircle     },
    warning: { border:T.amber,   bg:"rgba(245,158,11,0.12)", color:T.amber,   Icon:AlertCircle },
    info:    { border:T.blue,    bg:"rgba(59,130,246,0.12)", color:T.blue,    Icon:Activity    },
  };
  const s = map[type] || map.info;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:12, background:s.bg, border:`1px solid ${s.border}40`, boxShadow:"0 10px 25px rgba(0,0,0,0.4)", minWidth:260 }}>
      <s.Icon size={16} color={s.color}/>
      <span style={{ fontSize:13, fontWeight:500, color:T.textPri, flex:1 }}>{message}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.textMuted, padding:2 }}><X size={13}/></button>
    </div>
  );
};

// ================================================================
// ROOT
// ================================================================
export default function SinagBughawAdmin() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3600);
  };

  const left = collapsed ? 62 : 234;

  const renderPage = () => {
    const props = { showToast };
    switch (page) {
      case "dashboard":     return <DashboardPage {...props}/>;
      case "users":         return <UsersPage {...props}/>;
      case "batches":       return <BatchesPage {...props}/>;
      case "ai":            return <AIFeaturesPage {...props}/>;
      case "yearbooks":     return <YearbooksPage {...props}/>;
      case "analytics":     return <AnalyticsPage/>;
      default:
        const stub = STUBS[page];
        return stub ? <StubPage {...stub}/> : <DashboardPage {...props}/>;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.textPri, fontFamily:"system-ui, -apple-system, sans-serif" }}>
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <Header page={page} collapsed={collapsed}/>
      <main style={{ marginLeft:left, paddingTop:54, minHeight:"100vh", transition:"margin-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding:24, maxWidth:1280 }}>
          {renderPage()}
        </div>
      </main>
      {/* Toasts */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:8, width:300 }}>
        {toasts.map(t => <Toast key={t.id} {...t} onClose={()=>setToasts(p=>p.filter(x=>x.id!==t.id))}/>)}
      </div>
    </div>
  );
}