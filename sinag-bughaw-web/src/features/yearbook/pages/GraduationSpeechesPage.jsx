import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { transcriptApi } from '@/api/yearbook.api';
import { galleryApi } from '@/api/gallery.api';
import { recordContentView } from '@/api/analytics.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    done:       { label: 'Transcribed',  cls: 'bg-green-100 text-green-700'  },
    processing: { label: 'Processing…',  cls: 'bg-yellow-100 text-yellow-700' },
    pending:    { label: 'Pending',      cls: 'bg-indigo-100 text-indigo-600' },
    failed:     { label: 'Failed',       cls: 'bg-red-100 text-red-600'       },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Transcript Panel ─────────────────────────────────────────────────────────
function TranscriptPanel({ transcript, onClose }) {
  const [tab,         setTab] = useState('transcript');
  const [downloading, setDl]  = useState(false);

  if (!transcript) return null;

  const downloadSubtitle = async (format) => {
    setDl(true);
    try {
      const res  = await fetch(`/api/transcripts/${transcript.id}/subtitles?format=${format}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${transcript.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setDl(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-slate-100">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="font-extrabold text-base leading-tight mb-2 text-[#1d2b4b]">
            {transcript.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={transcript.status} />
            {transcript.language && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-[#fdb813]/10 text-[#1d2b4b]">
                {transcript.language}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200
                     border-none cursor-pointer flex items-center justify-center text-slate-500 transition-colors"
        >
          <i className="fas fa-times text-sm" />
        </button>
      </div>

      {/* Tabs */}
      {transcript.status === 'done' && (
        <div className="flex gap-2 px-6 pt-4">
          {['transcript', 'notes'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm font-bold px-4 py-2 rounded-xl border-none cursor-pointer capitalize transition-colors
                          ${tab === t
                            ? 'bg-[#1d2b4b] text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t === 'transcript' ? 'Full Transcript' : 'AI Notes'}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {transcript.status === 'done' ? (
          <>
            {tab === 'transcript' && (
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {transcript.transcript_text || 'No transcript text available.'}
              </div>
            )}
            {tab === 'notes' && (
              transcript.notes
                ? <div className="text-sm leading-[1.8] text-slate-700 whitespace-pre-wrap">{transcript.notes}</div>
                : <p className="text-slate-400">No AI notes generated yet.</p>
            )}
          </>
        ) : transcript.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-600" />
            <p className="text-sm font-semibold text-slate-500">Groq Whisper is transcribing this speech…</p>
            <p className="text-xs text-slate-400">This may take a few minutes.</p>
          </div>
        ) : transcript.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-circle-exclamation text-3xl text-red-500" />
            <p className="text-sm font-semibold text-slate-500">Transcription failed.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <i className="fas fa-clock text-3xl text-slate-300" />
            <p className="text-sm text-slate-500">Queued for transcription.</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {transcript.status === 'done' && (
        <div className="p-6 border-t border-slate-100 flex gap-3 flex-wrap">
          <button
            onClick={() => downloadSubtitle('srt')} disabled={downloading}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl
                       border-none cursor-pointer bg-[#1d2b4b] text-white
                       hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-download" /> SRT
          </button>
          <button
            onClick={() => downloadSubtitle('vtt')} disabled={downloading}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl
                       border-none cursor-pointer bg-[#fdb813]/20 text-[#1d2b4b]
                       hover:bg-[#fdb813]/35 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-download" /> VTT
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Speech Card ──────────────────────────────────────────────────────────────
function SpeechCard({ transcript, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border
                  ${active
                    ? 'bg-[#1d2b4b] border-transparent shadow-lg scale-[1.01]'
                    : 'bg-white border-black/[0.04] shadow-sm hover:shadow-md'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                         ${active ? 'bg-[#fdb813]/20' : 'bg-[#1d2b4b]/[0.06]'}`}>
          <i className={`fas fa-microphone-lines text-sm ${active ? 'text-[#fdb813]' : 'text-[#1d2b4b]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-extrabold text-sm leading-snug truncate mb-1
                          ${active ? 'text-white' : 'text-[#1d2b4b]'}`}>
            {transcript.title}
          </h3>
          <StatusBadge status={transcript.status} />
          {transcript.created_at && (
            <p className={`text-xs mt-1.5 ${active ? 'text-white/50' : 'text-slate-400'}`}>
              {new Date(transcript.created_at).toLocaleDateString('en-PH', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GraduationSpeechesPage() {
  const navigate = useNavigate();

  const [transcripts,   setTranscripts]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [meta,          setMeta]          = useState(null);
  const [faceSearching, setFaceSearching] = useState(false);

  const debounceRef = useRef(null);

  const fetchTranscripts = (q = search, p = page) => {
    setLoading(true);
    transcriptApi.list({ q, page: p })
      .then(({ data }) => { setTranscripts(data.data ?? []); setMeta(data.meta ?? null); })
      .catch(() => setTranscripts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTranscripts('', 1);
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => { fetchTranscripts(search, page); }, [page]);

  useEffect(() => {
    if (!selected?.id) return;

    recordContentView({
      content_type: 'graduation_speech',
      content_id: selected.id,
      title: selected.title,
      category: selected.status ?? 'speech',
      url: '/graduation/speeches',
    }).catch(() => {});
  }, [selected]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchTranscripts(val, 1); }, 400);
  };

  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    try {
      const fd = new FormData();
      fd.append('face_image', file);
      const { data } = await galleryApi.faceSearch(fd);
      const found = data.photos ?? [];
      if (!found.length) alert('No matching photos found.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed.');
    } finally {
      setFaceSearching(false);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate('/gallery', { state: { tab: 'graduation:videos' } });
  };

  const PageBtn = ({ disabled, onClick, icon }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center
                  font-bold transition-colors
                  ${disabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1d2b4b] text-white hover:bg-indigo-700'}`}
    >
      <i className={`fas ${icon} text-xs`} />
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-[70px] pb-[110px] rounded-b-[60px] text-white">

        {/* ✅ Back to Gallery — was /graduation */}
        <a
          href="/gallery"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white
                     text-sm no-underline mb-6 transition-colors cursor-pointer"
        >
          <i className="fas fa-arrow-left" /> Back to Gallery
        </a>

        <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
          Ceremonial Speeches
        </p>
        <h1 className="text-[2.5rem] font-extrabold tracking-tight mb-3 leading-tight">
          Speeches &amp; <span className="text-[#fdb813]">Transcripts</span>
        </h1>
        <p className="text-white/60 text-sm max-w-md leading-relaxed">
          Listen to graduation speeches, read AI-generated transcripts, and search key moments — powered by Groq Whisper.
        </p>
      </header>

      {/* ── Floating search bar ── */}
      <div className="max-w-[1100px] mx-auto px-5 w-full -mt-8">
        <div className="bg-white rounded-2xl flex items-center gap-3 px-5 shadow-xl shadow-[#1d2b4b]/10 h-14">
          <i className="fas fa-search flex-shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search speeches, transcripts, or notes…"
            className="flex-1 border-none outline-none text-sm bg-transparent text-[#1d2b4b]"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              <i className="fas fa-times text-sm" />
            </button>
          )}
          <div className="flex-shrink-0 w-px h-6 bg-slate-200" />
          <div className="flex-shrink-0 relative w-9 h-9">
            <FaceSearchButton
              onFile={handleFaceFile}
              loading={faceSearching}
              className="relative right-auto top-auto translate-y-0"
            />
          </div>
        </div>

      </div>

      {/* ── Main layout ── */}
      <main className="max-w-[1100px] mx-auto px-5 pt-8 pb-24 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-600" />
          </div>
        ) : transcripts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
            <i className="fas fa-microphone-slash text-6xl text-slate-200 mb-5 block" />
            <h3 className="font-extrabold text-lg text-[#1d2b4b] mb-2">
              {search ? 'No speeches match your search.' : 'No speeches available yet.'}
            </h3>
          </div>
        ) : (
          <div className={`flex gap-6 items-start`}>
            {/* Speech list */}
            <div
              className="flex-shrink-0 transition-all duration-300"
              style={{ width: selected ? '340px' : '100%' }}
            >
              <div className="flex flex-col gap-3">
                {transcripts.map(t => (
                  <SpeechCard
                    key={t.id}
                    transcript={t}
                    active={selected?.id === t.id}
                    onClick={() => setSelected(selected?.id === t.id ? null : t)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <PageBtn disabled={page === 1}             onClick={() => setPage(p => p - 1)} icon="fa-chevron-left"  />
                  <span className="text-sm font-bold text-slate-500">{page} / {meta.last_page}</span>
                  <PageBtn disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)} icon="fa-chevron-right" />
                </div>
              )}
            </div>

            {/* Transcript panel */}
            {selected && (
              <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-lg shadow-[#1d2b4b]/[0.08] min-h-[500px] sticky top-6">
                <TranscriptPanel transcript={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
