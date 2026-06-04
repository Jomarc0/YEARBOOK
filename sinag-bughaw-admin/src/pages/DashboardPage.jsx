import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  DASHBOARD_API_PATH,
  AUDIT_LOGS_PATH,
  LOCALE,
  buildMetricCards,
} from "../config/dashboard.config";

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const cx = (...v) => v.filter(Boolean).join(" ");

const Card = ({ className = "", children }) => (
  <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>
);

const Skeleton = ({ className = "" }) => (
  <div className={cx("animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]", className)} />
);

function MetricCard({ label, value, sub, subColorClass, subBgClass, icon, iconBgClass, loading }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <>
              <Skeleton className="mb-3 h-8 w-2/3" />
              <Skeleton className="h-5 w-4/5" />
            </>
          ) : (
            <>
              <p className="mb-2 text-3xl font-extrabold leading-none text-slate-800">{value}</p>
              <span className={cx("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", subBgClass, subColorClass)}>
                {sub}
              </span>
            </>
          )}
        </div>
        <div className={cx("grid h-11 w-11 place-items-center rounded-xl text-xs font-bold", iconBgClass)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function EnrollmentChart({ data, loading }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!data || loading) return;

    const loadChart = () => {
      if (!window.Chart || !canvasRef.current) return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      chartRef.current = new window.Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: data.map((d) => d.year),
          datasets: [
            {
              label: "Enrolled Students",
              data: data.map((d) => d.total),
              backgroundColor: "rgba(79,70,229,0.15)",
              borderColor: "#4f46e5",
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
              hoverBackgroundColor: "rgba(79,70,229,0.30)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} students` } },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#64748b", font: { size: 12, weight: "600" } },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: { color: "#e2e8f0", lineWidth: 1 },
              ticks: { color: "#64748b", font: { size: 11 }, callback: (v) => v.toLocaleString() },
              border: { display: false },
            },
          },
        },
      });
    };

    if (window.Chart) {
      loadChart();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = loadChart;
      document.head.appendChild(script);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, loading]);

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Enrollment Analytics</h3>
          <p className="text-xs text-slate-500">Students per batch year</p>
        </div>
        <button
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
          onClick={() => window.print()}
        >
          Export
        </button>
      </div>
      {loading ? (
        <Skeleton className="h-60 w-full rounded-xl" />
      ) : (
        <div className="relative h-60">
          <canvas ref={canvasRef} role="img" aria-label="Bar chart showing enrolled students per batch year" />
        </div>
      )}
    </Card>
  );
}

function TrendingAlumni({ items, loading }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-base font-extrabold text-slate-800">Trending Alumni</h3>

      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3 flex items-center gap-3 last:mb-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-3 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
          ))
        : items.length === 0
          ? <p className="py-5 text-center text-sm text-slate-500">No trending alumni yet.</p>
          : items.map((a, i) => (
              <div key={a.id ?? i} className="mb-3 flex items-center gap-3 last:mb-0">
                <div className="grid h-9 w-9 place-items-center rounded-full border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
                  {a.avatar_initials ?? a.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.program}</p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {fmt(a.views)} views
                </span>
              </div>
            ))}
    </Card>
  );
}

const TYPE_STYLES = {
  image: { bgClass: "bg-indigo-50",  textClass: "text-indigo-700",  label: "IMG" },
  video: { bgClass: "bg-amber-50",   textClass: "text-amber-700",   label: "VID" },
  audio: { bgClass: "bg-emerald-50", textClass: "text-emerald-700", label: "AUD" },
  doc:   { bgClass: "bg-violet-50",  textClass: "text-violet-700",  label: "DOC" },
};

