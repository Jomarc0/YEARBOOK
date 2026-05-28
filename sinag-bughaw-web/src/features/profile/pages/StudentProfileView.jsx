import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { studentsApi } from '@/api/student.api';
import { profileApi } from '@/api/gallery.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import MessageModal from '@/components/feedback/MessageModal';
import ShareModal from '@/features/profile/components/ShareModal';
import PremiumBadge from '@/features/subscription/components/PremiumBadge';
import SubscriptionGate from '@/features/subscription/components/SubscriptionGate';
import StudentPhotosSection from '../components/StudentPhotosSection';
import PostContextMenu from '../components/PostContextMenu';
import VoiceNotesSection from '@/features/messaging/components/VoiceNotesSection';
import { imageUrl, avatarUrl as makeAvatar } from '@/utils/imageUrl';
import { recordProfileView } from '@/api/analytics.api';

const TABS = [
  { key: 'posts',        icon: 'fas fa-th',            label: 'POSTS'          },
  { key: 'tagged',       icon: 'fas fa-tag',            label: 'TAGGED'         },
  { key: 'academic',     icon: 'fas fa-graduation-cap', label: 'ACADEMIC'       },
  { key: 'achievements', icon: 'fas fa-award',          label: 'ACHIEVEMENTS'   },
  { key: 'voice',        icon: 'fas fa-microphone',     label: 'VOICE MEMORIES' },
];

const COURSE_SHORT = {
  'Bachelor of Science in Computer Science':       'BSCS',
  'Bachelor of Science in Information Technology': 'BSIT',
  'Bachelor of Science in Civil Engineering':      'BSCE',
  'Bachelor of Science in Mechanical Engineering': 'BSME',
  'Bachelor of Science in Nursing':                'BSN',
  'Bachelor of Science in Accountancy':            'BSA',
  'Bachelor of Science in Psychology':             'BSPsych',
  'Bachelor of Education':                         'BE',
};

// ─── Skeleton shimmer rows used inside locked previews ───────────────────────
function SkeletonRows({ count = 4, widths }) {
  const W = widths ?? [80, 60, 72, 45];
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 11, width: `${W[i % W.length]}%`, background: '#e2e8f0', borderRadius: 6 }} />
      ))}
    </div>
  );
}

// ─── Locked grid preview (posts) ─────────────────────────────────────────────
function LockedPostsPreview() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, borderRadius: 14, overflow: 'hidden' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{
          aspectRatio: '1/1',
          background: `hsl(${220 + i * 12}, ${16 + i * 2}%, ${88 - i * 2}%)`,
        }} />
      ))}
    </div>
  );
}

