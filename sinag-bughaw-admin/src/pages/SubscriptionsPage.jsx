/**
 * SubscriptionsPage.jsx
 * NU Lipa / Sinag-Bughaw — Admin Panel
 *
 * API:
 *   GET   /api/admin/subscriptions         ?search&plan&status&page
 *   GET   /api/admin/subscriptions/stats
 *   GET   /api/admin/subscriptions/{id}
 *   PATCH /api/admin/subscriptions/{id}/cancel
 *
 * Plan values in DB: standard_monthly | standard_yearly | premium_monthly | premium_yearly
 */

import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";

const cx = (...v) => v.filter(Boolean).join(" ");

const Skeleton = ({ className = "", style }) => (
  <div
    style={style}
    className={cx(
      "animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]",
      className,
    )}
  />
);

function Badge({ label, tone = "default" }) {
  const tones = {
    success: "bg-emerald-50 text-emerald-700",
    neutral: "bg-slate-100 text-slate-600",
    danger: "bg-red-50 text-red-700",
    warning: "bg-amber-50 text-amber-700",
    purple: "bg-violet-600 text-white",
    purpleSoft: "bg-violet-50 text-violet-700",
    indigo: "bg-indigo-50 text-indigo-700",
    default: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={cx("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone] ?? tones.default)}>
      {label}
    </span>
  );
}

// Maps actual DB plan values to display labels
function planBadge(plan, tier) {
  if (plan === "premium_monthly")  return <Badge label="Premium Monthly" tone="purple" />;
  if (plan === "premium_yearly")   return <Badge label="Premium Yearly" tone="purple" />;
  if (plan === "standard_monthly") return <Badge label="Standard Monthly" tone="purpleSoft" />;
  if (plan === "standard_yearly")  return <Badge label="Standard Yearly" tone="purpleSoft" />;
  // fallback
  return <Badge label={plan ?? "Free"} tone="neutral" />;
}

function statusBadge(status) {
  const map = {
    active:    { label: "Active", tone: "success" },
    expired:   { label: "Expired", tone: "neutral" },
    cancelled: { label: "Cancelled", tone: "danger" },
    pending:   { label: "Pending", tone: "warning" },
  };
  const s = map[status] ?? { label: status ?? "—", tone: "neutral" };
  return <Badge {...s} />;
}

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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cx(
            "rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg",
            t.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;
  const pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(last, cur + 2); i++) pages.push(i);
  const Btn = ({ label, page, disabled, active }) => (
    <button
      onClick={() => !disabled && onPage(page)}
      className={cx(
        "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
        active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        disabled && "cursor-default opacity-40",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
      <div className="text-sm text-slate-500">Page {cur} of {last} · {meta.total} records</div>
      <div className="flex gap-1.5">
        <Btn label="←" page={cur - 1} disabled={cur === 1} />
        {pages.map(p => <Btn key={p} label={p} page={p} active={p === cur} />)}
        <Btn label="→" page={cur + 1} disabled={cur === last} />
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function SubDetailModal({ sub, onClose, onCancel, loading }) {
  if (!sub) return null;
  const fmt      = v => v ? new Date(v).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fmtMoney = v => v != null ? `₱${parseFloat(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—";

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/55 p-5" onClick={onClose}>
      <div className="w-full max-w-[500px] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="text-base font-extrabold text-slate-800">Subscription Details</div>
          <button onClick={onClose} className="text-2xl leading-none text-slate-500 transition hover:text-slate-700">×</button>
        </div>
        <div className="px-6 py-5">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["User",        `${sub.user?.first_name ?? ""} ${sub.user?.last_name ?? ""}`],
              ["Email",       sub.user?.email ?? "—"],
              ["Plan",        sub.plan ?? "—"],
              ["Tier",        sub.tier ?? "—"],
              ["Status",      sub.status ?? "—"],
              ["Amount Paid", fmtMoney(sub.amount_paid)],
              ["Started",     fmt(sub.created_at)],
              ["Expires",     fmt(sub.expires_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</div>
                <div className="text-sm font-semibold text-slate-800">{v}</div>
              </div>
            ))}
          </div>
          {sub.paymongo_payment_intent_id && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">PayMongo Intent ID</div>
              <div className="font-mono text-xs text-slate-700">{sub.paymongo_payment_intent_id}</div>
            </div>
          )}
          {sub.status === "active" && (
            <button
              onClick={() => onCancel(sub)}
              disabled={loading}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Cancelling…" : "Cancel Subscription"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Storage Overview ─────────────────────────────────────────────────────────
function StorageOverview({ stats, loading }) {
  const tiers = [
    { key: "free",             label: "Free", tone: "neutral" },
    { key: "premium_standard", label: "Standard Plans", tone: "purpleSoft" },
    { key: "premium",          label: "Premium Plans", tone: "purple" },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-base font-extrabold text-slate-800">Storage Tier Overview</div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {tiers.map(t => (
          <div key={t.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Badge label={t.label} tone={t.tone} />
            <div className="mt-3 text-3xl font-black leading-none text-slate-800">
              {loading ? <Skeleton className="h-7 w-14" /> : (stats?.tiers?.[t.key] ?? 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500">subscribers</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const [subs,       setSubs]       = useState([]);
  const [meta,       setMeta]       = useState(null);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [statsLoad,  setStatsLoad]  = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [plan,       setPlan]       = useState("");
  const [status,     setStatus]     = useState("");
  const [selected,   setSelected]   = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const { toasts, push: toast } = useToast();
  const timer = useRef(null);

  const fetchSubs = useCallback(async (p = 1, q = search, pl = plan, st = status) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/subscriptions", { params: { page: p, search: q, plan: pl, status: st, per_page: 15 } });
      setSubs(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch {
      toast("Failed to load subscriptions.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, plan, status]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/subscriptions/stats");
      setStats(res.data);
    } catch {}
    finally { setStatsLoad(false); }
  }, []);

  useEffect(() => { fetchSubs(1); fetchStats(); }, []);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchSubs(1, v, plan, status); }, 400);
  };

  const doCancel = async (sub) => {
    setCancelling(true);
    try {
      await api.patch(`/admin/subscriptions/${sub.id}/cancel`);
      toast("Subscription cancelled.");
      setSelected(null);
      fetchSubs(page);
      fetchStats();
    } catch {
      toast("Failed to cancel subscription.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const STAT_CARDS = [
    { key: "active", label: "Active Subscriptions", value: stats?.active_count ?? 0, toneClass: "text-emerald-600", bgClass: "bg-emerald-50", tag: "ACT" },
    { key: "revenue", label: "Revenue (All Time)", value: `₱${((stats?.total_revenue ?? 0) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, toneClass: "text-indigo-600", bgClass: "bg-indigo-50", tag: "REV" },
    { key: "expiring", label: "Expiring This Month", value: stats?.expiring_soon ?? 0, toneClass: "text-amber-600", bgClass: "bg-amber-50", tag: "EXP" },
    { key: "cancelled", label: "Cancelled", value: stats?.cancelled_count ?? 0, toneClass: "text-red-600", bgClass: "bg-red-50", tag: "CAN" },
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-6 py-7 animate-[fadeIn_.3s_ease]">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Subscriptions & Storage</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor premium subscriptions and storage quotas.</p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {STAT_CARDS.map(c => (
            <div key={c.key} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xs font-extrabold", c.bgClass, c.toneClass)}>{c.tag}</div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">{c.label}</div>
                {statsLoad ? <Skeleton className="h-6 w-20" /> : <div className={cx("text-3xl font-black leading-none", c.toneClass)}>{c.value}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Storage overview */}
        <StorageOverview stats={stats} loading={statsLoad} />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search user, email..."
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
          <select
            value={plan}
            onChange={e => { setPlan(e.target.value); setPage(1); fetchSubs(1, search, e.target.value, status); }}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All Plans</option>
            <option value="standard">Standard (Monthly & Yearly)</option>
            <option value="premium">Premium (Monthly & Yearly)</option>
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); fetchSubs(1, search, plan, e.target.value); }}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["User", "Plan", "Status", "Amount Paid", "Expires", "Actions"].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <Skeleton className="h-3.5" style={{ width: `${j === 0 ? 140 : 90}px` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : subs.length === 0
                    ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">No subscriptions found.</td>
                        </tr>
                      )
                    : subs.map(s => (
                        <tr key={s.id} className="border-b border-slate-200 transition-colors hover:bg-indigo-50/40">
                          <td className="px-4 py-3.5 text-sm text-slate-800">
                            <div className="font-bold">{s.user?.first_name} {s.user?.last_name}</div>
                            <div className="text-xs text-slate-500">{s.user?.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-800">{planBadge(s.plan, s.tier)}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-800">{statusBadge(s.status)}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-slate-800">
                            {s.amount_paid != null
                              ? `₱${(parseFloat(s.amount_paid) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {s.expires_at ? new Date(s.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "Never"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-800">
                            <button
                              onClick={() => setSelected(s)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-5 py-4">
            <Pagination meta={meta} onPage={p => { setPage(p); fetchSubs(p); }} />
          </div>
        </div>
      </div>

      <SubDetailModal sub={selected} onClose={() => setSelected(null)} onCancel={doCancel} loading={cancelling} />
      <Toast toasts={toasts} />
    </>
  );
}