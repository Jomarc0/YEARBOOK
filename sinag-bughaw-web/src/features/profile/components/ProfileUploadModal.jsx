import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileUpload } from '../hooks/useProfileUpload';
import TagPeopleSearch from './TagPeopleSearch';
import { Link } from 'react-router-dom';

export default function ProfileUploadModal({ onClose, onSuccess }) {
  const { user: authUser } = useAuth();

  const tierKey = authUser?.tier === 'premium'
    ? 'premium'
    : authUser?.tier === 'standard' || authUser?.plan === 'premium'
      ? 'premium_standard'
      : 'free';

  const {
    fileRef, preview,
    caption,    setCaption,
    visibility, setVisibility,
    taggedUsers, tagUser, untagUser,
    uploading, progress, error,
    canUpload,
    handleFileChange, upload, reset,
  } = useProfileUpload(() => { onSuccess?.(); onClose(); }, tierKey);

  const isVideo = preview?.file?.type?.startsWith('video/');

  const visOpts = [
    { value: 'public',  icon: 'fa-globe',       label: 'Public'  },
    { value: 'friends', icon: 'fa-user-friends', label: 'Friends' },
    { value: 'private', icon: 'fa-lock',         label: 'Only Me' },
  ];

  return (
    <>
      <style>{`
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
        @keyframes modalSlide {
          from { opacity:0; transform:translate(-50%,-46%) scale(0.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(10,16,30,0.7)', backdropFilter: 'blur(6px)',
        animation: 'backdropIn 0.2s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: '100%', maxWidth: 500,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        animation: 'modalSlide 0.25s cubic-bezier(0.34,1.3,0.64,1)',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e2d4f 100%)',
          padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(253,184,19,0.15)',
              border: '1px solid rgba(253,184,19,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-camera" style={{ color: '#fdb813', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Share a Memory</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.04em' }}>
                {canUpload
                  ? tierKey === 'premium' ? 'Premium HD · 4K uploads enabled' : 'Standard HD · HD uploads enabled'
                  : 'Premium feature'
                }
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>

          {/* ── FREE GATE ──────────────────────────────────────────────────── */}
          {!canUpload ? (
            <div style={{ textAlign: 'center', padding: '20px 8px 8px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'linear-gradient(135deg,#f0f3fa,#e8edf5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fas fa-crown" style={{ fontSize: 24, color: '#fdb813' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Premium Required</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
                Uploading photos and videos is available for subscribers. Upgrade to share your memories.
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Free',      icon: 'fa-eye',    desc: 'View only',       color: '#94a3b8', bg: '#f8fafc' },
                  { label: 'Standard',  icon: 'fa-bolt',   desc: 'HD Photos + Video', color: '#3f51b5', bg: '#eef2ff', highlight: true },
                  { label: 'Premium HD',icon: 'fa-crown',  desc: '4K + 10 GB',       color: '#d97706', bg: '#fffbeb', highlight: true },
                ].map(t => (
                  <div key={t.label} style={{
                    flex: 1, borderRadius: 12, padding: '14px 8px', textAlign: 'center',
                    border: t.highlight ? `1.5px solid ${t.color}30` : '1.5px solid #e2e8f0',
                    background: t.bg,
                  }}>
                    <i className={`fas ${t.icon}`} style={{ color: t.color, fontSize: 18, marginBottom: 8, display: 'block' }} />
                    <div style={{ fontSize: 11, fontWeight: 800, color: t.color, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <Link to="/subscription" onClick={onClose} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#fdb813,#f59e0b)',
                color: '#1d2b4b', textDecoration: 'none',
                padding: '11px 28px', borderRadius: 10,
                fontSize: 13, fontWeight: 800,
                boxShadow: '0 4px 16px rgba(253,184,19,0.35)',
              }}>
                <i className="fas fa-crown" style={{ fontSize: 11 }} /> Upgrade Now
              </Link>
              <button onClick={onClose} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>

          ) : (
            /* ── UPLOAD FORM ─────────────────────────────────────────────── */
            <>
              {/* Drop zone */}
              {!preview ? (
                <div
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: '2px dashed #e2e8f0', borderRadius: 14,
                    padding: '36px 20px', textAlign: 'center',
                    cursor: 'pointer', background: '#f8fafc',
                    transition: 'all 0.18s', marginBottom: 14,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d2b4b'; e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <input
                    ref={fileRef} type="file" hidden
                    accept="image/jpeg,image/png,image/webp,image/heic,image/gif,video/mp4,video/quicktime"
                    onChange={handleFileChange}
                  />
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
                    background: '#1d2b4b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813', fontSize: 20 }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    Click to upload
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                    JPEG · PNG · WebP · GIF · HEIC · MP4 · MOV
                    <br />Max 50 MB per file
                  </div>
                </div>
              ) : (
                <div style={{ borderRadius: 14, overflow: 'hidden', background: '#0f172a', position: 'relative', marginBottom: 14 }}>
                  {isVideo
                    ? <video src={preview.url} controls style={{ width: '100%', maxHeight: 240, display: 'block' }} />
                    : <img src={preview.url} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
                  }
                  <button onClick={reset} style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-times" />
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  }}>
                    <i className={`fas ${isVideo ? 'fa-video' : 'fa-image'}`} style={{ marginRight: 4 }} />
                    {preview.name.length > 28 ? preview.name.slice(0, 28) + '…' : preview.name}
                  </div>
                </div>
              )}

              {/* Caption */}
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption or memory..."
                rows={2}
                style={{
                  width: '100%', padding: '11px 13px', marginBottom: 12,
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  resize: 'none', fontFamily: 'inherit', fontSize: 13,
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s', background: '#fafafa',
                }}
                onFocus={e => e.target.style.borderColor = '#1d2b4b'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />

              {/* Tag people */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-user-tag" style={{ color: '#fdb813' }} /> Tag People
                </div>
                <TagPeopleSearch tagged={taggedUsers} onTag={tagUser} onUntag={untagUser} excludeId={authUser?.id} />
              </div>

              {/* Visibility */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Visibility
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {visOpts.map(opt => (
                    <button key={opt.value} onClick={() => setVisibility(opt.value)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                      border: visibility === opt.value ? '2px solid #1d2b4b' : '1.5px solid #e2e8f0',
                      background: visibility === opt.value ? '#f0f3fa' : '#fafafa',
                      color: visibility === opt.value ? '#1d2b4b' : '#94a3b8',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      transition: 'all 0.12s', letterSpacing: '0.03em',
                    }}>
                      <i className={`fas ${opt.icon}`} style={{ fontSize: 10 }} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: 12, padding: '9px 12px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, fontSize: 12, color: '#dc2626',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <i className="fas fa-circle-exclamation" /> {error}
                </div>
              )}

              {/* Progress */}
              {uploading && progress > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                    <span>Uploading to Cloudinary...</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg, #1d2b4b, #3f51b5)',
                      width: `${progress}%`, transition: 'width 0.25s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  Cancel
                </button>
                <button
                  onClick={upload}
                  disabled={!preview || uploading}
                  style={{
                    flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                    background: !preview || uploading ? '#e2e8f0' : 'linear-gradient(135deg,#1d2b4b,#2d4270)',
                    color: !preview || uploading ? '#94a3b8' : '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: !preview || uploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {uploading
                    ? <><i className="fas fa-spinner fa-spin" /> Uploading...</>
                    : <><i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} /> Post to Profile</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}