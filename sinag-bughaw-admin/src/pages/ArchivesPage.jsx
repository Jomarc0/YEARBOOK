/**
 * ArchivesPage.jsx
 * NU Lipa / Sinag-Bughaw — Admin Panel
 *
 * Manages historical yearbooks: view, publish/unpublish, generate PDF, delete.
 *
 * API:
 *   GET    /api/admin/archives              ?search&status&page
 *   GET    /api/admin/archives/stats
 *   POST   /api/admin/archives/{id}/publish
 *   POST   /api/admin/archives/{id}/unpublish
 *   POST   /api/admin/archives/{id}/generate-pdf
 *   DELETE /api/admin/archives/{id}
 */

import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";

const T = {
  bg: "#f0f4ff", surface: "#ffffff", border: "#e2e8f5",
  text: "#1a2540", muted: "#5b6784", primary: "#4254c5",
  success: "#16a34a", successBg: "#dcfce7",
  danger: "#ef4444", dangerBg: "#fee2e2",
  warning: "#d97706", warningBg: "#fef3c7",
  purple: "#7c3aed", purpleBg: "#f4ebff",
  shadow: "0 2px 12px rgba(66,84,197,.07)",
  shadowMd: "0 4px 24px rgba(66,84,197,.13)",
};

const Sk = ({ w = "100%", h = 14, r = 6, style = {} }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#e8edf8 25%,#f4f6fc 50%,#e8edf8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite linear", ...style }} />
);

function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, color, background: bg, whiteSpace: "nowrap" }}>{label}</span>;
}

function statusBadge(status) {
  const map = {
    published:  { color: T.success, bg: T.successBg },
    draft:      { color: T.muted,   bg: T.border    },
    generating: { color: T.warning, bg: T.warningBg },
    failed:     { color: T.danger,  bg: T.dangerBg  },
  };
  return <Badge label={status ?? "draft"} {...(map[status] ?? { color: T.muted, bg: T.border })} />;
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
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding: "12px 18px", borderRadius: 12, fontWeight: 600, fontSize: "0.88rem", background: t.type === "error" ? T.dangerBg : T.successBg, color: t.type === "error" ? T.danger : T.success, border: `1px solid ${t.type === "error" ? "#fca5a5" : "#86efac"}`, boxShadow: T.shadowMd, animation: "fadeIn .2s ease" }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,.55)", zIndex: 1000, display: "grid", placeItems: "center" }} onClick={onCancel}>
      <div style={{ background: T.surface, borderRadius: 20, padding: "28px 30px", width: 420, boxShadow: T.shadowMd, animation: "fadeIn .18s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: "0.9rem", color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.muted, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: confirmColor ?? T.primary, color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit", fontSize: "0.88rem" }}>
            {loading ? "Processing…" : confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;
  const pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(last, cur + 2); i++) pages.push(i);
  const Btn = ({ label, page, disabled, active }) => (
    <button onClick={() => !disabled && onPage(page)} style={{ padding: "7px 13px", borderRadius: 9, border: `1px solid ${active ? T.primary : T.border}`, background: active ? T.primary : T.surface, color: active ? "#fff" : T.text, fontWeight: 600, fontSize: "0.84rem", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: "inherit" }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, flexWrap: "wrap", gap: 10 }}>
      <div style={{ fontSize: "0.84rem", color: T.muted }}>Page {cur} of {last} · {meta.total} yearbooks</div>
      <div style={{ display: "flex", gap: 6 }}>
        <Btn label="←" page={cur - 1} disabled={cur === 1} />
        {pages.map(p => <Btn key={p} label={p} page={p} active={p === cur} />)}
        <Btn label="→" page={cur + 1} disabled={cur === last} />
      </div>
    </div>
  );
}