function RecentUploads({ items, loading }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-base font-extrabold text-slate-800">Recent Uploads</h3>

      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3 flex items-center gap-3 last:mb-0">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-3 w-2/3" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          ))
        : items.length === 0
          ? <p className="py-5 text-center text-sm text-slate-500">No recent uploads.</p>
          : items.map((u, i) => {
              const s = TYPE_STYLES[u.type] ?? TYPE_STYLES.doc;
              return (
                <div key={u.id ?? i} className="mb-3 flex items-center gap-3 last:mb-0">
                  <div className={cx("grid h-9 w-9 place-items-center rounded-lg text-[11px] font-bold", s.bgClass, s.textClass)}>
                    {s.label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{u.filename}</p>
                    <p className="text-xs text-slate-500">{u.uploader} · {u.time}</p>
                  </div>
                </div>
              );
            })}
    </Card>
  );
}

const ACTIVITY_COLORS = {
  register: "bg-emerald-500",
  upload:   "bg-blue-500",
  update:   "bg-amber-500",
  delete:   "bg-red-500",
  settings: "bg-violet-500",
  login:    "bg-cyan-500",
  default:  "bg-slate-400",
};

function ActivityFeed({ items, loading, onViewAll }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-800">Recent Audit Activity</h3>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="grid gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : items.length === 0
            ? <p className="py-4 text-center text-sm text-slate-500">No recent activity.</p>
            : items.map((a, i) => {
                const dot = ACTIVITY_COLORS[a.type] ?? ACTIVITY_COLORS.default;
                return (
                  <div key={a.id ?? i} className="flex items-start gap-3">
                    <div className={cx("mt-1.5 h-2 w-2 rounded-full", dot)} />
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-slate-800">{a.title}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                        <span>{a.subject}</span>
                        <span>{a.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
      </div>
      <button
        onClick={onViewAll}
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
      >
        View Full Log
      </button>
    </Card>
  );
}

function EngagementBar({ label, value, max, colorClass, loading }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {loading
          ? <Skeleton className="h-3 w-10" />
          : <span className="text-sm font-bold text-slate-800">{value.toLocaleString()}</span>
        }
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        {!loading && <div className={cx("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

function EngagementCard({ data, loading }) {
  const maxVal = data ? Math.max(data.weekly_visits, data.returning_alumni, data.new_registrations, 1) : 1;
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-base font-extrabold text-slate-800">Engagement Overview</h3>
      <EngagementBar label="Weekly Visits"      value={data?.weekly_visits      ?? 0} max={maxVal} colorClass="bg-indigo-600" loading={loading} />
      <EngagementBar label="Returning Alumni"   value={data?.returning_alumni   ?? 0} max={maxVal} colorClass="bg-emerald-500" loading={loading} />
      <EngagementBar label="New Registrations"  value={data?.new_registrations  ?? 0} max={maxVal} colorClass="bg-amber-500" loading={loading} />
    </Card>
  );
}

function PageHeader({ lastRefresh, onRefresh, refreshing }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your yearbook system data efficiently.
          {lastRefresh && <span className="ml-2">Last updated: {lastRefresh}</span>}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={cx(refreshing && "animate-spin")}>↻</span>
        Refresh
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh,setLastRefresh]= useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(DASHBOARD_API_PATH);
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data?.error
        ?? err.message
        ?? "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(
        new Date().toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
      );
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metricCards = buildMetricCards(data?.metrics).map((card) => ({
    ...card,
    value: typeof card.value === "number" ? fmt(card.value) : card.value,
  }));

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-7 animate-[fadeIn_.3s_ease]">
      <PageHeader lastRefresh={lastRefresh} onRefresh={() => load(true)} refreshing={refreshing} />

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <span>{error}</span>
          <button onClick={() => load()} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="mb-5">
        <EngagementCard data={data?.engagement} loading={loading} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <EnrollmentChart data={data?.enrollment_by_year} loading={loading} />
        <TrendingAlumni items={data?.trending_alumni ?? []} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentUploads items={data?.recent_uploads ?? []} loading={loading} />
        <ActivityFeed
          items={data?.recent_activity ?? []}
          loading={loading}
          onViewAll={() => navigate(AUDIT_LOGS_PATH)}
        />
      </div>
    </div>
  );
}