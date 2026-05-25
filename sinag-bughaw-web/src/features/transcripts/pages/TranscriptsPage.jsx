import { useEffect, useRef, useState } from 'react';
import { transcriptsApi } from '@/api/yearbook.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ── API helpers (add these to your yearbook.api.js) ──────────────────────────
// transcriptsApi.list(params)              → GET /api/transcripts
// transcriptsApi.upload(formData)          → POST /api/transcripts
// transcriptsApi.show(id)                  → GET /api/transcripts/{id}
// transcriptsApi.delete(id)               → DELETE /api/transcripts/{id}
// transcriptsApi.subtitles(id, format)    → GET /api/transcripts/{id}/subtitles
// transcriptsApi.regenerateNotes(id)      → POST /api/transcripts/{id}/notes

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  done:       { background: '#ecfdf5', color: '#059669' },
  processing: { background: '#fefce8', color: '#ca8a04' },
  failed:     { background: '#fef2f2', color: '#dc2626' },
  pending:    { background: '#f1f5f9', color: '#64748b' },
};

const STATUS_ICON = {
  done:       'fa-check',
  processing: 'fa-spinner fa-spin',
  failed:     'fa-times',
  pending:    'fa-clock',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TranscriptCard({ t, onDelete, onRefreshNotes, onSubtitleDownload }) {
  const [expanded,      setExpanded]      = useState(false);
  const [notesOpen,     setNotesOpen]     = useState(false);
  const [regenLoading,  setRegenLoading]  = useState(false);

  const handleRegenNotes = async () => {
    setRegenLoading(true);
    try {
      const { data } = await transcriptsApi.regenerateNotes(t.id);
      onRefreshNotes(t.id, data.notes);
    } catch { alert('Failed to regenerate notes.'); }
    finally { setRegenLoading(false); }
  };

  const isDone    = t.status === 'done';
  const statusS   = STATUS_STYLE[t.status] ?? STATUS_STYLE.pending;
  const statusI   = STATUS_ICON[t.status]  ?? 'fa-clock';

  return (
    <div className="bg-white transition-all"
      style={{ borderRadius: 20, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 40px rgba(29,43,75,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#eef2ff' }}>
            <i className="fas fa-microphone" style={{ color: '#3f51b5' }} />
          </div>
          <div>
            <h3 className="font-extrabold m-0" style={{ color: '#1d2b4b', fontSize: '1rem' }}>{t.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {t.language && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <i className="fas fa-globe mr-1" />{t.language.toUpperCase()}
                </span>
              )}
              {t.duration_formatted && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <i className="fas fa-clock mr-1" />{t.duration_formatted}
                </span>
              )}
              {t.word_count > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <i className="fas fa-align-left mr-1" />{t.word_count.toLocaleString()} words
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 flex items-center gap-1"
          style={statusS}>
          <i className={`fas ${statusI} text-xs`} />
          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
        </span>
      </div>

      {/* ── Transcript text preview ── */}
      {isDone && t.transcript_text && (
        <div className="mb-4">
          <div className="text-sm leading-relaxed rounded-xl p-4"
            style={{ background: '#f8fafc', color: '#475569', borderLeft: '4px solid #fdb813' }}>
            {expanded
              ? t.transcript_text
              : t.transcript_text.slice(0, 300) + (t.transcript_text.length > 300 ? '…' : '')}
          </div>
          {t.transcript_text.length > 300 && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f51b5', fontSize: '0.8rem', fontWeight: 700, marginTop: 6, padding: 0 }}>
              {expanded ? '↑ Show less' : '↓ Read full transcript'}
            </button>
          )}
        </div>
      )}

      {/* ── Processing state ── */}
      {t.status === 'processing' && (
        <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: '#94a3b8' }}>
          <i className="fas fa-robot" style={{ color: '#3f51b5' }} />
          Groq AI is transcribing your audio…
        </div>
      )}

      {/* ── Speech Notes ── */}
      {isDone && (
        <div className="mb-4">
          <button onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-2 font-bold text-sm border-none cursor-pointer"
            style={{ background: 'none', color: '#1d2b4b', padding: 0 }}>
            <i className={`fas fa-chevron-${notesOpen ? 'up' : 'down'} text-xs`} style={{ color: '#fdb813' }} />
            Speech Notes
            {t.has_notes && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(253,184,19,0.15)', color: '#92660a' }}>AI</span>
            )}
          </button>

          {notesOpen && (
            <div className="mt-3 rounded-xl p-4"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {t.notes ? (
                <div className="text-sm leading-relaxed" style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>
                  {t.notes}
                </div>
              ) : (
                <p className="text-sm m-0" style={{ color: '#94a3b8' }}>
                  No speech notes yet.
                </p>
              )}
              <button onClick={handleRegenNotes} disabled={regenLoading}
                className="flex items-center gap-2 font-bold text-xs mt-3 border-none cursor-pointer px-3 py-2 rounded-xl"
                style={{ background: '#1d2b4b', color: '#fdb813', opacity: regenLoading ? 0.6 : 1 }}>
                <i className={`fas ${regenLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} />
                {regenLoading ? 'Generating…' : t.notes ? 'Regenerate Notes' : 'Generate Notes'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      {isDone && (
        <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          {/* Subtitle downloads */}
          <button
            onClick={() => onSubtitleDownload(t.id, 'srt')}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            <i className="fas fa-download" style={{ color: '#fdb813' }} /> SRT
          </button>
          <button
            onClick={() => onSubtitleDownload(t.id, 'vtt')}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            <i className="fas fa-download" style={{ color: '#fdb813' }} /> VTT
          </button>

          {/* Copy transcript */}
          <button
            onClick={() => { navigator.clipboard.writeText(t.transcript_text); }}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            <i className="fas fa-copy" /> Copy Text
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(t.id)}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer ml-auto"
            style={{ background: '#fef2f2', color: '#dc2626' }}>
            <i className="fas fa-trash" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [title,       setTitle]       = useState('');
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const fileRef   = useRef();
  const searchRef = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────

  const load = (q = search) => {
    setLoading(true);
    transcriptsApi.list({ q: q || undefined })
      .then(({ data }) => setTranscripts(data.data ?? []))
      .catch(() => setTranscripts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setSearch(searchInput);
      load(searchInput);
    }, 400);
    return () => clearTimeout(searchRef.current);
  }, [searchInput]);

  // Auto-refresh processing transcripts every 5s
  useEffect(() => {
    const hasProcessing = transcripts.some(t => t.status === 'pending' || t.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => load(), 5000);
    return () => clearInterval(interval);
  }, [transcripts]);

  // ── Upload ──────────────────────────────────────────────────────────────

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !title.trim()) {
      alert('Please enter a speech title first.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title.trim());
      await transcriptsApi.upload(formData);
      setTitle('');
      load();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Upload failed. Check file size (max 25 MB).';
      alert(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (! confirm('Delete this transcript and its audio file?')) return;
    try {
      await transcriptsApi.delete(id);
      setTranscripts(prev => prev.filter(t => t.id !== id));
    } catch { alert('Delete failed.'); }
  };

  // ── Refresh notes ───────────────────────────────────────────────────────

  const handleRefreshNotes = (id, notes) => {
    setTranscripts(prev => prev.map(t => t.id === id ? { ...t, notes, has_notes: !!notes } : t));
  };

  // ── Subtitle download ───────────────────────────────────────────────────

  const handleSubtitleDownload = async (id, format) => {
    try {
      const response = await transcriptsApi.subtitles(id, format);
      const blob     = new Blob([response.data], {
        type: format === 'vtt' ? 'text/vtt' : 'application/x-subrip',
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `transcript-${id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert(`Failed to download ${format.toUpperCase()} subtitles.`); }
  };

  // ── Stats ───────────────────────────────────────────────────────────────

  const doneCount       = transcripts.filter(t => t.status === 'done').length;
  const processingCount = transcripts.filter(t => ['pending', 'processing'].includes(t.status)).length;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">AI-Powered · Groq Whisper</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Speech <span style={{ color: '#fdb813' }}>Transcripts</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Upload graduation speeches. Groq AI transcribes them into searchable text, subtitles, and structured speech notes.
        </p>

        {/* Stats */}
        {(doneCount > 0 || processingCount > 0) && (
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            {doneCount > 0 && (
              <span className="flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-full"
                style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', color: '#6ee7b7' }}>
                <i className="fas fa-check-circle" /> {doneCount} transcript{doneCount > 1 ? 's' : ''} ready
              </span>
            )}
            {processingCount > 0 && (
              <span className="flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-full"
                style={{ background: 'rgba(253,184,19,0.15)', border: '1px solid rgba(253,184,19,0.35)', color: '#fdb813' }}>
                <i className="fas fa-spinner fa-spin" /> {processingCount} processing…
              </span>
            )}
          </div>
        )}
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px 100px', width: '100%' }}>

        {/* ── Upload Panel ── */}
        <div className="bg-white mb-8"
          style={{ borderRadius: 24, boxShadow: '0 18px 36px rgba(29,43,75,0.08)', padding: 32 }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(253,184,19,0.1)' }}>
              <i className="fas fa-microphone text-xl" style={{ color: '#fdb813' }} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>Upload Speech Audio</h2>
              <p className="text-xs m-0 mt-1" style={{ color: '#94a3b8' }}>
                MP3, WAV, M4A, OGG, FLAC, WebM · Max 25 MB · Powered by Groq Whisper
              </p>
            </div>
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Speech title  (e.g. Graduation Speech 2026 — Vilma Santos)"
            className="w-full outline-none text-sm mb-4"
            style={{ padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: 14, fontFamily: 'inherit', transition: '0.3s', color: '#1d2b4b' }}
            onFocus={e => e.target.style.borderColor = '#3f51b5'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />

          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.flac,.webm,.mp4" hidden onChange={handleUpload} />

          <button onClick={() => title.trim() ? fileRef.current.click() : alert('Enter a title first.')}
            disabled={uploading}
            className="font-bold text-white border-none cursor-pointer flex items-center gap-2"
            style={{ padding: '14px 28px', borderRadius: 14, fontSize: '0.9rem', background: uploading ? '#94a3b8' : '#1d2b4b', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = '#3f51b5'; }}
            onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = '#1d2b4b'; }}>
            {uploading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading…</>
              : <><i className="fas fa-cloud-upload-alt" style={{ color: '#fdb813' }} /> Choose Audio File</>}
          </button>

          {/* Feature list */}
          <div className="flex flex-wrap gap-3 mt-5 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
            {[
              { icon: 'fa-file-alt',            label: 'Transcript' },
              { icon: 'fa-closed-captioning',   label: 'Subtitles (SRT/VTT)' },
              { icon: 'fa-wand-magic-sparkles',  label: 'Speech Notes' },
              { icon: 'fa-search',               label: 'Searchable' },
            ].map(f => (
              <span key={f.label} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(63,81,181,0.07)', color: '#3f51b5' }}>
                <i className={`fas ${f.icon}`} style={{ color: '#fdb813' }} />{f.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="relative mb-6">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: '#94a3b8', fontSize: '0.85rem', zIndex: 1 }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search transcripts, speeches, notes…"
            className="w-full outline-none font-semibold text-sm"
            style={{ padding: '14px 18px 14px 40px', borderRadius: 14, border: '2px solid #e2e8f0', background: 'white', fontFamily: 'inherit', color: '#1d2b4b', transition: '0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
            onFocus={e => e.target.style.borderColor = '#3f51b5'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); load(''); }}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem' }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {/* ── Transcript list ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-xl m-0" style={{ color: '#1d2b4b' }}>
            <i className="fas fa-file-alt mr-2" style={{ color: '#fdb813' }} />
            {search ? `Results for "${search}"` : 'Speech Archive'}
          </h2>
          {!loading && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: '#f1f5f9', color: '#64748b' }}>
              {transcripts.length} speech{transcripts.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
            <p className="text-sm">Loading transcripts…</p>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="text-center bg-white py-20 px-8"
            style={{ borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-microphone-slash text-6xl mb-4 block opacity-10" style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>
              {search ? 'No speeches match your search.' : 'No Transcripts Yet'}
            </h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              {search ? 'Try a different keyword.' : 'Upload a graduation speech audio file to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {transcripts.map(t => (
              <TranscriptCard
                key={t.id}
                t={t}
                onDelete={handleDelete}
                onRefreshNotes={handleRefreshNotes}
                onSubtitleDownload={handleSubtitleDownload}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}