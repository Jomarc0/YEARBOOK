import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const photo = photos[current];

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowRight' && current < photos.length - 1) setCurrent(c => c + 1);
      if (e.key === 'ArrowLeft'  && current > 0)                 setCurrent(c => c - 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
    // FIX Bug 6: Added `onClose` to dependencies to ensure fresh closure
  }, [current, photos.length, onClose]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(8,12,24,0.97)' }}
      onClick={onClose}>
      <div className="relative flex flex-col items-center px-4"
        style={{ maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}>
        <img src={photo.file_path} alt={photo.caption || 'Photo'}
          className="rounded-2xl shadow-2xl"
          style={{ maxWidth: '88vw', maxHeight: '80vh', objectFit: 'contain' }} />
        {photo.caption && (
          <p className="text-white/60 text-sm font-semibold mt-4 text-center">{photo.caption}</p>
        )}
        <p className="text-white/25 text-xs font-bold mt-2">{current + 1} / {photos.length}</p>
      </div>

      {/* Close */}
      <button onClick={onClose}
        className="absolute top-5 right-5 border-none cursor-pointer flex items-center justify-center w-11 h-11 rounded-full transition-all"
        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
        <i className="fas fa-times" />
      </button>

      {/* Prev */}
      {current > 0 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 border-none cursor-pointer flex items-center justify-center w-11 h-11 rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <i className="fas fa-chevron-left" />
        </button>
      )}

      {/* Next */}
      {current < photos.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 border-none cursor-pointer flex items-center justify-center w-11 h-11 rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <i className="fas fa-chevron-right" />
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GraduationArchivePage() {
  const { id } = useParams();
  const [album,    setAlbum]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null); // index

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    graduationApi.show(id)
      // FIX Bug 5: Unwrap the nested data. API returns { success: true, data: album }, so data.data is the album.
      .then(({ data }) => setAlbum(data.data ?? data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
      </div>
      <Footer />
    </div>
  );

  if (!album) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <i className="fas fa-graduation-cap text-5xl" style={{ color: '#e2e8f0' }} />
        <h2 className="text-xl font-black" style={{ color: '#1d2b4b' }}>Album not found.</h2>
        <Link to="/graduation" className="font-semibold no-underline hover:underline" style={{ color: '#3f51b5' }}>
          ← Back to Graduation
        </Link>
      </div>
      <Footer />
    </div>
  );

  const photos = album.photos ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Header */}
      <header className="text-white"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '70px 8% 110px', borderRadius: '0 0 60px 60px' }}>
        <Link to="/graduation" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm no-underline mb-6 transition">
          <i className="fas fa-arrow-left" /> Back to Graduation Hub
        </Link>
                <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
              {album.category === 'archive' ? 'Archive' : 'Graduation Photos'}
            </p>
            <h1 className="font-extrabold mb-3" style={{ fontSize: '2.5rem', letterSpacing: '-1.5px' }}>
              {album.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
              {album.event_date && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
                  {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-2">
                <i className="fas fa-images" style={{ color: '#fdb813' }} />
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            </div>
            {album.description && (
              <p className="text-white/60 mt-3 max-w-xl text-sm leading-relaxed">{album.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Photo Grid */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '50px 20px 100px', width: '100%' }}>
        {photos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl"
            style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.05)' }}>
            <i className="fas fa-images text-6xl mb-5 block" style={{ color: '#e2e8f0' }} />
            <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>No Photos Yet</h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>This album has no photos.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo, i) => (
              <div key={photo.id}
                className="mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-white cursor-zoom-in transition-all duration-300"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                onClick={() => setLightbox(i)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(29,43,75,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}>
                <img src={photo.file_path} alt={photo.caption || 'Photo'}
                  className="w-full block" loading="lazy"
                  onError={e => { e.target.style.display = 'none'; }} />
                {photo.caption && (
                  <p className="px-4 py-2.5 text-xs font-medium m-0" style={{ color: '#64748b' }}>{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} />
      )}

      <Footer />
    </div>
  );
}