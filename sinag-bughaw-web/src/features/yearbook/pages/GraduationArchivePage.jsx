import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080c18]/[0.97]"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center px-4 max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.file_path}
          alt={photo.caption || 'Photo'}
          className="rounded-2xl shadow-2xl max-w-[88vw] max-h-[80vh] object-contain"
        />
        {photo.caption && (
          <p className="text-white/60 text-sm font-semibold mt-4 text-center">{photo.caption}</p>
        )}
        <p className="text-white/25 text-xs font-bold mt-2">{current + 1} / {photos.length}</p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20
                   text-white border-none cursor-pointer flex items-center justify-center transition-colors"
      >
        <i className="fas fa-times" />
      </button>

      {/* Prev */}
      {current > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                     bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer
                     flex items-center justify-center transition-colors"
        >
          <i className="fas fa-chevron-left" />
        </button>
      )}

      {/* Next */}
      {current < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                     bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer
                     flex items-center justify-center transition-colors"
        >
          <i className="fas fa-chevron-right" />
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GraduationArchivePage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [album,     setAlbum]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [lightbox,  setLightbox]  = useState(null);
  const [searching, setSearching] = useState(false);
  const [matches,   setMatches]   = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    graduationApi.show(id)
      .then(({ data }) => setAlbum(data.data ?? data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleBack = (e) => {
    e.preventDefault();
    navigate('/gallery', { state: { tab: 'graduation:archive' } });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-indigo-600" />
      </div>
      <Footer />
    </div>
  );

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!album) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <i className="fas fa-graduation-cap text-5xl text-slate-200" />
        <h2 className="text-xl font-black text-[#1d2b4b]">Album not found.</h2>
        <a
          href="/gallery"
          onClick={handleBack}
          className="font-semibold no-underline hover:underline text-indigo-600 cursor-pointer"
        >
          ← Back to Gallery
        </a>
      </div>
      <Footer />
    </div>
  );

  const photos = album.photos ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Header ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-[70px] pb-[50px] rounded-b-[60px] text-white">

        <a
          href="/gallery"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white
                     text-sm no-underline mb-6 transition-colors cursor-pointer"
        >
          <i className="fas fa-arrow-left" /> Back to Gallery
        </a>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
              {album.category === 'archive' ? 'Archive' : 'Graduation Photos'}
            </p>
            <h1 className="text-[2.5rem] font-extrabold tracking-tight mb-3 leading-tight">
              {album.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
              {album.event_date && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar text-[#fdb813]" />
                  {new Date(album.event_date).toLocaleDateString('en-PH', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
              <span className="flex items-center gap-2">
                <i className="fas fa-images text-[#fdb813]" />
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            </div>
            {album.description && (
              <p className="text-white/60 mt-3 max-w-xl text-sm leading-relaxed">
                {album.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Face search bar ── */}
        <div className="mt-7 max-w-[600px]">
          <div className="relative">
            <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2
                          text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
              className="w-full h-[52px] pl-[50px] pr-14 border border-white/15 rounded-[14px]
                         outline-none bg-white/10 backdrop-blur-xl text-white text-sm font-medium
                         cursor-pointer placeholder-white/50 box-border transition-all
                         focus:bg-white/[0.18] focus:border-[#fdb813]/60"
            />
            <FaceSearchButton onFile={handleFaceFile} loading={searching} />
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

      {/* ── Photo Grid ── */}
      <main className="max-w-[1100px] mx-auto w-full px-5 pt-[50px] pb-24">
        {photos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
            <i className="fas fa-images text-6xl text-slate-200 mb-5 block" />
            <h3 className="font-extrabold text-lg text-[#1d2b4b] mb-2">No Photos Yet</h3>
            <p className="text-sm text-slate-400">This album has no photos.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-white
                           cursor-zoom-in shadow-sm hover:-translate-y-1 hover:shadow-xl
                           transition-all duration-300"
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photo.file_path}
                  alt={photo.caption || 'Photo'}
                  className="w-full block"
                  loading="lazy"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                {photo.caption && (
                  <p className="px-4 py-2.5 text-xs font-medium m-0 text-slate-500">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {lightbox !== null && (
        <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} />
      )}

      <Footer />
    </div>
  );
}