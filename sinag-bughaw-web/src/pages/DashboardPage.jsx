/**
 * DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Instagram-style feed dashboard.
 * - 3-column desktop layout: left sidebar | feed | right sidebar
 * - Posts fetched from GET /api/feed?filter=all|public|batchmates|mine
 * - Visibility: public posts + batchmates posts (same batch_id) + own posts
 * - No likes, no comments — view count + tag students only
 * - Tag modal → POST /api/students/profile/tagged-photos
 * - Uses existing Navbar + Footer from your codebase
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate }                         from 'react-router-dom';
import { useAuth }                                   from '@/features/auth/hooks/useAuth';
import { useAppConfig }                              from '@/features/platform/AppConfigProvider';
import { searchApi }                                 from '@/api/search.api';
import { storageUrl }                                from '@/api/client';
import axios                                         from '@/api/client';
import Navbar                                        from '@/components/layout/Navbar';
import Footer                                        from '@/components/layout/Footer';

// ─── Tier helper ─────────────────────────────────────────────────────────────
const getTier = (user) => {
  if (!user) return 'free';
  if (user.tier === 'premium' || user.is_premium) return 'premium';
  if (user.tier === 'standard') return 'standard';
  return 'free';
};

// ─── Visibility pill ─────────────────────────────────────────────────────────
function VisPill({ visibility }) {
  const map = {
    public:     { label: 'Public',     cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',  icon: 'fa-globe'   },
    batchmates: { label: 'Batchmates', cls: 'bg-indigo-50  text-indigo-800  border-indigo-200',   icon: 'fa-users'   },
    private:    { label: 'Private',    cls: 'bg-slate-100  text-slate-500   border-slate-200',    icon: 'fa-lock'    },
  };
  const cfg = map[visibility] ?? map.private;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <i className={`fas ${cfg.icon} text-[8px]`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

// ─── Post media grid (Instagram-style carousel) ───────────────────────────────
function PostMediaGrid({ media }) {
  const [current, setCurrent] = useState(0);

  if (!media?.length) return null;

  const isVideo = (path) => /\.(mp4|mov|webm)(\?|$)/i.test(path ?? '');
  const getUrl  = (path) => path?.startsWith('http') ? path : (storageUrl(path) || path);

  // Single item — no carousel needed
  if (media.length === 1) {
    const m = media[0];
    return (
      <div className="w-full max-h-[480px] bg-black">
        {isVideo(m.file_path)
          ? <video src={getUrl(m.file_path)} controls className="w-full max-h-[480px] object-contain mx-auto block" />
          : <img   src={getUrl(m.file_path)} alt={m.caption ?? 'post'}
              className="w-full max-h-[480px] object-cover block"
              loading="lazy"
              onError={e => { e.currentTarget.src = 'https://via.placeholder.com/800x480?text=Photo'; }}
            />
        }
      </div>
    );
  }

  // Multiple items — Instagram-style carousel
  const prev = (e) => { e.stopPropagation(); setCurrent(i => (i - 1 + media.length) % media.length); };
  const next = (e) => { e.stopPropagation(); setCurrent(i => (i + 1) % media.length); };

  const m = media[current];

  return (
    <div className="relative w-full max-h-[480px] bg-black select-none">

      {/* Current slide */}
      <div className="w-full max-h-[480px] overflow-hidden">
        {isVideo(m.file_path)
          ? <video src={getUrl(m.file_path)} controls
              className="w-full max-h-[480px] object-contain mx-auto block" />
          : <img src={getUrl(m.file_path)} alt={`slide ${current + 1}`}
              className="w-full max-h-[480px] object-cover block"
              loading="lazy"
              onError={e => { e.currentTarget.src = 'https://via.placeholder.com/800x480?text=Photo'; }}
            />
        }
      </div>

      {/* Left arrow */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-black/50 hover:bg-black/75
                   text-white flex items-center justify-center
                   border-none cursor-pointer transition-colors backdrop-blur-sm"
        aria-label="Previous"
      >
        <i className="fas fa-chevron-left text-xs" />
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-black/50 hover:bg-black/75
                   text-white flex items-center justify-center
                   border-none cursor-pointer transition-colors backdrop-blur-sm"
        aria-label="Next"
      >
        <i className="fas fa-chevron-right text-xs" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {media.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className={`rounded-full border-none cursor-pointer transition-all p-0
              ${i === current
                ? 'w-2 h-2 bg-white'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
              }`}
          />
        ))}
      </div>

      {/* Counter badge — top right (like Instagram) */}
      <div className="absolute top-3 right-3 z-10
                      bg-black/50 backdrop-blur-sm text-white
                      text-[11px] font-semibold px-2.5 py-1 rounded-full">
        {current + 1} / {media.length}
      </div>
    </div>
  );
}

