import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { faceApi, galleryApi, mediaApi } from '@/api/gallery.api';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import BulkUploadZone from '@/features/yearbook/components/BulkUploadZone';
import { storageUrl } from '@/api/client';

// ── NEW imports ───────────────────────────────────────────────────────────────
import ProtectedImage from '@/components/ui/ProtectedImage';
import { ContentOwnershipBanner } from '@/components/ui/CopyrightLabel';
import { useContentProtection } from '@/utils/contentProtection';

// ── Sub-components (unchanged) ────────────────────────────────────────────────

function FaceTagBadge({ tag }) {
  const studentId = tag.student?.id ?? tag.user_id;
  const name      = tag.student?.name ?? 'Unknown';
  const pic       = tag.student?.profile_picture;
  return (
    <Link to={`/profile/${studentId}`} onClick={e => e.stopPropagation()} className="no-underline">
      <div className="inline-flex items-center gap-2 transition-all"
        style={{ background: 'rgba(29,43,75,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(253,184,19,0.4)', borderRadius: 50, padding: '6px 14px 6px 7px', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1d2b4b'; e.currentTarget.style.borderColor = '#fdb813'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,43,75,0.88)'; e.currentTarget.style.borderColor = 'rgba(253,184,19,0.4)'; }}>
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-black text-xs"
          style={{ background: '#fdb813', color: '#1d2b4b' }}>
          {pic
            ? <img src={storageUrl(pic)} alt="" className="w-full h-full object-cover" />
            : name.charAt(0).toUpperCase()
          }
        </div>
        <div>
          <span className="block text-white text-xs font-bold leading-none">{name}</span>
          <span className="block text-[10px] font-semibold" style={{ color: '#fdb813' }}>
            {parseFloat(tag.similarity ?? 0).toFixed(1)}% match
          </span>
        </div>
      </div>
    </Link>
  );
}

function GridTagChips({ tags }) {
  if (!tags?.length) return null;
  const show  = tags.slice(0, 2);
  const extra = tags.length - show.length;
  return (
    <div className="flex flex-wrap gap-1 px-3 pb-2">
      {show.map(t => (
        <Link key={t.user_id ?? t.student?.id} to={`/profile/${t.student?.id ?? t.user_id}`}
          onClick={e => e.stopPropagation()}
          className="no-underline inline-flex items-center gap-1 hover:opacity-75 transition-opacity"
          style={{ background: '#1d2b4b', color: 'white', borderRadius: 50, padding: '3px 9px 3px 5px', fontSize: 10, fontWeight: 700 }}>
          <i className="fas fa-user-tag" style={{ color: '#fdb813', fontSize: 9 }} />
          {(t.student?.name ?? 'Student').split(' ')[0]}
        </Link>
      ))}
      {extra > 0 && (
        <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 50, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>
          +{extra}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status, faceCount }) {
  const cfg = {
    analyzed: { bg: '#ecfdf5', color: '#059669', icon: 'fa-circle-check',        text: `${faceCount} face${faceCount !== 1 ? 's' : ''}` },
    pending:  { bg: '#fffbeb', color: '#d97706', icon: 'fa-clock',               text: 'Analyzing…' },
    error:    { bg: '#fef2f2', color: '#dc2626', icon: 'fa-triangle-exclamation', text: 'Failed' },
  }[status] ?? { bg: '#f8fafc', color: '#94a3b8', icon: 'fa-circle-dashed', text: 'Pending' };
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      <i className={`fas ${cfg.icon}`} /> {cfg.text}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GalleryShowPage() {
  const { id } = useParams();

  const [album,      setAlbum]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lightbox,   setLightbox]   = useState(null);
  const [tagCache,   setTagCache]   = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  
  // FIX Bug 8: Use a ref to track fetched IDs to avoid infinite loop
  const fetchingRef = useRef(new Set());

  // ── NEW: content protection hook on the masonry container ────────────────
  const masonryRef = useContentProtection();

  // FIX Bug 7: Tier should be read from actual user data/subscription
  // Assuming user object is available via context or prop; default to free if missing
  const userTier = 'free'; // This should be replaced with: const { user } = useAuth(); const tier = user?.subscription?.tier ?? 'free';

  const tier = userTier;

  const loadAlbum = useCallback(() => {
    if (!id) return;
    setLoading(true);
    galleryApi.show(id)
      .then(({ data }) => setAlbum(data?.data ?? data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadAlbum(); }, [loadAlbum]);

  const uploadHook = useMediaUpload(id ? parseInt(id) : null, tier, () => {
    setShowUpload(false);
    loadAlbum();
  });

  const loadTags = useCallback(async (photoId) => {
    // FIX Bug 8: Check ref instead of tagCache state to prevent dependency cycle
    if (fetchingRef.current.has(photoId)) return;
    
    fetchingRef.current.add(photoId);
    try {
      const { data } = await faceApi.photoTags(photoId);
      setTagCache(prev => ({
        ...prev,
        [photoId]: { status: data.status ?? 'pending', face_count: data.face_count ?? 0, tags: data.tags ?? [] },
      }));
    } catch {}
    finally { fetchingRef.current.delete(photoId); }
  // FIX Bug 8: Stable dependencies - no tagCache or setTagCache
  }, []);

  useEffect(() => {
    if (!album?.photos) return;
    album.photos.forEach((photo, i) => { setTimeout(() => loadTags(photo.id), i * 80); });
  }, [album, loadTags]); // eslint-disable-line

  const handleDelete = async (photoId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this photo?')) return;
    setDeleting(photoId);
    try {
      await mediaApi.deletePhoto(photoId);
      setAlbum(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== photoId) }));
      if (lightbox?.id === photoId) setLightbox(null);
    } catch { alert('Delete failed.'); }
    finally { setDeleting(null); }
  };

  useEffect(() => {
    if (!lightbox || !album?.photos) return;
    const handle = (e) => {
      const idx = album.photos.findIndex(p => p.id === lightbox.id);
      if (e.key === 'ArrowRight' && album.photos[idx + 1]) setLightbox(album.photos[idx + 1]);
      if (e.key === 'ArrowLeft'  && album.photos[idx - 1]) setLightbox(album.photos[idx - 1]);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightbox, album]);

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
        <i className="fas fa-images text-5xl text-slate-200" />
        <h2 className="text-xl font-black" style={{ color: '#1d2b4b' }}>Album not found.</h2>
        <Link to="/gallery" className="font-semibold no-underline hover:underline" style={{ color: '#3f51b5' }}>
          ← Back to Gallery
        </Link>
      </div>
      <Footer />
    </div>
  );

  const photos       = album.photos ?? [];
  const totalTags    = Object.values(tagCache).reduce((s, t) => s + (t.tags?.length ?? 0), 0);
  const lightboxTags = lightbox ? (tagCache[lightbox.id]?.tags ?? []) : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <style>{`
        @keyframes fadeIn  { from{opacity:0}                            to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .photo-card:hover .photo-delete { opacity: 1 !important; }
      `}</style>

      <Navbar />

      {/* ── Header ── */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] py-20 text-white rounded-b-[60px]">
        <Link to="/gallery" className="inline-flex items-center gap-2 text-white/55 hover:text-white text-sm no-underline mb-6 transition">
          <i className="fas fa-arrow-left" /> Back to Gallery
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-4">{album.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
              {album.event_date && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar text-[#fdb813]" />
                  {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-2">
                <i className="fas fa-images text-[#fdb813]" />
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
              {totalTags > 0 && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-user-tag text-[#fdb813]" />
                  {totalTags} student tag{totalTags !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {album.description && (
              <p className="text-white/65 mt-4 max-w-xl leading-relaxed text-sm">{album.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-2 font-extrabold text-sm border-none cursor-pointer px-5 py-3 rounded-2xl transition-all"
            style={{ background: showUpload ? 'rgba            (255,255,255,0.15)' : '#fdb813', color: showUpload ? 'white' : '#1d2b4b' }}
            onMouseEnter={e => !showUpload && (e.currentTarget.style.background = '#f5b200')}
            onMouseLeave={e => !showUpload && (e.currentTarget.style.background = '#fdb813')}>
            <i className={`fas ${showUpload ? 'fa-times' : 'fa-cloud-arrow-up'}`} />
            {showUpload ? 'Cancel Upload' : 'Upload Photos'}
          </button>
        </div>

        {/* ── NEW: Ownership banner ── */}
        <div style={{ marginTop: 24 }}>
          <ContentOwnershipBanner />
        </div>
      </header>

      {/* ── Upload Panel ── */}
      {showUpload && (
        <div className="px-[8%] pt-10">
          <BulkUploadZone {...uploadHook} tier={tier} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {/* ── Masonry Grid ── */}
      {/* ref={masonryRef} activates the content protection hook */}
      <main ref={masonryRef} className="px-[8%] py-16 flex-1">
        {photos.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5">
            {photos.map(photo => {
              const td  = tagCache[photo.id];
              const src = storageUrl(photo.file_path);
              return (
                <div key={photo.id}
                  className="photo-card mb-5 break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.015] transition-all duration-300 bg-white relative"
                  style={{ cursor: 'zoom-in' }}
                >
                  {/* ── MODIFIED: ProtectedImage replaces <img> ── */}
                  {src && (
                    <ProtectedImage
                      src={src}
                      alt={photo.caption || 'Photo'}
                      watermarkText="© NU Lipa"
                      showCopyright={false}   // copyright shown at page level
                      onClick={() => setLightbox(photo)}
                      style={{ borderRadius: 0 }}
                    />
                  )}
                  {photo.caption && (
                    <p className="px-4 pt-2.5 text-xs text-slate-500 font-medium m-0">{photo.caption}</p>
                  )}
                  {td?.tags?.length > 0 && <div className="pt-1.5"><GridTagChips tags={td.tags} /></div>}
                  {td && <div className="px-3 pb-3"><StatusPill status={td.status} faceCount={td.face_count} /></div>}

                  <button
                    className="photo-delete absolute top-2.5 right-2.5 border-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.92)', color: deleting === photo.id ? '#ef4444' : '#64748b', opacity: 0, zIndex: 10 }}
                    onClick={e => handleDelete(photo.id, e)}
                    disabled={deleting === photo.id}
                    title="Delete photo">
                    <i className={`fas ${deleting === photo.id ? 'fa-spinner fa-spin' : 'fa-trash-can'} text-xs`} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400">
            <i className="fas fa-images text-6xl mb-5 block opacity-10" />
            <h3 className="text-xl font-black mb-2" style={{ color: '#1d2b4b' }}>No Photos Yet</h3>
            <p className="text-sm mb-6">This album has no photos.</p>
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 font-extrabold text-sm border-none cursor-pointer px-5 py-3 rounded-2xl text-white transition-all"
              style={{ background: '#1d2b4b' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
              <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} />
              Upload First Photos
            </button>
          </div>
        )}
      </main>

      {/* ── Lightbox ── */}
      {lightbox && (() => {
        const idx  = photos.findIndex(p => p.id === lightbox.id);
        const prev = photos[idx - 1] ?? null;
        const next = photos[idx + 1] ?? null;
        return (
          <div onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(8,12,24,0.96)', animation: 'fadeIn 0.2s ease', cursor: 'zoom-out' }}>
            <div className="relative flex flex-col items-center px-4" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw' }}>

              {/* ── MODIFIED: ProtectedImage in lightbox ── */}
              <ProtectedImage
                src={storageUrl(lightbox.file_path)}
                alt={lightbox.caption || 'Photo'}
                variant="lightbox"
                watermarkText="© NU Lipa — All Rights Reserved"
                style={{
                  maxWidth: '88vw',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                }}
                imgStyle={{ maxHeight: '78vh', objectFit: 'contain' }}
              />

              {lightbox.caption && (
                <p className="text-white/65 text-sm font-semibold mt-4 text-center">{lightbox.caption}</p>
              )}
              {lightboxTags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4" style={{ animation: 'slideUp 0.3s ease' }}>
                  <span className="text-white/35 text-[10px] font-bold uppercase tracking-widest self-center mr-1">
                    <i className="fas fa-user-tag mr-1" />Tagged:
                  </span>
                  {lightboxTags.map(tag => <FaceTagBadge key={tag.user_id ?? tag.student?.id} tag={tag} />)}
                </div>
              )}
              {tagCache[lightbox.id] && (
                <div className="mt-3">
                  <StatusPill status={tagCache[lightbox.id].status} faceCount={tagCache[lightbox.id].face_count} />
                </div>
              )}
              <p className="text-white/25 text-xs font-bold mt-3">{idx + 1} / {photos.length}</p>
            </div>

            <button onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 bg-white/12 hover:bg-white/22 text-white border-none w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition">
              <i className="fas fa-times" />
            </button>
            {prev && (
              <button onClick={e => { e.stopPropagation(); setLightbox(prev); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/12 hover:bg-white/22 text-white border-none w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition">
                <i className="fas fa-chevron-left" />
              </button>
            )}
            {next && (
              <button onClick={e => { e.stopPropagation(); setLightbox(next); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/12 hover:bg-white/22 text-white border-none w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition">
                <i className="fas fa-chevron-right" />
              </button>
            )}
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}