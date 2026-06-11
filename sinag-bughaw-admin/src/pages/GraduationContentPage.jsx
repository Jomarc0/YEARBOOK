/**
 * GraduationContentPage.jsx
 * Fixes:
 *  - ContentCard action row: all buttons in one consistent row, no orphaned delete
 *  - Icon-only buttons are uniform 30×30
 *  - AlbumDetailModal fetches from correct endpoint + shows all file types
 *  - All content types support multiple files per album
 *  - Videos/audio/PDF render correctly in detail modal and card strip
 *  - Face search integrated into detail modal for photo albums
 *  - Detail modal reloads after "+ Add More Files"
 *  - Transcript badge shown on cards that have transcripts
 *  - AddFilesModal: uses filesRef so upload() never reads stale closure
 */

import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import { usePhotoFacesBroadcast } from "../hooks/usePhotoFacesBroadcast";
import Icon from "../components/shared/Icon";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#f0f4ff",
  surface:   "#ffffff",
  border:    "#e2e8f5",
  text:      "#1a2540",
  muted:     "#5b6784",
  hint:      "#9ba8c4",
  primary:   "#4254c5",
  primaryBg: "#eef2ff",
  success:   "#16a34a",
  successBg: "#dcfce7",
  danger:    "#ef4444",
  dangerBg:  "#fee2e2",
  warning:   "#d97706",
  warningBg: "#fef3c7",
  shadow:    "0 2px 12px rgba(66,84,197,.07)",
  shadowMd:  "0 4px 24px rgba(66,84,197,.13)",
  shadowLg:  "0 8px 40px rgba(66,84,197,.18)",
};

// ─── All content types ────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { key: "photos",      label: "Photos",       icon: "PHO", accept: "image/*",              multiple: true },
  { key: "videos",      label: "Videos",       icon: "VID", accept: "video/*",              multiple: true },
  { key: "program",     label: "Program",      icon: "PRG", accept: ".pdf,image/*",         multiple: true },
  { key: "invitations", label: "Invitations",  icon: "INV", accept: ".pdf,image/*",         multiple: true },
  { key: "songs",       label: "Grad Song",    icon: "AUD", accept: "audio/*,video/*",      multiple: true },
  { key: "mass",        label: "Mass",         icon: "MAS", accept: "video/*",              multiple: true },
  { key: "speeches",    label: "Speeches",     icon: "SPK", accept: "video/*,audio/*",      multiple: true },
];

const FACE_TYPES = ["photos"];

const inputBase = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: `1px solid ${T.border}`, fontSize: "0.88rem",
  color: T.text, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box", background: "#fafbff",
};

// ─── Icon button helper ───────────────────────────────────────────────────────
const iconBtn = (color, bg, borderColor) => ({
  width: 30, height: 30, flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 8,
  border: `1px solid ${borderColor ?? T.border}`,
  background: bg ?? "none",
  color,
  fontSize: "0.82rem",
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 14, radius = 6, style = {} }) => (
  <div
    style={{ width: w, height: h, borderRadius: radius, ...style }}
    className="animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]"
  />
);

function detectFileType(photo) {
  const meta = photo?.ai_metadata ?? {};
  const mime = photo?.mime_type ?? meta.mime_type ?? "";
  const url  = photo?.file_path ?? "";
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac)(\?|$)/i.test(url)) return "audio";
  if (mime === "application/pdf" || /\.pdf(\?|$)/i.test(url)) return "pdf";
  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) return "image";
  return "file";
}

function StatusBadge({ status }) {
  const map = {
    published: { tone: "bg-emerald-50 text-emerald-700", label: "published" },
    draft:     { tone: "bg-slate-100 text-slate-600",    label: "draft"     },
    archived:  { tone: "bg-amber-50 text-amber-700",     label: "archived"  },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/55 p-5" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalCard({ children, width = 560 }) {
  return (
    <div style={{ maxWidth: width }} className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-[fadeUp_.2s_ease]">
      {children}
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <div className="text-[1.08rem] font-extrabold text-slate-800">{title}</div>
        {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
      </div>
      <button onClick={onClose} className="ml-3 px-1 text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
    </div>
  );
}

function ModalBody({ children }) {
  return <div className="flex-1 overflow-y-auto px-6 pb-2 pt-5">{children}</div>;
}

function ModalFooter({ children }) {
  return (
    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 pb-5 pt-3">
      {children}
    </div>
  );
}

function Btn({ variant = "primary", children, style = {}, ...props }) {
  const v = {
    primary: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
    ghost:   "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    danger:  "border-transparent bg-red-500 text-white hover:bg-red-600",
    success: "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button
      {...props}
      style={style}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${v[variant]}`}
    >
      {children}
    </button>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="mb-5 flex items-center gap-0">
      {["Create Album", "Upload Files"].map((s, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && <div className={`h-0.5 w-10 transition-colors ${step > i ? "bg-indigo-600" : "bg-slate-200"}`} />}
          <div className="flex items-center gap-2">
            <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold transition ${step === i + 1 ? "bg-indigo-600 text-white" : step > i + 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-bold ${step === i + 1 ? "text-indigo-600" : step > i + 1 ? "text-emerald-600" : "text-slate-400"}`}>{s}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-[fadeUp_.2s_ease] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            t.type === "error"
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-emerald-300 bg-emerald-50 text-emerald-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", confirmBg = T.danger, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <Overlay onClose={onCancel}>
      <ModalCard width={400}>
        <ModalBody>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: T.text, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: "0.86rem", color: T.muted, marginBottom: 20, lineHeight: 1.65 }}>{message}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Btn>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: confirmBg, color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", fontSize: "0.88rem" }}
            >
              {loading ? "Processing…" : confirmLabel}
            </button>
          </div>
        </ModalBody>
      </ModalCard>
    </Overlay>
  );
}

