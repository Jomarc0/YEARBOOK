/**
 * GalleryPage.jsx  (MODIFIED)
 * src/features/yearbook/pages/GalleryPage.jsx
 *
 * Changes from original:
 *   1. GradProgramCard  — download button now requires premium; shows upgrade
 *      prompt for free users instead of a direct <a download> link.
 *   2. GradInvitationCard — same download gate.
 *   3. GradAlbumCard / GradVideoCard / GradSongCard — unchanged.
 *   4. ContentOwnershipBanner added to the hero.
 *   5. Gallery photo cards in the general tab now use ProtectedImage.
 *   6. All direct "Save image as" download links removed from photo grids.
 *   7. StorageUsageBar is hidden for free-tier users.
 *   8. isPremium now accounts for both 'premium' and 'standard' tiers.
 *   9. No other business logic changed.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, mediaApi } from '@/api/gallery.api';
import { graduationApi } from '@/api/yearbook.api';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useAuth } from '@/features/auth/hooks/useAuth';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import BulkUploadZone from '@/features/yearbook/components/BulkUploadZone';
import StorageUsageBar from '@/features/yearbook/components/StorageUsageBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

// ── NEW imports ───────────────────────────────────────────────────────────────
import ProtectedImage from '@/components/ui/ProtectedImage';
import { ContentOwnershipBanner } from '@/components/ui/CopyrightLabel';

// ─── Safe localStorage getter (Edge/Safari Tracking Prevention blocks direct access) ──
const safeGetToken = () => {
  try { 
    return localStorage.getItem('auth_token') || localStorage.getItem('sb_token') || '';
  }
  catch { return ''; }
};

// ─── tier helper (consistent with Navbar / ProfilePage) ───────────────────────
const getTier = (user) => {
  if (!user) return 'free';
  if (user.tier === 'premium' || user.is_premium) return 'premium';
  if (user.tier === 'standard') return 'standard';
  return 'free';
};

// ─────────────────────────────────────────────────────────────────────────────
// TABS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',               label: 'All Photos',    icon: 'fa-images',             grad: false },
  { key: 'graduation:photos',     label: 'Graduation',    icon: 'fa-graduation-cap',     grad: true  },
  { key: 'graduation:toga',       label: 'Toga Gallery',  icon: 'fa-user-graduate',      grad: true  },
  { key: 'graduation:archive',    label: 'Archive',       icon: 'fa-box-archive',        grad: true  },
  { key: 'graduation:videos',     label: 'Videos',        icon: 'fa-film',               grad: true  },
  { key: 'graduation:program',    label: 'Program',       icon: 'fa-file-pdf',           grad: true  },
  { key: 'graduation:invitation', label: 'Invitation',    icon: 'fa-envelope-open-text', grad: true  },
  { key: 'graduation:song',       label: 'Grad Song',     icon: 'fa-music',              grad: true  },
  { key: 'graduation:mass',       label: 'Baccalaureate', icon: 'fa-church',             grad: true  },
];

const UPLOAD_CONFIG = {
  'graduation:photos':     { label: 'Upload Photos',        endpoint: '/api/graduation/upload-photo',      field: 'photos', accept: 'image/jpeg,image/png,image/webp',                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true  },
  'graduation:toga':       { label: 'Upload Toga Photos',   endpoint: '/api/graduation/upload-photo',      field: 'photos', accept: 'image/jpeg,image/png,image/webp',                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true  },
  'graduation:archive':    { label: 'Upload Archive Photos', endpoint: '/api/graduation/upload-photo',     field: 'photos', accept: 'image/jpeg,image/png,image/webp',                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true  },
  'graduation:videos':     { label: 'Upload Video',         endpoint: '/api/graduation/upload-video',      field: 'video',  accept: 'video/mp4,video/quicktime,video/webm',                               multiple: false, note: 'MP4, MOV, WebM — max 2GB',        needsAlbum: false },
  'graduation:program':    { label: 'Upload Program',       endpoint: '/api/graduation/upload-program',    field: 'program',accept: 'application/pdf',                                                    multiple: false, note: 'PDF only — max 20MB',             needsAlbum: false },
  'graduation:invitation': { label: 'Upload Invitation',    endpoint: '/api/graduation/upload-invitation', field: 'file',   accept: 'application/pdf,image/jpeg,image/png,image/webp',                   multiple: false, note: 'PDF or image — max 20MB',         needsAlbum: false },
  'graduation:song':       { label: 'Upload Song / Video',  endpoint: '/api/graduation/upload-song',       field: 'audio',  accept: 'audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,audio/webm,video/mp4,video/quicktime,video/webm', multiple: false, note: 'Audio: MP3, WAV, M4A  ·  Video: MP4, MOV, WebM — max 500MB', needsAlbum: false },
  'graduation:mass':       { label: 'Upload Mass Video',    endpoint: '/api/graduation/upload-mass',       field: 'video',  accept: 'video/mp4,video/quicktime,video/webm',                               multiple: false, note: 'MP4, MOV, WebM — max 2GB',        needsAlbum: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// Storage hook (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function useStorageUsage() {
  const [storage, setStorage] = useState({ used_bytes: 0, limit_bytes: 524288000, tier: 'free' });
  const reload = () =>
    mediaApi.storageUsage()
      .then(({ data }) => {
        const p = data?.data ?? data;
        setStorage({ used_bytes: p.used_bytes ?? p.used ?? 0, limit_bytes: p.limit_bytes ?? p.limit ?? 524288000, tier: p.tier ?? 'free' });
      })
      .catch(() => {});
  useEffect(() => { reload(); }, []);
  return [storage, reload];
}

// ─────────────────────────────────────────────────────────────────────────────
// Protected download gate
// ─────────────────────────────────────────────────────────────────────────────
function ProtectedDownloadButton({ href, label = 'Download', isPremium = false }) {
  const [showGate, setShowGate] = useState(false);

  if (!isPremium) {
    return (
      <>
        <button
          onClick={() => setShowGate(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 700,
            color: '#94a3b8', textDecoration: 'none',
            background: '#f1f5f9', padding: '8px 16px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
          }}
          title="Premium required to download"
        >
          <i className="fas fa-lock" style={{ fontSize: 11 }} /> {label}
        </button>

        {showGate && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: 'rgba(8,12,24,0.75)' }}
            onClick={() => setShowGate(false)}
          >
            <div
              style={{
                background: '#fff', borderRadius: 28, padding: '36px 32px',
                maxWidth: 400, width: '100%', textAlign: 'center',
                boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(29,43,75,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <i className="fas fa-shield-halved" style={{ fontSize: 24, color: '#1d2b4b' }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: '#1d2b4b', margin: '0 0 10px' }}>
                Content Protected
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px', lineHeight: 1.6 }}>
                This document is owned by <strong>National University Lipa</strong>.
              </p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
                Upgrade to <strong style={{ color: '#1d2b4b' }}>Premium</strong> or <strong style={{ color: '#1d2b4b' }}>Standard</strong> to download
                official graduation documents.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowGate(false)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 14,
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <Link
                  to="/premium"
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 14,
                    background: '#1d2b4b', color: '#fdb813',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    textDecoration: 'none',
                  }}
                >
                  <i className="fas fa-star" style={{ fontSize: 11 }} /> Upgrade
                </Link>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Premium / Standard user — real download link
  return (
    <a
      href={href}
      download
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 700,
        color: '#1d2b4b', textDecoration: 'none',
        background: 'rgba(253,184,19,0.15)', padding: '8px 16px', borderRadius: 10,
      }}
    >
      <i className="fas fa-download" /> {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Graduation Upload Modal (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function GradUploadModal({ tab, albums, onClose, onSuccess }) {
  const cfg = UPLOAD_CONFIG[tab];
  const [files,     setFiles]     = useState([]);
  const [title,     setTitle]     = useState('');
  const [desc,      setDesc]      = useState('');
  const [eventDate, setEventDate] = useState('');
  const [albumId,   setAlbumId]   = useState(albums?.[0]?.id ?? '');
  const [newAlbum,  setNewAlbum]  = useState('');
  const [useNew,    setUseNew]    = useState(!albums?.length);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');

  if (!cfg) return null;

  const handleSubmit = async () => {
    if (!files.length)                                { setError('Please select a file.'); return; }
    if (!cfg.needsAlbum && !title.trim())             { setError('Title is required.'); return; }
    if (cfg.needsAlbum && useNew && !newAlbum.trim()) { setError('Album name is required.'); return; }
    setLoading(true); setError('');
    try {
      const token = safeGetToken();
      let targetAlbumId = albumId;
      if (cfg.needsAlbum && useNew) {
        const category = tab.split(':')[1];
        const r = await fetch('/api/graduation/album', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: newAlbum, description: desc, category, event_date: eventDate || null }) });
        // Guard: server may return HTML on 500 instead of JSON
        const ct = r.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) throw new Error(`Server error (${r.status}). Please try again.`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.message ?? 'Album creation failed.');
        targetAlbumId = d.data.id;
      }
      const fd = new FormData();
      if (cfg.needsAlbum) { fd.append('album_id', targetAlbumId); files.forEach(f => fd.append('photos[]', f)); }
      else { fd.append('title', title); fd.append('description', desc); if (eventDate) fd.append('event_date', eventDate); fd.append(cfg.field, files[0]); }
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', cfg.endpoint);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => {
          if (xhr.status < 300) { resolve(); return; }
          // Guard: parse only if response is JSON, otherwise show status
          try {
            const ct = xhr.getResponseHeader('content-type') ?? '';
            const msg = ct.includes('application/json')
              ? (JSON.parse(xhr.responseText)?.message ?? 'Upload failed.')
              : `Server error (${xhr.status}). Please try again.`;
            reject(new Error(msg));
          } catch {
            reject(new Error(`Server error (${xhr.status}). Please try again.`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error. Check your connection and try again.'));
        xhr.send(fd);
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setProgress(0); }
  };

  const iStyle = { borderColor: '#e2e8f0', color: '#1d2b4b', fontFamily: 'inherit' };
  const onFocus = e => e.target.style.borderColor = '#3f51b5';
  const onBlur  = e => e.target.style.borderColor = '#e2e8f0';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(8,12,24,0.75)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full overflow-y-auto" style={{ maxWidth: '500px', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 pt-7 pb-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>{cfg.label}</h2>
            <p className="text-xs mt-1 m-0" style={{ color: '#94a3b8' }}>{cfg.note}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <i className="fas fa-times text-sm" />
          </button>
        </div>
        <div className="px-7 py-6 flex flex-col gap-5">
          {cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Album</label>
              {albums?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {['Existing Album', 'New Album'].map((lbl, i) => (
                    <button key={lbl} onClick={() => setUseNew(!!i)} className="flex-1 py-2 rounded-xl text-sm font-bold border-none cursor-pointer transition-all" style={{ background: useNew === !!i ? '#1d2b4b' : '#f1f5f9', color: useNew === !!i ? 'white' : '#64748b' }}>{lbl}</button>
                  ))}
                </div>
              )}
              {!useNew && albums?.length > 0
                ? <select value={albumId} onChange={e => setAlbumId(e.target.value)} className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={iStyle}>{albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
                : <input type="text" value={newAlbum} onChange={e => setNewAlbum(e.target.value)} placeholder="New album name" className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={iStyle} onFocus={onFocus} onBlur={onBlur} />
              }
            </div>
          )}
          {!cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a title…" className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={iStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Description <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Short description…" className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none" style={iStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Event Date <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span></label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={iStyle} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>File{cfg.multiple ? 's' : ''} *</label>
            <label onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#3f51b5'; e.currentTarget.style.background='rgba(63,81,181,0.04)'; }} onDragLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc'; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc'; const f=Array.from(e.dataTransfer.files); setFiles(cfg.multiple?f:[f[0]]); }} className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer" style={{ border: '2px dashed #e2e8f0', padding: '24px 20px', background: files.length ? 'rgba(63,81,181,0.04)' : '#f8fafc' }}>
              <i className={`fas ${files.length ? 'fa-check-circle' : 'fa-cloud-arrow-up'} text-3xl`} style={{ color: files.length ? '#3f51b5' : '#cbd5e1' }} />
              {files.length ? <p className="text-sm font-bold m-0" style={{ color: '#3f51b5' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</p> : <p className="text-sm font-semibold m-0" style={{ color: '#94a3b8' }}>Click or drag &amp; drop</p>}
              <input type="file" accept={cfg.accept} multiple={cfg.multiple} className="hidden" onChange={e => setFiles(cfg.multiple ? Array.from(e.target.files) : [e.target.files[0]])} />
            </label>
          </div>
          {loading && progress > 0 && (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: '#64748b' }}><span>Uploading…</span><span>{progress}%</span></div>
              <div className="w-full rounded-full" style={{ height: '6px', background: '#e2e8f0' }}><div style={{ width: `${progress}%`, height: '6px', background: '#3f51b5', borderRadius: '9999px' }} /></div>
            </div>
          )}
          {error && <div className="text-sm font-semibold px-4 py-3 rounded-xl" style={{ background: '#fee2e2', color: '#dc2626' }}><i className="fas fa-circle-exclamation mr-2" />{error}</div>}
          <button onClick={handleSubmit} disabled={loading} className="w-full flex items-center justify-center gap-2 font-bold text-white py-3.5 rounded-2xl border-none cursor-pointer text-sm" style={{ background: loading ? '#94a3b8' : '#1d2b4b' }} onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3f51b5'; }} onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1d2b4b'; }}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Uploading…</> : <><i className="fas fa-cloud-arrow-up" /> {cfg.label}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADUATION CONTENT CARDS
// ─────────────────────────────────────────────────────────────────────────────

function GradAlbumCard({ album }) {
  const cover = album.photos?.[0]?.file_path;
  return (
    <Link to={`/graduation/archive/${album.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 20px 45px rgba(29,43,75,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(29,43,75,0.07)'; }}>
        <div style={{ height: 220, background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', position: 'relative', overflow: 'hidden' }}>
          {cover
            ? <ProtectedImage src={cover} alt={album.title} watermark={false} showCopyright={false} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} style={{ width: '100%', height: '100%' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-images" style={{ fontSize: 48, color: 'rgba(253,184,19,0.4)' }} /></div>
          }
          <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(253,184,19,0.95)', color: '#1d2b4b', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
            {album.photos_count ?? 0} photos
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.title}</h4>
          {album.event_date && (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
              {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function GradVideoCard({ album, badge }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ background: '#0a0f1e' }}>
        {playing
          ? <video src={album.media_url} controls autoPlay style={{ width: '100%', maxHeight: 240, display: 'block' }} />
          : <div onClick={() => setPlaying(true)} style={{ height: 200, background: 'linear-gradient(135deg,#0d1b35,#1d2b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              {badge && <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(253,184,19,0.95)', color: '#1d2b4b', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 10 }}>{badge}</span>}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ color: '#1d2b4b', fontSize: 18, marginLeft: 3 }} />
              </div>
            </div>
        }
      </div>
      <div style={{ padding: 20 }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 6px' }}>{album.title}</h4>
        {album.description && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{album.description}</p>}
        {album.event_date && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <Link to="/graduation/speeches" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#3f51b5', textDecoration: 'none', background: 'rgba(63,81,181,0.08)', padding: '4px 10px', borderRadius: 8 }}>
          <i className="fas fa-file-lines" /> View Transcript
        </Link>
      </div>
    </div>
  );
}

function GradProgramCard({ album, isPremium = false }) {
  return (
    <div style={{ borderRadius: 24, background: '#fff', padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(253,184,19,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="fas fa-file-pdf" style={{ color: '#fdb813', fontSize: 22 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 4px' }}>{album.title}</h4>
        {album.description && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px' }}>{album.description}</p>}
        {album.event_date && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fas fa-copyright" style={{ color: '#fdb813', fontSize: 10 }} />
          Property of National University Lipa. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={album.media_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#1d2b4b', padding: '8px 16px', borderRadius: 10 }}>
            <i className="fas fa-eye" /> View
          </a>
          <ProtectedDownloadButton href={album.media_url} label="Download" isPremium={isPremium} />
        </div>
      </div>
    </div>
  );
}

function GradInvitationCard({ album, isPremium = false }) {
  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 20px 45px rgba(29,43,75,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(29,43,75,0.07)'; }}>
      <div style={{ height: 240, background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {album.media_url?.match(/\.(jpg|jpeg|png|webp)$/i)
          ? <ProtectedImage src={album.media_url} alt={album.title} watermarkText="© NU Lipa" showCopyright style={{ width: '100%', height: '100%' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <i className="fas fa-envelope-open-text" style={{ fontSize: 48, color: 'rgba(253,184,19,0.6)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Digital Invitation</span>
            </div>
        }
      </div>
      <div style={{ padding: '18px 20px' }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 6px' }}>{album.title}</h4>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fas fa-copyright" style={{ color: '#fdb813', fontSize: 10 }} />
          Property of National University Lipa
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={album.media_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#1d2b4b', padding: '7px 14px', borderRadius: 10 }}>
            <i className="fas fa-eye" /> View
          </a>
          <ProtectedDownloadButton href={album.media_url} label="Save" isPremium={isPremium} />
        </div>
      </div>
    </div>
  );
}

function GradSongCard({ album }) {
  const mediaRef               = useRef(null);
  const [playing,  setPlaying] = useState(false);
  const [current,  setCurrent] = useState(0);
  const [duration, setDur]     = useState(0);

  // Detect if the uploaded file is a video based on URL extension or MIME hint
  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(album.media_url ?? '');

  const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const toggle = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div style={{ borderRadius: 24, background: '#fff', overflow: 'hidden', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>

      {isVideo ? (
        /* ── Video mode ── */
        <div style={{ background: '#0a0f1e', position: 'relative' }}>
          <video
            ref={mediaRef}
            src={album.media_url}
            style={{ width: '100%', maxHeight: 220, display: 'block', background: '#000' }}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)}
          />
          {/* overlay play button before first play */}
          {!playing && (
            <div
              onClick={toggle}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ color: '#1d2b4b', fontSize: 18, marginLeft: 3 }} />
              </div>
            </div>
          )}
          {/* type badge */}
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(29,43,75,0.8)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
            <i className="fas fa-film" style={{ marginRight: 4 }} />VIDEO
          </span>
        </div>
      ) : (
        /* ── Audio mode ── */
        <div style={{ height: 130, background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {[...Array(20)].map((_,i) => (
            <div key={i} style={{ position: 'absolute', width: 3, borderRadius: 3, height: `${20+Math.sin(i*0.8)*32}px`, background: playing ? '#fdb813' : 'rgba(253,184,19,0.25)', left: `${4+i*4.8}%`, transition: 'background 0.3s' }} />
          ))}
          <button
            onClick={toggle}
            style={{ position: 'relative', zIndex: 1, width: 52, height: 52, borderRadius: '50%', background: '#fdb813', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} style={{ color: '#1d2b4b', fontSize: 16, marginLeft: playing ? 0 : 3 }} />
          </button>
          {/* type badge */}
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(253,184,19,0.2)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>
            <i className="fas fa-music" style={{ marginRight: 4 }} />AUDIO
          </span>
          <audio
            ref={mediaRef}
            src={album.media_url}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)}
          />
        </div>
      )}

      <div style={{ padding: '18px 20px' }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 10px' }}>{album.title}</h4>
        {/* Seekbar — shown for both audio and video */}
        <div
          style={{ height: 6, background: '#e2e8f0', borderRadius: 3, cursor: 'pointer', marginBottom: 6 }}
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            if (mediaRef.current) mediaRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
          }}
        >
          <div style={{ width: `${duration ? (current / duration) * 100 : 0}%`, height: '100%', background: '#fdb813', borderRadius: 3, transition: 'width 0.1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
          <span>{fmt(current)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GALLERY PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const { user } = useAuth();

  // ── Tier detection (consistent with Navbar / ProfilePage / DashboardPage) ──
  const userTier  = getTier(user);
  const isPremium = userTier === 'premium' || userTier === 'standard'; // ← Standard also counts
  const isFree    = userTier === 'free';

  const canUpload = user?.role === 'admin' || user?.is_admin || isPremium;

  const [activeTab,     setActiveTab]     = useState('general');
  const [albums,        setAlbums]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searching,     setSearching]     = useState(false);
  const [matches,       setMatches]       = useState([]);
  const [showUpload,    setShowUpload]    = useState(false);
  const [showGradModal, setShowGradModal] = useState(false);
  const [activeAlbum,   setActiveAlbum]  = useState(null);
  const [storage,       reloadStorage]   = useStorageUsage();
  const tier = storage.tier;

  const isGrad = activeTab !== 'general';

  const loadAlbums = (tab = activeTab) => {
    setLoading(true);
    if (tab === 'general') {
      galleryApi.list('general', null)
        .then(({ data }) => setAlbums(data.data ?? data ?? []))
        .catch(() => setAlbums([]))
        .finally(() => setLoading(false));
    } else {
      const category = tab.split(':')[1];
      graduationApi.list(category)
        .then(({ data }) => setAlbums(data.data ?? data ?? []))
        .catch(() => setAlbums([]))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadAlbums(activeTab); }, [activeTab]);

  const handleTabChange = (key) => { setActiveTab(key); setShowUpload(false); setShowGradModal(false); setMatches([]); };

  const handleFaceFile = async (file) => {
    setSearching(true); setMatches([]);
    try {
      const fd = new FormData(); fd.append('face_image', file);
      const { data } = await galleryApi.faceSearch(fd);
      const found = data.matches ?? [];
      setMatches(found);
      if (!found.length) alert('No matching student found.');
    } catch { alert('Face search failed.'); }
    finally { setSearching(false); }
  };

  const uploadHook = useMediaUpload(activeAlbum, tier, () => { setShowUpload(false); loadAlbums(); reloadStorage(); });
  const openUpload = (albumId) => { setActiveAlbum(albumId); setShowUpload(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleGradSuccess = () => { setShowGradModal(false); loadAlbums(activeTab); reloadStorage(); };
  const photoGradTabs = ['graduation:photos', 'graduation:toga', 'graduation:archive'];
  const gradAlbumsForModal = photoGradTabs.includes(activeTab) ? albums : [];
  const primaryTabs   = TABS.slice(0, 5);
  const secondaryTabs = TABS.slice(5);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7fe', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <header style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 70px', textAlign: 'center', color: '#fff', borderRadius: '0 0 60px 60px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>National University Lipa</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 14px' }}>
          The <span style={{ color: '#fdb813' }}>Visual Archive</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.7, fontWeight: 300 }}>
          Relive the milestones and pioneer memories through our AI-powered digital gallery.
        </p>

        <div style={{ maxWidth: 520, margin: '0 auto 28px' }}>
          <ContentOwnershipBanner
            message="All media in this gallery is the exclusive property of"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {activeTab === 'general' && (
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#fdb813', fontSize: 15, zIndex: 1, pointerEvents: 'none' }} />
              <input type="text" readOnly
                onClick={() => document.querySelector('#gallery-face-hidden')?.click()}
                placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
                style={{ width: '100%', height: 52, boxSizing: 'border-box', padding: '0 56px 0 50px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14, outline: 'none', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                onFocus={e => { e.target.style.background='rgba(255,255,255,0.18)'; e.target.style.borderColor='rgba(253,184,19,0.6)'; }}
                onBlur={e  => { e.target.style.background='rgba(255,255,255,0.1)';  e.target.style.borderColor='rgba(255,255,255,0.15)'; }}
              />
              <FaceSearchButton onFile={handleFaceFile} loading={searching} />
            </div>
            {matches.length > 0 && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {matches.map(m => (
                  <Link key={m.user_id} to={`/profile/${m.user_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '12px 14px', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#fdb813'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'}>
                    <img src={imageUrl(m.profile_picture) || avatarUrl(m.name)} alt={m.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid #fdb813', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}><i className="fas fa-brain" style={{ color: '#fdb813', marginRight: 4 }} />{m.similarity}% match</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: 1000, margin: '-30px auto 0', padding: '0 20px', width: '100%', position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
        <div style={{ background: '#fff', display: 'flex', gap: 4, padding: 6, borderRadius: '20px 20px 0 0', flexWrap: 'nowrap', boxShadow: '0 -4px 20px rgba(29,43,75,0.06)', borderBottom: '1px solid #f1f5f9' }}>
          {primaryTabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{ flex: 1, minWidth: 60, padding: '10px 6px', border: 'none', cursor: 'pointer', borderRadius: 14, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: 11 }} />{tab.label}
            </button>
          ))}
        </div>
        <div style={{ background: '#fff', display: 'flex', gap: 4, padding: 6, borderRadius: '0 0 20px 20px', boxShadow: '0 18px 36px rgba(29,43,75,0.1)' }}>
          {secondaryTabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{ flex: 1, minWidth: 60, padding: '8px 6px', border: 'none', cursor: 'pointer', borderRadius: 14, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: 11 }} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── StorageUsageBar: hidden for free tier ── */}
      {activeTab === 'general' && !isFree && (
        <div style={{ maxWidth: 1000, margin: '16px auto 0', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
          <StorageUsageBar usedBytes={storage.used_bytes} limitBytes={storage.limit_bytes} tier={tier} onUpgrade={() => window.location.href='/subscription'} />
        </div>
      )}

      {showUpload && !isGrad && (
        <div style={{ maxWidth: 1000, margin: '20px auto 0', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
          <BulkUploadZone {...uploadHook} tier={tier} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {/* Content */}
      <section style={{ padding: '32px 8% 100px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: 0 }}>
            {TABS.find(t => t.key === activeTab)?.label ?? 'Albums'}
          </h2>
          {canUpload && (
            isGrad
              ? <button onClick={() => setShowGradModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1d2b4b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='#3f51b5'} onMouseLeave={e => e.currentTarget.style.background='#1d2b4b'}>
                  <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} />{UPLOAD_CONFIG[activeTab]?.label ?? 'Upload'}
                </button>
              : !showUpload && (
                  <button onClick={() => { setActiveAlbum(albums[0]?.id ?? null); setShowUpload(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1d2b4b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='#3f51b5'} onMouseLeave={e => e.currentTarget.style.background='#1d2b4b'}>
                    <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} /> Upload Photos
                  </button>
                )
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 36, color: '#3f51b5' }} />
          </div>
        ) : albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(29,43,75,0.06)' }}>
            <i className="fas fa-images" style={{ fontSize: 56, color: '#e2e8f0', display: 'block', marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: '0 0 8px' }}>Nothing Here Yet</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>No content in this section yet.</p>
            {canUpload && isGrad && (
              <button onClick={() => setShowGradModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1d2b4b', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='#3f51b5'} onMouseLeave={e => e.currentTarget.style.background='#1d2b4b'}>
                <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} />{UPLOAD_CONFIG[activeTab]?.label ?? 'Upload Content'}
              </button>
            )}
          </div>
        ) : (
          <>
            {(activeTab === 'general' || photoGradTabs.includes(activeTab)) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
                {albums.map(album => (
                  activeTab === 'general'
                    ? <div key={album.id} style={{ position: 'relative' }} className="group">
                        <Link to={`/gallery/${album.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 28, overflow: 'hidden', border: '1px solid #f1f5f9', transition: '0.35s cubic-bezier(0.175,0.885,0.32,1.275)' }}
                          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-10px)'; e.currentTarget.style.boxShadow='0 24px 48px rgba(29,43,75,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                          <div style={{ height: 240, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                            {album.cover_photo_url
                              ? <ProtectedImage src={album.cover_photo_url} alt={album.title} watermark={false} showCopyright={false} style={{ width: '100%', height: '100%' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, background: 'linear-gradient(135deg, #e8edf5, #dbe3f0)' }}>📷</div>
                            }
                            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.95)', padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#1d2b4b', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <i className="fas fa-images" style={{ color: '#fdb813' }} /> {album.photos_count ?? 0} photos
                            </div>
                            {album.type === 'graduation' && (
                              <div style={{ position: 'absolute', top: 14, left: 14, background: '#fdb813', color: '#1d2b4b', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 10 }}>Graduation</div>
                            )}
                          </div>
                          <div style={{ padding: '22px 24px' }}>
                            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1d2b4b', margin: '0 0 8px' }}>{album.title}</h4>
                            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
                              {album.event_date ? new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                            </p>
                          </div>
                        </Link>
                        {canUpload && (
                          <button onClick={() => openUpload(album.id)} style={{ position: 'absolute', bottom: 18, right: 18, display: 'flex', alignItems: 'center', gap: 6, background: '#1d2b4b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: 0, transition: 'all 0.2s', zIndex: 10 }}
                            className="group-hover:opacity-100"
                            onMouseEnter={e => e.currentTarget.style.background='#3f51b5'}
                            onMouseLeave={e => e.currentTarget.style.background='#1d2b4b'}>
                            <i className="fas fa-plus" style={{ color: '#fdb813' }} /> Add Photos
                          </button>
                        )}
                      </div>
                    : <GradAlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
            {activeTab === 'graduation:videos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {albums.map(a => <GradVideoCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'graduation:program' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {albums.map(a => <GradProgramCard key={a.id} album={a} isPremium={isPremium} />)}
              </div>
            )}
            {activeTab === 'graduation:invitation' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {albums.map(a => <GradInvitationCard key={a.id} album={a} isPremium={isPremium} />)}
              </div>
            )}
            {activeTab === 'graduation:song' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {albums.map(a => <GradSongCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'graduation:mass' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {albums.map(a => <GradVideoCard key={a.id} album={a} badge="Baccalaureate Mass" />)}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />

      {showGradModal && isGrad && (
        <GradUploadModal tab={activeTab} albums={gradAlbumsForModal} onClose={() => setShowGradModal(false)} onSuccess={handleGradSuccess} />
      )}
    </div>
  );
}