export default function StudentProfileView() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();
  const navigate           = useNavigate();

  const [student,      setStudent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [visibility,   setVisibility]   = useState(null);
  const [activeTab,    setActiveTab]    = useState('posts');
  const [showMsg,      setShowMsg]      = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [posts,        setPosts]        = useState([]);
  const [postsRestricted, setPostsRestricted] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [lightbox,     setLightbox]     = useState(null);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [toast,        setToast]        = useState(null);

  // Source of truth comes from the server via is_subscribed_viewer
  // Falls back to false until the student loads
  const canViewFull = student?.is_subscribed_viewer ?? false;

  // ── Fetch student ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    if (parseInt(id) === authUser?.id) {
      navigate('/profile', { replace: true });
      return;
    }
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => setStudent(data))
      .catch((err) => {
        const vis = err.response?.data?.visibility;
        if (vis) setVisibility(vis);
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, [id, authUser]);

  // ── Fetch posts when tab is active ────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'posts' && student) loadPosts();
  }, [activeTab, id, student]);

  // ── Record profile view when student loads ─────────────────────────────────
  useEffect(() => {
    if (!student) return;
    const timer = setTimeout(() => {
      recordProfileView(student.id).catch(() => {}); // fire-and-forget, silent fail
    }, 2000); // 2s debounce — only counts genuine visits
    return () => clearTimeout(timer);
  }, [student?.id]);
  
  const loadPosts = () => {
    setPostsLoading(true);
    profileApi.getPosts(id)
      .then(({ data }) => {
        // Backend returns { restricted: true } for free-tier viewers
        if (data.restricted) {
          setPostsRestricted(true);
          setPosts([]);
        } else {
          setPostsRestricted(false);
          setPosts(data.data?.data ?? data.data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  };

  const showToast = (msg, color = '#10b981') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePostDeleted = (photoId) => {
    setPosts(prev => prev.filter(p => p.id !== photoId));
    showToast('Post deleted.', '#ef4444');
    setContextMenu(null);
  };

  const handlePostUpdated = (updated) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    showToast('Post updated!');
    setContextMenu(null);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fe' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(63,81,181,0.2)', borderTopColor: '#1d2b4b', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  // ── Not found / private / alumni_only ─────────────────────────────────────
  if (!student) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f7fe', gap: 12 }}>
      <i
        className={`fas ${visibility === 'private' ? 'fa-lock' : visibility === 'alumni_only' ? 'fa-user-shield' : 'fa-user-slash'}`}
        style={{ fontSize: 48, color: '#e2e8f0' }}
      />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d2b4b', margin: 0 }}>
        {visibility === 'private'     && 'This profile is private.'}
        {visibility === 'alumni_only' && 'Log in to view this profile.'}
        {!visibility                  && 'Student not found.'}
      </h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
        {visibility === 'private'     && 'The student has restricted access to their profile.'}
        {visibility === 'alumni_only' && 'This profile is visible to logged-in users only.'}
      </p>
      <button
        onClick={() => navigate('/directory')}
        style={{ background: 'none', border: 'none', color: '#3f51b5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        ← Back to Directory
      </button>
    </div>
  );

  const batchYear   = student.section?.batch_year || new Date().getFullYear();
  const courseShort = COURSE_SHORT[student.course] || student.course?.match(/\b[A-Z]/g)?.join('') || 'Student';
  const avatar      = imageUrl(student.profile_picture) || makeAvatar(student.name);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fe', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .ig-post { cursor: pointer; }
        .ig-post:hover .ig-overlay { opacity: 1 !important; }
        .ig-post img, .ig-post video { transition: transform 0.4s ease; }
        .ig-post:hover img, .ig-post:hover video { transform: scale(1.05); }
        .nu-tab  { transition: all 0.15s; border: none; background: none; cursor: pointer; }
        .nu-tab:hover { color: #1d2b4b !important; }
        .nu-btn  { transition: all 0.15s; }
        .nu-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <Navbar />

      {/* ── Modals ── */}
      <MessageModal isOpen={showMsg}   onClose={() => setShowMsg(false)}   student={student} authUser={authUser} />
      <ShareModal   isOpen={showShare} onClose={() => setShowShare(false)} student={student} />

      {contextMenu && (
        <PostContextMenu
          post={contextMenu.post}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onDelete={handlePostDeleted}
          onUpdated={handlePostUpdated}
        />
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer' }}
          >
            <i className="fas fa-times" />
          </button>
          {lightbox.ai_metadata?.resource_type === 'video' ||
          lightbox.file_path?.match(/\.(mp4|mov|webm|avi)(\?|$)/i) ? (
            <video
              src={lightbox.file_path}
              controls
              autoPlay
              style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 8, outline: 'none', background: '#000' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.file_path}
              alt={lightbox.caption ?? ''}
              style={{ maxWidth: '88vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
              onClick={e => e.stopPropagation()}
            />
          )}
          {lightbox.caption && (
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 13, fontWeight: 500, background: 'rgba(0,0,0,0.55)', padding: '6px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {lightbox.caption}
            </div>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#1d2b4b', color: '#fff', padding: '10px 22px', borderRadius: 10, zIndex: 9000, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(29,43,75,0.25)', animation: 'toastIn 0.25s ease', whiteSpace: 'nowrap' }}>
          <i className="fas fa-check-circle" style={{ color: '#fdb813', marginRight: 8 }} />{toast.msg}
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 935, margin: '0 auto', padding: '32px 20px 64px', width: '100%', animation: 'fadeIn 0.35s ease' }}>

        {/* ══ PROFILE CARD ══════════════════════════════════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 16px rgba(29,43,75,0.08)', border: '1px solid #e8edf5' }}>

          {/* Cover banner */}
          <div style={{ height: 130, background: 'linear-gradient(135deg, #1d2b4b 0%, #2d4270 45%, #3f51b5 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, #fdb813 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(253,184,19,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            <button
              onClick={() => navigate(-1)}
              style={{ position: 'absolute', top: 16, left: 20, display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: 10 }} /> Back
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '0 32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>

              {/* Avatar */}
              <div style={{ position: 'relative', marginTop: -52, flexShrink: 0 }}>
                <div style={{ padding: 3, borderRadius: '50%', background: 'linear-gradient(135deg, #fdb813, #f59e0b)', display: 'inline-block' }}>
                  <div style={{ padding: 3, borderRadius: '50%', background: '#fff', display: 'inline-block' }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: '#1d2b4b' }}>
                      <img
                        src={avatar}
                        alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.src = makeAvatar(student.name); }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2.5px solid #fff' }} />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowMsg(true)}
                  className="nu-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d2b4b', color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <i className="fas fa-paper-plane" style={{ fontSize: 11, color: '#fdb813' }} /> Message
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  className="nu-btn"
                  style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Share Profile"
                >
                  <i className="fas fa-share-alt" />
                </button>
              </div>
            </div>

            {/* Name row — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: 0 }}>{student.name}</h1>
              {student.is_premium && <PremiumBadge size="sm" />}
              {canViewFull && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3f51b5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
                  PIONEER {batchYear}
                </span>
              )}
            </div>

            {/* Course — only for subscribed viewers */}
            {canViewFull && (
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', fontWeight: 500 }}>
                {student.course ?? 'Pioneer Student'} · National University Lipa
              </p>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 28, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              {[
                { value: canViewFull ? posts.length                  : '—',    label: 'Posts'      },
                { value: canViewFull ? (student.profile_views ?? 0)  : '—',    label: 'Views'      },
                { value: canViewFull ? courseShort                    : '🔒',   label: 'Program'    },
                { value: canViewFull ? (student.student_id ?? 'N/A') : '••••', label: 'Student ID' },
                { value: canViewFull ? batchYear                      : '—',    label: 'Batch'      },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1d2b4b', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bio — gated */}
            <SubscriptionGate
              isSubscribed={canViewFull}
              variant="inline"
              message="Subscribe to view this student's bio and personal quote."
              preview={
                <div style={{ borderLeft: '3px solid #fdb813', paddingLeft: 12 }}>
                  <SkeletonRows count={2} widths={[75, 50]} />
                </div>
              }
            >
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: '0 0 8px', fontStyle: 'italic', borderLeft: '3px solid #fdb813', paddingLeft: 12 }}>
                "{student.bio || 'No quote yet.'}"
              </p>
              {student.motto && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 12px', marginTop: 4 }}>
                  <i className="fas fa-quote-left" style={{ fontSize: 9, color: '#fdb813' }} />
                  <span style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>{student.motto}</span>
                </div>
              )}
            </SubscriptionGate>

            {/* Location — only subscribed */}
            {canViewFull && (
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#ef4444', fontSize: 10 }} /> Lipa City, Batangas
                </span>
                <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-university" style={{ color: '#3f51b5', fontSize: 10 }} /> NU Lipa
                </span>
              </div>
            )}

            {/* Free-tier upgrade nudge shown below the name when locked */}
            {!canViewFull && (
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px' }}>
                <i className="fas fa-lock" style={{ color: '#fdb813', fontSize: 11 }} />
                <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                  Full profile visible to Premium members.
                </span>
                <button
                  onClick={() => navigate('/payment')}
                  style={{ background: 'none', border: 'none', color: '#3f51b5', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Upgrade →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ TABS ══════════════════════════════════════════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 14, marginBottom: 4, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5', display: 'flex', overflow: 'hidden' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              className="nu-tab"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '14px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                color: activeTab === tab.key ? '#1d2b4b' : '#94a3b8',
                borderBottom: activeTab === tab.key ? '2px solid #1d2b4b' : '2px solid transparent',
                borderRight: i < TABS.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <i className={tab.icon} style={{ fontSize: 11, color: activeTab === tab.key ? '#fdb813' : 'inherit' }} />
              <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══ POSTS TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === 'posts' && (
          // postsRestricted is set when the API returns restricted:true (free viewer)
          // canViewFull mirrors is_subscribed_viewer from the student response
          // Both must align — we use postsRestricted as the gate here since it comes
          // directly from the posts endpoint response
          <SubscriptionGate
            isSubscribed={!postsRestricted && canViewFull}
            variant="full"
            message="Subscribe to view this student's posts, photos, and memories."
            preview={<LockedPostsPreview />}
          >
            {postsLoading ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '64px 0', textAlign: 'center', boxShadow: '0 1px 4px rgba(29,43,75,0.06)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(29,43,75,0.1)', borderTopColor: '#1d2b4b', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              </div>
            ) : posts.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '72px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid #1d2b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                  <i className="fas fa-camera" style={{ color: '#1d2b4b' }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d2b4b', margin: '0 0 8px' }}>No Posts Yet</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Share your pioneer memories with your batchmates.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(29,43,75,0.06)' }}>
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="ig-post"
                    style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#1d2b4b' }}
                    onClick={() => !contextMenu && setLightbox(post)}
                    onContextMenu={e => {
                      e.preventDefault();
                      setContextMenu({ post, x: e.clientX, y: e.clientY });
                    }}
                  >
                    {post.ai_metadata?.resource_type === 'video' ? (
                      <video src={post.file_path} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted />
                    ) : (
                      <img src={post.file_path} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                    <div className="ig-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(29,43,75,0.55)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}><i className="fas fa-heart" style={{ marginRight: 5, color: '#fdb813' }} />0</span>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}><i className="fas fa-comment" style={{ marginRight: 5, color: '#fdb813' }} />0</span>
                    </div>
                    {post.caption && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(29,43,75,0.85))', padding: '24px 10px 10px', fontSize: 11, color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>
                        {post.caption.length > 38 ? post.caption.slice(0, 38) + '…' : post.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubscriptionGate>
        )}

        {/* ══ TAGGED TAB ════════════════════════════════════════════════════════ */}
        {activeTab === 'tagged' && (
          <SubscriptionGate
            isSubscribed={canViewFull}
            variant="full"
            message="Subscribe to view tagged photos."
            preview={
              <div style={{ background: '#fff', borderRadius: 14, padding: 24 }}>
                <SkeletonRows count={4} />
              </div>
            }
          >
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 16, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-tag" style={{ color: '#fdb813' }} /> Tagged Photos
              </h4>
              <StudentPhotosSection userId={parseInt(id)} compact />
            </div>
          </SubscriptionGate>
        )}

        {/* ══ ACADEMIC TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'academic' && (
          <SubscriptionGate
            isSubscribed={canViewFull}
            variant="full"
            message="Subscribe to view academic information."
            preview={
              <div style={{ background: '#fff', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ height: 9, width: '40%', background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ height: 13, width: '65%', background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 20, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} /> Academic Info
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Course',     value: student.course || 'N/A',    icon: 'fa-book'         },
                  { label: 'Year Level', value: student.year_level ? `${student.year_level}th Year` : '4th Year', icon: 'fa-layer-group' },
                  { label: 'Status',     value: 'Enrolled',                 icon: 'fa-circle-check', green: true },
                  { label: 'Batch',      value: batchYear,                  icon: 'fa-calendar'     },
                ].map(row => (
                  <div key={row.label} style={{ padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className={`fas ${row.icon}`} style={{ fontSize: 9, color: '#fdb813' }} /> {row.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: row.green ? '#22c55e' : '#1d2b4b' }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Membership</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b' }}>{student.is_premium ? 'Premium' : 'Free Plan'}</div>
                </div>
                {student.is_premium ? <PremiumBadge size="sm" /> : <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Free Plan</span>}
              </div>
            </div>
          </SubscriptionGate>
        )}

        {/* ══ ACHIEVEMENTS TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'achievements' && (
          <SubscriptionGate
            isSubscribed={canViewFull}
            variant="full"
            message="Subscribe to view this student's achievements."
            preview={
              <div style={{ background: '#fff', borderRadius: 14, padding: 24 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f1f5f9', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 11, width: '55%', background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ height: 9,  width: '35%', background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 20, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-award" style={{ color: '#fdb813' }} /> Achievements
              </h4>
              {/* Replace MOCK_ACHIEVEMENTS with real data from studentsApi.getAchievements if available */}
              {[
                { title: 'Sinag-Bughaw Developer', subtitle: 'Capstone Project 2026',       icon: 'fa-code',      color: '#3f51b5' },
                { title: 'Tech Innovator Award',   subtitle: 'NU Lipa Exhibit',             icon: 'fa-lightbulb', color: '#f59e0b' },
                { title: "Dean's Lister",          subtitle: '1st Semester A.Y. 2025–2026', icon: 'fa-star',      color: '#fdb813' },
              ].map((a, i, arr) => (
                <div key={a.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: '#f8fafc', border: '1px solid #e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas ${a.icon}`} style={{ color: a.color, fontSize: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2b4b', marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.subtitle}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#e2e8f0', fontSize: 11, marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          </SubscriptionGate>
        )}

        {/* ══ VOICE MEMORIES TAB ════════════════════════════════════════════════ */}
        {activeTab === 'voice' && (
          <SubscriptionGate
            isSubscribed={canViewFull}
            variant="full"
            message="Subscribe to listen to voice memories."
            preview={
              <div style={{ background: '#fff', borderRadius: 14, padding: 24 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, width: '60%', background: '#e2e8f0', borderRadius: 4, marginBottom: 5 }} />
                      <div style={{ height: 6, width: '80%', background: '#f1f5f9', borderRadius: 20 }} />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
              <VoiceNotesSection profileUser={student} isOwnProfile={false} />
            </div>
          </SubscriptionGate>
        )}

      </main>

      <Footer />
    </div>
  );
}