import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileUpload } from '../hooks/useProfileUpload';
import TagPeopleSearch from './TagPeopleSearch';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';

export default function ProfileUploadModal({ onClose, onSuccess }) {
  const { user: authUser } = useAuth();

  const tierKey = authUser?.tier === 'premium'
    ? 'premium'
    : authUser?.tier === 'standard' || authUser?.plan === 'premium'
      ? 'premium_standard'
      : 'free';

  const {
    fileRef, preview,
    caption,    setCaption,
    visibility, setVisibility,
    taggedUsers, tagUser, untagUser,
    uploading, progress, error,
    canUpload,
    handleFileChange, upload, reset,
  } = useProfileUpload(() => { onSuccess?.(); onClose(); }, tierKey);

  // ── Multi-file state ────────────────────────────────────────────────────────
  const [files,       setFiles]       = useState([]); // [{ id, file, url, caption, isVideo }]
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [uploading2,  setUploading2]  = useState(false);
  const [progresses,  setProgresses]  = useState({}); // { id: 0-100 }
  const [errors2,     setErrors2]     = useState({}); // { id: 'msg' }
  const [done,        setDone]        = useState(false);
  const multiRef = useRef();

  const MAX_FILES = tierKey === 'premium' ? 20 : tierKey === 'premium_standard' ? 10 : 5;
  const MAX_MB    = 50;

  // ── Shared caption / visibility / tags for all files ──────────────────────
  const [sharedCaption,    setSharedCaption]    = useState('');
  const [sharedVisibility, setSharedVisibility] = useState('public');
  const [sharedTags,       setSharedTags]       = useState([]);
  const [perFileCaptions,  setPerFileCaptions]  = useState({}); // { id: caption }

  const visOpts = [
    { value: 'public',  icon: 'fa-globe',       label: 'Public'  },
    { value: 'friends', icon: 'fa-user-friends', label: 'Friends' },
    { value: 'private', icon: 'fa-lock',         label: 'Only Me' },
  ];

  // ── Add files ──────────────────────────────────────────────────────────────
  const handleMultiFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const valid    = selected.filter(f => f.size <= MAX_MB * 1024 * 1024);
    const newEntries = valid.slice(0, MAX_FILES - files.length).map(f => ({
      id:      Math.random().toString(36).slice(2),
      file:    f,
      url:     URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
    }));
    setFiles(prev => {
      const merged = [...prev, ...newEntries];
      setActiveIdx(merged.length - 1);
      return merged;
    });
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      setActiveIdx(Math.max(0, Math.min(activeIdx, next.length - 1)));
      return next;
    });
    setPerFileCaptions(prev => { const c = { ...prev }; delete c[id]; return c; });
    setProgresses(prev =>      { const c = { ...prev }; delete c[id]; return c; });
    setErrors2(prev =>         { const c = { ...prev }; delete c[id]; return c; });
  };

  // ── Upload all ─────────────────────────────────────────────────────────────
  const uploadAll = async () => {
    if (!files.length || uploading2) return;
    setUploading2(true);
    setErrors2({});

    const { profileApi } = await import('@/api/gallery.api');
    const fd = new FormData();

    // All files in ONE request → ONE post in DB
    files.forEach(entry => fd.append('files[]', entry.file));
    fd.append('caption',    sharedCaption);
    fd.append('visibility', sharedVisibility);
    sharedTags.forEach(u => fd.append('tagged_user_ids[]', String(u.id)));

    try {
      await profileApi.uploadMedia(fd, (pct) => {
        // Show same progress on all thumbs
        setProgresses(prev => {
          const next = { ...prev };
          files.forEach(f => { next[f.id] = pct; });
          return next;
        });
      });

      // Mark all done
      setProgresses(() => {
        const done = {};
        files.forEach(f => { done[f.id] = 100; });
        return done;
      });

      setDone(true);
      setTimeout(() => { onSuccess?.(); }, 900);

    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed.';
      setErrors2(() => {
        const errs = {};
        files.forEach(f => { errs[f.id] = msg; });
        return errs;
      });
    } finally {
      setUploading2(false);
    }
  };

  const totalProgress = files.length
    ? Math.round(Object.values(progresses).reduce((a, b) => a + b, 0) / files.length)
    : 0;

  // ── Thumb strip ────────────────────────────────────────────────────────────
  const ThumbStrip = () => (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
      {files.map((f, i) => (
        <div
          key={f.id}
          onClick={() => setActiveIdx(i)}
          style={{
            position: 'relative', flexShrink: 0,
            width: 60, height: 60, borderRadius: 10, overflow: 'hidden',
            border: i === activeIdx ? '2.5px solid #1d2b4b' : '2px solid #e2e8f0',
            cursor: 'pointer', background: '#0f172a',
            boxShadow: i === activeIdx ? '0 0 0 2px rgba(29,43,75,0.2)' : 'none',
            transition: 'border 0.12s',
          }}
        >
          {f.isVideo
            ? <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            : <img   src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          }
          {/* Progress ring overlay */}
          {progresses[f.id] != null && progresses[f.id] < 100 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{progresses[f.id]}%</span>
            </div>
          )}
          {progresses[f.id] === 100 && !errors2[f.id] && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-check" style={{ color: '#fff', fontSize: 14 }} />
            </div>
          )}
          {errors2[f.id] && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-exclamation" style={{ color: '#fff', fontSize: 13 }} />
            </div>
          )}
          {/* Remove */}
          {!uploading2 && (
            <button
              onClick={e => { e.stopPropagation(); removeFile(f.id); }}
              style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fas fa-times" />
            </button>
          )}
          {/* Video badge */}
          {f.isVideo && (
            <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 4px' }}>
              <i className="fas fa-video" style={{ color: '#fff', fontSize: 7 }} />
            </div>
          )}
        </div>
      ))}

      {/* Add more button */}
      {files.length < MAX_FILES && !uploading2 && (
        <div
          onClick={() => multiRef.current.click()}
          style={{
            flexShrink: 0, width: 60, height: 60, borderRadius: 10,
            border: '2px dashed #e2e8f0', background: '#f8fafc',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 3,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d2b4b'; e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
        >
          <i className="fas fa-plus" style={{ color: '#94a3b8', fontSize: 13 }} />
          <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700 }}>ADD</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
        @keyframes modalSlide {
          from { opacity:0; transform:translate(-50%,-46%) scale(0.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes successPop {
          0%   { transform:translate(-50%,-50%) scale(0.92); opacity:0; }
          60%  { transform:translate(-50%,-50%) scale(1.04); }
          100% { transform:translate(-50%,-50%) scale(1);    opacity:1; }
        }
        .multi-thumb-strip::-webkit-scrollbar { height: 3px; }
        .multi-thumb-strip::-webkit-scrollbar-track { background: #f1f5f9; border-radius:99px }
        .multi-thumb-strip::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius:99px }
      `}</style>

      {/* Backdrop */}
      <div onClick={!uploading2 ? onClose : undefined} style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(10,16,30,0.72)', backdropFilter: 'blur(6px)',
        animation: 'backdropIn 0.2s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: '100%', maxWidth: 520,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        animation: done ? 'successPop 0.3s ease' : 'modalSlide 0.25s cubic-bezier(0.34,1.3,0.64,1)',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e2d4f 100%)',
          padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(253,184,19,0.15)',
              border: '1px solid rgba(253,184,19,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-images" style={{ color: '#fdb813', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Share Memories</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.04em' }}>
                {canUpload
                  ? `Up to ${MAX_FILES} files · ${tierKey === 'premium' ? 'Premium HD 4K' : 'Standard HD'}`
                  : 'Premium feature'
                }
              </div>
            </div>
          </div>
          <button
            onClick={!uploading2 ? onClose : undefined}
            disabled={uploading2}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: uploading2 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)', cursor: uploading2 ? 'not-allowed' : 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, maxHeight: '82vh', overflowY: 'auto' }}>

          {/* ── FREE GATE ───────────────────────────────────────────────────── */}
          {!canUpload ? (
            <div style={{ textAlign: 'center', padding: '20px 8px 8px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(135deg,#f0f3fa,#e8edf5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-crown" style={{ fontSize: 24, color: '#fdb813' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Premium Required</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
                Uploading photos and videos is available for subscribers. Upgrade to share your memories.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Free',       icon: 'fa-eye',   desc: 'View only',          color: '#94a3b8', bg: '#f8fafc' },
                  { label: 'Standard',   icon: 'fa-bolt',  desc: 'HD · 10 files',      color: '#3f51b5', bg: '#eef2ff', highlight: true },
                  { label: 'Premium HD', icon: 'fa-crown', desc: '4K · 20 files · 10GB', color: '#d97706', bg: '#fffbeb', highlight: true },
                ].map(t => (
                  <div key={t.label} style={{ flex: 1, borderRadius: 12, padding: '14px 8px', textAlign: 'center', border: t.highlight ? `1.5px solid ${t.color}30` : '1.5px solid #e2e8f0', background: t.bg }}>
                    <i className={`fas ${t.icon}`} style={{ color: t.color, fontSize: 18, marginBottom: 8, display: 'block' }} />
                    <div style={{ fontSize: 11, fontWeight: 800, color: t.color, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
              <Link to="/subscription" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#fdb813,#f59e0b)', color: '#1d2b4b', textDecoration: 'none', padding: '11px 28px', borderRadius: 10, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 16px rgba(253,184,19,0.35)' }}>
                <i className="fas fa-crown" style={{ fontSize: 11 }} /> Upgrade Now
              </Link>
              <button onClick={onClose} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>

          ) : done ? (
            /* ── SUCCESS STATE ────────────────────────────────────────────── */
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                <i className="fas fa-check" style={{ color: '#fff', fontSize: 26 }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                {files.length} {files.length === 1 ? 'photo' : 'photos'} posted!
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Your memories are live on your profile.</p>
            </div>

          ) : (
            /* ── UPLOAD FORM ──────────────────────────────────────────────── */
            <>
              {/* Hidden multi-file input */}
              <input
                ref={multiRef}
                type="file" hidden multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/gif,video/mp4,video/quicktime"
                onChange={handleMultiFileChange}
              />

              {/* Drop zone — shown when no files yet */}
              {files.length === 0 ? (
                <div
                  onClick={() => multiRef.current.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#1d2b4b'; e.currentTarget.style.background = '#f1f5f9'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                    const dt = e.dataTransfer.files;
                    if (dt.length) {
                      // Synthetic event for handleMultiFileChange
                      handleMultiFileChange({ target: { files: dt, value: '' }, preventDefault: () => {} });
                    }
                  }}
                  style={{ border: '2px dashed #e2e8f0', borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.18s', marginBottom: 14 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d2b4b'; e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px', background: '#1d2b4b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813', fontSize: 22 }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Click or drag to upload</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
                    JPEG · PNG · WebP · GIF · HEIC · MP4 · MOV<br />
                    Up to <strong style={{ color: '#1d2b4b' }}>{MAX_FILES} files</strong> · Max <strong style={{ color: '#1d2b4b' }}>50 MB</strong> each
                  </div>
                </div>

              ) : (
                <>
                  {/* Thumbnail strip */}
                  <div className="multi-thumb-strip" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
                    {files.map((f, i) => (
                      <div
                        key={f.id}
                        onClick={() => setActiveIdx(i)}
                        style={{ position: 'relative', flexShrink: 0, width: 62, height: 62, borderRadius: 10, overflow: 'hidden', border: i === activeIdx ? '2.5px solid #1d2b4b' : '2px solid #e2e8f0', cursor: 'pointer', background: '#0f172a', transition: 'border 0.12s' }}
                      >
                        {f.isVideo
                          ? <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          : <img   src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                        {progresses[f.id] != null && progresses[f.id] < 100 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{progresses[f.id]}%</span>
                          </div>
                        )}
                        {progresses[f.id] === 100 && !errors2[f.id] && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-check" style={{ color: '#fff', fontSize: 14 }} />
                          </div>
                        )}
                        {errors2[f.id] && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-exclamation" style={{ color: '#fff', fontSize: 13 }} />
                          </div>
                        )}
                        {!uploading2 && (
                          <button
                            onClick={e => { e.stopPropagation(); removeFile(f.id); }}
                            style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.72)', border: 'none', color: '#fff', fontSize: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="fas fa-times" />
                          </button>
                        )}
                        {f.isVideo && (
                          <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 4px' }}>
                            <i className="fas fa-video" style={{ color: '#fff', fontSize: 7 }} />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add more */}
                    {files.length < MAX_FILES && !uploading2 && (
                      <div
                        onClick={() => multiRef.current.click()}
                        style={{ flexShrink: 0, width: 62, height: 62, borderRadius: 10, border: '2px dashed #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 3, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d2b4b'; e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                      >
                        <i className="fas fa-plus" style={{ color: '#94a3b8', fontSize: 14 }} />
                        <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700 }}>
                          {files.length}/{MAX_FILES}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active file preview */}
                  {files[activeIdx] && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0f172a', position: 'relative', marginBottom: 14, maxHeight: 220 }}>
                      {files[activeIdx].isVideo
                        ? <video src={files[activeIdx].url} controls style={{ width: '100%', maxHeight: 220, display: 'block' }} />
                        : <img   src={files[activeIdx].url} alt="Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                      }
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {activeIdx + 1} / {files.length}
                      </div>
                    </div>
                  )}

                  {/* Per-file caption toggle */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span><i className="fas fa-pen" style={{ color: '#fdb813', marginRight: 5 }} />Caption</span>
                      <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>
                        {files[activeIdx] && perFileCaptions[files[activeIdx].id] != null
                          ? `Custom for photo ${activeIdx + 1}`
                          : 'Applied to all'
                        }
                      </span>
                    </div>

                    {/* Shared caption */}
                    <textarea
                      value={sharedCaption}
                      onChange={e => setSharedCaption(e.target.value)}
                      placeholder="Write a caption for all photos..."
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', marginBottom: 6, border: '1.5px solid #e2e8f0', borderRadius: 10, resize: 'none', fontFamily: 'inherit', fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fafafa', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#1d2b4b'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />

                    {/* Per-photo caption override */}
                    {files[activeIdx] && (
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fas fa-image" style={{ fontSize: 9 }} />
                          Override caption for photo {activeIdx + 1} only (optional)
                        </div>
                        <textarea
                          value={perFileCaptions[files[activeIdx].id] ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            setPerFileCaptions(prev => ({ ...prev, [files[activeIdx].id]: val }));
                          }}
                          placeholder={`Custom caption for photo ${activeIdx + 1}...`}
                          rows={1}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #e2e8f0', borderRadius: 8, resize: 'none', fontFamily: 'inherit', fontSize: 12, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fafffe', transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#3f51b5'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tag people */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-user-tag" style={{ color: '#fdb813' }} /> Tag People
                </div>
                <TagPeopleSearch
                  tagged={sharedTags}
                  onTag={u  => setSharedTags(prev => [...prev.filter(x => x.id !== u.id), u])}
                  onUntag={u => setSharedTags(prev => prev.filter(x => x.id !== u.id))}
                  excludeId={authUser?.id}
                />
              </div>

              {/* Visibility */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Visibility
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {visOpts.map(opt => (
                    <button key={opt.value} onClick={() => setSharedVisibility(opt.value)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', border: sharedVisibility === opt.value ? '2px solid #1d2b4b' : '1.5px solid #e2e8f0', background: sharedVisibility === opt.value ? '#f0f3fa' : '#fafafa', color: sharedVisibility === opt.value ? '#1d2b4b' : '#94a3b8', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.12s' }}>
                      <i className={`fas ${opt.icon}`} style={{ fontSize: 10 }} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Any errors */}
              {Object.keys(errors2).length > 0 && (
                <div style={{ marginBottom: 12, padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
                  <i className="fas fa-circle-exclamation" style={{ marginRight: 6 }} />
                  {Object.keys(errors2).length} file{Object.keys(errors2).length > 1 ? 's' : ''} failed to upload. Check your connection and try again.
                </div>
              )}

              {/* Overall progress bar */}
              {uploading2 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                    <span>Uploading {files.length} file{files.length > 1 ? 's' : ''}...</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #1d2b4b, #3f51b5)', width: `${totalProgress}%`, transition: 'width 0.25s ease' }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={!uploading2 ? onClose : undefined}
                  disabled={uploading2}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: uploading2 ? '#c4cdd8' : '#64748b', fontSize: 13, fontWeight: 600, cursor: uploading2 ? 'not-allowed' : 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (!uploading2) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={uploadAll}
                  disabled={files.length === 0 || uploading2}
                  style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: files.length === 0 || uploading2 ? '#e2e8f0' : 'linear-gradient(135deg,#1d2b4b,#2d4270)', color: files.length === 0 || uploading2 ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 700, cursor: files.length === 0 || uploading2 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 0.15s' }}
                >
                  {uploading2
                    ? <><i className="fas fa-spinner fa-spin" /> Uploading {files.length} file{files.length > 1 ? 's' : ''}...</>
                    : <><i className="fas fa-cloud-arrow-up" style={{ color: files.length ? '#fdb813' : '#94a3b8' }} /> Post {files.length > 0 ? `${files.length} Photo${files.length > 1 ? 's' : ''}` : 'to Profile'}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}