// ─── File Thumbnail ───────────────────────────────────────────────────────────
function FileThumb({ photo, idx, onLightbox }) {
  const type = detectFileType(photo);
  const url  = photo.file_path;
  const base = { width: "100%", aspectRatio: "4/3", borderRadius: 10, display: "block", background: "#1a2540" };

  if (type === "image") return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => onLightbox({ url, type: "image" })}>
      <img src={url} alt={`File ${idx + 1}`} style={{ ...base, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
      <div style={{ position: "absolute", bottom: 4, right: 6, fontSize: "0.65rem", background: "rgba(0,0,0,.5)", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>IMG</div>
    </div>
  );

  if (type === "video") return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, cursor: "pointer", background: "#0d1420" }} onClick={() => onLightbox({ url, type: "video" })}>
      <video src={url} style={{ ...base, objectFit: "cover" }} preload="metadata" muted />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,20,50,.55)", borderRadius: 10, color: "#fff" }}>
        <div style={{ fontSize: "1.8rem" }}>▶</div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: 4, letterSpacing: ".04em" }}>VIDEO</div>
      </div>
    </div>
  );

  if (type === "audio") return (
    <div style={{ padding: "14px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: "1.6rem", marginBottom: 8, textAlign: "center" }}>🎵</div>
      <audio src={url} controls style={{ width: "100%", height: 32 }} />
    </div>
  );

  if (type === "pdf") return (
    <button type="button" onClick={() => onLightbox({ url, type: "pdf" })} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, textDecoration: "none", gap: 8, minHeight: 100, cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ fontSize: "2rem" }}>PDF</div>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: T.primary }}>View PDF</div>
    </button>
  );

  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, textDecoration: "none", gap: 8, minHeight: 100 }}>
      <div style={{ fontSize: "2rem" }}>📎</div>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: T.primary }}>Download</div>
    </a>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ALBUM DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════════════
