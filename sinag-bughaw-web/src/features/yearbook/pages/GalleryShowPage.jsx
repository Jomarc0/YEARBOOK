/**
 * GalleryShowPage.jsx — FIXED
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Added missing `useAuth` import (was crashing with ReferenceError).
 * No other logic changed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { faceApi, galleryApi, mediaApi } from '@/api/gallery.api';
import { useAuth } from '@/features/auth/hooks/useAuth';   // ← FIX: was missing
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { usePhotoFacesBroadcast } from '@/hooks/usePhotoFacesBroadcast';
import BulkUploadZone from '@/features/yearbook/components/BulkUploadZone';
import { storageUrl } from '@/api/client';
import ProtectedImage from '@/components/ui/ProtectedImage';
import { ContentOwnershipBanner } from '@/components/ui/CopyrightLabel';
import { useContentProtection } from '@/utils/contentProtection';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

// ─── Sub-components (unchanged) ───────────────────────────────────────────────

function FaceTagBadge({ tag }) {
  const person    = tag.user ?? tag.student ?? tag;
  const studentId = person.id ?? tag.user_id;
  const name      = person.name ?? tag.name ?? 'Unknown';
  const pic       = person.profile_picture ?? tag.profile_picture;
  return (
    <Link to={`/profile/${studentId}`} onClick={e => e.stopPropagation()} className="no-underline">
      <div className="inline-flex items-center gap-2 bg-[#1d2b4b]/[0.88] backdrop-blur-lg
                      border border-[#fdb813]/40 rounded-full px-3.5 py-[6px] cursor-pointer
                      hover:bg-[#1d2b4b] hover:border-[#fdb813] transition-all">
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center
                        font-black text-xs bg-[#fdb813] text-[#1d2b4b]">
          {pic
            ? <img src={storageUrl(pic)} alt="" className="w-full h-full object-cover" />
            : name.charAt(0).toUpperCase()
          }
        </div>
        <div>
          <span className="block text-white text-xs font-bold leading-none">{name}</span>
          <span className="block text-[10px] font-semibold text-[#fdb813]">
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
    <div className="flex flex-wrap gap-1 px-2.5 pb-1.5 pt-1">
      {show.map(t => (
        <Link
          key={t.user_id ?? t.user?.id ?? t.student?.id}
          to={`/profile/${t.user?.id ?? t.student?.id ?? t.user_id}`}
          onClick={e => e.stopPropagation()}
          className="no-underline inline-flex items-center gap-1 bg-[#1d2b4b] text-white
                     rounded-full py-[3px] px-[9px] pl-[5px] text-[10px] font-bold hover:opacity-75 transition-opacity"
        >
          <i className="fas fa-user-tag text-[#fdb813] text-[9px]" />
          {(t.user?.name ?? t.student?.name ?? t.name ?? 'Student').split(' ')[0]}
        </Link>
      ))}
      {extra > 0 && (
        <span className="bg-slate-100 text-slate-500 rounded-full py-[3px] px-[9px] text-[10px] font-bold">
          +{extra}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status, faceCount }) {
  const cfg = {
    analyzed: { cls: 'bg-emerald-50 text-emerald-700',  icon: 'fa-circle-check',         text: `${faceCount} face${faceCount !== 1 ? 's' : ''}` },
    done:     { cls: 'bg-emerald-50 text-emerald-700',  icon: 'fa-circle-check',         text: `${faceCount} face${faceCount !== 1 ? 's' : ''}` },
    matched:  { cls: 'bg-emerald-50 text-emerald-700',  icon: 'fa-circle-check',         text: `${faceCount} face${faceCount !== 1 ? 's' : ''}` },
    no_matches: { cls: 'bg-emerald-50 text-emerald-700', icon: 'fa-circle-check',         text: `${faceCount} face${faceCount !== 1 ? 's' : ''}` },
    pending:  { cls: 'bg-amber-50 text-amber-700',      icon: 'fa-clock',                text: 'Analyzing…' },
    queued:   { cls: 'bg-amber-50 text-amber-700',      icon: 'fa-clock',                text: 'Analyzing…' },
    error:    { cls: 'bg-red-50 text-red-600',           icon: 'fa-triangle-exclamation', text: 'Failed' },
  }[status] ?? { cls: 'bg-slate-50 text-slate-400', icon: 'fa-circle-dashed', text: 'Pending' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <i className={`fas ${cfg.icon}`} /> {cfg.text}
    </span>
  );
}

function LightboxModal({ photo, photos, tagCache, onClose, onNavigate }) {
  const idx  = photos.findIndex(p => p.id === photo.id);
  const prev = photos[idx - 1] ?? null;
  const next = photos[idx + 1] ?? null;
  const tags = tagCache[photo.id]?.tags ?? [];
  const td   = tagCache[photo.id];

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowRight' && next) onNavigate(next);
      if (e.key === 'ArrowLeft'  && prev) onNavigate(prev);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [photo, prev, next, onNavigate, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-[#060a14]/[0.97] flex items-center justify-center cursor-zoom-out"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 bg-white/10 hover:bg-white/[0.22] border-none text-white
                   w-11 h-11 rounded-full cursor-pointer flex items-center justify-center text-base
                   transition-colors z-10"
      >
        <i className="fas fa-times" />
      </button>

      <div className="absolute top-[22px] left-1/2 -translate-x-1/2 bg-white/[0.08] text-white/55
                      text-[11px] font-bold px-3.5 py-1.5 rounded-full">
        {idx + 1} / {photos.length}
      </div>

      {prev && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(prev); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/[0.22] border-none
                     text-white w-12 h-12 rounded-full cursor-pointer flex items-center justify-center
                     text-base transition-colors z-10"
        >
          <i className="fas fa-chevron-left" />
        </button>
      )}

      {next && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(next); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/[0.22] border-none
                     text-white w-12 h-12 rounded-full cursor-pointer flex items-center justify-center
                     text-base transition-colors z-10"
        >
          <i className="fas fa-chevron-right" />
        </button>
      )}

      <div
        onClick={e => e.stopPropagation()}
        className="flex flex-col items-center max-w-[88vw] max-h-[90vh]"
      >
        <ProtectedImage
          src={storageUrl(photo.file_path)}
          alt={photo.caption || 'Photo'}
          variant="lightbox"
          watermarkText="© NU Lipa — All Rights Reserved"
          style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          imgStyle={{ maxHeight: '72vh', maxWidth: '88vw', objectFit: 'contain', display: 'block' }}
        />

        {photo.caption && (
          <p className="text-white/65 text-[13px] font-semibold mt-3.5 text-center">{photo.caption}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <span className="text-white/35 text-[10px] font-bold uppercase tracking-widest self-center">
              <i className="fas fa-user-tag mr-1" />Tagged:
            </span>
            {tags.map(tag => <FaceTagBadge key={tag.user_id ?? tag.student?.id} tag={tag} />)}
          </div>
        )}

        {td && (
          <div className="mt-2.5">
            <StatusPill status={td.status} faceCount={td.face_count} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GalleryShowPage() {
  const { id } = useParams();

  const [album,      setAlbum]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lightbox,   setLightbox]   = useState(null);
  const [tagCache,   setTagCache]   = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [deleteErr,  setDeleteErr]  = useState('');
  const [searching,  setSearching]  = useState(false);
  const [matches,    setMatches]    = useState([]);

  const fetchingRef = useRef(new Set());
  const masonryRef  = useContentProtection();

  // FIX: useAuth is now imported correctly above
  const { user } = useAuth();
  const tier = user?.tier === 'premium' || user?.is_premium ? 'premium'
             : user?.tier === 'standard' ? 'standard'
             : 'free';
  const canUpload = user?.role === 'admin' || user?.is_admin || tier === 'standard' || tier === 'premium';

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
    if (fetchingRef.current.has(photoId)) return;
    fetchingRef.current.add(photoId);
    try {
      const { data } = await faceApi.photoTags(photoId);
      setTagCache(prev => ({
        ...prev,
        [photoId]: {
          status:     data.status     ?? 'pending',
          face_count: data.face_count ?? 0,
          tags:       data.tags       ?? [],
        },
      }));
    } catch {}
    finally { fetchingRef.current.delete(photoId); }
  }, []);

  const albumPhotoIds = album?.photos?.map(photo => photo.id) ?? [];

  usePhotoFacesBroadcast(
    (event) => {
      setTagCache(prev => ({
        ...prev,
        [event.photo_id]: {
          status: event.status,
          face_count: event.face_count,
          tags: event.matches ?? [],
        },
      }));

      loadTags(event.photo_id);
    },
    { photoIds: albumPhotoIds, enabled: albumPhotoIds.length > 0 }
  );

  useEffect(() => {
    if (!album?.photos) return;
    album.photos.forEach((photo, i) => {
      setTimeout(() => loadTags(photo.id), i * 80);
    });
  }, [album, loadTags]);

  const handleDelete = async (photoId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this photo permanently?')) return;
    setDeleting(photoId);
    setDeleteErr('');
    try {
      await mediaApi.deletePhoto(photoId);
      setAlbum(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== photoId) }));
      if (lightbox?.id === photoId) setLightbox(null);
    } catch (err) {
      const msg = err.response?.data?.message ?? `Error ${err.response?.status ?? 'unknown'}`;
      setDeleteErr(msg);
      setTimeout(() => setDeleteErr(''), 4000);
    } finally {
      setDeleting(null);
    }
  };

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
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3f51b5]" />
      </div>
      <Footer />
    </div>
  );

  if (!album) return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <i className="fas fa-images text-5xl text-slate-200" />
        <h2 className="text-xl font-extrabold text-[#1d2b4b] m-0">Album not found.</h2>
        <Link to="/gallery" className="font-semibold text-[#3f51b5] no-underline hover:underline">
          ← Back to Gallery
        </Link>
      </div>
      <Footer />
    </div>
  );

  const photos    = album.photos ?? [];
  const totalTags = Object.values(tagCache).reduce((s, t) => s + (t.tags?.length ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe]">
      <Navbar />

      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] pt-[72px] pb-16 text-white rounded-b-[56px]">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 text-white/55 hover:text-white text-[13px] no-underline mb-5 transition-colors"
        >
          <i className="fas fa-arrow-left" /> Back to Gallery
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[2.2rem] font-black tracking-tight mb-3.5">{album.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-white/65 text-[13px]">
              {album.event_date && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-calendar text-[#fdb813]" />
                  {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <i className="fas fa-images text-[#fdb813]" />
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
              {totalTags > 0 && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-user-tag text-[#fdb813]" />
                  {totalTags} tag{totalTags !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {album.description && (
              <p className="text-white/60 mt-3.5 max-w-[520px] leading-relaxed text-[13px]">
                {album.description}
              </p>
            )}
          </div>

          {canUpload ? (
            <button
              onClick={() => setShowUpload(v => !v)}
              className={`flex items-center gap-2 font-extrabold text-[13px] border-none cursor-pointer
                          px-5 py-[11px] rounded-2xl transition-all
                          ${showUpload
                            ? 'bg-white/15 text-white hover:bg-white/20'
                            : 'bg-[#fdb813] text-[#1d2b4b] hover:bg-[#f5b200]'}`}
            >
              <i className={`fas ${showUpload ? 'fa-times' : 'fa-cloud-arrow-up'}`} />
              {showUpload ? 'Cancel Upload' : 'Upload Photos'}
            </button>
          ) : (
            <Link to="/premium"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#fdb813] px-5 py-[11px] text-[13px] font-extrabold text-[#1d2b4b] no-underline">
              <i className="fas fa-lock" /> Upgrade to Upload
            </Link>
          )}
        </div>

        {/* Face search bar */}
        <div className="mt-6 max-w-[600px]">
          <div className="relative">
            <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2 text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
              className="w-full h-[52px] pl-[50px] pr-14 border border-white/15 rounded-[14px] outline-none
                         bg-white/10 backdrop-blur-xl text-white text-sm font-medium cursor-pointer
                         focus:bg-white/[0.18] focus:border-[#fdb813]/60 transition-all placeholder-white/50
                         box-border"
            />
            <FaceSearchButton onFile={handleFaceFile} loading={searching} />
          </div>

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

        <div className="mt-5">
          <ContentOwnershipBanner />
        </div>
      </header>

      {showUpload && canUpload && (
        <div className="px-[8%] pt-7">
          <BulkUploadZone {...uploadHook} tier={tier} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {deleteErr && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white
                        px-5 py-3 rounded-[14px] text-[13px] font-bold z-[9998]
                        flex items-center gap-2 shadow-[0_8px_32px_rgba(220,38,38,0.35)]
                        whitespace-nowrap">
          <i className="fas fa-circle-exclamation" /> {deleteErr}
        </div>
      )}

      <main ref={masonryRef} className="px-[8%] pt-9 pb-20 flex-1">
        {photos.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {photos.map(photo => {
              const td         = tagCache[photo.id];
              const src        = storageUrl(photo.file_path);
              const isDeleting = deleting === photo.id;

              return (
                <div
                  key={photo.id}
                  className={`group bg-white rounded-[20px] overflow-hidden border border-black/[0.04]
                               shadow-[0_2px_12px_rgba(29,43,75,0.07)] cursor-zoom-in
                               hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(29,43,75,0.13)]
                               transition-all duration-200
                               ${isDeleting ? 'opacity-50' : ''}`}
                  onClick={() => setLightbox(photo)}
                >
                  <div className="relative w-full pt-[75%] bg-slate-100 overflow-hidden">
                    {src && (
                      <div className="absolute inset-0">
                        <ProtectedImage
                          src={src}
                          alt={photo.caption || 'Photo'}
                          watermarkText="© NU Lipa"
                          showCopyright={false}
                          style={{ width: '100%', height: '100%', borderRadius: 0 }}
                          imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-[#1d2b4b]/45 opacity-0 group-hover:opacity-100
                                    flex items-center justify-center transition-opacity duration-200">
                      <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl
                                      px-[18px] py-2 text-white text-[12px] font-bold flex items-center gap-1.5">
                        <i className="fas fa-expand" /> View
                      </div>
                    </div>

                    <button
                      className={`absolute top-2.5 right-2.5 border-none cursor-pointer w-8 h-8 rounded-[10px]
                                   z-[5] flex items-center justify-center text-red-400 text-[12px]
                                   shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all
                                   opacity-0 group-hover:opacity-100
                                   hover:bg-red-500 hover:text-white bg-white/92
                                   ${isDeleting ? 'cursor-not-allowed bg-red-500/80 text-white opacity-100' : ''}`}
                      onClick={e => handleDelete(photo.id, e)}
                      disabled={isDeleting}
                      title="Delete photo"
                    >
                      <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-trash-can'}`} />
                    </button>
                  </div>

                  <div className="px-3 pt-2.5 pb-3">
                    {photo.caption && (
                      <p className="mb-1.5 text-[11px] text-slate-500 font-medium truncate">
                        {photo.caption}
                      </p>
                    )}
                    {td && (
                      <div className={td?.tags?.length > 0 ? 'mb-1.5' : ''}>
                        <StatusPill status={td.status} faceCount={td.face_count} />
                      </div>
                    )}
                    {td?.tags?.length > 0 && <GridTagChips tags={td.tags} />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-5 bg-white rounded-3xl shadow-[0_2px_16px_rgba(29,43,75,0.06)]">
            <i className="fas fa-images text-5xl text-slate-200 block mb-4" />
            <h3 className="text-xl font-extrabold text-[#1d2b4b] mb-2">No Photos Yet</h3>
            <p className="text-[13px] text-slate-400 mb-5">This album has no photos.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#3f51b5] text-white
                         border-none px-5 py-[11px] rounded-[14px] text-[13px] font-bold cursor-pointer
                         transition-colors"
            >
              <i className="fas fa-cloud-arrow-up text-[#fdb813]" />
              Upload First Photos
            </button>
          </div>
        )}
      </main>

      {lightbox && (
        <LightboxModal
          photo={lightbox} photos={photos} tagCache={tagCache}
          onClose={() => setLightbox(null)} onNavigate={setLightbox}
        />
      )}

      <Footer />
    </div>
  );
}
