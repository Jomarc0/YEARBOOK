import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentsApi } from '@/api/student.api';
import { profileApi } from '@/api/gallery.api';
import { voiceNotesApi } from '@/api/messaging.api';
import { storageUrl } from '@/api/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PremiumBadge from '@/features/subscription/components/PremiumBadge';
import StudentPhotosSection from '../components/StudentPhotosSection';
import ProfileUploadModal from '../components/ProfileUploadModal';
import PostContextMenu from '../components/PostContextMenu';
import ShareModal from '../components/ShareModal';
import PostCard from '../components/PostCard';
import PostLightbox from '../components/PostLightbox';
import MessageModal from '@/components/feedback/MessageModal';

const TABS = [
  { key: 'posts',        icon: 'fas fa-th-large',       label: 'Posts'        },
  { key: 'tagged',       icon: 'fas fa-tag',             label: 'Tagged'       },
  { key: 'academic',     icon: 'fas fa-graduation-cap',  label: 'Academic'     },
  { key: 'achievements', icon: 'fas fa-award',           label: 'Achievements' },
  { key: 'voicenotes',   icon: 'fas fa-microphone',      label: 'Voice Notes'  },
];

const getTier = (u) => {
  if (!u) return 'free';
  if (u.tier === 'premium' || u.is_premium) return 'premium';
  if (u.tier === 'standard') return 'standard';
  return 'free';
};

