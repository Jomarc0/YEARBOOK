import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ─── Safe localStorage getter (Edge/Safari Tracking Prevention) ───────────────
const safeGetToken = () => {
  try {
    return localStorage.getItem('auth_token') || localStorage.getItem('sb_token') || '';
  }
  catch { return ''; }
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'photos',     label: 'Photos',        icon: 'fa-images' },
  { key: 'videos',     label: 'Videos',        icon: 'fa-film' },
  { key: 'program',    label: 'Program',       icon: 'fa-file-pdf' },
  { key: 'archive',    label: 'Archive',       icon: 'fa-box-archive' },
  { key: 'toga',       label: 'Toga Gallery',  icon: 'fa-user-graduate' },
  { key: 'invitation', label: 'Invitation',    icon: 'fa-envelope-open-text' },
  { key: 'song',       label: 'Grad Song',     icon: 'fa-music' },
  { key: 'mass',       label: 'Baccalaureate', icon: 'fa-church' },
];

const VALID_TABS = TABS.map(t => t.key);

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD CONFIG — ALL tabs now support multiple files
// ─────────────────────────────────────────────────────────────────────────────
const UPLOAD_CONFIG = {
  photos: {
    label: 'Upload Photos', endpoint: '/api/graduation/upload-photo',
    field: 'photos', accept: 'image/jpeg,image/png,image/webp',
    multiple: true, note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true,
  },
  toga: {
    label: 'Upload Toga Photos', endpoint: '/api/graduation/upload-photo',
    field: 'photos', accept: 'image/jpeg,image/png,image/webp',
    multiple: true, note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true,
  },
  archive: {
    label: 'Upload Archive Photos', endpoint: '/api/graduation/upload-photo',
    field: 'photos', accept: 'image/jpeg,image/png,image/webp',
    multiple: true, note: 'JPG, PNG, WebP — max 50MB each', needsAlbum: true,
  },
  // ── CHANGED: multiple: true for all below ──
  videos: {
    label: 'Upload Videos', endpoint: '/api/graduation/upload-video',
    field: 'video', accept: 'video/mp4,video/quicktime,video/webm',
    multiple: true, note: 'MP4, MOV, WebM — max 2GB each', needsAlbum: false,
  },
  program: {
    label: 'Upload Programs', endpoint: '/api/graduation/upload-program',
    field: 'program', accept: 'application/pdf',
    multiple: true, note: 'PDF only — max 20MB each', needsAlbum: false,
  },
  invitation: {
    label: 'Upload Invitations', endpoint: '/api/graduation/upload-invitation',
    field: 'file', accept: 'application/pdf,image/jpeg,image/png,image/webp',
    multiple: true, note: 'PDF or image — max 20MB each', needsAlbum: false,
  },
  song: {
    label: 'Upload Songs / Videos', endpoint: '/api/graduation/upload-song',
    field: 'audio', accept: 'audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,audio/webm,video/mp4,video/quicktime,video/webm',
    multiple: true, note: 'Audio or Video — max 500MB each', needsAlbum: false,
  },
  mass: {
    label: 'Upload Mass Videos', endpoint: '/api/graduation/upload-mass',
    field: 'video', accept: 'video/mp4,video/quicktime,video/webm',
    multiple: true, note: 'MP4, MOV, WebM — max 2GB each', needsAlbum: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD MODAL — supports multiple files for ALL tabs
// Each non-album file gets its own title (auto-generated from filename if not set)
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ tab, albums, onClose, onSuccess }) {
  const cfg = UPLOAD_CONFIG[tab];
  const [files,     setFiles]     = useState([]);
  const [title,     setTitle]     = useState('');
  const [desc,      setDesc]      = useState('');
  const [eventDate, setEventDate] = useState('');
  const [albumId,   setAlbumId]   = useState(albums?.[0]?.id ?? '');
  const [newAlbum,  setNewAlbum]  = useState('');
  const [useNew,    setUseNew]    = useState(!albums?.length);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);   // overall progress (0-100)
  const [current,   setCurrent]   = useState(0);   // current file index
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(0);    // files successfully uploaded

  if (!cfg) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#e2e8f0';
    e.currentTarget.style.background  = '#f8fafc';
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => cfg.multiple ? [...prev, ...dropped] : [dropped[0]]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload a single file via XHR, returns a promise
  const uploadOne = (file, fileTitle, token) => new Promise((resolve, reject) => {
    const fd = new FormData();

    if (cfg.needsAlbum) {
      // handled separately — this branch won't be hit for needsAlbum
      reject(new Error('Wrong branch'));
      return;
    }

    // Use provided title, or strip extension from filename as fallback
    const t = fileTitle?.trim() || file.name.replace(/\.[^.]+$/, '');
    fd.append('title',       t);
    fd.append('description', desc);
    if (eventDate) fd.append('event_date', eventDate);
    fd.append(cfg.field, file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', cfg.endpoint);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      setProgress(100);
      if (xhr.status < 300) { resolve(); return; }
      try {
        const ct  = xhr.getResponseHeader('content-type') ?? '';
        const msg = ct.includes('application/json')
          ? (JSON.parse(xhr.responseText)?.message ?? 'Upload failed.')
          : `Server error (${xhr.status}). Please try again.`;
        reject(new Error(msg));
      } catch {
        reject(new Error(`Server error (${xhr.status}). Please try again.`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error. Check your connection.'));
    xhr.send(fd);
  });

  const handleSubmit = async () => {
    if (!files.length) { setError('Please select at least one file.'); return; }
    if (cfg.needsAlbum && useNew && !newAlbum.trim()) { setError('Album name is required.'); return; }
    // For non-album single-file tabs that need a title: only required when 1 file
    if (!cfg.needsAlbum && files.length === 1 && !title.trim()) {
      setError('Title is required.'); return;
    }

    setLoading(true); setError(''); setDone(0); setProgress(0);

    try {
      const token = safeGetToken();

      // ── Album-based upload (photos/toga/archive) ──
      if (cfg.needsAlbum) {
        let targetAlbumId = albumId;
        if (useNew) {
          const r = await fetch('/api/graduation/album', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ title: newAlbum, description: desc, category: tab, event_date: eventDate || null }),
          });
          const ct = r.headers.get('content-type') ?? '';
          if (!ct.includes('application/json')) throw new Error(`Server error (${r.status}). Please try again.`);
          const d = await r.json();
          if (!r.ok) throw new Error(d.message ?? 'Album creation failed.');
          targetAlbumId = d.data.id;
        }

        // Upload all photos in one request
        await new Promise((resolve, reject) => {
          const fd = new FormData();
          fd.append('album_id', targetAlbumId);
          files.forEach(f => fd.append('photos[]', f));
          const xhr = new XMLHttpRequest();
          xhr.open('POST', cfg.endpoint);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100));
          };
          xhr.onload = () => {
            if (xhr.status < 300) { resolve(); return; }
            try {
              const ct  = xhr.getResponseHeader('content-type') ?? '';
              const msg = ct.includes('application/json')
                ? (JSON.parse(xhr.responseText)?.message ?? 'Upload failed.')
                : `Server error (${xhr.status}).`;
              reject(new Error(msg));
            } catch { reject(new Error(`Server error (${xhr.status}).`)); }
          };
          xhr.onerror = () => reject(new Error('Network error.'));
          xhr.send(fd);
        });

        onSuccess();
        return;
      }

      // ── Non-album upload: send each file individually ──
      const errors = [];
      for (let i = 0; i < files.length; i++) {
        setCurrent(i + 1);
        setProgress(0);
        // For multiple files, use title only for first if provided; rest use filename
        const fileTitle = files.length === 1 ? title : (i === 0 && title ? title : '');
        try {
          await uploadOne(files[i], fileTitle, token);
          setDone(d => d + 1);
        } catch (e) {
          errors.push(`${files[i].name}: ${e.message}`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('\n'));
        // Still call onSuccess if at least one uploaded
        if (errors.length < files.length) onSuccess();
      } else {
        onSuccess();
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrent(0);
    }
  };

  const inputStyle = { borderColor: '#e2e8f0', color: '#1d2b4b', fontFamily: 'inherit' };
  const focusStyle = e => e.target.style.borderColor = '#3f51b5';
  const blurStyle  = e => e.target.style.borderColor = '#e2e8f0';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,24,0.75)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full overflow-y-auto"
        style={{ maxWidth: '520px', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5"
          style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>{cfg.label}</h2>
            <p className="text-xs mt-1 m-0" style={{ color: '#94a3b8' }}>{cfg.note}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center"
            style={{ background: '#f1f5f9', color: '#64748b' }}>
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">

          {/* Album selector */}
          {cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Album</label>
              {albums?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {['Existing Album', 'New Album'].map((lbl, i) => (
                    <button key={lbl} onClick={() => setUseNew(!!i)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border-none cursor-pointer transition-all"
                      style={{ background: useNew === !!i ? '#1d2b4b' : '#f1f5f9', color: useNew === !!i ? 'white' : '#64748b' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              {!useNew && albums?.length > 0
                ? <select value={albumId} onChange={e => setAlbumId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                : <input type="text" value={newAlbum} onChange={e => setNewAlbum(e.target.value)}
                    placeholder="New album name"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              }
            </div>
          )}

          {/* Title — only shown for non-album tabs */}
          {!cfg.needsAlbum && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>
                Title {files.length <= 1 ? '*' : <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — filename used if blank)</span>}
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={files.length > 1 ? 'Leave blank to use each filename…' : 'Enter a title…'}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>
              Description <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Short description…"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          {/* Event date */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>
              Event Date <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>
              Files * <span style={{ color: '#94a3b8', fontWeight: 400 }}>— select as many as you want</span>
            </label>
            <label
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3f51b5'; e.currentTarget.style.background = 'rgba(63,81,181,0.04)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
              style={{ border: '2px dashed #e2e8f0', padding: '28px 20px', background: files.length ? 'rgba(63,81,181,0.04)' : '#f8fafc' }}>
              <i className={`fas ${files.length ? 'fa-check-circle' : 'fa-cloud-arrow-up'} text-3xl`}
                style={{ color: files.length ? '#3f51b5' : '#cbd5e1' }} />
              {files.length
                ? <p className="text-sm font-bold m-0" style={{ color: '#3f51b5' }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected — click to add more
                  </p>
                : <p className="text-sm font-semibold m-0" style={{ color: '#94a3b8' }}>
                    Click or drag &amp; drop — multiple files OK
                  </p>
              }
              <input type="file" accept={cfg.accept} multiple className="hidden"
                onChange={e => setFiles(prev => cfg.multiple ? [...prev, ...Array.from(e.target.files)] : [e.target.files[0]])} />
            </label>

            {/* File list with remove buttons */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <i className="fas fa-file text-xs flex-shrink-0" style={{ color: '#94a3b8' }} />
                    <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#1d2b4b' }}>
                      {f.name}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: '#94a3b8' }}>
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="flex-shrink-0 border-none cursor-pointer w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: 'transparent', color: '#cbd5e1' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
                      <i className="fas fa-times text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress — shows per-file progress when uploading multiple */}
          {loading && (
            <div>
              {files.length > 1 && !cfg.needsAlbum && (
                <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>
                  Uploading file {current} of {files.length}
                  {done > 0 && <span style={{ color: '#059669' }}> · {done} done</span>}
                </p>
              )}
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: '#64748b' }}>
                <span>
                  {cfg.needsAlbum ? 'Uploading…' : `File ${current}/${files.length}`}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full rounded-full" style={{ height: '6px', background: '#e2e8f0' }}>
                <div style={{ width: `${progress}%`, height: '6px', background: '#3f51b5', borderRadius: '9999px', transition: 'width 0.2s' }} />
              </div>
              {/* Overall progress bar for multiple files */}
              {files.length > 1 && !cfg.needsAlbum && (
                <>
                  <div className="flex justify-between text-xs font-bold mt-2 mb-1" style={{ color: '#94a3b8' }}>
                    <span>Overall</span>
                    <span>{Math.round(((done + (progress / 100)) / files.length) * 100)}%</span>
                  </div>
                  <div className="w-full rounded-full" style={{ height: '4px', background: '#e2e8f0' }}>
                    <div style={{
                      width: `${Math.round(((done + (progress / 100)) / files.length) * 100)}%`,
                      height: '4px', background: '#fdb813', borderRadius: '9999px', transition: 'width 0.2s',
                    }} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm font-semibold px-4 py-3 rounded-xl"
              style={{ background: '#fee2e2', color: '#dc2626', whiteSpace: 'pre-line' }}>
              <i className="fas fa-circle-exclamation mr-2" />{error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-bold text-white py-3.5 rounded-2xl border-none cursor-pointer text-sm"
            style={{ background: loading ? '#94a3b8' : '#1d2b4b' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3f51b5'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1d2b4b'; }}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading…</>
              : <><i className="fas fa-cloud-arrow-up" /> {cfg.label} {files.length > 1 ? `(${files.length} files)` : ''}</>
            }
          </button>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT CARDS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function AlbumCard({ album }) {
  const cover = album.photos?.[0]?.file_path;
  return (
    <Link to={`/graduation/archive/${album.id}`} className="no-underline block">
      <div className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
        style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}>
        <div className="relative overflow-hidden" style={{ height: '220px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)' }}>
          {cover
            ? <img src={cover} alt={album.title} className="w-full h-full object-cover opacity-90" />
            : <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-images text-5xl" style={{ color: 'rgba(253,184,19,0.4)' }} />
              </div>
          }
          <div className="absolute bottom-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(253,184,19,0.95)', color: '#1d2b4b' }}>
            {album.photos_count ?? 0} photos
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: '#1d2b4b' }}>{album.title}</h3>
          {album.event_date && (
            <p className="text-xs flex items-center gap-1.5 m-0" style={{ color: '#94a3b8' }}>
              <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
              {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function VideoCard({ album, badge }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ background: '#0a0f1e' }}>
        {playing
          ? <video src={album.media_url} controls autoPlay className="w-full" style={{ maxHeight: '280px' }} />
          : <div className="flex items-center justify-center cursor-pointer relative"
              style={{ height: '220px', background: 'linear-gradient(135deg,#0d1b35,#1d2b4b)' }}
              onClick={() => setPlaying(true)}>
              {badge && (
                <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(253,184,19,0.95)', color: '#1d2b4b' }}>{badge}</span>
              )}
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fdb813' }}>
                <i className="fas fa-play text-xl" style={{ color: '#1d2b4b', marginLeft: '3px' }} />
              </div>
            </div>
        }
      </div>
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-2 line-clamp-2 m-0" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs flex items-center gap-1.5 m-0" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-2 text-xs font-bold no-underline mt-3 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(63,81,181,0.08)', color: '#3f51b5' }}>
          <i className="fas fa-file-lines" /> View Transcript
        </Link>
      </div>
    </div>
  );
}

function ProgramCard({ album }) {
  return (
    <div className="rounded-3xl bg-white p-6 flex gap-5 items-start"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(253,184,19,0.12)' }}>
        <i className="fas fa-file-pdf text-2xl" style={{ color: '#fdb813' }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-sm mb-3" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl"
            style={{ background: '#1d2b4b' }}>
            <i className="fas fa-eye" /> View Program
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}>
            <i className="fas fa-download" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}

function InvitationCard({ album }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}>
      <div className="flex items-center justify-center"
        style={{ height: '240px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', overflow: 'hidden' }}>
        {album.media_url?.match(/\.(jpg|jpeg|png|webp)$/i)
          ? <img src={album.media_url} alt={album.title} className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-3">
              <i className="fas fa-envelope-open-text text-5xl" style={{ color: 'rgba(253,184,19,0.6)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Digital Invitation</span>
            </div>
        }
      </div>
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-3">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl"
            style={{ background: '#1d2b4b' }}>
            <i className="fas fa-eye" /> View
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}>
            <i className="fas fa-download" /> Save
          </a>
        </div>
      </div>
    </div>
  );
}

function SongCard({ album }) {
  const mediaRef               = useRef(null);
  const [playing,  setPlaying] = useState(false);
  const [current,  setCurrent] = useState(0);
  const [duration, setDur]     = useState(0);

  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(album.media_url ?? '');
  const fmt     = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const toggle  = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>

      {isVideo ? (
        <div style={{ background: '#0a0f1e', position: 'relative' }}>
          <video ref={mediaRef} src={album.media_url}
            style={{ width: '100%', maxHeight: 220, display: 'block', background: '#000' }}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
          {!playing && (
            <div onClick={toggle}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ color: '#1d2b4b', fontSize: 18, marginLeft: 3 }} />
              </div>
            </div>
          )}
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(29,43,75,0.8)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>
            <i className="fas fa-film" style={{ marginRight: 4 }} />VIDEO
          </span>
        </div>
      ) : (
        <div className="relative flex items-center justify-center"
          style={{ height: '140px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute" style={{
              width: '3px', borderRadius: '3px',
              height: `${20 + Math.sin(i * 0.8) * 36}px`,
              background: playing ? '#fdb813' : 'rgba(253,184,19,0.25)',
              left: `${4 + i * 4.8}%`, transition: 'background 0.3s',
            }} />
          ))}
          <button onClick={toggle}
            className="relative z-10 flex items-center justify-center rounded-full border-none cursor-pointer"
            style={{ width: '56px', height: '56px', background: '#fdb813' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} text-lg`}
              style={{ color: '#1d2b4b', marginLeft: playing ? 0 : '3px' }} />
          </button>
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(253,184,19,0.2)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>
            <i className="fas fa-music" style={{ marginRight: 4 }} />AUDIO
          </span>
          <audio ref={mediaRef} src={album.media_url}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
        </div>
      )}

      <div style={{ padding: '18px 20px' }}>
        <h3 className="font-extrabold text-base mb-2" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        <div className="rounded-full cursor-pointer mb-1.5" style={{ height: '6px', background: '#e2e8f0' }}
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            if (mediaRef.current) mediaRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
          }}>
          <div style={{ width: `${duration ? (current / duration) * 100 : 0}%`, height: '6px', background: '#fdb813', borderRadius: '9999px', transition: 'width 0.1s' }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#94a3b8' }}>
          <span>{fmt(current)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab, isAdmin, onUpload }) {
  const cfg = {
    photos:     { icon: 'fa-images',             text: 'No graduation photos yet.' },
    videos:     { icon: 'fa-film',               text: 'No graduation videos yet.' },
    program:    { icon: 'fa-file-pdf',           text: 'No graduation program uploaded yet.' },
    archive:    { icon: 'fa-box-archive',        text: 'No archived records yet.' },
    toga:       { icon: 'fa-user-graduate',      text: 'No toga gallery photos yet.' },
    invitation: { icon: 'fa-envelope-open-text', text: 'No invitations uploaded yet.' },
    song:       { icon: 'fa-music',              text: 'No graduation songs uploaded yet.' },
    mass:       { icon: 'fa-church',             text: 'No Baccalaureate Mass videos yet.' },
  }[tab] ?? { icon: 'fa-graduation-cap', text: 'Nothing here yet.' };

  return (
    <div className="text-center py-24 bg-white rounded-3xl"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.05)' }}>
      <i className={`fas ${cfg.icon} text-6xl mb-5 block`} style={{ color: '#e2e8f0' }} />
      <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>Nothing Here Yet</h3>
      <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>{cfg.text}</p>
      {isAdmin && (
        <button onClick={onUpload}
          className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-2xl border-none cursor-pointer"
          style={{ background: '#1d2b4b', color: 'white' }}
          onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
          onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
          <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} />
          {UPLOAD_CONFIG[tab]?.label ?? 'Upload Content'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GraduationPage() {
  const { user }                        = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam  = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'photos';
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const loadData = (tab = activeTab) => {
    setLoading(true);
    graduationApi.list(tab)
      .then(({ data: res }) => setData(res.data ?? res ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(activeTab); }, [activeTab]);

  const handleSuccess = () => { setShowUpload(false); loadData(activeTab); };

  const primaryTabs   = TABS.slice(0, 4);
  const secondaryTabs = TABS.slice(4);
  const photoAlbums   = ['photos', 'toga', 'archive'].includes(activeTab) ? data : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg,#1d2b4b 0%,#2a3d66 100%)', padding: '80px 8% 150px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Class Milestones</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Graduation <span style={{ color: '#fdb813' }}>Hub</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '540px' }}>
          Photos, videos, programs, ceremonies, and memories — all in one place.
        </p>
        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-2 mt-6 text-sm font-bold no-underline px-5 py-2.5 rounded-2xl transition-all"
          style={{ background: 'rgba(253,184,19,0.15)', color: '#fdb813', border: '1px solid rgba(253,184,19,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
          <i className="fas fa-microphone-lines" /> Guest Speeches &amp; Transcripts
          {!user?.is_premium && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold"
              style={{ background: '#fdb813', color: '#1d2b4b' }}>Premium</span>
          )}
        </Link>
      </header>

      {/* Tabs */}
      <div className="mx-auto px-5" style={{ maxWidth: '1000px', width: '100%', marginTop: '-55px' }}>
        <div className="bg-white flex gap-2 p-2 rounded-2xl mb-2"
          style={{ boxShadow: '0 18px 36px rgba(29,43,75,0.1)' }}>
          {primaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-3"
              style={{ background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? 'white' : '#94a3b8' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="bg-white flex gap-2 p-2 rounded-2xl"
          style={{ boxShadow: '0 8px 24px rgba(29,43,75,0.07)' }}>
          {secondaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-2.5"
              style={{ background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? 'white' : '#94a3b8' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 100px', width: '100%' }}>

        {isAdmin && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>
              {TABS.find(t => t.key === activeTab)?.label}
            </h2>
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl border-none cursor-pointer transition-all"
              style={{ background: '#1d2b4b', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
              <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} />
              {UPLOAD_CONFIG[activeTab]?.label ?? 'Upload'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState tab={activeTab} isAdmin={isAdmin} onUpload={() => setShowUpload(true)} />
        ) : (
          <>
            {['photos', 'archive', 'toga'].includes(activeTab) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '24px' }}>
                {data.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'videos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <VideoCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'program' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.map(a => <ProgramCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'invitation' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '24px' }}>
                {data.map(a => <InvitationCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'song' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <SongCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'mass' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <VideoCard key={a.id} album={a} badge="Baccalaureate Mass" />)}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {showUpload && (
        <UploadModal
          tab={activeTab}
          albums={photoAlbums}
          onClose={() => setShowUpload(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}