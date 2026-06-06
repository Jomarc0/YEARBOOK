import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, mediaApi } from '@/api/gallery.api';
import { graduationApi, transcriptApi } from '@/api/yearbook.api';
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

// REMOVED: safeGetToken() — no longer needed.
// All API calls now go through the axios client which handles auth automatically.

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
  { key: 'graduation:videos',     label: 'Videos',        icon: 'fa-film'               },
  { key: 'graduation:program',    label: 'Program',       icon: 'fa-file-pdf'           },
  { key: 'graduation:invitation', label: 'Invitation',    icon: 'fa-envelope-open-text' },
  { key: 'graduation:song',       label: 'Grad Song',     icon: 'fa-music'              },
  { key: 'graduation:mass',       label: 'Baccalaureate', icon: 'fa-church'             },
];

// ─── Storage hook ─────────────────────────────────────────────────────────────
function useStorageUsage() {
  const [storage, setStorage] = useState({ used_bytes: 0, limit_bytes: 524288000, tier: 'free' });
  const reload = () =>
    mediaApi.storageUsage()
      .then(({ data }) => {
        const p = data?.data ?? data;
        setStorage({
          used_bytes:  p.used_bytes  ?? p.used  ?? 0,
          limit_bytes: p.limit_bytes ?? p.limit ?? 524288000,
          tier:        p.tier ?? 'free',
        });
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
            <div className="w-14 h-14 rounded-full bg-[#1d2b4b]/[0.07] flex items-center justify-center mx-auto mb-5">
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

// ─── CreateAlbumStep ──────────────────────────────────────────────────────────
function CreateAlbumStep({
  albums, activeAlbum, onSelect, onCreateNew, onProceed, onCancel,
  creating, newAlbumName, onNewAlbumNameChange,
}) {
  const [showNew, setShowNew] = useState(false);
  const canProceed = !!activeAlbum;

  return (
    <div className="bg-white rounded-[24px] border border-black/[0.04] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1d2b4b] text-white text-xs font-black flex items-center justify-center">1</div>
          <p className="m-0 text-[14px] font-extrabold text-[#1d2b4b]">Select or Create an Album</p>
        </div>
        <button onClick={onCancel}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border-none cursor-pointer
                     flex items-center justify-center text-slate-400 transition-colors">
          <i className="fas fa-times text-sm" />
        </button>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="m-0 text-[12px] font-bold text-slate-500 uppercase tracking-wide">
            <i className="fas fa-folder-open text-[#fdb813] mr-1.5" />Your Albums
          </p>
          <button onClick={() => setShowNew(v => !v)}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold border-none cursor-pointer
                         px-3 py-1.5 rounded-xl transition-colors
                         ${showNew ? 'bg-slate-100 text-slate-500' : 'bg-[#1d2b4b]/[0.08] text-[#1d2b4b] hover:bg-[#1d2b4b]/[0.14]'}`}>
            <i className={`fas ${showNew ? 'fa-times' : 'fa-plus'}`} />
            {showNew ? 'Cancel' : 'New Album'}
          </button>
        </div>

        {showNew && (
          <div className="flex gap-2">
            <input type="text" value={newAlbumName} onChange={e => onNewAlbumNameChange(e.target.value)}
              placeholder="Album name…"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold
                         text-[#1d2b4b] outline-none focus:border-[#3f51b5] transition-colors"
              onKeyDown={e => e.key === 'Enter' && onCreateNew()} />
            <button onClick={onCreateNew} disabled={creating || !newAlbumName.trim()}
              className={`px-4 py-2.5 rounded-xl border-none cursor-pointer text-[13px] font-bold
                          flex items-center gap-1.5 transition-colors shrink-0
                          ${creating || !newAlbumName.trim()
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#1d2b4b] text-white hover:bg-[#3f51b5]'}`}>
              {creating
                ? <><i className="fas fa-spinner animate-spin" /> Creating…</>
                : <><i className="fas fa-plus" /> Create</>}
            </button>
          </div>
        )}

        {albums.length === 0 && !showNew ? (
          <div className="text-center py-4 bg-slate-50 rounded-2xl text-[13px] text-slate-400">
            <i className="fas fa-folder mr-2 text-slate-300" />No albums yet — create one above.
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
                                 : 'bg-[#1d2b4b]/[0.06] text-[#1d2b4b] hover:bg-[#1d2b4b]/10'}`}>
                  <i className={`fas fa-folder text-[11px] ${active ? 'text-[#fdb813]' : 'text-slate-400'}`} />
                  {a.title}
                  {a.photos_count !== undefined && (
                    <span className={`text-[10px] ${active ? 'text-[#fdb813]' : 'text-slate-400'}`}>
                      ({a.photos_count})
                    </span>
                  )}
                  {active && <i className="fas fa-check text-[10px] text-[#fdb813] ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-1 border-t border-slate-100">
          <button onClick={onProceed} disabled={!canProceed}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] border-none
                         text-[13px] font-extrabold cursor-pointer transition-all
                         ${canProceed
                           ? 'bg-[#1d2b4b] text-white hover:bg-[#3f51b5]'
                           : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <i className="fas fa-arrow-right text-[#fdb813]" />Continue to Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transcript Modal ─────────────────────────────────────────────────────────
function TranscriptModal({ photoId, videoTitle, onClose }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [activeTab,   setActiveTab]   = useState('transcript');
  const [dlLoading,   setDlLoading]   = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!photoId) return;
    setLoading(true);
    transcriptApi.list({ graduation_photo_id: photoId })
      .then(({ data }) => {
        const list = data.data ?? data ?? [];
        setTranscripts(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setTranscripts([]))
      .finally(() => setLoading(false));
  }, [photoId]);

  const handleDownload = async (id, format) => {
    setDlLoading(true);
    try {
      const res  = await transcriptApi.subtitles(id, format);
      const blob = new Blob([res.data], { type: format === 'vtt' ? 'text/vtt' : 'application/x-subrip' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `transcript-${id}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert(`Failed to download ${format.toUpperCase()}.`); }
    finally { setDlLoading(false); }
  };

  const statusCfg = {
    done:       { bg: '#ecfdf5', color: '#059669', icon: 'fa-circle-check'       },
    processing: { bg: '#fefce8', color: '#ca8a04', icon: 'fa-spinner fa-spin'    },
    failed:     { bg: '#fef2f2', color: '#dc2626', icon: 'fa-circle-exclamation' },
    pending:    { bg: '#f1f5f9', color: '#64748b', icon: 'fa-clock'              },
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(8,12,24,0.85)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-[860px] sm:rounded-[28px] rounded-t-[28px]
                      flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fdb813]/[0.12] flex items-center justify-center">
              <i className="fas fa-file-lines text-[#fdb813]" />
            </div>
            <div>
              <h2 className="m-0 font-extrabold text-[15px] text-[#1d2b4b]">Speeches &amp; Transcripts</h2>
              {videoTitle && <p className="m-0 text-[11px] text-slate-400 mt-0.5">{videoTitle}</p>}
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border-none cursor-pointer
                       flex items-center justify-center text-slate-400 transition-colors flex-shrink-0">
            <i className="fas fa-times" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]" />
          </div>
        ) : transcripts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
            <i className="fas fa-microphone-slash text-5xl text-slate-200 block mb-4" />
            <h3 className="font-extrabold text-lg text-[#1d2b4b] mb-1">No Transcripts Yet</h3>
            <p className="text-sm text-slate-400">No speeches have been transcribed for this video.</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-[220px] sm:w-[240px] border-r border-slate-100 overflow-y-auto flex-shrink-0 p-3 flex flex-col gap-2">
              {transcripts.map(t => {
                const s   = statusCfg[t.status] ?? statusCfg.pending;
                const act = selected?.id === t.id;
                return (
                  <button key={t.id} onClick={() => { setSelected(t); setActiveTab('transcript'); }}
                    className="text-left w-full border-none cursor-pointer rounded-[16px] p-3.5 transition-all"
                    style={{ background: act ? '#1d2b4b' : 'transparent' }}
                    onMouseEnter={e => { if (!act) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!act) e.currentTarget.style.background = 'transparent'; }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: act ? 'rgba(253,184,19,0.2)' : '#f1f5f9' }}>
                        <i className="fas fa-microphone-lines text-[12px]"
                          style={{ color: act ? '#fdb813' : '#94a3b8' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-bold text-[12px] leading-snug truncate"
                          style={{ color: act ? 'white' : '#1d2b4b' }}>{t.title}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full"
                          style={{ background: act ? 'rgba(255,255,255,0.12)' : s.bg, color: act ? 'rgba(255,255,255,0.7)' : s.color }}>
                          <i className={`fas ${s.icon} text-[9px]`} />
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {selected.status === 'done' && (
                  <div className="flex gap-1.5 px-5 pt-4 pb-0 flex-shrink-0">
                    {['transcript', 'notes'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-[12px] text-[12px] font-bold border-none cursor-pointer transition-all capitalize"
                        style={{ background: activeTab === tab ? '#1d2b4b' : '#f1f5f9', color: activeTab === tab ? 'white' : '#64748b' }}>
                        {tab === 'transcript' ? 'Full Transcript' : 'AI Notes'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {selected.status === 'done' ? (
                    activeTab === 'transcript' ? (
                      selected.transcript_text ? (
                        <div className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap
                                        bg-slate-50 rounded-[16px] p-5 border-l-4 border-[#fdb813]">
                          {selected.transcript_text}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No transcript text available.</p>
                      )
                    ) : (
                      selected.notes ? (
                        <div className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap">
                          {selected.notes}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No AI notes generated yet.</p>
                      )
                    )
                  ) : selected.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]" />
                      <p className="text-sm font-semibold text-slate-500">Groq Whisper is transcribing this speech…</p>
                      <p className="text-xs text-slate-400">This may take a few minutes.</p>
                    </div>
                  ) : selected.status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <i className="fas fa-circle-exclamation text-3xl text-red-400" />
                      <p className="text-sm font-semibold text-slate-500">Transcription failed.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <i className="fas fa-clock text-3xl text-slate-300" />
                      <p className="text-sm text-slate-400">Queued for transcription.</p>
                    </div>
                  )}
                </div>

                {selected.status === 'done' && (
                  <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-100 flex-shrink-0 flex-wrap">
                    <button onClick={() => handleDownload(selected.id, 'srt')} disabled={dlLoading}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 rounded-xl border-none cursor-pointer transition-colors"
                      style={{ background: '#1d2b4b', color: 'white' }}>
                      <i className="fas fa-download text-[#fdb813]" /> SRT
                    </button>
                    <button onClick={() => handleDownload(selected.id, 'vtt')} disabled={dlLoading}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 rounded-xl border-none cursor-pointer transition-colors"
                      style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}>
                      <i className="fas fa-download" /> VTT
                    </button>
                    {selected.transcript_text && (
                      <button onClick={() => navigator.clipboard.writeText(selected.transcript_text)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 rounded-xl border-none cursor-pointer"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        <i className="fas fa-copy" /> Copy
                      </button>
                    )}
                    <Link to="/graduation/speeches"
                      className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3f51b5] no-underline
                                 bg-[#3f51b5]/[0.08] px-3 py-2 rounded-xl hover:bg-[#3f51b5]/[0.15] transition-colors">
                      <i className="fas fa-arrow-up-right-from-square text-[10px]" /> All Speeches
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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

// ─── VideoAlbumCard ───────────────────────────────────────────────────────────
function VideoAlbumCard({ album, onClick }) {
  const videoCount = (album.media_files ?? album.mediaFiles ?? album.videos ?? []).length
    || (album.media_url ? 1 : 0);

  return (
    <button onClick={() => onClick(album)}
      className="text-left w-full border-none bg-white rounded-3xl overflow-hidden
                 shadow-sm border border-black/[0.04] cursor-pointer group
                 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="h-[200px] bg-gradient-to-br from-[#0d1b35] to-[#1d2b4b] relative overflow-hidden
                      flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#fdb813] flex items-center justify-center
                        shadow-lg group-hover:scale-110 transition-transform duration-300">
          <i className="fas fa-play text-2xl text-[#1d2b4b] ml-1" />
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white
                        text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <i className="fas fa-film text-[#fdb813] text-[10px]" />
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </div>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fdb813 0, #fdb813 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
      </div>
      <div className="p-5">
        <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1.5 truncate">{album.title}</h4>
        {album.event_date && (
          <p className="text-xs text-slate-400 m-0 flex items-center gap-1.5">
            <i className="fas fa-calendar text-[#fdb813]" />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <p className="mt-2 text-[11px] font-bold text-[#3f51b5] flex items-center gap-1">
          <i className="fas fa-arrow-right text-[10px]" /> View Videos
        </p>
      </div>
    </button>
  );
}

// ─── GradVideoCard ────────────────────────────────────────────────────────────
function GradVideoCard({ video, photoId, albumTitle, badge }) {
  const [playing,        setPlaying]        = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const src   = video.file_path ?? video.media_url;
  const title = video.title ?? video.caption ?? albumTitle ?? 'Video';
  const date  = video.event_date ?? null;

  return (
    <>
      <div className="rounded-3xl overflow-hidden bg-white border border-black/[0.04] shadow-sm">
        <div className="bg-[#0a0f1e]">
          {playing ? (
            <video src={src} controls autoPlay className="w-full max-h-[240px] block" />
          ) : (
            <div onClick={() => setPlaying(true)}
              className="h-[200px] bg-gradient-to-br from-[#0d1b35] to-[#1d2b4b] flex items-center justify-center cursor-pointer relative">
              {badge && (
                <span className="absolute top-3 left-3 bg-[#fdb813]/95 text-[#1d2b4b] text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                  {badge}
                </span>
              )}
              <div className="w-14 h-14 rounded-full bg-[#fdb813] flex items-center justify-center shadow-lg">
                <i className="fas fa-play text-xl text-[#1d2b4b] ml-0.5" />
              </div>
            </div>
          )}
        </div>
        <div className="p-5">
          <h4 className="font-extrabold text-[15px] text-[#1d2b4b] mb-1.5">{title}</h4>
          {date && (
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
              <i className="fas fa-calendar text-[#fdb813]" />
              {new Date(date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          <button onClick={() => setShowTranscript(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3f51b5]
                       bg-[#3f51b5]/[0.08] px-2.5 py-1 rounded-lg hover:bg-[#3f51b5]/[0.15] transition-colors border-none cursor-pointer">
            <i className="fas fa-file-lines" /> View Transcript
          </button>
        </div>
      </div>

      {showTranscript && (
        <TranscriptModal
          photoId={photoId}
          videoTitle={title}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  );
}

function GradProgramCard({ album, isPremium = false }) {
  return (
    <div className="rounded-3xl bg-white p-6 flex gap-5 items-start border border-black/[0.04] shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#fdb813]/[0.12] flex items-center justify-center shrink-0">
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
  const mediaRef = useRef(null);
  const [playing,        setPlaying]        = useState(false);
  const [current,        setCurrent]        = useState(0);
  const [duration,       setDur]            = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(album.media_url ?? '');
  const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const toggle = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
    setPlaying(!playing);
  };

  return (
    <>
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
              <div key={i}
                className={`absolute w-[3px] rounded-sm transition-colors duration-300 ${playing ? 'bg-[#fdb813]' : 'bg-[#fdb813]/25'}`}
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
          <div className="flex justify-between text-[11px] text-slate-400 mb-3">
            <span>{fmt(current)}</span><span>{fmt(duration)}</span>
          </div>
          <button onClick={() => setShowTranscript(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3f51b5]
                       bg-[#3f51b5]/[0.08] px-2.5 py-1 rounded-lg hover:bg-[#3f51b5]/[0.15] transition-colors border-none cursor-pointer">
            <i className="fas fa-file-lines" /> View Transcript
          </button>
        </div>
      </div>

      {showTranscript && (
        <TranscriptModal
          photoId={album.id}
          videoTitle={album.title}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  );
}

// ─── Face Search Results ──────────────────────────────────────────────────────
function FaceSearchResults({ matches, isGrad }) {
  if (!matches.length) return null;
  return (
    <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
      {matches.map(p => (
        isGrad ? (
          <Link key={p.user_id ?? p.id} to={`/profile/${p.user_id}`}
            className="flex items-center gap-3 bg-white/[0.12] backdrop-blur-md border border-white/20
                       rounded-[14px] p-3 no-underline hover:border-[#fdb813] transition-colors">
            <img src={imageUrl(p.profile_picture) || avatarUrl(p.name)} alt={p.name}
              className="w-11 h-11 rounded-xl object-cover border-2 border-[#fdb813] flex-shrink-0" />
            <div className="min-w-0">
              <p className="m-0 font-bold text-[13px] text-white truncate">{p.name}</p>
              <p className="m-0 text-[11px] text-white/60">
                <i className="fas fa-brain text-[#fdb813] mr-1" />{p.similarity}% match
              </p>
            </div>
          </Link>
        ) : (
          <Link key={p.photo_id ?? p.id} to={p.album_id ? `/gallery/${p.album_id}` : '#'}
            className="block rounded-[14px] overflow-hidden border border-white/20
                       hover:border-[#fdb813] transition-all no-underline group">
            <div className="relative">
              <img src={p.file_path} alt={p.caption || 'Photo'} className="w-full h-28 object-cover" />
              <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {p.similarity}%
              </div>
            </div>
            {p.album?.title && (
              <p className="m-0 text-[11px] font-bold text-white/70 px-2 py-1.5 truncate bg-black/40
                            group-hover:bg-[#fdb813]/20 group-hover:text-white transition-colors">
                <i className="fas fa-images mr-1" />{p.album.title}
              </p>
            )}
          </Link>
        )
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
  const [uploadStep,    setUploadStep]    = useState(null);
  const [activeAlbum,   setActiveAlbum]   = useState(null);
  const [storage,       reloadStorage]    = useStorageUsage();
  const [newAlbumName,  setNewAlbumName]  = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [selectedVideoAlbum, setSelectedVideoAlbum] = useState(null);

  const isGrad = activeTab !== 'general';
  const tier   = storage.tier;

  const uploadHook = useMediaUpload(activeAlbum, tier, () => {
    setUploadStep(null);
    loadAlbums();
    reloadStorage();
  });

  const bulkUploadProps = {
    queue:       uploadHook.files,
    uploading:   uploadHook.uploading,
    progress:    uploadHook.progress,
    errors:      uploadHook.error ? [uploadHook.error] : [],
    isDragging:  uploadHook.isDragging,
    limits: {
      videoAllowed: uploadHook.tier.maxVideoSizeMB > 0,
      maxFiles:     uploadHook.tier.maxFiles,
      maxPhotoMB:   uploadHook.tier.maxFileSizeMB,
      maxVideoMB:   uploadHook.tier.maxVideoSizeMB,
    },
    addFiles:     uploadHook.addFiles,
    removeFile:   uploadHook.removeFile,
    clearQueue:   uploadHook.clearFiles,
    upload:       () => uploadHook.submit(),
    dragHandlers: uploadHook.dragProps,
  };

  const loadAlbums = (tab = activeTab) => {
    setLoading(true);
    const req = tab === 'general'
      ? galleryApi.list('general', null)
      : graduationApi.list(tab.split(':')[1]);
    req
      .then(({ data }) => setAlbums(data.data ?? data ?? []))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAlbums(activeTab); }, [activeTab]); // eslint-disable-line

  const handleTabChange = (key) => {
    setActiveTab(key);
    setUploadStep(null);
    setMatches([]);
    setActiveAlbum(null);
    setNewAlbumName('');
    setSelectedVideoAlbum(null);
  };

  // ── FIX: replaced raw fetch() + safeGetToken() with galleryApi.createAlbum()
  //         so the axios interceptor handles the Authorization header correctly.
  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const { data } = await galleryApi.createAlbum({
        title: newAlbumName.trim(),
        type:  'general',
      });

      const newId = data?.data?.id ?? data?.id;

      // Refresh the album list and auto-select the newly created album.
      const { data: listData } = await galleryApi.list('general', null);
      setAlbums(listData.data ?? listData ?? []);
      setActiveAlbum(newId);
      setNewAlbumName('');
    } catch (e) {
      alert(e?.response?.data?.message ?? e.message ?? 'Album creation failed.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleFaceFile = async (file) => {
    setSearching(true);
    setMatches([]);
    try {
      const fd = new FormData();
      fd.append('face_image', file);
      fd.append('type', isGrad ? 'graduation' : 'general');
      if (isGrad) fd.append('category', activeTab.split(':')[1]);
      const { data } = await galleryApi.faceSearch(fd);
      setMatches(data.photos ?? []);
      if (!data.photos?.length) alert('No matching photos found.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  const cancelUpload = () => {
    setUploadStep(null);
    setActiveAlbum(null);
    setNewAlbumName('');
    uploadHook.clearFiles();
  };

  const openUploadFromCard = (albumId) => {
    setActiveAlbum(albumId);
    setUploadStep('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const flattenVideosFromAlbum = (album, badge = undefined) => {
    const vids = album.media_files ?? album.mediaFiles ?? album.videos ?? [];
    if (vids.length > 0) {
      return vids.map(v => ({
        video:      v,
        photoId:    v.id,
        albumId:    album.id,
        albumTitle: album.title,
        badge,
      }));
    }
    return [{
      video:      { ...album, file_path: album.media_url },
      photoId:    album.id,
      albumId:    album.id,
      albumTitle: album.title,
      badge,
    }];
  };

  const isVideoTab     = activeTab === 'graduation:videos' || activeTab === 'graduation:mass';
  const videoTabBadge  = activeTab === 'graduation:mass' ? 'Baccalaureate Mass' : undefined;
  const photoGradTabs  = ['graduation:photos'];
  const primaryTabs    = TABS.slice(0, 4);
  const secondaryTabs  = TABS.slice(4);

  const tabCls = (key, sm = false) =>
    `flex items-center justify-center gap-1.5 font-bold border-none cursor-pointer transition-all rounded-[14px]
     ${sm ? 'py-2 px-1.5 text-[11px]' : 'py-2.5 px-2 text-[12px]'}
     ${activeTab === key ? 'bg-[#1d2b4b] text-white' : 'bg-transparent text-slate-400 hover:text-slate-600'}`;

  const heroTitle = isGrad
    ? <><span className="text-[#fdb813]">Graduation</span> Hub</>
    : <>The <span className="text-[#fdb813]">Visual Archive</span></>;
  const heroSubtitle = isGrad
    ? 'Photos, videos, programs, ceremonies, and memories — all in one place.'
    : 'Relive the milestones and pioneer memories through our AI-powered digital gallery.';
  const heroLabel = isGrad ? 'Class Milestones' : 'National University Lipa';

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe] font-sans">
      <Navbar />

      {/* ── Hero ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-10 pb-10 text-center text-white rounded-b-[28px]">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50 mb-2.5">{heroLabel}</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{heroTitle}</h1>
        <p className="text-sm text-white/70 max-w-[520px] mx-auto mb-4 leading-relaxed font-light">
          {heroSubtitle}
        </p>

        {isGrad && (
          <div className="mb-6">
            <Link to="/graduation/speeches"
              className="inline-flex items-center gap-2 text-sm font-bold no-underline px-5 py-2.5 rounded-2xl transition-all
                         bg-[#fdb813]/15 text-[#fdb813] border border-[#fdb813]/30 hover:bg-[#fdb813]/25">
              <i className="fas fa-microphone-lines" /> Guest Speeches &amp; Transcripts
            </Link>
          </div>
        )}

        {!isGrad && (
          <div className="max-w-[520px] mx-auto mb-7">
            <ContentOwnershipBanner message="All media in this gallery is the exclusive property of" />
          </div>
        )}

        <div className="max-w-[560px] mx-auto relative z-10">
          <div className="relative">
            <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2 text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
            <input type="text" readOnly
              placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
              className="w-full h-11 pl-[46px] pr-14 border border-white/15 rounded-xl outline-none
                         bg-white/10 backdrop-blur-xl text-white text-sm font-medium cursor-pointer
                         focus:bg-white/[0.18] focus:border-[#fdb813]/60 transition-all placeholder-white/50" />
            <FaceSearchButton onFile={handleFaceFile} loading={searching} />
          </div>
          <FaceSearchResults matches={matches} isGrad={isGrad} />
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="max-w-[1000px] mx-auto -mt-4 px-5 w-full relative z-10">
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
          <StorageUsageBar
            usedBytes={storage.used_bytes}
            limitBytes={storage.limit_bytes}
            tier={tier}
            onUpgrade={() => window.location.href = '/subscription'}
          />
        </div>
      )}

      {/* ── Upload flow ── */}
      {!isGrad && uploadStep && (
        <div className="max-w-[1000px] mx-auto mt-5 px-5 w-full flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {['Select Album', 'Upload Photos'].map((label, i) => {
              const stepKey  = i === 0 ? 'album' : 'upload';
              const isDone   = uploadStep === 'upload' && i === 0;
              const isActive = uploadStep === stepKey;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black
                    ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[#1d2b4b] text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isDone ? <i className="fas fa-check" /> : i + 1}
                  </div>
                  <span className={`text-[12px] font-bold ${isActive ? 'text-[#1d2b4b]' : 'text-slate-400'}`}>{label}</span>
                  {i === 0 && <i className="fas fa-chevron-right text-slate-300 text-[10px]" />}
                </div>
              );
            })}
          </div>

          {uploadStep === 'album' && (
            <CreateAlbumStep
              albums={albums} activeAlbum={activeAlbum} onSelect={setActiveAlbum}
              onCreateNew={handleCreateAlbum} onProceed={() => setUploadStep('upload')}
              onCancel={cancelUpload} creating={creatingAlbum}
              newAlbumName={newAlbumName} onNewAlbumNameChange={setNewAlbumName}
            />
          )}

          {uploadStep === 'upload' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-[#1d2b4b]/[0.08] px-3.5 py-2 rounded-xl">
                  <i className="fas fa-folder text-[#fdb813] text-[13px]" />
                  <span className="text-[13px] font-extrabold text-[#1d2b4b]">
                    {albums.find(a => a.id === activeAlbum)?.title ?? 'Selected Album'}
                  </span>
                </div>
                <button onClick={() => setUploadStep('album')}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-400
                             hover:text-[#1d2b4b] border-none bg-transparent cursor-pointer transition-colors">
                  <i className="fas fa-arrow-left" /> Change Album
                </button>
              </div>
              <BulkUploadZone {...bulkUploadProps} tier={tier} onCancel={cancelUpload} />
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <section className="px-[8%] pt-8 pb-24 flex-1">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl font-extrabold text-[#1d2b4b] m-0 flex items-center gap-2">
            {isVideoTab && selectedVideoAlbum ? (
              <>
                <button onClick={() => setSelectedVideoAlbum(null)}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#1d2b4b]
                             border-none bg-transparent cursor-pointer text-xl font-extrabold transition-colors p-0">
                  <i className="fas fa-chevron-left text-base" />
                  {TABS.find(t => t.key === activeTab)?.label}
                </button>
                <i className="fas fa-chevron-right text-slate-300 text-sm" />
                <span className="text-[#1d2b4b]">{selectedVideoAlbum.title}</span>
              </>
            ) : (
              TABS.find(t => t.key === activeTab)?.label ?? 'Albums'
            )}
          </h2>

          {canUpload && !isGrad && !uploadStep && (
            <button onClick={() => setUploadStep('album')}
              className="flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none
                         px-5 py-2.5 rounded-[14px] text-[13px] font-bold cursor-pointer transition-colors">
              <i className="fas fa-cloud-arrow-up text-[#fdb813]" /> Upload Photos
            </button>
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
            {canUpload && !isGrad && (
              <button onClick={() => setUploadStep('album')}
                className="inline-flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none
                           px-5 py-2.5 rounded-[14px] text-[13px] font-bold cursor-pointer transition-colors">
                <i className="fas fa-cloud-arrow-up text-[#fdb813]" /> Upload Photos
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Photo grids ── */}
            {(activeTab === 'general' || photoGradTabs.includes(activeTab)) && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-7">
                {albums.map(album => (
                  activeTab === 'general' ? (
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
                        <button onClick={() => openUploadFromCard(album.id)}
                          className="absolute bottom-[18px] right-[18px] flex items-center gap-1.5
                                     bg-[#1d2b4b] hover:bg-[#3f51b5] text-white border-none px-3.5 py-2
                                     rounded-xl text-[11px] font-bold cursor-pointer z-10 transition-all
                                     opacity-0 group-hover:opacity-100">
                          <i className="fas fa-plus text-[#fdb813]" /> Add Photos
                        </button>
                      )}
                    </div>
                  ) : (
                    <GradAlbumCard key={album.id} album={album} />
                  )
                ))}
              </div>
            )}

            {/* ── Videos / Baccalaureate Mass tabs ── */}
            {isVideoTab && (
              <>
                {!selectedVideoAlbum && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                    {albums.map(album => (
                      <VideoAlbumCard key={album.id} album={album} onClick={setSelectedVideoAlbum} />
                    ))}
                  </div>
                )}

                {selectedVideoAlbum && (
                  <>
                    <button onClick={() => setSelectedVideoAlbum(null)}
                      className="mb-5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-500
                                 hover:text-[#1d2b4b] border-none bg-transparent cursor-pointer transition-colors">
                      <i className="fas fa-arrow-left" /> Back to all albums
                    </button>

                    {(() => {
                      const videoItems = flattenVideosFromAlbum(selectedVideoAlbum, videoTabBadge);
                      return videoItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                          <i className="fas fa-film text-5xl text-slate-200 block mb-4" />
                          <p className="text-slate-400 text-sm">No videos in this album yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                          {videoItems.map(({ video, photoId, albumTitle, badge }, i) => (
                            <GradVideoCard
                              key={video.id ?? `v-${i}`}
                              video={video}
                              photoId={photoId}
                              albumTitle={albumTitle}
                              badge={badge}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </>
                )}
              </>
            )}

            {/* ── Program tab ── */}
            {activeTab === 'graduation:program' && (
              <div className="flex flex-col gap-4">
                {albums.map(a => <GradProgramCard key={a.id} album={a} isPremium={isPremium} />)}
              </div>
            )}

            {/* ── Invitation tab ── */}
            {activeTab === 'graduation:invitation' && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {albums.map(a => <GradInvitationCard key={a.id} album={a} isPremium={isPremium} />)}
              </div>
            )}

            {/* ── Grad Song tab ── */}
            {activeTab === 'graduation:song' && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                {albums.map(a => <GradSongCard key={a.id} album={a} />)}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
