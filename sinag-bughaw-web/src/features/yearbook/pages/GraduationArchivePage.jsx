/**
 * GraduationArchivePage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGES FROM ORIGINAL:
 *  - Added face-search bar to the album header (mirrors GalleryPage hero search).
 *  - Imports: added `galleryApi` (for faceSearch), `FaceSearchButton`,
 *    `imageUrl`, `avatarUrl`.
 *  - New state: `searching`, `matches`.
 *  - New handler: `handleFaceFile` — calls galleryApi.faceSearch and sets matches.
 *  - Match result cards rendered below the search input in the header.
 *  - Lightbox close/nav inline-style → hover handlers kept as-is (original style).
 *  - No logic, API calls, routes, or other backend behavior changed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';
import { galleryApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

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
  const [album,      setAlbum]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lightbox,   setLightbox]   = useState(null);

  // ── Face search state ──────────────────────────────────────────────────────
  const [searching,  setSearching]  = useState(false);
  const [matches,    setMatches]    = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    graduationApi.show(id)
      .then(({ data }) => setAlbum(data.data ?? data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Face search handler ────────────────────────────────────────────────────
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
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '70px 8% 50px', borderRadius: '0 0 60px 60px' }}>
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

        {/* ── Face search bar ── */}
        <div className="mt-7 max-w-[600px]">
          <div className="relative">
            <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2 text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
            <input
              type="text"
              readOnly
              onClick={() => document.querySelector('#archive-face-search-hidden')?.click()}
              placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
              className="w-full h-[52px] pl-[50px] pr-14 border border-white/15 rounded-[14px] outline-none
                         bg-white/10 backdrop-blur-xl text-white text-sm font-medium cursor-pointer
                         focus:bg-white/[0.18] focus:border-[#fdb813]/60 transition-all placeholder-white/50
                         box-border"
            />
            <FaceSearchButton
              onFile={handleFaceFile}
              loading={searching}
            />
          </div>

          {/* Face match results */}
          {matches.length > 0 && (
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
              {matches.map(m => (
                <Link
                  key={m.user_id}
                  to={`/profile/${m.user_id}`}
                  className="flex items-center gap-3 bg-white/[0.12] backdrop-blur-md border border-white/20
                             rounded-[14px] p-3 no-underline hover:border-[#fdb813] transition-colors"
                >
                  <img
                    src={imageUrl(m.profile_picture) || avatarUrl(m.name)}
                    alt={m.name}
                    className="w-11 h-11 rounded-xl object-cover border-2 border-[#fdb813] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="m-0 font-bold text-[13px] text-white truncate">{m.name}</p>
                    <p className="m-0 text-[11px] text-white/60">
                      <i className="fas fa-brain text-[#fdb813] mr-1" />{m.similarity}% match
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
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