import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { transcriptApi } from '@/api/yearbook.api';

// ─── Safe localStorage getter (Edge/Safari Tracking Prevention) ───────────────
const safeGetToken = () => {
  try { return localStorage.getItem('token') ?? ''; }
  catch { return ''; }
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSCRIPT STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    done:       { label: 'Transcribed',  bg: '#dcfce7', color: '#16a34a' },
    processing: { label: 'Processing…', bg: '#fef9c3', color: '#ca8a04' },
    pending:    { label: 'Pending',      bg: '#e0e7ff', color: '#3f51b5' },
    failed:     { label: 'Failed',       bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSCRIPT DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function TranscriptPanel({ transcript, onClose }) {
  const [tab, setTab] = useState('transcript');
  const [downloading, setDownloading] = useState(false);

  if (!transcript) return null;

  const downloadSubtitle = async (format) => {
    setDownloading(true);
    try {
      // FIX 1: use safeGetToken() instead of direct localStorage access
      const res = await fetch(`/api/transcripts/${transcript.id}/subtitles?format=${format}`, {
        headers: { Authorization: `Bearer ${safeGetToken()}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${transcript.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Panel header */}
      <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="font-extrabold text-base leading-tight mb-2" style={{ color: '#1d2b4b' }}>
            {transcript.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={transcript.status} />
            {transcript.language && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                style={{ background: 'rgba(253,184,19,0.12)', color: '#1d2b4b' }}>
                {transcript.language}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose}
          className="flex-shrink-0 w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center"
          style={{ background: '#f1f5f9', color: '#64748b' }}>
          <i className="fas fa-times text-sm" />
        </button>
      </div>

      {/* Sub-tabs */}
      {transcript.status === 'done' && (
        <div className="flex gap-2 px-6 pt-4">
          {['transcript', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="text-sm font-bold px-4 py-2 rounded-xl border-none cursor-pointer capitalize transition-all"
              style={{
                background: tab === t ? '#1d2b4b' : '#f1f5f9',
                color:      tab === t ? 'white'   : '#64748b',
              }}>
              {t === 'transcript' ? 'Full Transcript' : 'AI Notes'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {transcript.status === 'done' ? (
          <>
            {tab === 'transcript' && (
              <div className="text-sm leading-relaxed" style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                {transcript.transcript_text || 'No transcript text available.'}
              </div>
            )}
            {tab === 'notes' && (
              <div className="prose prose-sm max-w-none" style={{ color: '#334155' }}>
                {transcript.notes
                  ? <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{transcript.notes}</div>
                  : <p style={{ color: '#94a3b8' }}>No AI notes generated yet.</p>
                }
              </div>
            )}
          </>
        ) : transcript.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
            <p className="text-sm font-semibold" style={{ color: '#64748b' }}>
              Groq Whisper is transcribing this speech…
            </p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>This may take a few minutes.</p>
          </div>
        ) : transcript.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-circle-exclamation text-3xl" style={{ color: '#dc2626' }} />
            <p className="text-sm font-semibold" style={{ color: '#64748b' }}>Transcription failed.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-clock text-3xl" style={{ color: '#94a3b8' }} />
            <p className="text-sm" style={{ color: '#64748b' }}>Queued for transcription.</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {transcript.status === 'done' && (
        <div className="p-6 border-t flex gap-3 flex-wrap" style={{ borderColor: '#e2e8f0' }}>
          <button onClick={() => downloadSubtitle('srt')} disabled={downloading}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border-none cursor-pointer transition-all"
            style={{ background: '#1d2b4b', color: 'white' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
            onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
            <i className="fas fa-download" /> SRT
          </button>
          <button onClick={() => downloadSubtitle('vtt')} disabled={downloading}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border-none cursor-pointer transition-all"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
            <i className="fas fa-download" /> VTT
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEECH CARD
// ─────────────────────────────────────────────────────────────────────────────
function SpeechCard({ transcript, active, onClick }) {
  return (
    <div onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer transition-all"
      style={{
        background:  active ? '#1d2b4b' : 'white',
        boxShadow:   active ? '0 8px 24px rgba(29,43,75,0.18)' : '0 2px 8px rgba(29,43,75,0.06)',
        border:      active ? 'none' : '1px solid rgba(0,0,0,0.04)',
        transform:   active ? 'scale(1.01)' : 'none',
      }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: active ? 'rgba(253,184,19,0.2)' : 'rgba(29,43,75,0.06)' }}>
          <i className="fas fa-microphone-lines text-sm" style={{ color: active ? '#fdb813' : '#1d2b4b' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-sm leading-snug truncate mb-1"
            style={{ color: active ? 'white' : '#1d2b4b' }}>
            {transcript.title}
          </h3>
          <StatusBadge status={transcript.status} />
          {transcript.created_at && (
            <p className="text-xs mt-1.5" style={{ color: active ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
              {new Date(transcript.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [file,    setFile]    = useState(null);
  const [title,   setTitle]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    if (!file || !title.trim()) { setError('Title and audio file are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('audio', file);
      fd.append('title', title);
      await transcriptApi.store(fd);
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,24,0.7)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-8"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-extrabold text-xl" style={{ color: '#1d2b4b' }}>Upload Speech Audio</h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center"
            style={{ background: '#f1f5f9', color: '#64748b' }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#64748b' }}>
              Speech Title *
            </label>
            <input
              type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Keynote Address — Dr. Santos"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ borderColor: '#e2e8f0', color: '#1d2b4b', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#3f51b5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#64748b' }}>
              Audio File * <span style={{ color: '#94a3b8', fontWeight: 400 }}>(mp3, wav, m4a, ogg, flac, webm — max 25MB)</span>
            </label>
            <label className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
              style={{ border: '2px dashed #e2e8f0', padding: '28px', background: file ? 'rgba(63,81,181,0.04)' : '#f8fafc' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.borderColor = file ? '#3f51b5' : '#e2e8f0'}>
              <i className={`fas ${file ? 'fa-file-audio' : 'fa-cloud-arrow-up'} text-3xl`}
                style={{ color: file ? '#3f51b5' : '#cbd5e1' }} />
              <span className="text-sm font-semibold" style={{ color: file ? '#3f51b5' : '#94a3b8' }}>
                {file ? file.name : 'Click or drag to upload'}
              </span>
              <input type="file" accept="audio/*" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {error && (
            <div className="text-sm font-semibold px-4 py-3 rounded-xl" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-bold text-white py-3 rounded-xl border-none cursor-pointer transition-all text-sm mt-2"
            style={{ background: loading ? '#94a3b8' : '#1d2b4b' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3f51b5'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1d2b4b'; }}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading & Queuing…</>
              : <><i className="fas fa-cloud-arrow-up" /> Upload & Transcribe</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GraduationSpeechesPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [showUpload,  setShowUpload]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [meta,        setMeta]        = useState(null);
  const debounceRef = useRef(null);

  const fetchTranscripts = (q = search, p = page) => {
    setLoading(true);
    transcriptApi.list({ q, page: p })
      .then(({ data }) => {
        setTranscripts(data.data ?? []);
        setMeta(data.meta ?? null);
      })
      .catch(() => setTranscripts([]))
      .finally(() => setLoading(false));
  };

  // Initial load
  useEffect(() => {
    fetchTranscripts('', 1);
    // FIX 2: clean up debounce timer on unmount
    return () => clearTimeout(debounceRef.current);
  }, []); // eslint-disable-line

  // FIX 3: drive pagination fetch from useEffect so page state is always fresh
  // (avoids stale closure when calling fetchTranscripts inline in button onClick)
  useEffect(() => {
    fetchTranscripts(search, page);
  }, [page]); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTranscripts(val, 1);
    }, 400);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchTranscripts(search, 1);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '70px 8% 110px', borderRadius: '0 0 60px 60px' }}>
        <Link to="/graduation"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm no-underline mb-6 transition">
          <i className="fas fa-arrow-left" /> Back to Graduation Hub
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Ceremonial Speeches</p>
            <h1 className="font-extrabold mb-3" style={{ fontSize: '2.5rem', letterSpacing: '-1.5px' }}>
              Speeches & <span style={{ color: '#fdb813' }}>Transcripts</span>
            </h1>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Listen to graduation speeches, read AI-generated transcripts, and search key moments — powered by Groq Whisper.
            </p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl border-none cursor-pointer transition-all"
            style={{ background: '#fdb813', color: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <i className="fas fa-cloud-arrow-up" /> Upload Speech
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div className="mx-auto px-5" style={{ maxWidth: '1100px', width: '100%', marginTop: '-32px' }}>
        <div className="bg-white rounded-2xl flex items-center gap-3 px-5"
          style={{ boxShadow: '0 18px 36px rgba(29,43,75,0.1)', height: '56px' }}>
          <i className="fas fa-search" style={{ color: '#94a3b8' }} />
          <input
            type="text" value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search speeches, transcripts, or notes…"
            className="flex-1 border-none outline-none text-sm bg-transparent"
            style={{ color: '#1d2b4b', fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => handleSearch('')}
              className="border-none bg-transparent cursor-pointer text-sm"
              style={{ color: '#94a3b8' }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 100px', width: '100%' }}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
          </div>
        ) : transcripts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl"
            style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.05)' }}>
            <i className="fas fa-microphone-slash text-6xl mb-5 block" style={{ color: '#e2e8f0' }} />
            <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>
              {search ? 'No speeches match your search.' : 'No speeches uploaded yet.'}
            </h3>
            {!search && (
              <button onClick={() => setShowUpload(true)}
                className="mt-4 inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer"
                style={{ background: '#1d2b4b', color: 'white' }}>
                <i className="fas fa-cloud-arrow-up" /> Upload First Speech
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
            {/* Left: speech list */}
            <div style={{ width: selected ? '340px' : '100%', flexShrink: 0, transition: 'width 0.3s ease' }}>
              <div className="flex flex-col gap-3">
                {transcripts.map(t => (
                  <SpeechCard key={t.id} transcript={t}
                    active={selected?.id === t.id}
                    onClick={() => setSelected(selected?.id === t.id ? null : t)}
                  />
                ))}
              </div>

              {/* FIX 3: pagination buttons only update `page`; useEffect handles the fetch */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center font-bold transition-all"
                    style={{ background: page === 1 ? '#f1f5f9' : '#1d2b4b', color: page === 1 ? '#94a3b8' : 'white' }}>
                    <i className="fas fa-chevron-left text-xs" />
                  </button>
                  <span className="text-sm font-bold" style={{ color: '#64748b' }}>
                    {page} / {meta.last_page}
                  </span>
                  <button
                    disabled={page === meta.last_page}
                    onClick={() => setPage(p => p + 1)}
                    className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center font-bold transition-all"
                    style={{ background: page === meta.last_page ? '#f1f5f9' : '#1d2b4b', color: page === meta.last_page ? '#94a3b8' : 'white' }}>
                    <i className="fas fa-chevron-right text-xs" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: transcript panel */}
            {selected && (
              <div className="flex-1 bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: '0 8px 32px rgba(29,43,75,0.08)', minHeight: '500px', position: 'sticky', top: '24px' }}>
                <TranscriptPanel transcript={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />
      )}

      <Footer />
    </div>
  );
}