import { useEffect, useRef, useState } from 'react';
import { voiceNotesApi } from '@/api/messaging.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function VoiceNotesPage() {
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title,     setTitle]     = useState('');
  const [playing,   setPlaying]   = useState(null);
  const fileRef  = useRef();
  const audioRef = useRef({});

  const load = () => {
    voiceNotesApi.list()
      .then(({ data }) => setNotes(data))
      .finally(()      => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!title) { alert('Please enter a title first.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      await voiceNotesApi.upload(formData);
      setTitle('');
      load();
    } catch { alert('Upload failed. Make sure Cloudinary is configured.'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this voice memory?')) return;
    await voiceNotesApi.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePlay = (id, url) => {
    if (playing === id) {
      audioRef.current[id]?.pause();
      setPlaying(null);
    } else {
      Object.values(audioRef.current).forEach(a => a?.pause());
      setPlaying(id);
      if (!audioRef.current[id]) {
        audioRef.current[id] = new Audio(url);
        audioRef.current[id].onended = () => setPlaying(null);
      }
      audioRef.current[id].play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Memories</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Voice <span style={{ color: '#fdb813' }}>Memories</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Record and preserve audio memories from your university journey.
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px 100px', width: '100%' }}>

        {/* Upload Panel */}
        <div className="bg-white mb-10"
          style={{ borderRadius: '24px', boxShadow: '0 18px 36px rgba(29,43,75,0.08)', padding: '35px' }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(253,184,19,0.1)' }}>
              <i className="fas fa-microphone text-xl" style={{ color: '#fdb813' }} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg" style={{ color: '#1d2b4b' }}>Upload Voice Memory</h2>
              <p className="text-xs" style={{ color: '#94a3b8' }}>MP3, WAV, M4A, OGG, WebM — Max 20MB</p>
            </div>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Memory title (e.g. Graduation Day Speech)"
            className="w-full outline-none text-sm mb-4"
            style={{ padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: '14px', fontFamily: 'inherit', transition: '0.3s' }}
            onFocus={e => e.target.style.borderColor = '#3f51b5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />

          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm" hidden onChange={handleUpload} />
          <button onClick={() => fileRef.current.click()} disabled={uploading || !title}
            className="font-bold text-white border-none cursor-pointer flex items-center gap-2 transition-all"
            style={{
              padding: '14px 28px', borderRadius: '14px', fontSize: '0.9rem',
              background: uploading || !title ? '#94a3b8' : '#1d2b4b',
            }}
            onMouseEnter={e => { if (!uploading && title) e.currentTarget.style.background = '#3f51b5'; }}
            onMouseLeave={e => { if (!uploading && title) e.currentTarget.style.background = '#1d2b4b'; }}>
            {uploading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading...</>
              : <><i className="fas fa-cloud-upload-alt" style={{ color: '#fdb813' }} /> Upload Audio File</>}
          </button>
        </div>

        {/* Notes List */}
        <h2 className="font-extrabold text-xl mb-6" style={{ color: '#1d2b4b' }}>
          <i className="fas fa-music mr-2" style={{ color: '#fdb813' }} />My Voice Memories
        </h2>

        {loading ? (
          <div className="flex flex-col items-center py-20" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center bg-white py-20 px-8"
            style={{ borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-microphone-slash text-6xl mb-4 block opacity-10" style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>No Voice Memories Yet</h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Upload your first audio memory above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notes.map(note => (
              <div key={note.id} className="bg-white flex items-center gap-5 transition-all"
                style={{ borderRadius: '20px', padding: '20px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(29,43,75,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'; }}>

                {/* Play button */}
                <button onClick={() => togglePlay(note.id, note.audio_url)}
                  className="flex-shrink-0 flex items-center justify-center border-none cursor-pointer transition-all"
                  style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: playing === note.id ? '#fdb813' : '#1d2b4b',
                    color: playing === note.id ? '#1d2b4b' : '#fdb813',
                    fontSize: '1.1rem',
                  }}>
                  <i className={`fas fa-${playing === note.id ? 'pause' : 'play'}`} />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold truncate" style={{ color: '#1d2b4b', fontSize: '1rem' }}>{note.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                    <i className="fas fa-calendar mr-1" />
                    {new Date(note.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  {/* Fake waveform */}
                  <div className="flex items-center gap-0.5 mt-2">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="rounded-full flex-shrink-0"
                        style={{
                          width: '3px',
                          height: `${8 + Math.sin(i * 0.8) * 6}px`,
                          background: playing === note.id ? '#fdb813' : '#e2e8f0',
                          transition: '0.3s'
                        }} />
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <button onClick={() => handleDelete(note.id)}
                  className="flex-shrink-0 border-none cursor-pointer transition-all flex items-center justify-center"
                  style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', color: '#ef4444' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                  <i className="fas fa-trash text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}