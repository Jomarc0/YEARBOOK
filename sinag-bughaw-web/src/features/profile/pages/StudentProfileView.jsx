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

const TABS = [
  { key: 'posts',        icon: 'fas fa-th-large',       label: 'Posts'          },
  { key: 'tagged',       icon: 'fas fa-tag',             label: 'Tagged'         },
  { key: 'academic',     icon: 'fas fa-graduation-cap',  label: 'Academic'       },
  { key: 'achievements', icon: 'fas fa-award',           label: 'Achievements'   },
  { key: 'voice',        icon: 'fas fa-microphone',      label: 'Voice Memories' },
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

function SkeletonBlock({ w = '60%', h = 11 }) {
  return <div className="rounded-md bg-slate-200 animate-pulse" style={{ width: w, height: h }} />;
}

function LockedGrid() {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse"
          style={{ background: `hsl(${220 + i * 10}, ${14 + i * 2}%, ${88 - i * 2}%)` }} />
      ))}
    </div>
  );
}

export default function StudentProfileView() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();
  const navigate           = useNavigate();

  const [student,          setStudent]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [visibility,       setVisibility]       = useState(null);
  const [activeTab,        setActiveTab]        = useState('posts');
  const [showMsg,          setShowMsg]          = useState(false);
  const [showShare,        setShowShare]        = useState(false);
  const [posts,            setPosts]            = useState([]);
  const [postsRestricted,  setPostsRestricted]  = useState(false);
  const [postsLoading,     setPostsLoading]     = useState(false);
  const [lightbox,         setLightbox]         = useState(null);
  const [contextMenu,      setContextMenu]      = useState(null);
  const [toast,            setToast]            = useState(null);

  // ── Achievements state ────────────────────────────────────────────────────
  const [achievements,   setAchievements]   = useState([]);
  const [achieveLoading, setAchieveLoading] = useState(false);

  const canViewFull = student?.is_subscribed_viewer ?? false;

  useEffect(() => {
    if (!id) return;
    if (parseInt(id) === authUser?.id) { navigate('/profile', { replace: true }); return; }
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => setStudent(data))
      .catch(err => { setVisibility(err.response?.data?.visibility ?? null); setStudent(null); })
      .finally(() => setLoading(false));
  }, [id, authUser]);

  useEffect(() => {
    if (activeTab === 'posts' && student) loadPosts();
  }, [activeTab, id, student]);

  // ── Load achievements when tab is opened and user can view ────────────────
  useEffect(() => {
    if (activeTab === 'achievements' && canViewFull && id) loadAchievements();
  }, [activeTab, id, canViewFull]);

  const loadPosts = () => {
    setPostsLoading(true);
    profileApi.getPosts(id)
      .then(({ data }) => {
        if (data.restricted) { setPostsRestricted(true); setPosts([]); }
        else { setPostsRestricted(false); setPosts(data.data?.data ?? data.data ?? []); }
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  };

  // FIX: fetch real achievements from DB instead of showing hardcoded fake data
  const loadAchievements = () => {
    setAchieveLoading(true);
    studentsApi.getAchievements(id)
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        if (Array.isArray(data) && data.length) {
          setAchievements(data.map(a => {
            let meta = {};
            try { meta = JSON.parse(a.type || '{}'); } catch {}
            return {
              id:    a.id,
              title: a.title,
              sub:   a.subtitle ?? '',
              icon:  meta.icon  ?? 'fa-star',
              color: meta.color ?? '#fdb813',
            };
          }));
        } else {
          setAchievements([]);
        }
      })
      .catch(() => setAchievements([]))
      .finally(() => setAchieveLoading(false));
  };

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePostDeleted = (pid) => { setPosts(p => p.filter(x => x.id !== pid)); showToastMsg('Post deleted.', 'error'); setContextMenu(null); };
  const handlePostUpdated = (u)   => { setPosts(p => p.map(x => x.id === u.id ? { ...x, ...u } : x)); showToastMsg('Updated!'); setContextMenu(null); };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fe]">
      <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 border-t-[#1d2b4b] animate-spin" />
    </div>
  );

  // ── Not found / private ────────────────────────────────────────────────────
  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fe] gap-3 px-4 text-center">
      <i className={`fas ${visibility === 'private' ? 'fa-lock' : visibility === 'alumni_only' ? 'fa-user-shield' : 'fa-user-slash'} text-5xl text-slate-200`} />
      <h2 className="text-lg font-black text-[#1d2b4b] m-0">
        {visibility === 'private'     ? 'This profile is private.'         : ''}
        {visibility === 'alumni_only' ? 'Log in to view this profile.'     : ''}
        {!visibility                  ? 'Student not found.'               : ''}
      </h2>
      <p className="text-sm text-slate-400 m-0">
        {visibility === 'private'     ? 'The student has restricted access to their profile.' : ''}
        {visibility === 'alumni_only' ? 'This profile is visible to logged-in users only.'   : ''}
      </p>
      <button onClick={() => navigate('/directory')}
        className="bg-transparent border-none text-[#3f51b5] text-sm font-semibold cursor-pointer">
        ← Back to Directory
      </button>
    </div>
  );

  const batchYear   = student.section?.batch_year || new Date().getFullYear();
  const courseShort = COURSE_SHORT[student.course] || student.course?.match(/\b[A-Z]/g)?.join('') || 'Student';
  const avatar      = imageUrl(student.profile_picture) || makeAvatar(student.name);

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col font-sans">
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .post-cell:hover .post-overlay { opacity: 1 !important; }
        .post-cell:hover img, .post-cell:hover video { transform: scale(1.04); }
        .post-cell img, .post-cell video { transition: transform 0.35s ease; }
      `}</style>

      <Navbar />

      <MessageModal isOpen={showMsg}   onClose={() => setShowMsg(false)}   student={student} authUser={authUser} />
      <ShareModal   isOpen={showShare} onClose={() => setShowShare(false)} student={student} />
      {contextMenu && (
        <PostContextMenu post={contextMenu.post} position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)} onDelete={handlePostDeleted} onUpdated={handlePostUpdated} />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-5 right-6 bg-transparent border-none text-white text-2xl cursor-pointer opacity-75 hover:opacity-100 transition">
            <i className="fas fa-times" />
          </button>
          {lightbox.file_path?.match(/\.(mp4|mov|webm)(\?|$)/i)
            ? <video src={lightbox.file_path} controls autoPlay className="max-w-[88vw] max-h-[88vh] rounded-lg" onClick={e => e.stopPropagation()} />
            : <img   src={lightbox.file_path} alt={lightbox.caption ?? ''} className="max-w-[88vw] max-h-[88vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          }
          {lightbox.caption && (
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/55 px-5 py-2 rounded-full whitespace-nowrap">
              {lightbox.caption}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 z-[9000] px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl
                         whitespace-nowrap flex items-center gap-2
                         ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1d2b4b] text-white'}`}
          style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease' }}>
          <i className={`fas ${toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'} text-[#fdb813]`} />
          {toast.msg}
        </div>
      )}

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8 animate-[fadeUp_0.35s_ease]">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm border border-slate-100">

          {/* Cover */}
          <div className="h-28 sm:h-36 relative overflow-hidden bg-gradient-to-br from-[#1d2b4b] via-[#2d4270] to-[#3f51b5]">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(circle, #fdb813 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#fdb813]/5" />
            {/* Back button */}
            <button onClick={() => navigate(-1)}
              className="absolute top-4 left-5 flex items-center gap-1.5 text-white/75 hover:text-white bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-1.5 cursor-pointer text-xs font-semibold transition border-none">
              <i className="fas fa-arrow-left text-[10px]" /> Back
            </button>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex items-end justify-between mb-4 -mt-12 sm:-mt-14">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-[#fdb813] to-amber-500 inline-block">
                  <div className="p-[3px] rounded-full bg-white inline-block">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#1d2b4b]">
                      <img src={avatar} alt={student.name} className="w-full h-full object-cover block"
                        onError={e => { e.currentTarget.src = makeAvatar(student.name); }} />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-14 sm:pt-16">
                <button onClick={() => setShowMsg(true)}
                  className="inline-flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#162038] text-white px-5 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition">
                  <i className="fas fa-paper-plane text-[#fdb813] text-xs" /> Message
                </button>
                <button onClick={() => setShowShare(true)}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer flex items-center justify-center transition text-sm">
                  <i className="fas fa-share-alt" />
                </button>
              </div>
            </div>

            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-[#1d2b4b] m-0 leading-none">{student.name}</h1>
              {student.is_premium && <PremiumBadge size="sm" />}
              {canViewFull && (
                <span className="text-[10px] font-bold text-[#3f51b5] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full tracking-wide">
                  PIONEER {batchYear}
                </span>
              )}
            </div>

            {canViewFull && (
              <p className="text-sm text-slate-500 font-medium mb-4">
                {student.course ?? 'Pioneer Student'} · National University Lipa
              </p>
            )}

            {/* Stats */}
            <div className="flex gap-6 flex-wrap mb-4 pb-4 border-b border-slate-100">
              {[
                { value: canViewFull ? posts.length                  : '—',    label: 'Posts'   },
                { value: canViewFull ? (student.profile_views ?? 0)  : '—',    label: 'Views'   },
                { value: canViewFull ? courseShort                    : '🔒',   label: 'Program' },
                { value: canViewFull ? (student.student_id ?? 'N/A') : '••••', label: 'ID'      },
                { value: canViewFull ? batchYear                      : '—',    label: 'Batch'   },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-black text-[#1d2b4b] m-0 leading-none">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 m-0">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio — gated */}
            <SubscriptionGate isSubscribed={canViewFull} variant="inline"
              message="Subscribe to view this student's bio and personal quote."
              preview={
                <div className="pl-3 border-l-[3px] border-[#fdb813] space-y-2 py-1">
                  <SkeletonBlock w="75%" /><SkeletonBlock w="50%" h={9} />
                </div>
              }
            >
              <p className="text-sm text-slate-500 leading-relaxed italic m-0 mb-2 pl-3 border-l-[3px] border-[#fdb813]">
                "{student.bio || 'No quote yet.'}"
              </p>
              {student.motto && (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-1">
                  <i className="fas fa-quote-left text-[#fdb813] text-[9px]" />
                  <span className="text-xs text-amber-800 italic">{student.motto}</span>
                </div>
              )}
            </SubscriptionGate>

            {canViewFull && (
              <div className="flex gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <i className="fas fa-map-marker-alt text-red-400 text-[10px]" /> Lipa City, Batangas
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <i className="fas fa-university text-[#3f51b5] text-[10px]" /> NU Lipa
                </span>
              </div>
            )}

            {/* Free-tier lock nudge */}
            {!canViewFull && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <i className="fas fa-lock text-[#fdb813] text-sm" />
                <span className="text-xs text-amber-800 font-semibold">Full profile visible to Premium members.</span>
                <button onClick={() => navigate('/payment')}
                  className="bg-transparent border-none text-[#3f51b5] text-xs font-bold cursor-pointer p-0">
                  Upgrade →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="bg-white rounded-2xl mb-3 shadow-sm border border-slate-100 flex overflow-hidden">
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold tracking-wide
                border-none cursor-pointer transition-all border-b-2
                ${activeTab === tab.key ? 'text-[#1d2b4b] border-[#1d2b4b] bg-slate-50' : 'text-slate-400 border-transparent bg-white hover:text-slate-600 hover:bg-slate-50'}
                ${i < TABS.length - 1 ? 'border-r border-r-slate-100' : ''}`}>
              <i className={`${tab.icon} text-[11px] ${activeTab === tab.key ? 'text-[#fdb813]' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── POSTS TAB ── */}
        {activeTab === 'posts' && (
          <SubscriptionGate isSubscribed={!postsRestricted && canViewFull} variant="full"
            message="Subscribe to view this student's posts, photos, and memories."
            preview={<LockedGrid />}
          >
            {postsLoading ? (
              <div className="bg-white rounded-2xl py-16 flex items-center justify-center shadow-sm border border-slate-100">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-100 border-t-[#1d2b4b] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl py-20 flex flex-col items-center text-center shadow-sm border border-slate-100 px-6">
                <div className="w-16 h-16 rounded-full border-2 border-[#1d2b4b]/20 flex items-center justify-center mb-4">
                  <i className="fas fa-camera text-[#1d2b4b]/30 text-2xl" />
                </div>
                <h3 className="text-lg font-black text-[#1d2b4b] mb-1">No Posts Yet</h3>
                <p className="text-sm text-slate-400">No memories shared here yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden shadow-sm">
                {posts.map(post => (
                  <div key={post.id} className="post-cell relative aspect-square overflow-hidden bg-[#1d2b4b] cursor-pointer"
                    onClick={() => !contextMenu && setLightbox(post)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ post, x: e.clientX, y: e.clientY }); }}
                  >
                    {post.file_path?.match(/\.(mp4|mov|webm)(\?|$)/i)
                      ? <video src={post.file_path} className="w-full h-full object-cover block" muted />
                      : <img   src={post.file_path} alt={post.caption ?? ''} className="w-full h-full object-cover block" />
                    }
                    <div className="post-overlay absolute inset-0 bg-[#1d2b4b]/55 opacity-0 transition-opacity duration-200 flex items-center justify-center gap-5">
                      <span className="text-white text-sm font-bold"><i className="fas fa-heart text-[#fdb813] mr-1" />0</span>
                      <span className="text-white text-sm font-bold"><i className="fas fa-comment text-[#fdb813] mr-1" />0</span>
                    </div>
                    {post.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1d2b4b]/85 to-transparent px-2.5 pb-2 pt-6 text-[11px] text-white font-medium leading-tight">
                        {post.caption.length > 38 ? post.caption.slice(0, 38) + '…' : post.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubscriptionGate>
        )}

        {/* ── TAGGED TAB ── */}
        {activeTab === 'tagged' && (
          <SubscriptionGate isSubscribed={canViewFull} variant="full" message="Subscribe to view tagged photos."
            preview={<div className="bg-white rounded-2xl p-6 space-y-3"><SkeletonBlock /><SkeletonBlock w="40%" /><SkeletonBlock w="70%" /></div>}
          >
            <ViewCard icon="fas fa-tag" label="Tagged Photos">
              <StudentPhotosSection userId={parseInt(id)} compact />
            </ViewCard>
          </SubscriptionGate>
        )}

        {/* ── ACADEMIC TAB ── */}
        {activeTab === 'academic' && (
          <SubscriptionGate isSubscribed={canViewFull} variant="full" message="Subscribe to view academic information."
            preview={
              <div className="bg-white rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <SkeletonBlock w="40%" h={9} /><SkeletonBlock w="65%" h={13} />
                  </div>
                ))}</div>
              </div>
            }
          >
            <ViewCard icon="fas fa-graduation-cap" label="Academic Info">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Course',     value: student.course || 'N/A',    icon: 'fa-book'         },
                  { label: 'Year Level', value: student.year_level ? `${student.year_level}th Year` : '4th Year', icon: 'fa-layer-group' },
                  { label: 'Status',     value: 'Enrolled',                 icon: 'fa-circle-check', green: true },
                  { label: 'Batch',      value: batchYear,                  icon: 'fa-calendar'     },
                ].map(row => (
                  <div key={row.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className={`fas ${row.icon} text-[#fdb813] text-[9px]`} />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.label}</span>
                    </div>
                    <p className={`text-sm font-bold m-0 ${row.green ? 'text-emerald-500' : 'text-[#1d2b4b]'}`}>{row.value}</p>
                  </div>
                ))}
              </div>
            </ViewCard>
          </SubscriptionGate>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === 'achievements' && (
          <SubscriptionGate isSubscribed={canViewFull} variant="full" message="Subscribe to view this student's achievements."
            preview={
              <div className="bg-white rounded-2xl p-6 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2"><SkeletonBlock w="55%" h={11} /><SkeletonBlock w="35%" h={9} /></div>
                  </div>
                ))}
              </div>
            }
          >
            <ViewCard icon="fas fa-award" label="Achievements">
              {achieveLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#1d2b4b] animate-spin" />
                  Loading…
                </div>
              ) : achievements.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-4">
                    <i className="fas fa-award text-slate-300 text-xl" />
                  </div>
                  <p className="text-sm font-bold text-[#1d2b4b] mb-1">No Achievements Yet</p>
                  <p className="text-xs text-slate-400">This student hasn't added any achievements yet.</p>
                </div>
              ) : (
                achievements.map((a, i, arr) => (
                  <div key={a.id ?? i}
                    className={`flex items-center gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <i className={`fas ${a.icon} text-base`} style={{ color: a.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1d2b4b] m-0 mb-0.5">{a.title}</p>
                      <p className="text-xs text-slate-400 m-0">{a.sub}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-200 text-xs" />
                  </div>
                ))
              )}
            </ViewCard>
          </SubscriptionGate>
        )}

        {/* ── VOICE MEMORIES TAB ── */}
        {activeTab === 'voice' && (
          <SubscriptionGate isSubscribed={canViewFull} variant="full" message="Subscribe to listen to voice memories."
            preview={
              <div className="bg-white rounded-2xl p-6 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2"><SkeletonBlock w="60%" h={9} /><SkeletonBlock w="80%" h={7} /></div>
                  </div>
                ))}
              </div>
            }
          >
            <ViewCard icon="fas fa-microphone" label="Voice Memories">
              <VoiceNotesSection profileUser={student} isOwnProfile={false} />
            </ViewCard>
          </SubscriptionGate>
        )}

      </main>
      <Footer />
    </div>
  );
}

function ViewCard({ icon, label, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h4 className="flex items-center gap-2 text-xs font-black text-[#1d2b4b] uppercase tracking-widest m-0 mb-4">
        <i className={`${icon} text-[#fdb813] text-xs`} />{label}
      </h4>
      {children}
    </div>
  );
}