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
import ProtectedImage from '@/components/ui/ProtectedImage';
import { ContentOwnershipBanner } from '@/components/ui/CopyrightLabel';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeGetToken = () => {
  try { return localStorage.getItem('auth_token') || localStorage.getItem('sb_token') || ''; }
  catch { return ''; }
};

const getTier = (user) => {
  if (!user) return 'free';
  if (user.tier === 'premium' || user.is_premium) return 'premium';
  if (user.tier === 'standard') return 'standard';
  return 'free';
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',               label: 'All Photos',    icon: 'fa-images'             },
  { key: 'graduation:photos',     label: 'Graduation',    icon: 'fa-graduation-cap'     },
  { key: 'graduation:toga',       label: 'Toga Gallery',  icon: 'fa-user-graduate'      },
  { key: 'graduation:archive',    label: 'Archive',       icon: 'fa-box-archive'        },
  { key: 'graduation:videos',     label: 'Videos',        icon: 'fa-film'               },
  { key: 'graduation:program',    label: 'Program',       icon: 'fa-file-pdf'           },
  { key: 'graduation:invitation', label: 'Invitation',    icon: 'fa-envelope-open-text' },
  { key: 'graduation:song',       label: 'Grad Song',     icon: 'fa-music'              },
  { key: 'graduation:mass',       label: 'Baccalaureate', icon: 'fa-church'             },
];