function AlbumDetailModal({ open, albumId, album: albumProp, contentType, isAdmin, onClose, onAddFiles, onRefresh: _onRefresh, toast }) {
  const [photos,        setPhotos]        = useState([]);
  const [albumData,     setAlbumData]     = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [lightbox,      setLightbox]      = useState(null);
  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches,   setFaceMatches]   = useState([]);
  const [facePhotoIds,  setFacePhotoIds]  = useState([]);
  const faceRef = useRef(null);

  const cfg           = CONTENT_TYPES.find(c => c.key === contentType) ?? CONTENT_TYPES[0];
  const hasFace       = FACE_TYPES.includes(contentType);
  const hasTranscript = albumData?.has_transcript;

  const loadAlbum = useCallback(() => {
    if (!open || !albumId) return;
    setLoading(true);
    api.get(`/admin/graduation/content/${albumId}`)
      .then(r => {
        const data = r.data?.data ?? r.data;
        setAlbumData(data);
        setPhotos(data?.photos ?? []);
      })
      .catch(() => toast("Failed to load files.", "error"))
      .finally(() => setLoading(false));
  }, [open, albumId]);

  useEffect(() => {
    loadAlbum();
    setFaceMatches([]);
    setFacePhotoIds([]);
  }, [loadAlbum]);

  const photoIds = photos.map(p => p.id).filter(Boolean);

  usePhotoFacesBroadcast(
    (event) => {
      setPhotos(prev =>
        prev.map(photo =>
          photo.id === event.photo_id
            ? { ...photo, ai_metadata: { ...(photo.ai_metadata ?? {}), status: event.status, face_count: event.face_count, matches: event.matches ?? [] } }
            : photo
        )
      );
    },
    { photoIds, enabled: open && photoIds.length > 0 }
  );

  const handleFaceSearch = async (file) => {
    setFaceSearching(true);
    setFaceMatches([]);
    setFacePhotoIds([]);
    try {
      const fd = new FormData();
      fd.append("face_image", file);
      const res = await api.post("/face/search", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const matches        = res.data?.matches ?? [];
      const matchedPhotoIds = (res.data?.photos ?? []).map(p => p.graduation_photo_id ?? p.photo_id).filter(Boolean);
      setFaceMatches(matches);
      setFacePhotoIds(matchedPhotoIds);
      if (!matches.length && !matchedPhotoIds.length) toast("No matching faces found.", "error");
    } catch {
      toast("Face search failed.", "error");
    } finally {
      setFaceSearching(false);
    }
  };

  if (!open) return null;

  const displayPhotos = faceMatches.length > 0 || facePhotoIds.length > 0
    ? photos.filter(p => {
        const matchIds = (p.ai_metadata?.matches ?? []).map(m => m.user_id);
        return facePhotoIds.includes(p.id) || faceMatches.some(m => matchIds.includes(m.user_id));
      })
    : photos;

  return (
    <>
      <Overlay onClose={onClose}>
        <ModalCard width={820}>
          <ModalHeader
            title={`${cfg.icon} ${albumProp?.title ?? albumData?.title ?? "Album"}`}
            subtitle={`${photos.length} file${photos.length !== 1 ? "s" : ""}${hasTranscript ? " · 📝 Transcript available" : ""}`}
            onClose={onClose}
          />
          <ModalBody>
            {/* Face search bar */}
            {hasFace && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: T.primaryBg, borderRadius: 12, border: `1px solid #c7d2fe` }}>
                  <span style={{ fontSize: "1.1rem" }}>🔍</span>
                  <div style={{ flex: 1, fontSize: "0.82rem", color: T.muted }}>
                    {faceSearching ? "Searching faces…" : faceMatches.length > 0
                      ? `Showing ${displayPhotos.length} matched photo(s) — `
                      : "Search by face to find a student in this album"}
                    {faceMatches.length > 0 && (
                      <button onClick={() => setFaceMatches([])} style={{ background: "none", border: "none", color: T.primary, cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", padding: 0 }}>
                        Clear filter
                      </button>
                    )}
                  </div>
                  <input
                    ref={faceRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => { if (e.target.files[0]) handleFaceSearch(e.target.files[0]); e.target.value = ""; }}
                  />
                  <Btn onClick={() => faceRef.current?.click()} disabled={faceSearching} style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                    {faceSearching ? "⟳ Searching…" : "📸 Upload Face"}
                  </Btn>
                </div>
                {faceMatches.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {faceMatches.map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: T.successBg, borderRadius: 999, border: `1px solid #86efac` }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: T.success }}>{m.name ?? m.user_name ?? `User ${m.user_id}`}</span>
                        <span style={{ fontSize: "0.7rem", color: T.muted }}>{m.similarity ?? m.confidence}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transcript link */}
            {hasTranscript && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fefce8", borderRadius: 10, border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📝</span>
                <span style={{ fontSize: "0.82rem", color: "#92400e", flex: 1 }}>This album has an AI-generated transcript</span>
                <a href={`/admin/graduation/transcripts?album_id=${albumId}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400e", textDecoration: "underline" }}>
                  View Transcript →
                </a>
              </div>
            )}

            {/* File grid */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} w="100%" h={120} radius={10} />)}
              </div>
            ) : displayPhotos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>{faceMatches.length > 0 ? "🔍" : "📂"}</div>
                <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>
                  {faceMatches.length > 0 ? "No matching photos found" : "No files yet"}
                </div>
                <div style={{ fontSize: "0.84rem" }}>
                  {faceMatches.length > 0 ? "Try a different photo or clear the face filter." : 'Use "+ Add More Files" to upload files to this album.'}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {displayPhotos.map((photo, idx) => (
                  <div key={photo.id ?? idx}>
                    <FileThumb photo={photo} idx={idx} onLightbox={setLightbox} />
                    {photo.ai_metadata?.status && photo.ai_metadata.status !== "done" && (
                      <div style={{ marginTop: 4, fontSize: "0.65rem", color: T.muted, textAlign: "center" }}>
                        {photo.ai_metadata.status === "pending"  ? "⏳ AI pending"  :
                         photo.ai_metadata.status === "queued"   ? "🔄 Analyzing…"  :
                         photo.ai_metadata.status === "error"    ? "❌ AI failed"   :
                         photo.ai_metadata.status === "failed"   ? "❌ AI failed"   : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {isAdmin && (
              <Btn onClick={() => { onClose(); onAddFiles(); }} style={{ marginRight: "auto" }}>
                + Add More Files
              </Btn>
            )}
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </ModalFooter>
        </ModalCard>
      </Overlay>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", color: "#fff", fontSize: "2rem", cursor: "pointer", lineHeight: 1 }}>x</button>
          {lightbox.type === "image" && (
            <>
              <a href={lightbox.url} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 22, right: 72, border: "1px solid rgba(255,255,255,.25)", borderRadius: 10, background: "rgba(255,255,255,.12)", color: "#fff", padding: "8px 12px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>
                Download Image
              </a>
              <img src={lightbox.url} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 12, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
            </>
          )}
          {lightbox.type === "video" && (
            <video src={lightbox.url} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 12 }} onClick={e => e.stopPropagation()} />
          )}
          {lightbox.type === "pdf" && (
            <iframe src={lightbox.url} title="PDF preview" style={{ width: "90vw", height: "88vh", border: "none", borderRadius: 12, background: "#fff" }} onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FILE DROP ZONE
// ═════════════════════════════════════════════════════════════════════════════
function FileDropZone({ cfg, files, setFiles, uploading, progress }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const statusIcon  = s => ({ done: "✓", error: "✗", uploading: "⟳" }[s] ?? "○");
  const statusColor = s => ({ done: T.success, error: T.danger, uploading: T.primary }[s] ?? T.hint);

  return (
    <>
      <div
        onDragOver={e  => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const dropped = Array.from(e.dataTransfer.files);
          if (dropped.length) setFiles(p => [...p, ...dropped]);
        }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? T.primary : T.border}`, borderRadius: 14, padding: "28px 16px", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", marginBottom: 12, background: dragOver ? T.primaryBg : T.bg, transition: "all .15s" }}
      >
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>📁</div>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text, marginBottom: 4 }}>
          {files.length > 0 ? `${files.length} file(s) selected — drop more to add` : "Drag & drop or click to browse"}
        </div>
        <div style={{ fontSize: "0.75rem", color: T.muted }}>{cfg.accept} · Multiple files supported</div>
        <input
          ref={fileRef}
          type="file"
          accept={cfg.accept}
          multiple
          style={{ display: "none" }}
          onChange={e => {
            const selected = Array.from(e.target.files);
            if (selected.length) setFiles(p => [...p, ...selected]);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
          {files.map((f, i) => {
            const prog = progress[i];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: i < files.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ color: statusColor(prog?.status), fontWeight: 700, fontSize: "0.8rem", width: 16, textAlign: "center" }}>
                  {prog ? statusIcon(prog.status) : "○"}
                </span>
                <span style={{ flex: 1, fontSize: "0.8rem", color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <span style={{ fontSize: "0.75rem", color: T.muted, flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                {!prog && (
                  <button
                    onClick={e => { e.stopPropagation(); setFiles(p => p.filter((_, idx) => idx !== i)); }}
                    style={{ background: "none", border: "none", color: T.hint, cursor: "pointer", fontSize: "0.9rem", padding: "0 2px", lineHeight: 1 }}
                  >×</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ALBUM UPLOAD MODAL (two-step)
// ═════════════════════════════════════════════════════════════════════════════
function AlbumUploadModal({ open, contentType, batches, onClose, onDone, toast }) {
  const cfg = CONTENT_TYPES.find(c => c.key === contentType) ?? CONTENT_TYPES[0];

  const [step,      setStep]      = useState(1);
  const [album,     setAlbum]     = useState(null);
  const [form,      setForm]      = useState({ title: "", description: "", batch_id: "", status: "draft", event_date: "" });
  const [errors,    setErrors]    = useState({});
  const [files,     setFiles]     = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState([]);

  const filesRef = useRef([]);
  useEffect(() => { filesRef.current = files; }, [files]);

  useEffect(() => {
    if (open) {
      setStep(1); setAlbum(null);
      setForm({ title: "", description: "", batch_id: "", status: "draft", event_date: "" });
      setErrors({}); setFiles([]); setProgress([]);
    }
  }, [open]);

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createAlbum = async () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await api.post("/admin/graduation/albums", { ...form, type: contentType });
      setAlbum(res.data.data ?? res.data);
      setStep(2);
      toast("Album created! Now add your files.");
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to create album.", "error");
    } finally { setSaving(false); }
  };

  const doUpload = async () => {
    const currentFiles = filesRef.current;
    if (!currentFiles.length) { toast("Select at least one file.", "error"); return; }
    setUploading(true);
    setProgress(currentFiles.map(f => ({ name: f.name, status: "uploading" })));
    const fd = new FormData();
    currentFiles.forEach(f => fd.append("files[]", f));
    try {
      await api.post(`/admin/graduation/albums/${album.id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProgress(currentFiles.map(f => ({ name: f.name, status: "done" })));
      toast(`${currentFiles.length} file(s) uploaded to "${album.title}".`);
      setFiles([]);
      onDone();
    } catch (err) {
      setProgress(currentFiles.map(f => ({ name: f.name, status: "error" })));
      toast(err.response?.data?.message ?? "Upload failed.", "error");
    } finally { setUploading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={580}>
        <ModalHeader
          title={`${cfg.icon} New ${cfg.label} Album`}
          subtitle={step === 1 ? "Step 1 of 2 — Set up your album" : `Step 2 of 2 — Upload files to "${album?.title}"`}
          onClose={onClose}
        />
        <ModalBody>
          <StepIndicator step={step} />

          {step === 1 && (
            <>
              <Field label="Album Title" required error={errors.title}>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder={`e.g. Graduation ${cfg.label} 2025`}
                  style={{ ...inputBase, borderColor: errors.title ? T.danger : T.border }} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={2} placeholder="Optional notes…" style={{ ...inputBase, resize: "vertical" }} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Batch">
                  <select value={form.batch_id} onChange={e => set("batch_id", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="">All Batches</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.graduation_year}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Field>
              </div>
              <Field label="Event Date">
                <input type="date" value={form.event_date} onChange={e => set("event_date", e.target.value)} style={inputBase} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, padding: "10px 14px", background: T.primaryBg, borderRadius: 12, border: "1px solid #c7d2fe" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: T.primary }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: T.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album?.title}</div>
                  <div style={{ fontSize: "0.72rem", color: T.muted }}>
                    {album?.status === "published" ? "Published" : "Draft"}
                    {FACE_TYPES.includes(contentType) && " · 👤 Face recognition will run"}
                    {["videos","songs","mass","speeches"].includes(contentType) && " · 📝 Transcription will run"}
                  </div>
                </div>
                <StatusBadge status={album?.status} />
              </div>

              <FileDropZone cfg={cfg} files={files} setFiles={setFiles} uploading={uploading} progress={progress} />

              {files.length > 0 && (
                <div style={{ fontSize: "0.78rem", color: T.primary, fontWeight: 600, marginBottom: 8 }}>
                  ✓ {files.length} file(s) ready to upload
                </div>
              )}

              <div style={{ fontSize: "0.78rem", color: T.muted, lineHeight: 1.6 }}>
                💡 You can upload more files after this — click <strong>Done</strong> when finished.
                {FACE_TYPES.includes(contentType) && <><br />👤 <strong>Face analysis</strong> will automatically queue for all uploaded images.</>}
                {["videos","songs","mass","speeches"].includes(contentType) && <><br />📝 <strong>AI transcription</strong> will automatically queue for uploaded media.</>}
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 1 && (
            <>
              <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
              <Btn onClick={createAlbum} disabled={saving}>{saving ? "Creating…" : "Create Album →"}</Btn>
            </>
          )}
          {step === 2 && (
            <>
              <Btn variant="ghost" onClick={onClose} disabled={uploading}>Close</Btn>
              <Btn onClick={doUpload} disabled={uploading || files.length === 0}>
                {uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length + " file(s)" : "Files"}`}
              </Btn>
              <Btn variant="success" onClick={() => { onDone(); onClose(); }}>✓ Done</Btn>
            </>
          )}
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ open, item, batches, onSave, onCancel, loading }) {
  const [form, setForm] = useState({});
  useEffect(() => {
    if (item) setForm({ title: item.title ?? "", description: item.description ?? "", batch_id: item.batch_id ?? "", status: item.status ?? "draft", event_date: item.event_date ?? "" });
  }, [item, open]);

  if (!open || !item) return null;
  return (
    <Overlay onClose={onCancel}>
      <ModalCard width={500}>
        <ModalHeader title="Edit Album" onClose={onCancel} />
        <ModalBody>
          {[
            { k: "title",       label: "Title",       type: "text"     },
            { k: "description", label: "Description", type: "textarea" },
            { k: "event_date",  label: "Event Date",  type: "date"     },
          ].map(f => (
            <Field key={f.k} label={f.label}>
              {f.type === "textarea"
                ? <textarea style={{ ...inputBase, resize: "vertical", minHeight: 60 }} value={form[f.k] ?? ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
                : <input type={f.type} style={inputBase} value={form[f.k] ?? ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
              }
            </Field>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Batch">
              <select style={{ ...inputBase, cursor: "pointer" }} value={form.batch_id ?? ""} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.graduation_year}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={{ ...inputBase, cursor: "pointer" }} value={form.status ?? "draft"} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>
        </ModalBody>
        <ModalFooter>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Btn>
          <Btn onClick={() => onSave(form)} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ADD FILES MODAL
// ═════════════════════════════════════════════════════════════════════════════
function AddFilesModal({ open, album, contentType, onClose, onDone, toast }) {
  const cfg = CONTENT_TYPES.find(c => c.key === contentType) ?? CONTENT_TYPES[0];

  const [files,     setFiles]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState([]);

  const filesRef = useRef([]);
  useEffect(() => { filesRef.current = files; }, [files]);

  useEffect(() => {
    if (open) { setFiles([]); setProgress([]); }
  }, [open]);

  if (!open || !album) return null;

  const upload = async () => {
    const currentFiles = filesRef.current;
    if (!currentFiles.length) { toast("Please select at least one file.", "error"); return; }
    setUploading(true);
    setProgress(currentFiles.map(f => ({ name: f.name, status: "uploading" })));
    const fd = new FormData();
    currentFiles.forEach(f => fd.append("files[]", f));
    try {
      await api.post(`/admin/graduation/albums/${album.id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProgress(currentFiles.map(f => ({ name: f.name, status: "done" })));
      toast(`${currentFiles.length} file(s) added to "${album.title}".`);
      setTimeout(() => { onDone(); onClose(); }, 600);
    } catch (err) {
      setProgress(currentFiles.map(f => ({ name: f.name, status: "error" })));
      toast(err.response?.data?.message ?? "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={520}>
        <ModalHeader
          title={`${cfg.icon} Add Files to "${album.title}"`}
          subtitle={
            FACE_TYPES.includes(contentType)
              ? "Images will be analyzed for face recognition automatically"
              : ["videos","songs","mass","speeches"].includes(contentType)
              ? "Media will be transcribed by AI automatically"
              : "Files will be added to this album"
          }
          onClose={onClose}
        />
        <ModalBody>
          <FileDropZone cfg={cfg} files={files} setFiles={setFiles} uploading={uploading} progress={progress} />
          {files.length > 0 && (
            <div style={{ fontSize: "0.78rem", color: T.primary, fontWeight: 600, marginTop: 4, marginBottom: 4 }}>
              ✓ {files.length} file(s) ready to upload
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Btn>
          <Btn onClick={upload} disabled={uploading || files.length === 0}>
            {uploading ? "Uploading…" : files.length > 0 ? `Upload ${files.length} file(s)` : "Upload"}
          </Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;
  const pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(last, cur + 2); i++) pages.push(i);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
      <div className="text-sm text-slate-500">Page {cur} of {last} · {meta.total} items</div>
      <div className="flex gap-1.5">
        {[
          { label: "←", page: cur - 1, disabled: cur === 1 },
          ...pages.map(p => ({ label: p, page: p, active: p === cur })),
          { label: "→", page: cur + 1, disabled: cur === last },
        ].map((b, i) => (
          <button key={i} onClick={() => !b.disabled && onPage(b.page)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
              b.active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            } ${b.disabled ? "cursor-default opacity-40" : ""}`}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatsRow({ stats, contentType }) {
  if (!stats || !stats[contentType]) return null;
  const s = stats[contentType];
  return (
    <div className="mb-5 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2.5">
      {[
        { label: "Total",     value: s.total,     color: T.primary },
        { label: "Published", value: s.published, color: T.success },
        { label: "Draft",     value: s.draft,     color: T.muted   },
        { label: "Archived",  value: s.archived,  color: T.warning },
      ].map(c => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">{c.label}</div>
          <div style={{ color: c.color }} className="text-2xl font-black leading-none">{c.value ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({ item, isAdmin, onViewFiles, onEdit, onDelete, onPublish, onArchive, onAddFiles }) {
  const typeEmoji = {
    photos: "🖼", videos: "🎬", program: "📄", archive: "📦",
    toga: "🎓", invitations: "✉️", songs: "🎵", mass: "⛪",
    speeches: "🎤", messages: "💬", highlights: "✨",
  };

  const photos    = item.photos ?? [];
  const firstImg  = photos.find(p => detectFileType(p) === "image");
  const thumb     = item.thumbnail_url ?? item.cover_photo_url ?? firstImg?.file_path ?? null;
  const fileCount = item.photos_count ?? item.file_count ?? photos.length ?? 0;
  const isVideo   = ["videos", "mass", "speeches"].includes(item.type);
  const isAudio   = item.type === "songs";
  const hasFace   = FACE_TYPES.includes(item.type);
  const hasStrip  = photos.length > 0;

  // Clean meta: show batch name + formatted event date only (no raw year duplication)
  const batchLabel = item.batch_name ?? "All Batches";
  const dateLabel  = item.event_date
    ? new Date(item.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const metaLine = [batchLabel, dateLabel].filter(Boolean).join(" · ");

  // Only show uploader if non-empty
  const uploader = item.uploaded_by?.trim() || null;

  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden", boxShadow: T.shadow,
        display: "flex", flexDirection: "column",
        transition: "box-shadow .18s, border-color .18s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.borderColor = "#c7d2fe"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow;   e.currentTarget.style.borderColor = T.border; }}
    >
      {/* ── Thumbnail ── */}
      <div
        onClick={onViewFiles}
        style={{
          height: 140, background: "linear-gradient(135deg,#1a2540,#2d3a6b)",
          position: "relative", overflow: "hidden", cursor: "pointer", flexShrink: 0,
        }}
      >
        {thumb && (
          <img
            src={thumb} alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        )}
        {/* Fallback icon — only shows when no thumb */}
        {!thumb && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", color: "rgba(255,255,255,.13)" }}>
            {isVideo ? "▶" : isAudio ? "🎵" : typeEmoji[item.type] ?? "📁"}
          </div>
        )}

        {/* Status badge — top left */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <StatusBadge status={item.status} />
        </div>

        {/* File count — top right */}
        {fileCount > 0 && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.58)", color: "#fff", fontSize: "0.67rem", fontWeight: 600, padding: "2px 8px", borderRadius: 5 }}>
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </div>
        )}

        {/* AI / Transcript pills — sit above the strip if present */}
        {(hasFace || item.has_transcript) && (
          <div style={{ position: "absolute", bottom: hasStrip ? 36 : 8, left: 8, display: "flex", gap: 4 }}>
            {hasFace && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(66,84,197,.88)", color: "#fff" }}>
                👤 AI
              </span>
            )}
            {item.has_transcript && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(22,163,74,.88)", color: "#fff" }}>
                📝
              </span>
            )}
          </div>
        )}

        {/* Mini file strip — flush at bottom, inside the 140px */}
        {hasStrip && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, display: "flex" }}>
            {photos.slice(0, 4).map((p, i) => {
              const t = detectFileType(p);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1, overflow: "hidden",
                    borderRight: i < 3 ? "0.5px solid rgba(255,255,255,.08)" : "none",
                    background: t === "image" ? `url(${p.file_path}) center/cover no-repeat` : "rgba(10,18,40,.35)",
                    backdropFilter: "blur(2px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem",
                  }}
                >
                  {t === "video" && <span style={{ color: "rgba(255,255,255,.65)" }}>▶</span>}
                  {t === "audio" && <span style={{ color: "rgba(255,255,255,.65)" }}>♪</span>}
                  {t === "pdf"   && <span style={{ color: "rgba(255,255,255,.65)" }}>📄</span>}
                  {t === "file"  && <span style={{ color: "rgba(255,255,255,.65)" }}>📎</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "11px 13px 10px", flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.87rem", color: T.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </div>
        <div style={{ fontSize: "0.73rem", color: T.muted, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {metaLine}
        </div>
        <div style={{ fontSize: "0.71rem", color: T.hint }}>
          {item.created_at_human}{uploader ? ` · by ${uploader}` : ""}
        </div>
        {item.description && (
          <div style={{ fontSize: "0.73rem", color: T.hint, marginTop: 5, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.description}
          </div>
        )}
      </div>

      {/* ── Actions row ── */}
      <div style={{ padding: "9px 10px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 5 }}>
        <button
          onClick={onViewFiles}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 8px", borderRadius: 8, border: `1px solid #c7d2fe`, background: T.primaryBg, color: T.primary, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          <Icon name="eye" className="h-3.5 w-3.5" /> View{fileCount > 0 ? ` (${fileCount})` : ""}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={e => { e.stopPropagation(); onAddFiles(); }}
              style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.border}`, background: "none", color: T.muted, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              + Files
            </button>

            {/* Separator */}
            <div style={{ width: 1, height: 18, background: T.border, flexShrink: 0, margin: "0 1px" }} />

            {item.status !== "published" ? (
              <button onClick={e => { e.stopPropagation(); onPublish(); }} title="Publish" style={iconBtn(T.success, T.successBg, "#86efac")}><Icon name="check" className="h-3.5 w-3.5" /></button>
            ) : (
              <button onClick={e => { e.stopPropagation(); onArchive(); }} title="Archive" style={iconBtn(T.warning, T.warningBg, "#fde68a")}><Icon name="archive" className="h-3.5 w-3.5" /></button>
            )}
            <button onClick={e => { e.stopPropagation(); onEdit(); }}   title="Edit"   style={iconBtn(T.muted, "none", T.border)}><Icon name="edit" className="h-3.5 w-3.5" /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete" style={iconBtn(T.danger, T.dangerBg, "#fecaca")}><Icon name="trash" className="h-3.5 w-3.5" /></button>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTENT TAB
// ═════════════════════════════════════════════════════════════════════════════
function ContentTab({ contentType, isAdmin, batches, stats, toast }) {
  const [items,          setItems]          = useState([]);
  const [meta,           setMeta]           = useState(null);
  const [page,           setPage]           = useState(1);
  const [loading,        setLoading]        = useState(true);
  const [actLoading,     setActLoading]     = useState(false);
  const [search,         setSearch]         = useState("");
  const [batchFilter,    setBatchFilter]    = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [albumModal,     setAlbumModal]     = useState(false);
  const [addFilesTarget, setAddFilesTarget] = useState(null);
  const [detailTarget,   setDetailTarget]   = useState(null);
  const [editTarget,     setEditTarget]     = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [confirmAction,  setConfirmAction]  = useState(null);
  const searchTimer = useRef(null);
  const cfg = CONTENT_TYPES.find(c => c.key === contentType);

  const load = useCallback(async (p = 1, q = search, batchId = batchFilter, status = statusFilter) => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? "/admin/graduation/content" : "/graduation/content";
      const params   = { type: contentType, page: p, per_page: 18 };
      if (q)               params.search   = q;
      if (batchId !== "all") params.batch_id = batchId;
      if (status  !== "all") params.status   = status;
      const res = await api.get(endpoint, { params });
      setItems(res.data.data ?? []);
      setMeta(res.data.meta  ?? null);
    } catch {
      toast("Failed to load content.", "error");
    } finally {
      setLoading(false);
    }
  }, [contentType, isAdmin, search, batchFilter, statusFilter]);

  useEffect(() => { load(page); }, [page, contentType, batchFilter, statusFilter]);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v); }, 400);
  };

  const handleEdit = async (form) => {
    setActLoading(true);
    try {
      await api.put(`/admin/graduation/content/${editTarget.id}`, form);
      toast("Album updated."); setEditTarget(null); load(page);
    } catch { toast("Update failed.", "error"); }
    finally  { setActLoading(false); }
  };

  const handleDelete = async () => {
    setActLoading(true);
    try {
      await api.delete(`/admin/graduation/content/${deleteTarget.id}`);
      toast("Album deleted."); setDeleteTarget(null); load(page);
    } catch { toast("Delete failed.", "error"); }
    finally  { setActLoading(false); }
  };

  const handleStatusAction = async () => {
    if (!confirmAction) return;
    setActLoading(true);
    try {
      await api.post(`/admin/graduation/content/${confirmAction.item.id}/${confirmAction.type}`);
      toast(confirmAction.type === "publish" ? "Published." : "Archived.");
      setConfirmAction(null); load(page);
    } catch { toast("Action failed.", "error"); }
    finally  { setActLoading(false); }
  };

  return (
    <>
      {isAdmin && <StatsRow stats={stats} contentType={contentType} />}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder={`Search ${cfg?.label ?? "content"}...`}
          className="min-w-[180px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={batchFilter}
          onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.graduation_year}</option>)}
        </select>
        {isAdmin && (
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        )}
        {meta && <div className="text-sm text-slate-500">{meta.total} albums</div>}
        {isAdmin && (
          <button
            onClick={() => setAlbumModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            + New Album
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Skeleton w="100%" h={140} radius={0} />
              <div className="p-3.5">
                <Skeleton w="70%" h={13} style={{ marginBottom: 8 }} />
                <Skeleton w="50%" h={11} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-12 text-center text-slate-500">
          <div className="mb-3 text-4xl font-black text-indigo-300">{cfg?.icon ?? "FIL"}</div>
          <div className="mb-1.5 text-base font-bold text-slate-800">
            No {cfg?.label ?? "content"} yet
          </div>
          <div className="mb-5 text-sm">
            {isAdmin ? "Create an album to get started." : "No published content available yet."}
          </div>
          {isAdmin && (
            <button
              onClick={() => setAlbumModal(true)}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              + Create First Album
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {items.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onViewFiles={() => setDetailTarget(item)}
              onAddFiles={() => setAddFilesTarget(item)}
              onEdit={() => setEditTarget(item)}
              onDelete={() => setDeleteTarget(item)}
              onPublish={() => setConfirmAction({ type: "publish", item })}
              onArchive={() => setConfirmAction({ type: "archive", item })}
            />
          ))}
        </div>
      )}

      <Pagination meta={meta} onPage={p => setPage(p)} />

      {/* Modals */}
      <AlbumUploadModal
        open={albumModal}
        contentType={contentType}
        batches={batches}
        onClose={() => setAlbumModal(false)}
        onDone={() => load(page)}
        toast={toast}
      />

      <AlbumDetailModal
        open={!!detailTarget}
        albumId={detailTarget?.id}
        album={detailTarget}
        contentType={contentType}
        isAdmin={isAdmin}
        onClose={() => setDetailTarget(null)}
        onAddFiles={() => setAddFilesTarget(detailTarget)}
        onRefresh={() => load(page)}
        toast={toast}
      />

      <AddFilesModal
        open={!!addFilesTarget}
        album={addFilesTarget}
        contentType={contentType}
        onClose={() => setAddFilesTarget(null)}
        onDone={() => load(page)}
        toast={toast}
      />

      <EditModal
        open={!!editTarget}
        item={editTarget}
        batches={batches}
        onSave={handleEdit}
        onCancel={() => setEditTarget(null)}
        loading={actLoading}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Album"
        message={`Permanently delete "${deleteTarget?.title}" and all its files?`}
        confirmLabel="Delete"
        confirmBg={T.danger}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={actLoading}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === "publish" ? "Publish Album" : "Archive Album"}
        message={confirmAction?.type === "publish"
          ? `Publish "${confirmAction?.item?.title}"? Students will be able to see it.`
          : `Archive "${confirmAction?.item?.title}"?`}
        confirmLabel={confirmAction?.type === "publish" ? "Publish" : "Archive"}
        confirmBg={confirmAction?.type === "publish" ? T.success : T.warning}
        onConfirm={handleStatusAction}
        onCancel={() => setConfirmAction(null)}
        loading={actLoading}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function GraduationContentPage({ isAdmin = false }) {
  const [activeTab, setActiveTab] = useState("photos");
  const [batches,   setBatches]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const { toasts, push: toast }   = useToast();

  useEffect(() => {
    api.get("/admin/batches", { params: { per_page: 100 } })
      .then(r => setBatches(r.data.data ?? r.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/admin/graduation/content/stats")
      .then(r => setStats(r.data))
      .catch(() => {});
  }, [isAdmin]);

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: ${T.primary} !important; box-shadow: 0 0 0 3px rgba(66,84,197,.12); }
      `}</style>

      <div className="min-h-screen bg-slate-50 px-6 py-7 animate-[fadeUp_.3s_ease]">
        <div className="mb-6">
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Graduation Content</h1>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${isAdmin ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
              {isAdmin ? "Admin" : "View Only"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Create albums then upload any files into them. Images auto-analyze faces · Media auto-transcribes."
              : "Browse published graduation materials from your batch."}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {CONTENT_TYPES.map(ct => (
            <button
              key={ct.key}
              onClick={() => setActiveTab(ct.key)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                activeTab === ct.key
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <ContentTab
            key={activeTab}
            contentType={activeTab}
            isAdmin={isAdmin}
            batches={batches}
            stats={stats}
            toast={toast}
          />
        </div>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}


