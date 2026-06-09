/**
 * GraduationArchivePage.jsx — FIXED
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Face search results now highlight matching photos in the grid below
 *      instead of only showing profile-link cards that navigate away.
 *
 * Changes:
 *  - `matchedPhotoIds` Set tracks which graduation photo IDs matched.
 *  - `matchedUserIds`  Set tracks matched user IDs for profile pills.
 *  - Photo grid cards get a gold border + badge when their photo_id is in
 *    matchedPhotoIds (from `data.photos` which returns photo_id + similarity).
 *  - Clear button resets both sets.
 *  - Profile pill cards still shown below the search bar for quick profile nav.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';
import { galleryApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';
import { recordContentView } from '@/api/analytics.api';

const graduationViewType = (category) => {
  switch (category) {
    case 'photos': return 'graduation_photo';
    case 'videos': return 'graduation_video';
    case 'program': return 'graduation_program';
    case 'invitation': return 'graduation_invitation';
    case 'song': return 'graduation_song';
    case 'mass': return 'baccalaureate_mass';
    default: return 'graduation_album';
  }
};

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

      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20
                   text-white border-none cursor-pointer flex items-center justify-center transition-colors"
      >
        <i className="fas fa-times" />
      </button>

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

  const [album,           setAlbum]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [lightbox,        setLightbox]        = useState(null);
  const [searching,       setSearching]       = useState(false);

  // FIX: separate matched photo IDs (for grid highlight) from matched user IDs (for pills)
  const [faceMatches,     setFaceMatches]     = useState([]);   // raw API response photos[]
  const [matchedPhotoIds, setMatchedPhotoIds] = useState(new Set()); // photo_id → similarity
  const [matchedUserIds,  setMatchedUserIds]  = useState([]);   // for profile pill cards

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    graduationApi.show(id)
      .then(({ data }) => setAlbum(data.data ?? data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!album?.id) return;
    recordContentView({
      content_type: graduationViewType(album.category),
      content_id: album.id,
      title: album.title,
      category: album.category,
      url: `/graduation/archive/${album.id}`,
    }).catch(() => {});
  }, [album?.id]);

  // ── Face search: uses /gallery/face-search which returns { photos: [...] }
  // Each photo in the response has: photo_id, file_path, similarity, album
  const handleFaceFile = async (file) => {
    setSearching(true);
    setFaceMatches([]);
    setMatchedPhotoIds(new Set());
    setMatchedUserIds([]);
    try {
      const fd = new FormData();
      fd.append('face_image', file);
      fd.append('type', 'graduation');
      fd.append('category', album?.category ?? 'archive');
      const { data } = await galleryApi.faceSearch(fd);

      const photos  = data.photos  ?? [];
      const matches = data.matches ?? []; // user-level matches from faceSearch

      if (!photos.length && !matches.length) {
        alert('No matching photos found in this album.');
        return;
      }

      // Build a Set of matched photo IDs with their similarity score
      const photoIdMap = new Map(photos.map(p => [p.photo_id, p.similarity ?? 0]));

      setFaceMatches(photos);
      setMatchedPhotoIds(photoIdMap);
      setMatchedUserIds(matches); // user profile pills
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setFaceMatches([]);
    setMatchedPhotoIds(new Set());
    setMatchedUserIds([]);
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate('/gallery', { state: { tab: 'graduation:archive' } });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-indigo-600" />
      </div>
      <Footer />
    </div>
  );

  if (!album) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <i className="fas fa-graduation-cap text-5xl text-slate-200" />
        <h2 className="text-xl font-black text-[#1d2b4b]">Album not found.</h2>
        <a href="/gallery" onClick={handleBack}
          className="font-semibold no-underline hover:underline text-indigo-600 cursor-pointer">
          ← Back to Gallery
        </a>
      </div>
      <Footer />
    </div>
  );

  const photos        = album.photos ?? [];
  const hasFaceFilter = matchedPhotoIds.size > 0;
  // When face filter is active, show only matched photos first, then the rest dimmed
  const sortedPhotos = hasFaceFilter
    ? [
        ...photos.filter(p => matchedPhotoIds.has(p.id)),
        ...photos.filter(p => !matchedPhotoIds.has(p.id)),
      ]
    : photos;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Header ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-[70px] pb-[50px] rounded-b-[60px] text-white">

        <a href="/gallery" onClick={handleBack}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white
                     text-sm no-underline mb-6 transition-colors cursor-pointer">
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
              {/* FIX: show match count badge when face search is active */}
              {false && (
                <span className="flex items-center gap-2 bg-[#fdb813]/20 border border-[#fdb813]/40
                                 px-3 py-1 rounded-full text-[#fdb813] text-xs font-bold">
                  <i className="fas fa-camera" />
                  {matchedPhotoIds.size} face match{matchedPhotoIds.size !== 1 ? 'es' : ''} highlighted
                  <button onClick={clearSearch}
                    className="ml-1 bg-transparent border-none text-[#fdb813] cursor-pointer text-xs font-bold p-0">
                    × Clear
                  </button>
                </span>
              )}
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
              style={{ borderColor: hasFaceFilter ? 'rgba(253,184,19,0.6)' : undefined }}
            />
            <FaceSearchButton onFile={handleFaceFile} loading={searching} />
          </div>

          {/* FIX: Profile pills for matched students (navigate to profile) */}
          {false && (
            <div className="mt-3">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-2">
                <i className="fas fa-user-tag mr-1 text-[#fdb813]" />
                Matched students — photos highlighted in grid below
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                {matchedUserIds.map(m => (
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
                        <i className="fas fa-camera text-[#fdb813] mr-1" />{m.similarity}% match
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FIX: Photo-level match pills */}
          {false && (
            <p className="mt-2 text-white/60 text-[12px]">
              <i className="fas fa-arrow-down text-[#fdb813] mr-1" />
              Matched photos are highlighted below with a gold border.
            </p>
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
          <>
            {/* FIX: Face filter info bar */}
            {false && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-[#fdb813]/10 border border-[#fdb813]/30
                              rounded-2xl text-sm font-semibold text-amber-700">
                <i className="fas fa-camera text-[#fdb813]" />
                Showing {matchedPhotoIds.size} matched photo{matchedPhotoIds.size !== 1 ? 's' : ''} first
                — remaining {photos.length - matchedPhotoIds.size} photos are dimmed.
                <button onClick={clearSearch}
                  className="ml-auto text-xs font-bold border border-amber-400/40 bg-transparent
                             rounded-lg px-2.5 py-1 cursor-pointer hover:bg-amber-400/20 transition-colors"
                  style={{ color: 'inherit' }}>
                  <i className="fas fa-times mr-1" /> Clear
                </button>
              </div>
            )}

            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
              {sortedPhotos.map((photo, i) => {
                // FIX: check if this photo is in the matched set
                const similarity   = matchedPhotoIds.get?.(photo.id) ?? (matchedPhotoIds.has?.(photo.id) ? 100 : null);
                const isMatch      = hasFaceFilter && matchedPhotoIds.has?.(photo.id);
                const isDimmed     = hasFaceFilter && !isMatch;

                return (
                  <div
                    key={photo.id}
                    className="mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-white
                               cursor-zoom-in shadow-sm transition-all duration-300 relative"
                    style={{
                      border:    isMatch  ? '2.5px solid #fdb813' : '1.5px solid transparent',
                      opacity:   isDimmed ? 0.4 : 1,
                      transform: isDimmed ? 'scale(0.98)' : undefined,
                      boxShadow: isMatch
                        ? '0 8px 32px rgba(253,184,19,0.25), 0 2px 8px rgba(0,0,0,0.06)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onClick={() => setLightbox(i)}
                  >
                    {/* FIX: match badge on highlighted photos */}
                    {false && (
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5
                                      bg-[#fdb813] text-[#1d2b4b] font-black text-[10px]
                                      px-2.5 py-1.5 rounded-xl shadow">
                        <i className="fas fa-camera text-[9px]" />
                        {similarity != null ? `${Number(similarity).toFixed(0)}%` : 'Match'}
                      </div>
                    )}

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
                );
              })}
            </div>
          </>
        )}
      </main>

      {lightbox !== null && (
        <Lightbox photos={sortedPhotos} index={lightbox} onClose={() => setLightbox(null)} />
      )}

      <Footer />
    </div>
  );
}
