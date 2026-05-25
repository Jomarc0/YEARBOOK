// src/features/profile/components/StudentPhotosSection.jsx
//
// Fixes applied:
//  1. Image URL — Cloudinary URLs are already absolute (start with https://)
//     storageUrl() was prepending the local storage root, breaking the URL.
//     Now uses resolvePhotoUrl() which handles both Cloudinary and local paths.
//  2. Key prop — was using item.tag_id ?? item.photo_id which can be undefined.
//     Now uses a guaranteed unique key.
//  3. "Manual" badge — was rendering item.source as visible text in some cases.
//     Source badge is now only shown for 'rekognition' AI tags, not 'manual'.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { faceApi } from '@/api/gallery.api';

/**
 * Resolve photo URL regardless of storage driver.
 * - Cloudinary: already a full https:// URL → use as-is
 * - Local storage: relative path → prepend storage root
 */
function resolvePhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const root = import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000';
  return `${root}/storage/${path}`;
}

export default function StudentPhotosSection({ userId, compact = false }) {
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [meta,    setMeta]    = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await faceApi.studentPhotos(userId, p);
      setPhotos(data.data ?? []);
      setMeta(data.meta ?? null);
      setPage(p);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (userId) load(1); }, [userId]); // eslint-disable-line

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#94a3b8' }}>
      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>Loading tagged photos…</span>
    </div>
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!photos.length) return (
    <div style={{ textAlign: 'center', padding: compact ? '16px 0' : '48px 0', color: '#94a3b8' }}>
      {compact ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
            {[0, 1, 2].map(n => (
              <div key={n} style={{
                aspectRatio: '1', borderRadius: 12,
                border: '2px dashed #e2e8f0',
                background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#cbd5e1',
              }}>
                <i className="fas fa-image" style={{ fontSize: 18 }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>No tagged photos yet.</p>
        </>
      ) : (
        <>
          <i className="fas fa-images" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.2 }} />
          <p style={{ fontWeight: 700, color: '#1d2b4b', fontSize: 14, marginBottom: 4 }}>No tagged photos yet</p>
          <p style={{ fontSize: 12, margin: 0 }}>This student hasn't been identified in any gallery photos.</p>
        </>
      )}
    </div>
  );

  // ── Compact mode ─────────────────────────────────────────────────────────
  if (compact) {
    const shown = photos.slice(0, 6);
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {shown.map((item, index) => {
            // FIX 1: resolve photo URL correctly
            const photoUrl = resolvePhotoUrl(item.photo?.file_path);
            // FIX 2: guaranteed unique key
            const key = item.id ?? `tagged-${item.photo_id ?? index}`;
            const albumId = item.photo?.album?.id ?? item.photo?.album_id;

            return (
              <Link
                key={key}
                to={albumId ? `/gallery/${albumId}` : '#'}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  position: 'relative', aspectRatio: '1',
                  borderRadius: 12, overflow: 'hidden',
                  background: '#1d2b4b',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,43,75,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.photo?.caption || 'Tagged photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={e => {
                        // If image fails, show initials placeholder
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = '#1d2b4b';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fdb813', fontSize: 24 }}>
                      <i className="fas fa-image" />
                    </div>
                  )}

                  {/* Similarity badge — only show if meaningful */}
                  {item.similarity != null && parseFloat(item.similarity) > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 4, right: 4,
                      background: 'rgba(29,43,75,0.85)',
                      color: '#fdb813', fontSize: 9, fontWeight: 800,
                      padding: '2px 6px', borderRadius: 6,
                    }}>
                      {parseFloat(item.similarity).toFixed(0)}%
                    </div>
                  )}

                  {/* FIX 3: AI badge only for rekognition, not manual */}
                  {item.source === 'rekognition' && (
                    <div style={{
                      position: 'absolute', top: 4, left: 4,
                      background: 'rgba(63,81,181,0.85)',
                      color: '#fff', fontSize: 8, fontWeight: 800,
                      padding: '2px 6px', borderRadius: 6,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <i className="fas fa-wand-magic-sparkles" style={{ fontSize: 7 }} /> AI
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {meta && meta.total > 6 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#3f51b5', fontWeight: 700, marginTop: 10 }}>
            +{meta.total - 6} more tagged photos
          </p>
        )}
      </>
    );
  }

  // ── Full paginated mode ───────────────────────────────────────────────────
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontWeight: 900, fontSize: 20, color: '#1d2b4b', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <i className="fas fa-user-tag" style={{ color: '#fdb813' }} />
          Tagged in Gallery
          {meta && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#3f51b5', borderRadius: 20, padding: '2px 10px', marginLeft: 4 }}>
              {meta.total}
            </span>
          )}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {photos.map((item, index) => {
          const photoUrl = resolvePhotoUrl(item.photo?.file_path);
          // FIX 2: guaranteed unique key
          const key     = item.id ?? `tagged-full-${item.photo_id ?? index}`;
          const albumId = item.photo?.album?.id ?? item.photo?.album_id;

          return (
            <Link
              key={key}
              to={albumId ? `/gallery/${albumId}` : '#'}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                position: 'relative', aspectRatio: '1',
                borderRadius: 16, overflow: 'hidden',
                background: '#1d2b4b',
                boxShadow: '0 2px 8px rgba(29,43,75,0.08)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,43,75,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,43,75,0.08)'; }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={item.photo?.caption || 'Gallery photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fdb813', fontSize: 32 }}>
                    <i className="fas fa-image" />
                  </div>
                )}

                {/* Similarity badge */}
                {item.similarity != null && parseFloat(item.similarity) > 0 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(29,43,75,0.82)', backdropFilter: 'blur(4px)',
                    color: '#fdb813', fontSize: 10, fontWeight: 800,
                    padding: '3px 8px', borderRadius: 8,
                  }}>
                    {parseFloat(item.similarity).toFixed(1)}%
                  </div>
                )}

                {/* FIX 3: AI badge only for rekognition */}
                {item.source === 'rekognition' && (
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(63,81,181,0.85)', backdropFilter: 'blur(4px)',
                    color: '#fff', fontSize: 9, fontWeight: 800,
                    padding: '3px 8px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <i className="fas fa-wand-magic-sparkles" style={{ fontSize: 8 }} /> AI
                  </div>
                )}

                {/* Hover overlay with album info */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  background: 'linear-gradient(to top, rgba(29,43,75,0.85) 0%, transparent 55%)',
                  transition: 'opacity 0.3s',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10,
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  {item.photo?.album && (
                    <>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.photo.album.title}
                      </span>
                      {item.photo.album.event_date && (
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>
                          {new Date(item.photo.album.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1 || loading}
            style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1d2b4b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: page <= 1 ? 0.35 : 1 }}>
            <i className="fas fa-chevron-left" />
          </button>
          <span style={{ padding: '8px 16px', borderRadius: 12, background: '#fff', color: '#1d2b4b', fontWeight: 700, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {page} / {meta.last_page}
          </span>
          <button onClick={() => load(page + 1)} disabled={page >= meta.last_page || loading}
            style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1d2b4b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: page >= meta.last_page ? 0.35 : 1 }}>
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </section>
  );
}