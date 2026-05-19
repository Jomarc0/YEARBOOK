import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function GalleryPage() {
  const [albums,    setAlbums]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [matches,   setMatches]   = useState([]);
  const [faceFile,  setFaceFile]  = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    galleryApi.list()
      .then(({ data }) => setAlbums(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleFaceSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFaceFile(file.name);
    setSearching(true);
    setMatches([]);
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await galleryApi.faceSearch(formData);
      setMatches(data.matches ?? []);
    } catch {
      alert('Face search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes scan      { 0%{top:0%} 50%{top:100%} 100%{top:0%} }
        .album-card { transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
        .album-card:hover { transform: translateY(-12px); box-shadow: 0 25px 50px rgba(29,43,75,0.12) !important; }
        .album-card:hover .scan-line { opacity: 1 !important; }
      `}</style>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-sm mb-2" style={{ opacity: 0.6, letterSpacing: '3px', textTransform: 'uppercase' }}>National University Lipa</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          The <span style={{ color: 'var(--nu-yellow)' }}>Visual Archive</span>
        </h1>
        <p className="font-light mx-auto" style={{ opacity: 0.8, fontSize: '1rem', maxWidth: '600px' }}>
          Relive the milestones and pioneer memories through our AI-powered digital gallery.
        </p>
      </header>

      {/* Face Search Panel */}
      <div className="mx-auto px-5 z-10" style={{ maxWidth: '1000px', width: '100%', marginTop: '-45px' }}>
        <div className="bg-white" style={{ borderRadius: '24px', boxShadow: '0 18px 40px rgba(29,43,75,0.08)', padding: '28px' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#ecfdf5', color: '#059669' }}>
              <i className="fas fa-user-check text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--nu-blue)' }}>Identify a Student by Face</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Upload a clear portrait — AI will match it against student profile photos</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <input readOnly value={faceFile ?? ''} placeholder="Click button to select a face image..."
              className="flex-1 outline-none cursor-pointer"
              style={{ minWidth: '240px', padding: '13px 16px', border: '1px solid #dbe3f0', borderRadius: '14px', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}
              onClick={() => fileRef.current.click()} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFaceSearch} />
            <button onClick={() => fileRef.current.click()} disabled={searching}
              className="font-bold border-none cursor-pointer flex items-center gap-2 transition-all"
              style={{ background: searching ? '#94a3b8' : 'var(--nu-blue)', color: 'white', borderRadius: '14px', padding: '13px 20px', fontSize: '0.85rem', cursor: searching ? 'not-allowed' : 'pointer' }}>
              {searching
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Searching...</>
                : <><i className="fas fa-user-check" /> Search Face</>}
            </button>
          </div>

          {/* Matches */}
          {matches.length > 0 && (
            <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {matches.map(m => (
                <Link key={m.user_id} to={`/profile/${m.user_id}`}
                  className="no-underline flex items-center gap-3 transition-all"
                  style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', background: '#f8fafc' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nu-blue-bright)'; e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1d2b4b&color=fff`}
                    className="rounded-xl object-cover flex-shrink-0"
                    style={{ width: '48px', height: '48px', border: '2px solid var(--nu-yellow)' }} />
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--nu-blue)' }}>{m.name}</h4>
                    <p className="text-xs" style={{ color: '#64748b' }}>{m.similarity}% match</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Albums Grid */}
      <section style={{ padding: '50px 8% 100px' }}>
        <h2 className="font-bold text-xl mb-8" style={{ color: 'var(--nu-blue)' }}>
          <i className="fas fa-images mr-2" style={{ color: 'var(--nu-yellow)' }} />Photo Albums
        </h2>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 rounded-full border-4 mx-auto mb-4"
              style={{ borderColor: 'rgba(63,81,181,0.2)', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8' }}>Loading albums...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 bg-white" style={{ borderRadius: '24px' }}>
            <i className="fas fa-images text-6xl mb-5 block" style={{ color: 'rgba(29,43,75,0.06)' }} />
            <h3 className="font-extrabold text-xl" style={{ color: 'var(--nu-blue)' }}>No Albums Yet</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
            {albums.map((album, i) => (
              <Link key={album.id} to={`/gallery/${album.id}`}
                className="album-card no-underline block bg-white overflow-hidden"
                style={{ borderRadius: '28px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 8px 25px rgba(0,0,0,0.04)', color: 'inherit', animationDelay: `${i * 0.05}s` }}>

                {/* Thumb */}
                <div className="relative overflow-hidden" style={{ height: '240px', background: 'linear-gradient(135deg, #e8edf5, #dbe3f0)' }}>
                  {/* Scanner animation line */}
                  <div className="scan-line absolute left-0 w-full opacity-0 transition-all"
                    style={{ height: '3px', background: 'var(--nu-yellow)', boxShadow: '0 0 12px var(--nu-yellow)', animation: 'scan 2.5s infinite linear', zIndex: 5 }} />

                  <div className="w-full h-full flex items-center justify-center text-5xl">📷</div>

                  <div className="absolute top-4 right-4 flex items-center gap-1 font-extrabold text-xs"
                    style={{ background: 'rgba(255,255,255,0.95)', padding: '6px 14px', borderRadius: '12px', color: 'var(--nu-blue)' }}>
                    <i className="fas fa-images" /> {album.photos_count ?? 0} photos
                  </div>
                </div>

                <div style={{ padding: '22px' }}>
                  <h4 className="font-extrabold mb-2" style={{ fontSize: '1.1rem', color: 'var(--nu-blue)' }}>{album.title}</h4>
                  <p className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                    <i className="fas fa-calendar" style={{ color: 'var(--nu-yellow)' }} />
                    {album.event_date ?? 'No date'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}