// ─── Tag modal ────────────────────────────────────────────────────────────────
//
// FIX: onSaved now receives the full tagged_students array returned by the
// server (not just the locally-selected IDs). This ensures the feed reflects
// the server's authoritative state — e.g. AI-tagged students are preserved.
// ─────────────────────────────────────────────────────────────────────────────
function TagModal({ photoId, existingTags = [], batchmates = [], onClose, onSaved }) {
  // Initialise selection from existing tag objects — always use .id
  const [selected, setSelected] = useState(existingTags.map(t => t.id));
  const [query,    setQuery]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const filtered = batchmates.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.course ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // FIX: POST /students/profile/tagged-photos now expects
  //   { photo_id: int, student_ids: int[] }
  // and returns { success, message, tagged_students: [{id,name,profile_picture}] }
  // We pass the server's tagged_students array straight to onSaved.
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.post('/students/profile/tagged-photos', {
        photo_id:    photoId,
        student_ids: selected,
      });

      // Pass back the authoritative list from the server
      onSaved(data.tagged_students ?? []);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to save tags. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-bold text-[#1d2b4b] m-0">Tag batchmates</h3>
            <p className="text-[11px] text-slate-400 m-0 mt-0.5">Select students to tag in this post</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400
                       hover:bg-slate-200 hover:text-slate-600 transition-colors border-none cursor-pointer">
            <i className="fas fa-times text-xs" aria-hidden="true" />
          </button>
        </div>

        {/* Selected tags strip */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-3">
            {selected.map(id => {
              const s = batchmates.find(b => b.id === id);
              if (!s) return null;
              return (
                <span key={id}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200
                             text-[11px] font-medium px-2.5 py-1 rounded-full">
                  {s.name}
                  <button onClick={() => toggle(id)}
                    className="text-indigo-400 hover:text-indigo-700 border-none bg-transparent cursor-pointer p-0 leading-none">
                    <i className="fas fa-times text-[9px]" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or course…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200
                         text-[#1d2b4b] placeholder-slate-400 outline-none
                         focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b5]/20 transition"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="max-h-56 overflow-y-auto px-5 pb-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">No students found.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(s => {
                const isSelected = selected.includes(s.id);
                const avatar = storageUrl(s.profile_picture)
                  || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff&size=64`;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left w-full border transition-all cursor-pointer
                      ${isSelected
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                      }`}
                  >
                    <img src={avatar} alt={s.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fff`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1d2b4b] truncate m-0">{s.name}</p>
                      <p className="text-[11px] text-slate-400 m-0">{s.course ?? 'Student'}</p>
                    </div>
                    {isSelected && (
                      <i className="fas fa-check-circle text-indigo-500 text-sm flex-shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 px-5 mb-2">{error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <span className="text-[12px] text-slate-400">{selected.length} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors border-none cursor-pointer">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-[#1d2b4b] text-[#fdb813] rounded-xl
                         hover:bg-[#2a3d6b] transition-colors border-none cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : 'Save tags'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single post card ─────────────────────────────────────────────────────────
//
// FIX: onTagSaved now receives the full tagged_students array from the server,
// not a list of IDs. Passed straight through to TagModal's onSaved prop.
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, batchmates, onTagSaved }) {
  const [tagOpen, setTagOpen] = useState(false);

  const avatar = storageUrl(post.user?.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name ?? 'U')}&background=1d2b4b&color=fdb813&size=64`;

  const isOwn = post.user_id === currentUser?.id;

  return (
    <>
      <article className="bg-white rounded-2xl border border-slate-100 overflow-hidden
                           transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/60">
        {/* Post header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to={isOwn ? `/profile/${post.user_id}` : `/students/${post.user_id}`}
            className="flex-shrink-0 no-underline">
            <img src={avatar} alt={post.user?.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-100"
              onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=U&background=1d2b4b&color=fdb813`; }}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={isOwn ? `/profile/${post.user_id}` : `/students/${post.user_id}`}
                className="text-[13px] font-bold text-[#1d2b4b] no-underline hover:text-[#3f51b5] truncate">
                {post.user?.name}
              </Link>
              {isOwn && <span className="text-[10px] text-slate-400">(you)</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400">{post.user?.course}</span>
              <span className="text-slate-200">·</span>
              <VisPill visibility={post.visibility} />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 flex-shrink-0">{post.time_ago ?? ''}</span>
        </div>

        {/* Media */}
        <PostMediaGrid media={post.media ?? []} />

        {/* Caption + tags */}
        <div className="px-4 pt-3 pb-1">
          {post.caption && (
            <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
              <span className="font-semibold text-[#1d2b4b] mr-1">{post.user?.name}</span>
              {post.caption}
            </p>
          )}

          {/* Tagged students */}
          {post.tagged_students?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tagged_students.map(s => (
                <Link key={s.id} to={`/students/${s.id}`}
                  className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700
                             border border-indigo-100 rounded-full px-2.5 py-0.5 no-underline
                             hover:bg-indigo-100 transition-colors">
                  <i className="fas fa-tag text-[8px]" aria-hidden="true" />
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-slate-50 mt-1">
          <button
            onClick={() => setTagOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500
                       bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5
                       transition-colors cursor-pointer"
          >
            <i className="fas fa-tag text-[11px]" aria-hidden="true" />
            Tag a student
          </button>

          <Link to={`/gallery`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500
                       bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5
                       transition-colors no-underline">
            <i className="fas fa-share text-[11px]" aria-hidden="true" />
            Share
          </Link>

          <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
            <i className="fas fa-eye text-[11px]" aria-hidden="true" />
            {(post.views_count ?? post.views ?? 0).toLocaleString()} views
          </div>
        </div>
      </article>

      {tagOpen && (
        <TagModal
          photoId={post.id}
          existingTags={post.tagged_students ?? []}
          batchmates={batchmates}
          onClose={() => setTagOpen(false)}
          // FIX: receives full tagged_students array from server, forwarded up
          onSaved={(taggedStudents) => onTagSaved(post.id, taggedStudents)}
        />
      )}
    </>
  );
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({ user, isOn }) {
  const tier = getTier(user);
  const isPremium = tier === 'premium' || tier === 'standard';

  const avatar = storageUrl(user?.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=1d2b4b&color=fdb813&size=128`;

  const NAV = [
    { to: '/dashboard',   icon: 'fa-home',              label: 'Dashboard'  },
    { to: '/directory',   icon: 'fa-users',             label: 'Directory',   feature: 'enable_student_directory_search' },
    { to: '/faculty',     icon: 'fa-chalkboard-teacher',label: 'Faculty'    },
    { to: '/gallery',     icon: 'fa-images',            label: 'Gallery'    },
    { to: '/sections',    icon: 'fa-layer-group',       label: 'Sections'   },
    { to: '/discover',    icon: 'fa-compass',           label: 'Discovery'  },
    { to: '/messages',    icon: 'fa-comment-dots',      label: 'Messages'   },
    { to: '/voice-notes', icon: 'fa-microphone',        label: 'Voice Notes'},
    { to: '/analytics',   icon: 'fa-chart-bar',         label: 'Analytics'  },
    { to: '/flipbook',    icon: 'fa-book-open',         label: 'Flipbook',    feature: ['enable_flipbook_viewer','publish_yearbook'] },
  ].filter(n => {
    if (!n.feature) return true;
    const keys = Array.isArray(n.feature) ? n.feature : [n.feature];
    return keys.every(k => isOn(k));
  });

  return (
    <aside className="flex flex-col gap-4 sticky top-[88px]">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-slate-100 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#fdb813]/40">
            <img src={avatar} alt={user?.name}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=U&background=fdb813&color=1d2b4b`; }}
            />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#1d2b4b] m-0">{user?.name}</p>
            <p className="text-[11px] text-slate-400 m-0 mt-0.5">{user?.course ?? 'Student'}</p>
          </div>

          {tier === 'premium' && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <i className="fas fa-crown text-[8px]" /> Premium
            </span>
          )}
          {tier === 'standard' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <i className="fas fa-star text-[8px]" /> Standard
            </span>
          )}
          {tier === 'free' && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <i className="fas fa-user text-[8px]" /> Free Plan
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Posts',    key: 'posts_count'   },
            { label: 'Tagged in',key: 'tagged_count'  },
          ].map(({ label, key }) => (
            <div key={key} className="bg-[#f4f7fe] rounded-xl p-3 text-center">
              <p className="text-[18px] font-extrabold text-[#1d2b4b] m-0">{user?.[key] ?? '—'}</p>
              <p className="text-[10px] text-slate-400 m-0 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <Link to={`/profile/${user?.id}`}
          className="block text-center py-2.5 bg-[#1d2b4b] text-[#fdb813] font-bold text-[12px]
                     rounded-xl no-underline hover:bg-[#2a3d6b] transition-colors">
          View my profile
        </Link>

        {!isPremium && isOn('enable_premium_subscription') && (
          <Link to="/premium"
            className="mt-2 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold
                       text-[#fdb813] bg-[#fdb813]/10 border border-[#fdb813]/20 rounded-xl
                       no-underline hover:bg-[#fdb813]/20 transition-colors">
            <i className="fas fa-crown text-[10px]" /> Upgrade plan →
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 py-1 mb-1">Navigation</p>
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-slate-600
                       no-underline hover:bg-[#f4f7fe] hover:text-[#1d2b4b] transition-colors
                       [&.active]:bg-[#3f51b5]/10 [&.active]:text-[#3f51b5] [&.active]:font-semibold">
            <i className={`fas ${icon} text-[13px] w-4 text-center`} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

// ─── Right sidebar ────────────────────────────────────────────────────────────
function RightSidebar({ batchmates, batchStats, topViewed }) {
  return (
    <aside className="flex flex-col gap-4 sticky top-[88px]">

      {/* Batchmates */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-3">Batchmates</p>
        {batchmates.slice(0, 5).map(s => {
          const avatar = storageUrl(s.profile_picture)
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff&size=64`;
          return (
            <Link key={s.id} to={`/students/${s.id}`}
              className="flex items-center gap-2.5 py-2 no-underline group">
              <img src={avatar} alt={s.name}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fff`; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1d2b4b] truncate m-0 group-hover:text-[#3f51b5] transition-colors">{s.name}</p>
                <p className="text-[10px] text-slate-400 m-0 truncate">{s.course ?? 'Student'}</p>
              </div>
              <i className="fas fa-chevron-right text-[10px] text-slate-300 group-hover:text-[#3f51b5] transition-colors" aria-hidden="true" />
            </Link>
          );
        })}
        <Link to="/batchmates"
          className="block text-center text-[11px] font-semibold text-[#3f51b5] mt-2 pt-3
                     border-t border-slate-100 no-underline hover:text-[#1d2b4b] transition-colors">
          View all batchmates →
        </Link>
      </div>

      {/* Trending this week */}
      {topViewed?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-3">
            <i className="fas fa-fire text-orange-400 mr-1.5" aria-hidden="true" />
            Trending this week
          </p>
          {topViewed.slice(0, 5).map((s, i) => {
            const avatar = storageUrl(s.profile_picture)
              || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fdb813&size=64`;
            const views = s.views_this_week ?? s.views ?? s.total_views ?? 0;
            return (
              <Link key={s.id} to={`/students/${s.id}`}
                className="flex items-center gap-2.5 py-2 no-underline group">
                <span className="text-[11px] font-black text-slate-300 w-4 text-center flex-shrink-0">#{i + 1}</span>
                <img src={avatar} alt={s.name}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fff`; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#1d2b4b] truncate m-0 group-hover:text-[#3f51b5] transition-colors">{s.name}</p>
                  <p className="text-[10px] text-slate-400 m-0">{views.toLocaleString()} views</p>
                </div>
              </Link>
            );
          })}
          <Link to="/analytics"
            className="block text-center text-[11px] font-semibold text-[#3f51b5] mt-2 pt-3
                       border-t border-slate-100 no-underline hover:text-[#1d2b4b] transition-colors">
            See full analytics →
          </Link>
        </div>
      )}

      {/* Batch stats */}
      {batchStats && (
        <div className="bg-[#1d2b4b] rounded-2xl p-4">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#fdb813]/70 mb-3">
            Batch {batchStats.year} stats
          </p>
          {[
            { label: 'Graduates',       value: batchStats.total_students  },
            { label: 'Photos uploaded', value: batchStats.total_photos    },
            { label: 'Posts this week', value: batchStats.posts_this_week },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-1.5">
              <span className="text-[12px] text-white/50">{label}</span>
              <span className="text-[12px] font-bold text-white">{(value ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// ─── Feed skeleton ────────────────────────────────────────────────────────────
function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-slate-200 rounded w-32 mb-1.5" />
              <div className="h-2.5 bg-slate-100 rounded w-24" />
            </div>
          </div>
          <div className="h-56 bg-slate-100" />
          <div className="px-4 py-3">
            <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }    = useAuth();
  const { isOn }    = useAppConfig();
  const navigate    = useNavigate();

  const [filter,      setFilter]      = useState('all');
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [batchmates,  setBatchmates]  = useState([]);
  const [topViewed,   setTopViewed]   = useState([]);
  const [batchStats,  setBatchStats]  = useState(null);

  // ── Search state ────────────────────────────────────────────────────────────
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState(null);
  const [showDrop,   setShowDrop]   = useState(false);
  const searchRef = useRef();

  // ── Fetch feed ──────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (activeFilter, activePage, activeQuery = query) => {
    try {
      const { data } = await axios.get('/feed', {
        params: { filter: activeFilter, page: activePage, per_page: 10, q: activeQuery || undefined },
      });
      const newPosts = data.data ?? data ?? [];
      if (activePage === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      const meta = data.meta ?? data;
      setHasMore(meta.current_page < meta.last_page || newPosts.length === 10);
    } catch (_) {
      // silently degrade
    }
  }, [query]);

  // initial load + filter change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchFeed(filter, 1, query).finally(() => setLoading(false));
  }, [filter, query, fetchFeed]);

  // ── Sidebar data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [bm, tv] = await Promise.allSettled([
          axios.get('/batchmates', { params: { per_page: 10 } }),
          axios.get('/analytics/trending'),
        ]);
        if (bm.status === 'fulfilled') setBatchmates(bm.value.data.data ?? bm.value.data ?? []);
        if (tv.status === 'fulfilled') setTopViewed(tv.value.data.data ?? tv.value.data ?? []);
      } catch (_) {}
    })();
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchFeed(filter, next, query);
    setLoadingMore(false);
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const onSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) { setShowDrop(false); return; }
    try {
      const { data } = await searchApi.search(val);
      setResults(data.results);
      setShowDrop(true);
    } catch (_) {}
  };

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Update tags in local state ──────────────────────────────────────────────
  //
  // FIX: now receives the full tagged_students array returned by the server
  // instead of a flat list of IDs that we had to re-hydrate from batchmates.
  // This means AI-tagged students (who may not be in the batchmates sidebar
  // list) are correctly preserved in the feed card.
  // ───────────────────────────────────────────────────────────────────────────
  const handleTagSaved = (postId, taggedStudents) => {
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : { ...p, tagged_students: taggedStudents }
    ));
  };

  const FILTERS = [
    { key: 'all',        label: 'All posts'       },
    { key: 'public',     label: 'Public'          },
    { key: 'batchmates', label: 'Batchmates only' },
    { key: 'mine',       label: 'My posts'        },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col">
      {/* Watermark */}
      <div
        aria-hidden="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg]
                   text-[clamp(2rem,6vw,5rem)] font-black text-black/[0.018]
                   pointer-events-none select-none z-0 whitespace-nowrap"
      >
        {user?.name}
      </div>

      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Top search bar ── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-xl relative z-50" ref={searchRef}>
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search students, faculty, or content…"
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white border border-slate-200
                         text-[#1d2b4b] placeholder-slate-400 outline-none shadow-sm
                         focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b5]/20 transition"
            />

            {showDrop && (
              <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                {results?.faculty?.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-[#3f51b5] bg-slate-50 m-0">Faculty</p>
                    {results.faculty.map(f => (
                      <Link key={f.id} to="/faculty"
                        className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-slate-50 border-b border-slate-50 transition-colors">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fff`}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt={f.name}
                        />
                        <div>
                          <p className="text-[13px] font-semibold text-[#1d2b4b] m-0">{f.name}</p>
                          <p className="text-[11px] text-slate-400 m-0">{f.title ?? 'Faculty'}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                {results?.students?.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-amber-600 bg-slate-50 m-0">Students</p>
                    {results.students.map(s => (
                      <Link key={s.id} to={`/students/${s.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-slate-50 border-b border-slate-50 transition-colors">
                        <img
                          src={storageUrl(s.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff`}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt={s.name}
                        />
                        <div>
                          <p className="text-[13px] font-semibold text-[#1d2b4b] m-0">{s.name}</p>
                          <p className="text-[11px] text-slate-400 m-0">Pioneer Student</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                {!results?.faculty?.length && !results?.students?.length && (
                  <p className="py-5 text-center text-sm text-slate-400">No results found.</p>
                )}
              </div>
            )}
          </div>

          {/* Welcome greeting */}
          <div className="hidden lg:block ml-auto text-right">
            <p className="text-[11px] text-slate-400 m-0 tracking-widest uppercase">Mabuhay, Pioneer!</p>
            <p className="text-[15px] font-extrabold text-[#1d2b4b] m-0">
              Welcome back, <span className="text-[#3f51b5]">{user?.name?.split(' ')[0]}</span>
            </p>
          </div>
        </div>

        {/* ── 3-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">

          {/* Left sidebar */}
          <div className="hidden">
            <LeftSidebar user={user} isOn={isOn} />
          </div>

          {/* Feed column */}
          <div className="min-w-0">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`text-[12px] font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer
                    ${filter === key
                      ? 'bg-[#1d2b4b] text-[#fdb813] border-[#1d2b4b]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Posts */}
            {loading ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
                <i className="fas fa-photo-video text-3xl text-slate-200 block mb-3" aria-hidden="true" />
                <p className="text-[14px] font-semibold text-slate-400 m-0">No posts here yet.</p>
                <p className="text-[12px] text-slate-300 m-0 mt-1">
                  {filter === 'mine' ? 'Upload your first photo in Gallery.' : 'Check back later!'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={user}
                    batchmates={batchmates}
                    onTagSaved={handleTagSaved}
                  />
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-[13px] font-semibold text-[#3f51b5] bg-white
                               border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors
                               cursor-pointer disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fas fa-spinner fa-spin text-xs" /> Loading more…
                      </span>
                    ) : 'Load more posts'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <RightSidebar
              batchmates={batchmates}
              topViewed={topViewed}
              batchStats={batchStats}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