const TIER_CONFIG = {
  premium:  { label: 'Premium',  icon: 'fa-crown',  cls: 'bg-amber-50 text-amber-700 border border-amber-200'   },
  standard: { label: 'Standard', icon: 'fa-bolt',   cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  free:     { label: 'Free',     icon: 'fa-user',   cls: 'bg-slate-100 text-slate-500 border border-slate-200'   },
};

export default function ProfilePage() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();
  const navigate           = useNavigate();

  const [student,           setStudent]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [bio,               setBio]               = useState('');
  const [editing,           setEditing]           = useState(false);
  const [toast,             setToast]             = useState(null);
  const [activeTab,         setActiveTab]         = useState('posts');
  const [showUpload,        setShowUpload]        = useState(false);
  const [showShare,         setShowShare]         = useState(false);
  const [showMsg,           setShowMsg]           = useState(false);
  const [posts,             setPosts]             = useState([]);
  const [postsLoading,      setPostsLoading]      = useState(false);
  const [contextMenu,       setContextMenu]       = useState(null);
  const [lightbox,          setLightbox]          = useState(null);
  const [voiceNotes,        setVoiceNotes]        = useState([]);
  const [voiceNotesLoading, setVoiceNotesLoading] = useState(false);

  // ── Academic state ────────────────────────────────────────────────────────
  const [academicData,    setAcademicData]    = useState(null);
  const [academicLoading, setAcademicLoading] = useState(false);

  // ── Achievements state ────────────────────────────────────────────────────
  const [achievements,   setAchievements]   = useState([]);
  const [achieveLoading, setAchieveLoading] = useState(false);

  const fileRef = useRef();
  const isOwn   = authUser?.id === parseInt(id);
  const userTier   = getTier(authUser);
  const isPremium  = userTier === 'premium' || userTier === 'standard';
  const isFree     = isOwn && !isPremium;
  const tierConfig = TIER_CONFIG[userTier];

  // ── Load student profile ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => { setStudent(data); setBio(data.bio ?? ''); })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Load tab data on tab switch ───────────────────────────────────────────
  useEffect(() => { if (activeTab === 'posts')        loadPosts();        }, [activeTab, id]);
  useEffect(() => { if (activeTab === 'voicenotes')   loadVoiceNotes();   }, [activeTab, id]);
  useEffect(() => { if (activeTab === 'achievements') loadAchievements(); }, [activeTab, id]);
  useEffect(() => { if (activeTab === 'academic')     loadAcademic();     }, [activeTab, id]);

  const loadPosts = () => {
    setPostsLoading(true);
    profileApi.getPosts(id)
      .then(({ data }) => setPosts(data.data?.data ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  };

  const loadVoiceNotes = () => {
    setVoiceNotesLoading(true);
    const req = isOwn ? voiceNotesApi.inbox() : voiceNotesApi.forProfile(id);
    req.then(({ data }) => setVoiceNotes(Array.isArray(data) ? data : []))
       .catch(() => setVoiceNotes([]))
       .finally(() => setVoiceNotesLoading(false));
  };

  // ── Fetch achievements from API ───────────────────────────────────────────
  // FIX: removed DEFAULT_ACHIEVEMENTS fallback — show empty state when DB has
  //      no records. Fake ids 1/2/3 were causing the save to silently fail.
  const loadAchievements = () => {
    if (!id) return;
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
              t:     a.title,
              s:     a.subtitle ?? '',
              icon:  meta.icon  ?? 'fa-star',
              color: meta.color ?? '#fdb813',
            };
          }));
        } else {
          // Empty array from DB — show the proper empty state, not fake data
          setAchievements([]);
        }
      })
      .catch(() => setAchievements([]))
      .finally(() => setAchieveLoading(false));
  };

  // ── Fetch academic data from student record ───────────────────────────────
  const loadAcademic = () => {
    if (!id) return;
    setAcademicLoading(true);
    studentsApi.show(id)
      .then(({ data }) => {
        setAcademicData({
          student_id:      data.student_id      ?? null,
          course:          data.course          ?? null,
          graduation_year: data.graduation_year ?? null,
          batch:           data.batch           ?? null,
          year_level:      data.year_level      ?? null,
          is_premium:      data.is_premium      ?? false,
          tier:            getTier(data),
        });
      })
      .catch(() => setAcademicData(null))
      .finally(() => setAcademicLoading(false));
  };

  const formatDuration = (s) => {
    if (!s) return null;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
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
    const fd = new FormData();
    fd.append('photo', file);
    const { data } = await studentsApi.updatePhoto(fd);
    setStudent(prev => ({ ...prev, profile_picture: data.profile_picture }));
    showToast('Profile photo updated!');
  };

  const handlePostDeleted = (pid) => {
    setPosts(prev => prev.filter(p => p.id !== pid));
    showToast('Post deleted.', 'error');
    setContextMenu(null);
  };

  const handlePostUpdated = (updated) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    showToast('Post updated!');
    setContextMenu(null);
  };

  const handleOpenUpload = () => isFree ? navigate('/premium') : setShowUpload(true);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fe]">
      <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 border-t-[#1d2b4b] animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
      Student not found.
    </div>
  );

  const avatar = storageUrl(student.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true&size=400`;

  const courseShort = student.course?.match(/\b[A-Z]/g)?.join('') ?? 'Student';

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col font-sans">
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .post-cell:hover .post-overlay { opacity: 1 !important; }
        .post-cell:hover img, .post-cell:hover video { transform: scale(1.04); }
        .post-cell img, .post-cell video { transition: transform 0.35s ease; }
      `}</style>

      <Navbar />

      {/* Modals */}
      {showUpload  && <ProfileUploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadPosts(); }} />}
      <ShareModal   isOpen={showShare} onClose={() => setShowShare(false)} student={student} />
      <MessageModal isOpen={showMsg}   onClose={() => setShowMsg(false)}   student={student} authUser={authUser} />
      {contextMenu && (
        <PostContextMenu
          post={contextMenu.post}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onDelete={handlePostDeleted}
          onUpdated={handlePostUpdated}
        />
      )}
      {lightbox && <PostLightbox post={lightbox.post} initialIdx={lightbox.idx} onClose={() => setLightbox(null)} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 z-[9000] px-5 py-2.5 rounded-xl text-sm font-semibold
                         shadow-xl whitespace-nowrap flex items-center gap-2
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
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.03]" />
          </div>

          {/* Body */}
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex items-end justify-between mb-4 -mt-12 sm:-mt-14">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-[#fdb813] to-amber-500 inline-block">
                  <div className="p-[3px] rounded-full bg-white inline-block">
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#1d2b4b] ${isOwn ? 'cursor-pointer' : ''}`}
                      onClick={() => isOwn && fileRef.current.click()}
                    >
                      <img src={avatar} alt={student.name}
                        className="w-full h-full object-cover block"
                        onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true`; }}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                {isOwn && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                    <button onClick={() => fileRef.current.click()}
                      className="absolute -bottom-0 left-1/2 -translate-x-1/2 bg-[#1d2b4b]/80 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full border-none cursor-pointer whitespace-nowrap tracking-wide">
                      EDIT
                    </button>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-14 sm:pt-16 flex-wrap justify-end">
                {isOwn ? (
                  <>
                    {userTier === 'premium' ? (
                      <Link to="/premium" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#fdb813] to-amber-500 text-[#1d2b4b] no-underline px-3 py-2 rounded-xl text-xs font-black shadow-md shadow-amber-200/50 hover:opacity-90 transition">
                        <i className="fas fa-crown text-[10px]" /> Premium Active
                      </Link>
                    ) : userTier === 'standard' ? (
                      <Link to="/premium" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-[#3f51b5] text-white no-underline px-3 py-2 rounded-xl text-xs font-black shadow-md shadow-indigo-200/50 hover:opacity-90 transition">
                        <i className="fas fa-bolt text-[10px]" /> Standard
                      </Link>
                    ) : (
                      <Link to="/premium" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#fdb813] to-amber-500 text-[#1d2b4b] no-underline px-3 py-2 rounded-xl text-xs font-black shadow-md shadow-amber-200/40 hover:opacity-90 transition">
                        <i className="fas fa-crown text-[10px]" /> Go Premium
                      </Link>
                    )}

                    <Link to="/settings"
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#1d2b4b] no-underline px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition">
                      <i className="fas fa-pen text-[10px]" /> Edit Profile
                    </Link>

                    <button onClick={handleOpenUpload}
                      title={isFree ? 'Upgrade to upload' : 'Add post'}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition
                        ${isFree ? 'bg-slate-300 text-slate-500' : 'bg-[#1d2b4b] hover:bg-[#162038] text-white'}`}>
                      <i className={`fas ${isFree ? 'fa-lock' : 'fa-plus'} text-[10px] text-[#fdb813]`} />
                      {isFree ? 'Locked' : 'Add Post'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowMsg(true)}
                    className="inline-flex items-center gap-2 bg-[#1d2b4b] hover:bg-[#162038] text-white px-5 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition">
                    <i className="fas fa-paper-plane text-[#fdb813] text-xs" /> Message
                  </button>
                )}

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
              <span className="text-[10px] font-bold text-[#3f51b5] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full tracking-wide">
                PIONEER 2026
              </span>
              {isOwn && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tierConfig.cls}`}>
                  <i className={`fas ${tierConfig.icon} text-[8px]`} />
                  {tierConfig.label.toUpperCase()}
                </span>
              )}
            </div>

            {/* Course */}
            <p className="text-sm text-slate-500 font-medium mb-4">
              {student.course ?? 'Pioneer Student'} · National University Lipa
            </p>

            {/* Stats row */}
            <div className="flex gap-6 flex-wrap mb-4 pb-4 border-b border-slate-100">
              {[
                { value: posts.length,                label: 'Posts'   },
                { value: student.profile_views ?? 0,  label: 'Views'   },
                { value: courseShort,                  label: 'Program' },
                { value: student.student_id ?? 'N/A', label: 'ID'      },
                { value: student.graduation_year ?? student.batch ?? '2026', label: 'Batch' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-black text-[#1d2b4b] m-0 leading-none">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 m-0">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {editing ? (
              <div className="mb-2">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  placeholder="Write your yearbook quote…"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl resize-none border-2 border-[#3f51b5] font-sans text-sm text-[#1d2b4b] outline-none box-border bg-white"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveBio}
                    className="px-4 py-2 rounded-lg border-none bg-[#1d2b4b] text-white text-xs font-semibold cursor-pointer hover:bg-[#162038] transition">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-100 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => isOwn && setEditing(true)}
                className={`text-sm text-slate-500 leading-relaxed italic m-0 mb-2 pl-3 border-l-[3px] border-[#fdb813] ${isOwn ? 'cursor-pointer hover:text-slate-700 transition-colors' : ''}`}
              >
                "{student.bio || (isOwn ? 'Click to add your yearbook quote…' : 'No quote yet.')}"
                {isOwn && <i className="fas fa-pen-to-square ml-2 text-slate-300 text-[10px]" />}
              </p>
            )}

            {/* Motto */}
            {student.motto && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-1">
                <i className="fas fa-quote-left text-[#fdb813] text-[9px]" />
                <span className="text-xs text-amber-800 italic">{student.motto}</span>
              </div>
            )}

            {/* Location */}
            <div className="flex gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <i className="fas fa-map-marker-alt text-red-400 text-[10px]" /> Lipa City, Batangas
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <i className="fas fa-university text-[#3f51b5] text-[10px]" /> NU Lipa
              </span>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="bg-white rounded-2xl mb-3 shadow-sm border border-slate-100 flex overflow-hidden">
          {TABS.map((tab, i) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold tracking-wide
                border-none cursor-pointer transition-all border-b-2
                ${activeTab === tab.key
                  ? 'text-[#1d2b4b] border-[#1d2b4b] bg-slate-50'
                  : 'text-slate-400 border-transparent bg-white hover:text-slate-600 hover:bg-slate-50'
                }
                ${i < TABS.length - 1 ? 'border-r border-r-slate-100' : ''}`}
            >
              <i className={`${tab.icon} text-[11px] ${activeTab === tab.key ? 'text-[#fdb813]' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── POSTS TAB ── */}
        {activeTab === 'posts' && (
          <div className="flex flex-col gap-3">
            {isOwn && (
              <div
                onClick={() => !isFree && setShowUpload(true)}
                className={`bg-white rounded-2xl px-4 py-3 shadow-sm border flex items-center gap-3 transition
                  ${isFree ? 'border-amber-100 cursor-default' : 'border-slate-100 cursor-pointer hover:shadow-md'}`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1d2b4b] shrink-0 border-2 border-slate-100">
                  <img src={avatar} alt="" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fdb813&bold=true`; }} />
                </div>
                {isFree ? (
                  <div className="flex-1 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-amber-700 font-semibold">
                      <i className="fas fa-lock text-[#fdb813] mr-1.5" />
                      Uploading posts requires a Premium or Standard plan.
                    </span>
                    <Link to="/premium" onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-[#fdb813] to-amber-500 text-[#1d2b4b] no-underline px-3 py-1.5 rounded-lg text-xs font-black shrink-0">
                      <i className="fas fa-crown text-[10px]" /> Upgrade Now
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400">
                      Share a memory, {student.name?.split(' ')[0]}…
                    </div>
                    <button className="flex items-center gap-2 bg-[#1d2b4b] text-white border-none rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer shrink-0">
                      <i className="fas fa-cloud-arrow-up text-[#fdb813]" /> Upload
                    </button>
                  </>
                )}
              </div>
            )}

            {postsLoading ? (
              <div className="bg-white rounded-2xl py-16 flex items-center justify-center shadow-sm border border-slate-100">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-100 border-t-[#1d2b4b] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl py-20 flex flex-col items-center text-center shadow-sm border border-slate-100 px-6">
                <div className="w-16 h-16 rounded-full border-2 border-[#1d2b4b]/20 flex items-center justify-center mb-4">
                  <i className="fas fa-camera text-[#1d2b4b]/40 text-2xl" />
                </div>
                <h3 className="text-lg font-black text-[#1d2b4b] mb-2">No Posts Yet</h3>
                <p className="text-sm text-slate-400 mb-4">Share your pioneer memories with your batchmates.</p>
                {isOwn && !isFree && (
                  <button onClick={() => setShowUpload(true)}
                    className="inline-flex items-center gap-2 bg-[#1d2b4b] text-white border-none px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#162038] transition">
                    <i className="fas fa-plus text-[#fdb813]" /> Share First Post
                  </button>
                )}
                {isOwn && isFree && (
                  <Link to="/premium"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#fdb813] to-amber-500 text-[#1d2b4b] no-underline px-5 py-2.5 rounded-xl text-sm font-black">
                    <i className="fas fa-crown" /> Upgrade to Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden shadow-sm">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} isOwn={isOwn}
                    onClick={(p, idx) => setLightbox({ post: p, idx })}
                    onMenuClick={(e, p) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setContextMenu({ post: p, x: r.left, y: r.bottom + 6 });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAGGED TAB ── */}
        {activeTab === 'tagged' && (
          <TabCard icon="fas fa-tag" label="Tagged Photos">
            <StudentPhotosSection userId={parseInt(id)} compact />
          </TabCard>
        )}

        {/* ── ACADEMIC TAB ── */}
        {activeTab === 'academic' && (
          <TabCard icon="fas fa-graduation-cap" label="Academic Info">
            {academicLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#1d2b4b] animate-spin" />
                Loading…
              </div>
            ) : academicData ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Student ID',      value: academicData.student_id      ?? 'N/A', icon: 'fa-id-card'      },
                    { label: 'Course',          value: academicData.course          ?? 'N/A', icon: 'fa-book'         },
                    { label: 'Graduation Year', value: academicData.graduation_year ?? 'N/A', icon: 'fa-calendar'     },
                    { label: 'Status',          value: 'Enrolled',                            icon: 'fa-circle-check', green: true },
                  ].map(row => (
                    <div key={row.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <i className={`fas ${row.icon} text-[#fdb813] text-[9px]`} />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.label}</span>
                      </div>
                      <p className={`text-sm font-bold m-0 ${row.green ? 'text-emerald-500' : 'text-[#1d2b4b]'} break-words`}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>

                {academicData.batch && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="fas fa-users text-[#fdb813] text-[9px]" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch</span>
                    </div>
                    <p className="text-sm font-bold text-[#1d2b4b] m-0">{academicData.batch}</p>
                  </div>
                )}

              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Could not load academic info.</p>
            )}
          </TabCard>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === 'achievements' && (
          <TabCard icon="fas fa-award" label="Achievements">
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
                <p className="text-xs text-slate-400">
                  {isOwn
                    ? <Link to="/settings" className="text-[#3f51b5] no-underline">Go to Settings to add achievements</Link>
                    : 'No achievements have been added yet.'}
                </p>
              </div>
            ) : (
              achievements.map((a, i, arr) => (
                <div key={a.id ?? i}
                  className={`flex items-center gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <i className={`fas ${a.icon} text-base`} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1d2b4b] m-0 mb-0.5">{a.t}</p>
                    <p className="text-xs text-slate-400 m-0">{a.s}</p>
                  </div>
                  <i className="fas fa-chevron-right text-slate-200 text-xs" />
                </div>
              ))
            )}
            {isOwn && achievements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <Link to="/settings#achievements"
                  className="inline-flex items-center gap-1.5 text-xs text-[#3f51b5] font-semibold no-underline hover:underline">
                  <i className="fas fa-pen-to-square text-[10px]" /> Edit Achievements in Settings
                </Link>
              </div>
            )}
          </TabCard>
        )}

        {/* ── VOICE NOTES TAB ── */}
        {activeTab === 'voicenotes' && (
          <TabCard
            icon="fas fa-microphone"
            label={isOwn ? `Voice Notes Received (${voiceNotes.length})` : `Voice Notes for ${student.name?.split(' ')[0]}`}
            action={
              <button onClick={loadVoiceNotes} disabled={voiceNotesLoading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-transparent cursor-pointer transition">
                <i className={`fas fa-rotate-right text-[10px] ${voiceNotesLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            }
          >
            {voiceNotesLoading ? (
              <div className="flex items-center justify-center py-14 gap-2 text-slate-400 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#1d2b4b] animate-spin" />
                Loading voice notes…
              </div>
            ) : voiceNotes.length === 0 ? (
              <div className="flex flex-col items-center text-center py-14">
                <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-4">
                  <i className="fas fa-microphone-slash text-slate-300 text-xl" />
                </div>
                <p className="text-sm font-bold text-[#1d2b4b] mb-1">No Voice Notes Yet</p>
                <p className="text-xs text-slate-400">
                  {isOwn ? 'Ask your batchmates to send you a voice memory!' : 'No approved voice notes yet.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {voiceNotes.map(note => (
                  <div key={note.id}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                    <img
                      src={note.sender?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(note.sender?.name ?? 'S')}&background=1d2b4b&color=fdb813&bold=true&size=80`}
                      alt={note.sender?.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-slate-200"
                      onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(note.sender?.name ?? 'S')}&background=1d2b4b&color=fdb813&bold=true`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-[#1d2b4b]">{note.title ?? 'Voice Memory'}</span>
                        {note.duration_seconds && (
                          <span className="text-[10px] text-slate-400 bg-slate-200 rounded-full px-2 py-0.5 font-semibold">
                            {formatDuration(note.duration_seconds)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        From <strong className="text-[#1d2b4b]">{note.sender?.name ?? 'Anonymous'}</strong>
                        {' '}·{' '}
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <audio controls src={note.audio_url} className="w-full h-8" />
                    </div>
                    {isOwn && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 tracking-wide
                        ${note.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : note.status === 'rejected' ? 'bg-red-50 text-red-500 border border-red-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {note.status?.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabCard>
        )}

      </main>
      <Footer />
    </div>
  );
}

function TabCard({ icon, label, action, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-xs font-black text-[#1d2b4b] uppercase tracking-widest m-0">
          <i className={`${icon} text-[#fdb813] text-xs`} />
          {label}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}