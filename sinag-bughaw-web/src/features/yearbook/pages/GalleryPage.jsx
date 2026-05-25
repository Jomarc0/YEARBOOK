import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, mediaApi } from '@/api/gallery.api';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import BulkUploadZone from '@/features/yearbook/components/BulkUploadZone';
import StorageUsageBar from '@/features/yearbook/components/StorageUsageBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

const TABS = [
  { key: 'general',            label: 'All Photos',  icon: 'fa-images'         },
  { key: 'graduation:photos',  label: 'Graduation',  icon: 'fa-graduation-cap' },
  { key: 'graduation:videos',  label: 'Videos',      icon: 'fa-film'           },
  { key: 'graduation:program', label: 'Program',     icon: 'fa-file-pdf'       },
  { key: 'graduation:archive', label: 'Archive',     icon: 'fa-box-archive'    },
];

function useStorageUsage() {
  const [storage, setStorage] = useState({ used_bytes: 0, limit_bytes: 524288000, tier: 'free' });
  const reload = () =>
    mediaApi.storageUsage()
      .then(({ data }) => {
        const p = data?.data ?? data;
        setStorage({
          used_bytes:  p.used_bytes  ?? p.used  ?? 0,
          limit_bytes: p.limit_bytes ?? p.limit ?? 524288000,
          tier:        p.tier        ?? 'free',
        });
      })
      .catch(() => {});
  useEffect(() => { reload(); }, []);
  return [storage, reload];
}