// ─── Yearbook Card ────────────────────────────────────────────────────────────
function YearbookCard({ yb, onPublish, onUnpublish, onGeneratePDF, onDelete, busy }) {
  const isBusy = busy === yb.id;
  const fmt = d => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: T.shadow, display: "flex", flexDirection: "column" }}>
      {/* Cover */}
      <div style={{ height: 140, background: yb.cover_image ? "none" : "linear-gradient(135deg,#1a2540,#4254c5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {yb.cover_image
          ? <img src={yb.cover_image} alt={yb.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center", color: "rgba(255,255,255,.7)" }}>
              <div style={{ fontSize: "2.5rem" }}>📚</div>
              <div style={{ fontSize: "0.78rem", marginTop: 6, fontWeight: 600 }}>{yb.academic_year ?? ""}</div>
            </div>
        }
        <div style={{ position: "absolute", top: 10, right: 10 }}>{statusBadge(yb.status)}</div>
        {yb.is_active && <div style={{ position: "absolute", top: 10, left: 10 }}><Badge label="Active" color="#fff" bg="rgba(22,163,74,.85)" /></div>}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px", flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: T.text, marginBottom: 4 }}>{yb.title}</div>
        <div style={{ fontSize: "0.8rem", color: T.muted, marginBottom: 12 }}>
          {yb.batch?.name ?? "No batch"} · {yb.academic_year ?? "—"}
        </div>
        {yb.pdf_generated_at && (
          <div style={{ fontSize: "0.76rem", color: T.muted, marginBottom: 8 }}>PDF: {fmt(yb.pdf_generated_at)}</div>
        )}
        {yb.description && (
          <div style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{yb.description}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {yb.status === "published"
          ? <button onClick={() => onUnpublish(yb)} disabled={isBusy}
              style={{ flex: 1, padding: "7px", borderRadius: 9, border: `1px solid ${T.border}`, background: "none", color: T.warning, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", opacity: isBusy ? 0.6 : 1 }}>
              Unpublish
            </button>
          : <button onClick={() => onPublish(yb)} disabled={isBusy}
              style={{ flex: 1, padding: "7px", borderRadius: 9, border: "none", background: T.successBg, color: T.success, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", opacity: isBusy ? 0.6 : 1 }}>
              Publish
            </button>
        }
        <button onClick={() => onGeneratePDF(yb)} disabled={isBusy || yb.status === "generating"}
          style={{ flex: 1, padding: "7px", borderRadius: 9, border: "none", background: "#edf2ff", color: T.primary, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", opacity: (isBusy || yb.status === "generating") ? 0.6 : 1 }}>
          {yb.status === "generating" ? "⏳ Generating…" : "📄 PDF"}
        </button>
        {yb.pdf_path && (
          <a href={yb.pdf_path} target="_blank" rel="noreferrer"
            style={{ flex: 1, padding: "7px", borderRadius: 9, border: `1px solid ${T.border}`, background: "none", color: T.muted, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textAlign: "center", textDecoration: "none", display: "block" }}>
            ↓ Download
          </a>
        )}
        <button onClick={() => onDelete(yb)} disabled={isBusy}
          style={{ padding: "7px 12px", borderRadius: 9, border: "none", background: T.dangerBg, color: T.danger, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", opacity: isBusy ? 0.6 : 1 }}>
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const inputStyle = { padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: "0.88rem", color: T.text, background: T.surface, fontFamily: "inherit", outline: "none" };

export default function ArchivesPage() {
  const [yearbooks, setYearbooks] = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [busy,      setBusy]      = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const { toasts, push: toast }   = useToast();
  const timer = useRef(null);

  const fetch = useCallback(async (p = 1, q = search, s = status) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/archives", { params: { page: p, search: q, status: s, per_page: 12 } });
      setYearbooks(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch { toast("Failed to load archives.", "error"); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    fetch(page);
    api.get("/admin/archives/stats").then(r => setStats(r.data)).catch(() => {});
  }, [page]);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetch(1, v, status); }, 400);
  };

  const doAction = async (type, yb) => {
    setBusy(yb.id);
    try {
      const endpoints = {
        publish:   `/admin/archives/${yb.id}/publish`,
        unpublish: `/admin/archives/${yb.id}/unpublish`,
        pdf:       `/admin/archives/${yb.id}/generate-pdf`,
      };
      await api.post(endpoints[type]);
      const msgs = { publish: "Yearbook published.", unpublish: "Yearbook unpublished.", pdf: "PDF generation started." };
      toast(msgs[type]);
      fetch(page);
    } catch { toast("Action failed.", "error"); }
    finally { setBusy(null); }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(confirm.id);
    try {
      await api.delete(`/admin/archives/${confirm.id}`);
      toast("Yearbook deleted.");
      setConfirm(null);
      fetch(page);
    } catch { toast("Delete failed.", "error"); }
    finally { setBusy(null); }
  };

  const STAT_CARDS = [
    { icon: "📚", label: "Total Yearbooks",  value: stats?.total      ?? 0, color: T.primary, bg: "#edf2ff"   },
    { icon: "✅", label: "Published",         value: stats?.published  ?? 0, color: T.success, bg: T.successBg },
    { icon: "📝", label: "Drafts",            value: stats?.drafts     ?? 0, color: T.muted,   bg: T.border    },
    { icon: "📄", label: "PDFs Generated",   value: stats?.pdfs_ready ?? 0, color: T.purple,  bg: T.purpleBg  },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: "28px 24px 40px", background: T.bg, minHeight: "100vh", animation: "fadeIn .3s ease" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: T.text, margin: 0 }}>Archives</h1>
          <p style={{ color: T.muted, fontSize: "0.9rem", margin: "6px 0 0" }}>Manage historical yearbooks, PDFs, and long-term preservation.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
          {STAT_CARDS.map(c => (
            <div key={c.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: T.shadow }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: c.bg, display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: "0.8rem", color: T.muted, marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: c.color }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="🔍 Search yearbook title, batch…" style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); fetch(1, search, e.target.value); }} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="generating">Generating</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <Sk w="100%" h={140} r={0} />
                <div style={{ padding: 18 }}><Sk w="70%" h={16} style={{ marginBottom: 10 }} /><Sk w="50%" h={12} /></div>
              </div>
            ))}
          </div>
        ) : yearbooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
            <div style={{ fontSize: "3rem", marginBottom: 14 }}>📚</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: T.text, marginBottom: 6 }}>No yearbooks found.</div>
            <div style={{ fontSize: "0.88rem" }}>Create yearbooks from the Yearbook Management module.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
            {yearbooks.map(yb => (
              <YearbookCard
                key={yb.id}
                yb={yb}
                busy={busy}
                onPublish={yb => doAction("publish", yb)}
                onUnpublish={yb => doAction("unpublish", yb)}
                onGeneratePDF={yb => doAction("pdf", yb)}
                onDelete={setConfirm}
              />
            ))}
          </div>
        )}

        <Pagination meta={meta} onPage={p => setPage(p)} />
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete Yearbook"
        message={`Permanently delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor={T.danger}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
        loading={busy === confirm?.id}
      />
      <Toast toasts={toasts} />
    </>
  );
}