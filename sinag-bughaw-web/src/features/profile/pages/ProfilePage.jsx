import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentsApi } from '@/api/student.api';
import { profileApi } from '@/api/gallery.api';
import { yearbookApi } from '@/api/yearbook.api';
import { storageUrl } from '@/api/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PremiumBadge from '@/features/subscription/components/PremiumBadge';
import StudentPhotosSection from '../components/StudentPhotosSection';
import ProfileUploadModal from '../components/ProfileUploadModal';
import PostContextMenu from '../components/PostContextMenu';
import ShareModal from '../components/ShareModal';

const TABS = [
  { key: 'posts',        icon: 'fas fa-th',            label: 'POSTS'        },
  { key: 'tagged',       icon: 'fas fa-tag',            label: 'TAGGED'       },
  { key: 'academic',     icon: 'fas fa-graduation-cap', label: 'ACADEMIC'     },
  { key: 'achievements', icon: 'fas fa-award',          label: 'ACHIEVEMENTS' },
];

export default function ProfilePage() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();

  const [student,      setStudent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [bio,          setBio]          = useState('');
  const [editing,      setEditing]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('posts');
  const [showUpload,   setShowUpload]   = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [posts,        setPosts]        = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [lightbox,     setLightbox]     = useState(null);

  const fileRef   = useRef();
  const isOwn     = authUser?.id === parseInt(id);
  const isPremium = authUser?.is_premium || authUser?.tier === 'premium' || authUser?.tier === 'standard';

  useEffect(() => {
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => { setStudent(data); setBio(data.bio ?? ''); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
  }, [activeTab, id]);

  const loadPosts = () => {
    setPostsLoading(true);
    profileApi.getPosts(id)
      .then(({ data }) => setPosts(data.data?.data ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  };

  const showToast = (msg, color = '#10b981') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const saveBio = async () => {
    await studentsApi.updateBio(bio);
    setStudent(prev => ({ ...prev, bio }));
    setEditing(false);
    showToast('Bio updated!');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await studentsApi.updatePhoto(formData);
    setStudent(prev => ({ ...prev, profile_picture: data.profile_picture }));
    showToast('Profile photo updated!');
  };

  const downloadPdf = async () => {
    const { data } = await yearbookApi.exportStudentPdf(id);
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url; a.download = `profile-${student?.student_id}.pdf`; a.click();
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fe' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(63,81,181,0.2)', borderTopColor: '#1d2b4b', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!student) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
      Student not found.
    </div>
  );

  const avatar = storageUrl(student.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true&size=400`;

  const courseShort = student.course?.match(/\b[A-Z]/g)?.join('') ?? 'Student';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fe', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .ig-post { cursor:pointer; }
        .ig-post:hover .ig-overlay { opacity:1 !important; }
        .ig-post:hover .ig-menu-btn { opacity:1 !important; }
        .ig-post img, .ig-post video { transition: transform 0.4s ease; }
        .ig-post:hover img, .ig-post:hover video { transform: scale(1.05); }
        .nu-tab { transition: all 0.15s; border: none; background: none; cursor: pointer; }
        .nu-tab:hover { color: #1d2b4b !important; }
        .nu-btn { transition: all 0.15s; }
        .nu-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <Navbar />

      {/* Modals */}
      {showUpload && <ProfileUploadModal onClose={() => setShowUpload(false)} onSuccess={loadPosts} />}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} student={student} />
      {contextMenu && (
        <PostContextMenu
          post={contextMenu.post}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onDelete={handlePostDeleted}
          onUpdated={handlePostUpdated}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer' }}>
            <i className="fas fa-times" />
          </button>
          <img src={lightbox.file_path} alt={lightbox.caption} style={{ maxWidth: '88vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          {lightbox.caption && (
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 13, fontWeight: 500, background: 'rgba(0,0,0,0.55)', padding: '6px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {lightbox.caption}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#1d2b4b', color: '#fff', padding: '10px 22px', borderRadius: 10, zIndex: 9000, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(29,43,75,0.25)', animation: 'toastIn 0.25s ease', whiteSpace: 'nowrap' }}>
          <i className="fas fa-check-circle" style={{ color: '#fdb813', marginRight: 8 }} />{toast.msg}
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 935, margin: '0 auto', padding: '32px 20px 64px', width: '100%', animation: 'fadeIn 0.35s ease' }}>

        {/* ══ PROFILE CARD ══ */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 16px rgba(29,43,75,0.08)', border: '1px solid #e8edf5' }}>

          {/* Cover banner */}
          <div style={{ height: 130, background: 'linear-gradient(135deg, #1d2b4b 0%, #2d4270 45%, #3f51b5 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, #fdb813 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(253,184,19,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>

              {/* Avatar with NU gold ring */}
              <div style={{ position: 'relative', marginTop: -52, flexShrink: 0 }}>
                <div style={{ padding: 3, borderRadius: '50%', background: 'linear-gradient(135deg, #fdb813, #f59e0b)', display: 'inline-block' }}>
                  <div style={{ padding: 3, borderRadius: '50%', background: '#fff', display: 'inline-block' }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: '#1d2b4b', cursor: isOwn ? 'pointer' : 'default' }}
                      onClick={() => isOwn && fileRef.current.click()}>
                      <img src={avatar} alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true`; }}
                      />
                    </div>
                  </div>
                </div>
                {/* Online dot */}
                <div style={{ position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2.5px solid #fff' }} />
                {isOwn && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                    <button onClick={() => fileRef.current.click()} style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', background: 'rgba(29,43,75,0.82)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none', borderRadius: 20, padding: '2px 9px', fontSize: 9, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                      CHANGE
                    </button>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isOwn ? (
                  <>
                    {/* Premium / Upgrade button */}
                    {isPremium ? (
                      <Link to="/premium" className="nu-btn" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #fdb813, #f59e0b)',
                        color: '#1d2b4b', textDecoration: 'none',
                        padding: '8px 16px', borderRadius: 10,
                        fontSize: 12, fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(253,184,19,0.35)',
                      }}>
                        <i className="fas fa-crown" style={{ fontSize: 10 }} /> Premium Active
                      </Link>
                    ) : (
                      <Link to="/premium" className="nu-btn" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #fdb813, #f59e0b)',
                        color: '#1d2b4b', textDecoration: 'none',
                        padding: '8px 16px', borderRadius: 10,
                        fontSize: 12, fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(253,184,19,0.3)',
                      }}>
                        <i className="fas fa-crown" style={{ fontSize: 10 }} /> Go Premium
                      </Link>
                    )}

                    <Link to="/settings" className="nu-btn" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f1f5f9', color: '#1d2b4b', textDecoration: 'none',
                      padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: '1px solid #e2e8f0',
                    }}>
                      <i className="fas fa-edit" style={{ fontSize: 10 }} /> Edit Profile
                    </Link>

                    <button onClick={() => setShowUpload(true)} className="nu-btn" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#1d2b4b', color: '#fff', border: 'none',
                      padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <i className="fas fa-plus" style={{ color: '#fdb813', fontSize: 10 }} /> Add Post
                    </button>
                  </>
                ) : (
                  <>
                    <button className="nu-btn" style={{ padding: '8px 22px', borderRadius: 10, border: 'none', background: '#1d2b4b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <i className="fas fa-paper-plane" style={{ marginRight: 6, fontSize: 11 }} />Message
                    </button>
                  </>
                )}

                <button onClick={() => setShowShare(true)} className="nu-btn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-share-alt" />
                </button>
                <button onClick={downloadPdf} className="nu-btn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-download" />
                </button>
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1d2b4b', margin: 0 }}>{student.name}</h1>
              {student.is_premium && <PremiumBadge size="sm" />}
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3f51b5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
                PIONEER 2026
              </span>
            </div>

            {/* Course */}
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', fontWeight: 500 }}>
              {student.course ?? 'Pioneer Student'} · National University Lipa
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 28, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              {[
                { value: posts.length,                label: 'Posts'      },
                { value: student.profile_views ?? 0,  label: 'Views'      },
                { value: courseShort,                  label: 'Program'    },
                { value: student.student_id ?? 'N/A', label: 'Student ID' },
                { value: '2026',                       label: 'Batch'      },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1d2b4b', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bio */}
            {editing ? (
              <div style={{ marginBottom: 12 }}>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Write your yearbook quote..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, resize: 'none', border: '1.5px solid #3f51b5', fontFamily: 'inherit', fontSize: 13, color: '#1d2b4b', outline: 'none', boxSizing: 'border-box' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={saveBio} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1d2b4b', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <p onClick={() => isOwn && setEditing(true)}
                style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: '0 0 8px', fontStyle: 'italic', cursor: isOwn ? 'pointer' : 'default', borderLeft: '3px solid #fdb813', paddingLeft: 12 }}>
                "{student.bio || (isOwn ? 'Click to add your yearbook quote...' : 'No quote yet.')}"
                {isOwn && <i className="fas fa-pencil-alt" style={{ marginLeft: 8, fontSize: 9, color: '#cbd5e1' }} />}
              </p>
            )}

            {student.motto && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 12px', marginTop: 4 }}>
                <i className="fas fa-quote-left" style={{ fontSize: 9, color: '#fdb813' }} />
                <span style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>{student.motto}</span>
              </div>
            )}

            {/* Location */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#ef4444', fontSize: 10 }} /> Lipa City, Batangas
              </span>
              <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="fas fa-university" style={{ color: '#3f51b5', fontSize: 10 }} /> NU Lipa
              </span>
            </div>
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div style={{ background: '#fff', borderRadius: 14, marginBottom: 4, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5', display: 'flex', overflow: 'hidden' }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} className="nu-tab"
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ POSTS TAB ══ */}
        {activeTab === 'posts' && (
          <div>
            {/* Upload bar */}
            {isOwn && (
              <div onClick={() => setShowUpload(true)}
                style={{ background: '#fff', borderRadius: 14, padding: '10px 14px', marginBottom: 4, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,43,75,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(29,43,75,0.06)'}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#1d2b4b', border: '2px solid #e2e8f0' }}>
                  <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true`; }} />
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#94a3b8', background: '#f8fafc', borderRadius: 20, padding: '9px 16px', border: '1px solid #e2e8f0' }}>
                  Share a memory, {student.name?.split(' ')[0]}...
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1d2b4b', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  <i className="fas fa-cloud-arrow-up" style={{ color: '#fdb813' }} /> Upload
                </button>
              </div>
            )}

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
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>Share your pioneer memories with your batchmates.</p>
                {isOwn && (
                  <button onClick={() => setShowUpload(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d2b4b', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <i className="fas fa-plus" style={{ color: '#fdb813' }} /> Share First Post
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(29,43,75,0.06)' }}>
                {posts.map(post => (
                  <div key={post.id} className="ig-post"
                    style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#1d2b4b' }}
                    onClick={() => !contextMenu && setLightbox(post)}
                  >
                    {post.ai_metadata?.resource_type === 'video' ? (
                      <video src={post.file_path} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted />
                    ) : (
                      <img src={post.file_path} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}

                    {/* Hover overlay */}
                    <div className="ig-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(29,43,75,0.55)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}><i className="fas fa-heart" style={{ marginRight: 5, color: '#fdb813' }} />0</span>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}><i className="fas fa-comment" style={{ marginRight: 5, color: '#fdb813' }} />0</span>
                    </div>

                    {/* Badges */}
                    {post.ai_metadata?.resource_type === 'video' && (
                      <i className="fas fa-play-circle" style={{ position: 'absolute', top: 8, right: 8, color: '#fff', fontSize: 16, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }} />
                    )}
                    {post.tagged_students?.length > 0 && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(29,43,75,0.75)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fas fa-user-tag" style={{ color: '#fdb813', fontSize: 9 }} />
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{post.tagged_students.length}</span>
                      </div>
                    )}

                    {/* Menu button */}
                    {isOwn && (
                      <button className="ig-menu-btn"
                        onClick={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setContextMenu({ post, x: rect.left, y: rect.bottom + 6 }); }}
                        style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 7, background: 'rgba(29,43,75,0.75)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: 0, transition: 'opacity 0.18s', zIndex: 2 }}>
                        <i className="fas fa-ellipsis-v" />
                      </button>
                    )}

                    {/* Caption */}
                    {post.caption && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(29,43,75,0.85))', padding: '24px 10px 10px', fontSize: 11, color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>
                        {post.caption.length > 38 ? post.caption.slice(0, 38) + '…' : post.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAGGED TAB ══ */}
        {activeTab === 'tagged' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 16, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-tag" style={{ color: '#fdb813' }} /> Tagged Photos
            </h4>
            <StudentPhotosSection userId={parseInt(id)} compact />
          </div>
        )}

        {/* ══ ACADEMIC TAB ══ */}
        {activeTab === 'academic' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 20, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} /> Academic Info
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Student ID', value: student.student_id ?? 'N/A', icon: 'fa-id-card'      },
                { label: 'Course',     value: student.course ?? 'N/A',     icon: 'fa-book'          },
                { label: 'Year Level', value: '4th Year',                  icon: 'fa-layer-group'   },
                { label: 'Status',     value: 'Enrolled',                  icon: 'fa-circle-check', green: true },
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
              {student.is_premium
                ? <PremiumBadge size="sm" />
                : <Link to="/premium" style={{ fontSize: 11, fontWeight: 700, color: '#fdb813', textDecoration: 'none', background: '#1d2b4b', padding: '5px 12px', borderRadius: 8 }}>Upgrade →</Link>
              }
            </div>
          </div>
        )}

        {/* ══ ACHIEVEMENTS TAB ══ */}
        {activeTab === 'achievements' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(29,43,75,0.06)', border: '1px solid #e8edf5' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1d2b4b', marginBottom: 20, marginTop: 0, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-award" style={{ color: '#fdb813' }} /> Achievements
            </h4>
            {[
              { t: 'Sinag-Bughaw Developer', s: 'Capstone Project 2026',       icon: 'fa-code',      color: '#3f51b5' },
              { t: 'Tech Innovator Award',   s: 'NU Lipa Exhibit',              icon: 'fa-lightbulb', color: '#f59e0b' },
              { t: "Dean's Lister",          s: '1st Semester A.Y. 2025–2026', icon: 'fa-star',      color: '#fdb813' },
            ].map((a, i, arr) => (
              <div key={a.t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: '#f8fafc', border: '1px solid #e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${a.icon}`} style={{ color: a.color, fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2b4b', marginBottom: 2 }}>{a.t}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.s}</div>
                </div>
                <i className="fas fa-chevron-right" style={{ color: '#e2e8f0', fontSize: 11, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}