const UPLOAD_CONFIG = {
  'graduation:photos':     { label: 'Upload Photos',         endpoint: '/api/graduation/upload-photo',      field: 'photos',  accept: 'image/jpeg,image/png,image/webp',                                                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each',              needsAlbum: true  },
  'graduation:toga':       { label: 'Upload Toga Photos',    endpoint: '/api/graduation/upload-photo',      field: 'photos',  accept: 'image/jpeg,image/png,image/webp',                                                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each',              needsAlbum: true  },
  'graduation:archive':    { label: 'Upload Archive Photos', endpoint: '/api/graduation/upload-photo',      field: 'photos',  accept: 'image/jpeg,image/png,image/webp',                                                                    multiple: true,  note: 'JPG, PNG, WebP — max 50MB each',              needsAlbum: true  },
  'graduation:videos':     { label: 'Upload Video',          endpoint: '/api/graduation/upload-video',      field: 'video',   accept: 'video/mp4,video/quicktime,video/webm',                                                               multiple: false, note: 'MP4, MOV, WebM — max 2GB',                    needsAlbum: false },
  'graduation:program':    { label: 'Upload Program',        endpoint: '/api/graduation/upload-program',    field: 'program', accept: 'application/pdf',                                                                                    multiple: false, note: 'PDF only — max 20MB',                         needsAlbum: false },
  'graduation:invitation': { label: 'Upload Invitation',     endpoint: '/api/graduation/upload-invitation', field: 'file',    accept: 'application/pdf,image/jpeg,image/png,image/webp',                                                    multiple: false, note: 'PDF or image — max 20MB',                     needsAlbum: false },
  'graduation:song':       { label: 'Upload Song / Video',   endpoint: '/api/graduation/upload-song',       field: 'audio',   accept: 'audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,audio/webm,video/mp4,video/quicktime,video/webm', multiple: false, note: 'Audio: MP3, WAV, M4A  ·  Video: MP4, MOV, WebM — max 500MB', needsAlbum: false },
  'graduation:mass':       { label: 'Upload Mass Video',     endpoint: '/api/graduation/upload-mass',       field: 'video',   accept: 'video/mp4,video/quicktime,video/webm',                                                               multiple: false, note: 'MP4, MOV, WebM — max 2GB',                    needsAlbum: false },
};

// ─── Storage hook ─────────────────────────────────────────────────────────────
function useStorageUsage() {
  const [storage, setStorage] = useState({ used_bytes: 0, limit_bytes: 524288000, tier: 'free' });
  const reload = () =>
    mediaApi.storageUsage()
      .then(({ data }) => {
        const p = data?.data ?? data;
        setStorage({ used_bytes: p.used_bytes ?? p.used ?? 0, limit_bytes: p.limit_bytes ?? p.limit ?? 524288000, tier: p.tier ?? 'free' });
      }).catch(() => {});
  useEffect(() => { reload(); }, []);
  return [storage, reload];
}

// ─── ProtectedDownloadButton ──────────────────────────────────────────────────
function ProtectedDownloadButton({ href, label = 'Download', isPremium = false }) {
  const [showGate, setShowGate] = useState(false);

  if (!isPremium) return (
    <>
      <button onClick={() => setShowGate(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400
                   bg-slate-100 px-4 py-2 rounded-xl border-none cursor-pointer">
        <i className="fas fa-lock text-[11px]" /> {label}
      </button>

      {showGate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/75"
          onClick={() => setShowGate(false)}>
          <div className="bg-white rounded-[28px] p-9 max-w-[400px] w-full text-center
                          shadow-[0_40px_100px_rgba(0,0,0,0.25)]"
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#1d2b4b]/7 flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-shield-halved text-2xl text-[#1d2b4b]" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1d2b4b] mb-2.5">Content Protected</h3>
            <p className="text-sm text-slate-500 mb-1.5 leading-relaxed">
              This document is owned by <strong>National University Lipa</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Upgrade to <strong className="text-[#1d2b4b]">Premium</strong> or{' '}
              <strong className="text-[#1d2b4b]">Standard</strong> to download official graduation documents.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowGate(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-500 cursor-pointer">
                Cancel
              </button>
              <Link to="/premium"
                className="flex-1 py-3 rounded-2xl bg-[#1d2b4b] text-[#fdb813] text-sm font-bold
                           flex items-center justify-center gap-1.5 no-underline">
                <i className="fas fa-star text-[11px]" /> Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <a href={href} download
      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1d2b4b]
                 no-underline bg-[#fdb813]/15 px-4 py-2 rounded-xl hover:bg-[#fdb813]/25 transition-colors">
      <i className="fas fa-download" /> {label}
    </a>
  );
}

// ─── GradUploadModal ──────────────────────────────────────────────────────────
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

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none text-[#1d2b4b] focus:border-[#3f51b5] transition-colors bg-white';

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
        const r = await fetch('/api/graduation/album', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: newAlbum, description: desc, category, event_date: eventDate || null }),
        });
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
          try {
            const ct = xhr.getResponseHeader('content-type') ?? '';
            const msg = ct.includes('application/json') ? (JSON.parse(xhr.responseText)?.message ?? 'Upload failed.') : `Server error (${xhr.status}).`;
            reject(new Error(msg));
          } catch { reject(new Error(`Server error (${xhr.status}).`)); }
        };
        xhr.onerror = () => reject(new Error('Network error.'));
        xhr.send(fd);
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setProgress(0); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/75"
      onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto
                      shadow-[0_40px_100px_rgba(0,0,0,0.25)]"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-lg m-0 text-[#1d2b4b]">{cfg.label}</h2>
            <p className="text-xs mt-1 m-0 text-slate-400">{cfg.note}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center
                       bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <i className="fas fa-times text-sm" />
          </button>
        </div>
        <div className="px-7 py-6 flex flex-col gap-5">
          {cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500">Album</label>
              {albums?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {['Existing Album', 'New Album'].map((lbl, i) => (
                    <button key={lbl} onClick={() => setUseNew(!!i)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-none cursor-pointer transition-all
                        ${useNew === !!i ? 'bg-[#1d2b4b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              {!useNew && albums?.length > 0
                ? <select value={albumId} onChange={e => setAlbumId(e.target.value)} className={inputCls}>
                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                : <input type="text" value={newAlbum} onChange={e => setNewAlbum(e.target.value)}
                    placeholder="New album name" className={inputCls} />
              }
            </div>
          )}
          {!cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500">Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Enter a title…" className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500">
              Description <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Short description…" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500">
              Event Date <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500">
              File{cfg.multiple ? 's' : ''} *
            </label>
            <label
              onDragOver={e  => { e.preventDefault(); e.currentTarget.classList.add('border-[#3f51b5]', 'bg-indigo-50/50'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('border-[#3f51b5]', 'bg-indigo-50/50'); }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-[#3f51b5]', 'bg-indigo-50/50');
                const f = Array.from(e.dataTransfer.files);
                setFiles(cfg.multiple ? f : [f[0]]);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer
                          border-2 border-dashed p-6 transition-colors
                          ${files.length ? 'border-[#3f51b5] bg-indigo-50/40' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
            >
              <i className={`fas ${files.length ? 'fa-check-circle text-[#3f51b5]' : 'fa-cloud-arrow-up text-slate-300'} text-3xl`} />
              {files.length
                ? <p className="text-sm font-bold m-0 text-[#3f51b5]">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                : <p className="text-sm font-semibold m-0 text-slate-400">Click or drag &amp; drop</p>
              }
              <input type="file" accept={cfg.accept} multiple={cfg.multiple} className="hidden"
                onChange={e => setFiles(cfg.multiple ? Array.from(e.target.files) : [e.target.files[0]])} />
            </label>
          </div>
          {loading && progress > 0 && (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-500">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="w-full rounded-full h-1.5 bg-slate-200">
                <div className="h-1.5 bg-[#3f51b5] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {error && (
            <div className="text-sm font-semibold px-4 py-3 rounded-xl bg-red-50 text-red-600 flex items-center gap-2">
              <i className="fas fa-circle-exclamation" /> {error}
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-bold text-white py-3.5
                        rounded-2xl border-none cursor-pointer text-sm transition-colors
                        ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1d2b4b] hover:bg-[#3f51b5]'}`}>
            {loading
              ? <><i className="fas fa-spinner animate-spin" /> Uploading…</>
              : <><i className="fas fa-cloud-arrow-up" /> {cfg.label}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grad content cards ───────────────────────────────────────────────────────
function GradAlbumCard({ album }) {
  const cover = album.photos?.[0]?.file_path;
  return (
    <Link to={`/graduation/archive/${album.id}`} className="no-underline block group">
      <div className="rounded-3xl overflow-hidden bg-white border border-black/[0.04]
                      shadow-sm transition-all duration-300
                      group-hover:-translate-y-2 group-hover:shadow-xl">
        <div className="h-[220px] bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] relative overflow-hidden">
          {cover
            ? <ProtectedImage src={cover} alt={album.title} watermark={false} showCopyright={false}
                imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                style={{ width: '100%', height: '100%' }} />
            : <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-images text-5xl text-[#fdb813]/40" />
              </div>
          }
          <div className="absolute bottom-3 right-3 bg-[#fdb813]/95 text-[#1d2b4b] text-[11px] font-bold px-2.5 py-1 rounded-full">
            {album.photos_count ?? 0} photos
          </div>
        </div>
        <div className="p-5">
          <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1.5 truncate">{album.title}</h4>
          {album.event_date && (
            <p className="text-xs text-slate-400 m-0 flex items-center gap-1.5">
              <i className="fas fa-calendar text-[#fdb813]" />
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
    <div className="rounded-3xl overflow-hidden bg-white border border-black/[0.04] shadow-sm">
      <div className="bg-[#0a0f1e]">
        {playing
          ? <video src={album.media_url} controls autoPlay className="w-full max-h-[240px] block" />
          : <div onClick={() => setPlaying(true)}
              className="h-[200px] bg-gradient-to-br from-[#0d1b35] to-[#1d2b4b] flex items-center justify-center cursor-pointer relative">
              {badge && (
                <span className="absolute top-3 left-3 bg-[#fdb813]/95 text-[#1d2b4b] text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                  {badge}
                </span>
              )}
              <div className="w-14 h-14 rounded-full bg-[#fdb813] flex items-center justify-center">
                <i className="fas fa-play text-xl text-[#1d2b4b] ml-0.5" />
              </div>
            </div>
        }
      </div>
      <div className="p-5">
        <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1.5">{album.title}</h4>
        {album.description && <p className="text-xs text-slate-500 mb-1.5">{album.description}</p>}
        {album.event_date && (
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <i className="fas fa-calendar text-[#fdb813]" />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3f51b5] no-underline
                     bg-[#3f51b5]/8 px-2.5 py-1 rounded-lg hover:bg-[#3f51b5]/15 transition-colors">
          <i className="fas fa-file-lines" /> View Transcript
        </Link>
      </div>
    </div>
  );
}

function GradProgramCard({ album, isPremium = false }) {
  return (
    <div className="rounded-3xl bg-white p-6 flex gap-5 items-start border border-black/[0.04] shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#fdb813]/12 flex items-center justify-center shrink-0">
        <i className="fas fa-file-pdf text-2xl text-[#fdb813]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1">{album.title}</h4>
        {album.description && <p className="text-sm text-slate-500 mb-2.5">{album.description}</p>}
        {album.event_date && (
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <i className="fas fa-calendar text-[#fdb813]" />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <p className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
          <i className="fas fa-copyright text-[#fdb813] text-[10px]" />
          Property of National University Lipa. All rights reserved.
        </p>
        <div className="flex gap-2.5 flex-wrap">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white no-underline
                       bg-[#1d2b4b] px-4 py-2 rounded-xl hover:bg-[#3f51b5] transition-colors">
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
    <div className="rounded-3xl overflow-hidden bg-white border border-black/[0.04] shadow-sm
                    hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
      <div className="h-[240px] bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] flex items-center justify-center overflow-hidden">
        {album.media_url?.match(/\.(jpg|jpeg|png|webp)$/i)
          ? <ProtectedImage src={album.media_url} alt={album.title} watermarkText="© NU Lipa"
              showCopyright style={{ width: '100%', height: '100%' }}
              imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="flex flex-col items-center gap-2.5">
              <i className="fas fa-envelope-open-text text-5xl text-[#fdb813]/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Digital Invitation</span>
            </div>
        }
      </div>
      <div className="p-5">
        <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1.5">{album.title}</h4>
        <p className="text-[11px] text-slate-400 mb-2.5 flex items-center gap-1">
          <i className="fas fa-copyright text-[#fdb813] text-[10px]" />
          Property of National University Lipa
        </p>
        <div className="flex gap-2.5">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white no-underline
                       bg-[#1d2b4b] px-3.5 py-2 rounded-xl hover:bg-[#3f51b5] transition-colors">
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

  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(album.media_url ?? '');
  const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const toggle = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="rounded-3xl bg-white overflow-hidden border border-black/[0.04] shadow-sm">
      {isVideo ? (
        <div className="bg-[#0a0f1e] relative">
          <video ref={mediaRef} src={album.media_url}
            className="w-full max-h-[220px] block bg-black"
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
          {!playing && (
            <div onClick={toggle}
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/35">
              <div className="w-[52px] h-[52px] rounded-full bg-[#fdb813] flex items-center justify-center">
                <i className="fas fa-play text-lg text-[#1d2b4b] ml-0.5" />
              </div>
            </div>
          )}
          <span className="absolute top-2.5 left-2.5 bg-[#1d2b4b]/80 text-[#fdb813] text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-sm">
            <i className="fas fa-film mr-1" />VIDEO
          </span>
        </div>
      ) : (
        <div className="h-[130px] bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] flex items-center justify-center relative overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`absolute w-[3px] rounded-sm transition-colors duration-300 ${playing ? 'bg-[#fdb813]' : 'bg-[#fdb813]/25'}`}
              style={{ height: `${20 + Math.sin(i * 0.8) * 32}px`, left: `${4 + i * 4.8}%` }} />
          ))}
          <button onClick={toggle}
            className="relative z-10 w-[52px] h-[52px] rounded-full bg-[#fdb813] border-none cursor-pointer
                       flex items-center justify-center hover:scale-110 transition-transform">
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} text-base text-[#1d2b4b]`}
              style={{ marginLeft: playing ? 0 : 3 }} />
          </button>
          <span className="absolute top-2.5 left-2.5 bg-[#fdb813]/20 text-[#fdb813] text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
            <i className="fas fa-music mr-1" />AUDIO
          </span>
          <audio ref={mediaRef} src={album.media_url}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
        </div>
      )}
      <div className="p-5">
        <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-2.5">{album.title}</h4>
        <div className="h-1.5 bg-slate-200 rounded-full cursor-pointer mb-1.5"
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            if (mediaRef.current) mediaRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
          }}>
          <div className="h-full bg-[#fdb813] rounded-full transition-[width] duration-100"
            style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{fmt(current)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── AlbumSelector ────────────────────────────────────────────────────────────
function AlbumSelector({ albums, activeAlbum, onSelect, onCreateNew, creating, newAlbumName, onNewAlbumNameChange }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="bg-white rounded-[20px] px-5 py-4 mb-3 border border-black/[0.04] shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="m-0 text-[13px] font-bold text-[#1d2b4b] flex items-center gap-2">
          <i className="fas fa-folder-open text-[#fdb813]" />
          Select Album to upload into
        </p>
        <button onClick={() => setShowNew(v => !v)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1d2b4b]
                       border-none cursor-pointer px-3 py-1.5 rounded-xl transition-colors
                       ${showNew ? 'bg-slate-100' : 'bg-[#1d2b4b]/6 hover:bg-[#1d2b4b]/10'}`}>
          <i className={`fas ${showNew ? 'fa-times' : 'fa-plus'}`} />
          {showNew ? 'Cancel' : 'New Album'}
        </button>
      </div>
      {showNew ? (
        <div className="flex gap-2">
          <input type="text" value={newAlbumName} onChange={e => onNewAlbumNameChange(e.target.value)}
            placeholder="Album name…"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold
                       text-[#1d2b4b] outline-none focus:border-[#3f51b5] transition-colors"
            onKeyDown={e => e.key === 'Enter' && onCreateNew()} />
          <button onClick={onCreateNew} disabled={creating || !newAlbumName.trim()}
            className={`px-4 py-2.5 rounded-xl border-none cursor-pointer text-[13px] font-bold
                        flex items-center gap-1.5 transition-colors
                        ${creating || !newAlbumName.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#1d2b4b] text-white hover:bg-[#3f51b5]'}`}>
            {creating ? <><i className="fas fa-spinner animate-spin" /> Creating…</> : <><i className="fas fa-plus" /> Create</>}
          </button>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-3 text-[13px] text-slate-400">
          <i className="fas fa-folder mr-2 text-slate-300" />
          No albums yet — create one above first.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {albums.map(a => {
            const active = activeAlbum === a.id;
            return (
              <button key={a.id} onClick={() => onSelect(a.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-none cursor-pointer
                             text-[12px] font-bold transition-all
                             ${active
                               ? 'bg-[#1d2b4b] text-white shadow-md'
                               : 'bg-[#1d2b4b]/6 text-[#1d2b4b] hover:bg-[#1d2b4b]/10'}`}>
                <i className={`fas fa-folder text-[11px] ${active ? 'text-[#fdb813]' : 'text-slate-400'}`} />
                {a.title}
                {active && <i className="fas fa-check text-[10px] text-[#fdb813] ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Face Search Results ──────────────────────────────────────────────────────
function FaceSearchResults({ matches }) {
  if (!matches.length) return null;
  return (
    <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
      {matches.map(p => (
        <Link
          key={p.photo_id}
          to={p.album_id ? `/gallery/${p.album_id}` : '#'}
          className="block rounded-[14px] overflow-hidden border border-white/20
                     hover:border-[#fdb813] transition-all no-underline group"
        >
          <div className="relative">
            <img src={p.file_path} alt={p.caption || 'Photo'} className="w-full h-28 object-cover" />
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white
                            text-[10px] font-bold px-2 py-0.5 rounded-full">
              {p.similarity}%
            </div>
          </div>
          {p.album?.title && (
            <p className="m-0 text-[11px] font-bold text-white/70 px-2 py-1.5
                          truncate bg-black/40 group-hover:bg-[#fdb813]/20
                          group-hover:text-white transition-colors">
              <i className="fas fa-images mr-1" />{p.album.title}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const { user } = useAuth();
  const userTier  = getTier(user);
  const isPremium = userTier === 'premium' || userTier === 'standard';
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
  const [newAlbumName,  setNewAlbumName] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const tier   = storage.tier;
  const isGrad = activeTab !== 'general';

  const uploadHook = useMediaUpload(activeAlbum, tier, () => {
    setShowUpload(false); loadAlbums(); reloadStorage();
  });

  const bulkUploadProps = {
    queue: uploadHook.files, uploading: uploadHook.uploading,
    progress: uploadHook.progress, errors: uploadHook.error ? [uploadHook.error] : [],
    isDragging: uploadHook.isDragging,
    limits: { videoAllowed: uploadHook.tier.maxVideoSizeMB > 0, maxFiles: uploadHook.tier.maxFiles, maxPhotoMB: uploadHook.tier.maxFileSizeMB, maxVideoMB: uploadHook.tier.maxVideoSizeMB },
    addFiles: uploadHook.addFiles, removeFile: uploadHook.removeFile,
    clearQueue: uploadHook.clearFiles, upload: () => uploadHook.submit(),
    dragHandlers: uploadHook.dragProps,
  };

  const loadAlbums = (tab = activeTab) => {
    setLoading(true);
    const req = tab === 'general'
      ? galleryApi.list('general', null)
      : graduationApi.list(tab.split(':')[1]);
    req.then(({ data }) => setAlbums(data.data ?? data ?? []))
       .catch(() => setAlbums([]))
       .finally(() => setLoading(false));
  };

  useEffect(() => { loadAlbums(activeTab); }, [activeTab]);

  useEffect(() => {
    if (showUpload && !isGrad && albums.length > 0 && !activeAlbum) setActiveAlbum(albums[0].id);
  }, [albums, showUpload, isGrad, activeAlbum]);

  const handleTabChange = (key) => {
    setActiveTab(key); setShowUpload(false); setShowGradModal(false); setMatches([]); setActiveAlbum(null);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const token = safeGetToken();
      const r = await fetch('/api/gallery/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newAlbumName.trim(), type: 'general' }),
      });
      const ct = r.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) throw new Error(`Server error (${r.status})`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message ?? 'Album creation failed.');
      const newId = d.data?.id ?? d.id;
      await galleryApi.list('general', null).then(({ data }) => {
        setAlbums(data.data ?? data ?? []); setActiveAlbum(newId);
      }).catch(() => {});
      setNewAlbumName('');
    } catch (e) { alert(e.message); }
    finally { setCreatingAlbum(false); }
  };

  // ── Face search ────────────────────────────────────────────────────────
  const handleFaceFile = async (file) => {
    setSearching(true);
    setMatches([]);
    try {
      const fd = new FormData();
      fd.append('face_image', file);
      const { data } = await galleryApi.faceSearch(fd);
      const found = data.photos ?? [];
      setMatches(found);
      if (!found.length) alert('No matching photos found.');
    } catch {
      alert('Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  const openUpload = (albumId) => {
    setActiveAlbum(albumId ?? albums[0]?.id ?? null);
    setShowUpload(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const photoGradTabs      = ['graduation:photos', 'graduation:toga', 'graduation:archive'];
  const gradAlbumsForModal = photoGradTabs.includes(activeTab) ? albums : [];
  const primaryTabs        = TABS.slice(0, 5);
  const secondaryTabs      = TABS.slice(5);

  const tabCls = (key, sm = false) =>
    `flex items-center justify-center gap-1.5 font-bold border-none cursor-pointer transition-all rounded-[14px]
     ${sm ? 'py-2 px-1.5 text-[11px]' : 'py-2.5 px-2 text-[12px]'}
     ${activeTab === key ? 'bg-[#1d2b4b] text-white' : 'bg-transparent text-slate-400 hover:text-slate-600'}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe] font-sans">
      <Navbar />

      {/* ── Hero ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-20 pb-[70px] text-center text-white rounded-b-[60px]">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50 mb-2.5">National University Lipa</p>
        <h1 className="text-5xl font-black tracking-tight mb-3.5">
          The <span className="text-[#fdb813]">Visual Archive</span>
        </h1>
        <p className="text-base text-white/70 max-w-[560px] mx-auto mb-6 leading-relaxed font-light">
          Relive the milestones and pioneer memories through our AI-powered digital gallery.
        </p>

        <div className="max-w-[520px] mx-auto mb-7">
          <ContentOwnershipBanner message="All media in this gallery is the exclusive property of" />
        </div>

        {activeTab === 'general' && (
          <div className="max-w-[600px] mx-auto relative z-10">
            <div className="relative">
              <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2 text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
              <input type="text" readOnly
                placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
                className="w-full h-[52px] pl-[50px] pr-14 border border-white/15 rounded-[14px] outline-none
                           bg-white/10 backdrop-blur-xl text-white text-sm font-medium cursor-pointer
                           focus:bg-white/18 focus:border-[#fdb813]/60 transition-all placeholder-white/50" />
              <FaceSearchButton onFile={handleFaceFile} loading={searching} />
            </div>
            <FaceSearchResults matches={matches} />
          </div>
        )}
      </header>

      {/* ── Tabs ── */}
      <div className="max-w-[1000px] mx-auto -mt-[30px] px-5 w-full relative z-10">
        <div className="bg-white flex gap-1 p-1.5 rounded-t-[20px] shadow-sm border-b border-slate-100">
          {primaryTabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={`flex-1 min-w-[60px] ${tabCls(tab.key)}`}>
              <i className={`fas ${tab.icon} ${activeTab === tab.key ? 'text-[#fdb813]' : ''} text-[11px]`} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-white flex gap-1 p-1.5 rounded-b-[20px] shadow-xl shadow-[#1d2b4b]/10">
          {secondaryTabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={`flex-1 min-w-[60px] ${tabCls(tab.key, true)}`}>
              <i className={`fas ${tab.icon} ${activeTab === tab.key ? 'text-[#fdb813]' : ''} text-[11px]`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage bar */}
      {activeTab === 'general' && !isFree && (
        <div className="max-w-[1000px] mx-auto mt-4 px-5 w-full">
          <StorageUsageBar usedBytes={storage.used_bytes} limitBytes={storage.limit_bytes}
            tier={tier} onUpgrade={() => window.location.href = '/subscription'} />
        </div>
      )}

      {/* Upload panel */}
      {showUpload && !isGrad && (
        <div className="max-w-[1000px] mx-auto mt-5 px-5 w-full">
          <AlbumSelector albums={albums} activeAlbum={activeAlbum}
            onSelect={setActiveAlbum} onCreateNew={handleCreateAlbum}
            creating={creatingAlbum} newAlbumName={newAlbumName}
            onNewAlbumNameChange={setNewAlbumName} />
          <BulkUploadZone {...bulkUploadProps} tier={tier}
            onCancel={() => { setShowUpload(false); uploadHook.clearFiles(); }} />
        </div>
      )}

      {/* ── Content ── */}
      <section className="px-[8%] pt-8 pb-24 flex-1">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl font-extrabold text-[#1d2b4b] m-0">
            {TABS.find(t => t.key === activeTab)?.label ?? 'Albums'}
          </h2>
          {canUpload && (
            isGrad
              ? <button onClick={() => setShowGradModal(true)}
                  className="flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none
                             px-5 py-2.5 rounded-[14px] text-[13px] font-bold cursor-pointer transition-colors">
                  <i className="fas fa-cloud-arrow-up text-[#fdb813]" />
                  {UPLOAD_CONFIG[activeTab]?.label ?? 'Upload'}
                </button>
              : !showUpload && (
                <button onClick={() => openUpload(null)}
                  className="flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none
                             px-5 py-2.5 rounded-[14px] text-[13px] font-bold cursor-pointer transition-colors">
                  <i className="fas fa-cloud-arrow-up text-[#fdb813]" /> Upload Photos
                </button>
              )
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 border-t-[#3f51b5] animate-spin" />
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 px-5 bg-white rounded-3xl shadow-sm border border-slate-100">
            <i className="fas fa-images text-5xl text-slate-200 block mb-4" />
            <h3 className="text-xl font-extrabold text-[#1d2b4b] mb-2">Nothing Here Yet</h3>
            <p className="text-sm text-slate-400 mb-5">No content in this section yet.</p>
            {canUpload && isGrad && (
              <button onClick={() => setShowGradModal(true)}
                className="inline-flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none
                           px-5 py-2.5 rounded-[14px] text-[13px] font-bold cursor-pointer transition-colors">
                <i className="fas fa-cloud-arrow-up text-[#fdb813]" />
                {UPLOAD_CONFIG[activeTab]?.label ?? 'Upload Content'}
              </button>
            )}
          </div>
        ) : (
          <>
            {(activeTab === 'general' || photoGradTabs.includes(activeTab)) && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-7">
                {albums.map(album => (
                  activeTab === 'general'
                    ? (
                      <div key={album.id} className="relative group">
                        <Link to={`/gallery/${album.id}`}
                          className="block no-underline text-inherit bg-white rounded-[28px] overflow-hidden
                                     border border-slate-100 hover:-translate-y-2.5 hover:shadow-2xl
                                     transition-all duration-300">
                          <div className="h-[240px] bg-slate-100 relative overflow-hidden">
                            {album.cover_photo_url
                              ? <ProtectedImage src={album.cover_photo_url} alt={album.title} watermark={false}
                                  showCopyright={false} style={{ width: '100%', height: '100%' }}
                                  imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div className="w-full h-full flex items-center justify-center text-5xl
                                                bg-gradient-to-br from-[#e8edf5] to-[#dbe3f0]">📷</div>
                            }
                            <div className="absolute top-3.5 right-3.5 bg-white/95 px-3 py-[5px] rounded-xl
                                            text-[11px] font-bold text-[#1d2b4b] flex items-center gap-1">
                              <i className="fas fa-images text-[#fdb813]" /> {album.photos_count ?? 0} photos
                            </div>
                            {album.type === 'graduation' && (
                              <div className="absolute top-3.5 left-3.5 bg-[#fdb813] text-[#1d2b4b] text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                                Graduation
                              </div>
                            )}
                          </div>
                          <div className="px-6 py-5">
                            <h4 className="text-base font-extrabold text-[#1d2b4b] mb-2">{album.title}</h4>
                            <p className="text-[12px] text-slate-400 m-0 flex items-center gap-1.5">
                              <i className="fas fa-calendar text-[#fdb813]" />
                              {album.event_date
                                ? new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                                : 'No date'}
                            </p>
                          </div>
                        </Link>
                        {canUpload && (
                          <button onClick={() => openUpload(album.id)}
                            className="absolute bottom-[18px] right-[18px] flex items-center gap-1.5
                                       bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none px-3.5 py-2
                                       rounded-xl text-[11px] font-bold cursor-pointer z-10 transition-all
                                       opacity-0 group-hover:opacity-100">
                            <i className="fas fa-plus text-[#fdb813]" /> Add Photos
                          </button>
                        )}
                      </div>
                    )
                    : <GradAlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
            {activeTab === 'graduation:videos'     && <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">{albums.map(a => <GradVideoCard     key={a.id} album={a} />)}</div>}
            {activeTab === 'graduation:program'    && <div className="flex flex-col gap-4">{albums.map(a => <GradProgramCard    key={a.id} album={a} isPremium={isPremium} />)}</div>}
            {activeTab === 'graduation:invitation' && <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">{albums.map(a => <GradInvitationCard key={a.id} album={a} isPremium={isPremium} />)}</div>}
            {activeTab === 'graduation:song'       && <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">{albums.map(a => <GradSongCard        key={a.id} album={a} />)}</div>}
            {activeTab === 'graduation:mass'       && <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">{albums.map(a => <GradVideoCard        key={a.id} album={a} badge="Baccalaureate Mass" />)}</div>}
          </>
        )}
      </section>

      <Footer />

      {showGradModal && isGrad && (
        <GradUploadModal tab={activeTab} albums={gradAlbumsForModal}
          onClose={() => setShowGradModal(false)} onSuccess={() => { setShowGradModal(false); loadAlbums(activeTab); reloadStorage(); }} />
      )}
    </div>
  );
}