function VideoCard({ album }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ background: '#0a0f1e' }}>
        {playing
          ? <video src={album.media_url} controls autoPlay style={{ width: '100%', maxHeight: 240, display: 'block' }} />
          : <div onClick={() => setPlaying(true)} style={{ height: 200, background: 'linear-gradient(135deg,#0d1b35,#1d2b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ color: '#1d2b4b', fontSize: 18, marginLeft: 3 }} />
              </div>
            </div>
        }
      </div>
      <div style={{ padding: 20 }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 6px' }}>{album.title}</h4>
        {album.description && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{album.description}</p>}
        {album.event_date && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ album }) {
  return (
    <div style={{ borderRadius: 24, background: '#fff', padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start', boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(253,184,19,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="fas fa-file-pdf" style={{ color: '#fdb813', fontSize: 22 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1d2b4b', margin: '0 0 4px' }}>{album.title}</h4>
        {album.description && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px' }}>{album.description}</p>}
        {album.event_date && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={album.media_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#1d2b4b', padding: '8px 16px', borderRadius: 10 }}>
            <i className="fas fa-eye" /> View Program
          </a>
          <a href={album.media_url} download
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1d2b4b', textDecoration: 'none', background: 'rgba(253,184,19,0.15)', padding: '8px 16px', borderRadius: 10 }}>
            <i className="fas fa-download" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [activeTab,   setActiveTab]  = useState('general');
  const [albums,      setAlbums]     = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [searching,   setSearching]  = useState(false);
  const [matches,     setMatches]    = useState([]);
  const [showUpload,  setShowUpload] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [storage,     reloadStorage] = useStorageUsage();

  const tier = storage.tier;

  const loadAlbums = (tab = activeTab) => {
    setLoading(true);
    const [type, category] = tab.includes(':') ? tab.split(':') : [tab, null];
    galleryApi.list(type, category)
      .then(({ data }) => setAlbums(data.data ?? data ?? []))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAlbums(activeTab); }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setShowUpload(false);
    setMatches([]);
  };

  const handleFaceFile = async (file) => {
    setSearching(true);
    setMatches([]);
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await galleryApi.faceSearch(formData);
      const found = data.matches ?? [];
      setMatches(found);
      if (!found.length) alert('No matching student found.');
    } catch {
      alert('Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  const uploadHook = useMediaUpload(activeAlbum, tier, () => {
    setShowUpload(false);
    loadAlbums();
    reloadStorage();
  });

  const openUpload = (albumId) => {
    setActiveAlbum(albumId);
    setShowUpload(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isGraduation = activeTab !== 'general';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7fe', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <header style={{
        background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)',
        padding: '80px 8% 60px', textAlign: 'center', color: '#fff',
        borderRadius: '0 0 60px 60px',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
          National University Lipa
        </p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 14px' }}>
          The <span style={{ color: '#fdb813' }}>Visual Archive</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7, fontWeight: 300 }}>
          Relive the milestones and pioneer memories through our AI-powered digital gallery.
        </p>

        {activeTab === 'general' && (
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#fdb813', fontSize: 15, zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="text" readOnly
                onClick={() => document.querySelector('#gallery-face-hidden')?.click()}
                placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
                style={{
                  width: '100%', height: 52, boxSizing: 'border-box',
                  padding: '0 56px 0 50px',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 14, outline: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'rgba(253,184,19,0.6)'; }}
                onBlur={e  => { e.target.style.background = 'rgba(255,255,255,0.1)';  e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              />
              <FaceSearchButton onFile={handleFaceFile} loading={searching} />
            </div>

            {matches.length > 0 && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {matches.map(m => (
                  <Link key={m.user_id} to={`/profile/${m.user_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '12px 14px', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#fdb813'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,184,19,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <img
                      src={imageUrl(m.profile_picture) || avatarUrl(m.name)}
                      alt={m.name}
                      style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid #fdb813', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                        <i className="fas fa-brain" style={{ color: '#fdb813', marginRight: 4 }} />{m.similarity}% match
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: 1000, margin: '-30px auto 0', padding: '0 20px', width: '100%', position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
        <div style={{ background: '#fff', display: 'flex', gap: 4, padding: 6, borderRadius: 20, flexWrap: 'wrap', boxShadow: '0 18px 36px rgba(29,43,75,0.1)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{
                flex: 1, minWidth: 80, padding: '10px 8px', border: 'none', cursor: 'pointer',
                borderRadius: 14, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: activeTab === tab.key ? '#1d2b4b' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#94a3b8',
                transition: 'all 0.15s',
              }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: 11 }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage Bar */}
      {activeTab === 'general' && (
        <div style={{ maxWidth: 1000, margin: '16px auto 0', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
          <StorageUsageBar usedBytes={storage.used_bytes} limitBytes={storage.limit_bytes} tier={tier} onUpgrade={() => window.location.href = '/subscription'} />
        </div>
      )}

      {/* Upload Panel */}
      {showUpload && (
        <div style={{ maxWidth: 1000, margin: '20px auto 0', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
          <BulkUploadZone {...uploadHook} tier={tier} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {/* Albums */}
      <section style={{ padding: '40px 8% 100px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: 0 }}>
            {TABS.find(t => t.key === activeTab)?.label ?? 'Albums'}
          </h2>
          {!isGraduation && !showUpload && (
            <button
              onClick={() => { setActiveAlbum(albums[0]?.id ?? null); setShowUpload(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1d2b4b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
              <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} /> Upload Photos
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 36, marginBottom: 16 }} />
          </div>
        ) : albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(29,43,75,0.06)' }}>
            <i className="fas fa-images" style={{ fontSize: 56, color: '#e2e8f0', display: 'block', marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: '0 0 8px' }}>Nothing Here Yet</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No content in this section yet.</p>
          </div>
        ) : (
          <>
            {activeTab === 'graduation:videos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {albums.map(album => <VideoCard key={album.id} album={album} />)}
              </div>
            )}

            {activeTab === 'graduation:program' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {albums.map(album => <ProgramCard key={album.id} album={album} />)}
              </div>
            )}

            {(activeTab === 'general' || activeTab === 'graduation:photos' || activeTab === 'graduation:archive') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
                {albums.map(album => (
                  <div key={album.id} style={{ position: 'relative' }} className="group">
                    <Link to={`/gallery/${album.id}`}
                      style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 28, overflow: 'hidden', border: '1px solid #f1f5f9', transition: '0.35s cubic-bezier(0.175,0.885,0.32,1.275)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 24px 48px rgba(29,43,75,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ height: 240, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                        {album.cover_photo_url
                          ? <img src={album.cover_photo_url} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, background: 'linear-gradient(135deg, #e8edf5, #dbe3f0)' }}>📷</div>
                        }
                        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.95)', padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#1d2b4b', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="fas fa-images" style={{ color: '#fdb813' }} /> {album.photos_count ?? 0} photos
                        </div>
                        {album.type === 'graduation' && (
                          <div style={{ position: 'absolute', top: 14, left: 14, background: '#fdb813', color: '#1d2b4b', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 10 }}>
                            Graduation
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '22px 24px' }}>
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1d2b4b', margin: '0 0 8px' }}>{album.title}</h4>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
                          {album.event_date
                            ? new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                            : 'No date'}
                        </p>
                      </div>
                    </Link>

                    {!isGraduation && (
                      <button
                        onClick={() => openUpload(album.id)}
                        style={{
                          position: 'absolute', bottom: 18, right: 18,
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#1d2b4b', color: '#fff', border: 'none',
                          padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          opacity: 0, transition: 'all 0.2s', zIndex: 10,
                        }}
                        className="group-hover:opacity-100"
                        onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
                        <i className="fas fa-plus" style={{ color: '#fdb813' }} /> Add Photos
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}