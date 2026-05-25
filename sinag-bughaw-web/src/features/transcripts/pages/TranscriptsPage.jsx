import { useEffect, useRef, useState } from 'react';
import { transcriptsApi } from '@/api/yearbook.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [title,       setTitle]       = useState('');
  const fileRef = useRef();

  const load = () => {
    transcriptsApi.list()
      .then(({ data }) => setTranscripts(data.data ?? []))
      .finally(()      => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !title) { alert('Please enter a title first.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      await transcriptsApi.upload(formData);
      setTitle('');
      load();
    } catch { alert('Upload failed.'); }
    finally { setUploading(false); }
  };

  const statusStyle = (status) => {
    const map = {
      done:       { background: '#ecfdf5', color: '#059669' },
      processing: { background: '#fefce8', color: '#ca8a04' },
      failed:     { background: '#fef2f2', color: '#dc2626' },
      pending:    { background: '#f1f5f9', color: '#64748b' },
    };
    return map[status] || map.pending;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">AI-Powered</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Speech <span style={{ color: '#fdb813' }}>Transcripts</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Upload graduation speeches and let AI transcribe them into searchable text.
        </p>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px 100px', width: '100%' }}>

        {/* Upload Panel */}
        <div className="bg-white mb-10"
          style={{ borderRadius: '24px', boxShadow: '0 18px 36px rgba(29,43,75,0.08)', padding: '35px' }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(253,184,19,0.1)' }}>
              <i className="fas fa-microphone text-xl" style={{ color: '#fdb813' }} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg" style={{ color: '#1d2b4b' }}>Upload Speech Audio</h2>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Supported: MP3, WAV, M4A, OGG — Max 50MB</p>
            </div>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Speech title (e.g. Graduation Speech 2026)"
            className="w-full outline-none text-sm mb-4"
            style={{ padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: '14px', fontFamily: 'inherit', transition: '0.3s' }}
            onFocus={e => e.target.style.borderColor = '#3f51b5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />

          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg" hidden onChange={handleUpload} />

          <button onClick={() => fileRef.current.click()} disabled={uploading || !title}
            className="font-bold text-white border-none cursor-pointer flex items-center gap-2 transition-all"
            style={{
              padding: '14px 28px', borderRadius: '14px', fontSize: '0.9rem',
              background: uploading || !title ? '#94a3b8' : '#1d2b4b',
              cursor: uploading || !title ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={e => { if (!uploading && title) e.currentTarget.style.background = '#3f51b5'; }}
            onMouseLeave={e => { if (!uploading && title) e.currentTarget.style.background = '#1d2b4b'; }}>
            {uploading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading...</>
              : <><i className="fas fa-cloud-upload-alt" style={{ color: '#fdb813' }} /> Choose Audio File</>}
          </button>
        </div>

        {/* Transcript List */}
        <h2 className="font-extrabold text-xl mb-6" style={{ color: '#1d2b4b' }}>
          <i className="fas fa-file-alt mr-2" style={{ color: '#fdb813' }} />Speech Archive
        </h2>

        {loading ? (
          <div className="flex flex-col items-center py-20" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
            <p className="text-sm">Loading transcripts...</p>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="text-center bg-white py-20 px-8"
            style={{ borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-microphone-slash text-6xl mb-4 block opacity-10" style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>No Transcripts Yet</h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Upload a speech audio file to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {transcripts.map(t => (
              <div key={t.id} className="bg-white transition-all"
                style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 15px 35px rgba(29,43,75,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#eef2ff' }}>
                      <i className="fas fa-microphone" style={{ color: '#3f51b5' }} />
                    </div>
                    <h3 className="font-extrabold" style={{ color: '#1d2b4b', fontSize: '1.05rem' }}>{t.title}</h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 flex items-center gap-1"
                    style={statusStyle(t.status)}>
                    {t.status === 'processing' && <i className="fas fa-spinner fa-spin text-xs" />}
                    {t.status === 'done' && <i className="fas fa-check text-xs" />}
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </div>

                {t.language && (
                  <p className="text-xs mb-3 flex items-center gap-1" style={{ color: '#94a3b8' }}>
                    <i className="fas fa-globe" /> Language: {t.language.toUpperCase()}
                  </p>
                )}

                {t.transcript_text && (
                  <div className="text-sm leading-relaxed rounded-xl p-4" style={{ background: '#f8fafc', color: '#475569', borderLeft: '4px solid #fdb813' }}>
                    {t.transcript_text}
                  </div>
                )}

                {t.status === 'processing' && (
                  <div className="text-xs mt-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
                    <i className="fas fa-robot" style={{ color: '#3f51b5' }} />
                    Whisper AI is transcribing your audio...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}