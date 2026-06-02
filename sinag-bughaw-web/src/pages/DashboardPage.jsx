/**
 * DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MIGRATION NOTES:
 *  - Removed all inline `style={{}}` props; replaced with Tailwind utility classes.
 *  - Replaced arbitrary hex colors with a consistent token set via Tailwind's
 *    JIT `[value]` syntax for the brand palette (#1d2b4b, #3f51b5, #fdb813).
 *  - `onMouseEnter/Leave` inline style mutations removed; replaced with Tailwind
 *    `hover:` variants and `group-hover:` where needed.
 *  - No logic, API calls, routes, or backend behavior changed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { searchApi } from '@/api/search.api';
import { storageUrl } from '@/api/client';
import Navbar from '@/components/layout/Navbar';
import axios from '@/api/client';

// ─── Tier helper ──────────────────────────────────────────────────────────────
const getTier = (user) => {
  if (!user) return 'free';
  if (user.tier === 'premium' || user.is_premium) return 'premium';
  if (user.tier === 'standard') return 'standard';
  return 'free';
};

// ─── Quick access card definitions ───────────────────────────────────────────
const CARDS = [
  { to: '/directory',   icon: 'fas fa-users',              label: 'Students',    desc: 'Browse the student directory.',  iconBg: 'bg-indigo-50',  iconTxt: 'text-indigo-600'  },
  { to: '/faculty',     icon: 'fas fa-chalkboard-teacher', label: 'Faculty',     desc: 'Meet our educators.',            iconBg: 'bg-violet-50',  iconTxt: 'text-violet-600'  },
  { to: '/gallery',     icon: 'fas fa-images',             label: 'Gallery',     desc: 'Relive school memories.',        iconBg: 'bg-emerald-50', iconTxt: 'text-emerald-600' },
  { to: '/sections',    icon: 'fas fa-layer-group',        label: 'Sections',    desc: 'View batch groupings.',          iconBg: 'bg-orange-50',  iconTxt: 'text-orange-500'  },
  { to: '/messages',    icon: 'fas fa-comment-dots',       label: 'Messages',    desc: 'Chat with classmates.',          iconBg: 'bg-amber-50',   iconTxt: 'text-amber-600'   },
  { to: '/flipbook',    icon: 'fas fa-book-open',          label: 'Flipbook',    desc: 'Browse the digital yearbook.',   iconBg: 'bg-pink-50',    iconTxt: 'text-pink-600'    },
  { to: '/voice-notes', icon: 'fas fa-microphone',         label: 'Voice Notes', desc: 'Record audio memories.',         iconBg: 'bg-teal-50',    iconTxt: 'text-teal-600'    },
  { to: '/analytics',   icon: 'fas fa-chart-bar',          label: 'Analytics',   desc: "See who's trending.",            iconBg: 'bg-sky-50',     iconTxt: 'text-sky-600'     },
  { to: '/settings',    icon: 'fas fa-cog',                label: 'Settings',    desc: 'Manage your profile.',           iconBg: 'bg-slate-100',  iconTxt: 'text-slate-500'   },
];

// ─── Main page component ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userTier  = getTier(user);
  const isPremium = userTier === 'premium' || userTier === 'standard';

  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState(null);
  const [showDrop,      setShowDrop]      = useState(false);
  const [digest,        setDigest]        = useState(null);
  const [digestLoading, setDigestLoading] = useState(true);
  const searchRef = useRef();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/memories/digest');
        setDigest(data.data);
      } catch (_) {}
      finally { setDigestLoading(false); }
    })();
  }, []);

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

  const firstName = user?.name?.split(' ')[0] ?? 'Pioneer';
  const avatarSrc =
    storageUrl(user?.profile_picture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=1d2b4b&color=fdb813&size=128`;

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      {/* ── Watermark (decorative, aria-hidden) ── */}
      <div
        aria-hidden="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg]
                   text-[clamp(2rem,6vw,5rem)] font-black text-black/[0.022]
                   pointer-events-none select-none z-[9999] whitespace-nowrap"
      >
        {user?.name}
      </div>

      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* ── Welcome header ── */}
        <header className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-1">
            Mabuhay, NU Lipa Pioneer!
          </p>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-tight text-[#1d2b4b] leading-none m-0">
            Welcome back,{' '}
            <span className="text-[#3f51b5]">{firstName}</span>
          </h1>
        </header>

        {/* ── Global search ── */}
        <div className="relative max-w-xl mb-10 z-50" ref={searchRef}>
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search students, faculty, or content…"
            className="w-full pl-11 pr-4 py-3.5 text-sm rounded-xl bg-white border border-slate-200
                       text-[#1d2b4b] placeholder-slate-400 outline-none shadow-sm
                       transition focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b5]/20"
          />

          {/* ── Search dropdown ── */}
          {showDrop && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              <SearchGroup label="Faculty" labelColor="text-[#3f51b5]">
                {results?.faculty?.map(f => (
                  <SearchRow
                    key={f.id} to="/faculty"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fff`}
                    name={f.name} sub={f.title ?? 'Faculty'}
                  />
                ))}
              </SearchGroup>
              <SearchGroup label="Students" labelColor="text-amber-600">
                {results?.students?.map(s => (
                  <SearchRow
                    key={s.id} to={`/profile/${s.id}`}
                    src={storageUrl(s.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff`}
                    name={s.name} sub="Pioneer Student"
                  />
                ))}
              </SearchGroup>
              {!results?.faculty?.length && !results?.students?.length && (
                <p className="py-5 text-center text-sm text-slate-400">No results found.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Two-column content grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-6 items-start">

          {/* ── LEFT column ── */}
          <div className="flex flex-col gap-8">

            {/* Quick Access cards */}
            <section>
              <SectionTitle>Quick Access</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {CARDS.map(c => (
                  <Link
                    key={c.to} to={c.to}
                    className="group bg-white rounded-2xl p-4 border border-slate-100 no-underline
                               hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70
                               transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <i className={`${c.icon} ${c.iconTxt} text-base`} aria-hidden="true" />
                    </div>
                    <p className="text-[13px] font-semibold text-[#1d2b4b] mb-0.5 m-0">{c.label}</p>
                    <p className="text-[11px] text-slate-400 leading-snug m-0">{c.desc}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Memory Digest */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle as="span" noBottom>
                  <i className="fas fa-clock-rotate-left text-[#3f51b5] mr-2" aria-hidden="true" />
                  Your Memories
                </SectionTitle>

                {/* Tier badge */}
                {!isPremium ? (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    <i className="fas fa-lock text-[9px] mr-1" />
                    Upgrade for more
                  </span>
                ) : userTier === 'premium' ? (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    Premium
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    Standard
                  </span>
                )}
              </div>

              {digestLoading ? (
                /* Loading skeleton */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">

                  {/* "On This Day" — visible to all tiers */}
                  <MemoryCard
                    icon="fas fa-calendar-day" iconCls="text-indigo-600" iconBg="bg-indigo-50"
                    label={`On This Day${digest?.on_this_day?.date ? ` — ${digest.on_this_day.date}` : ''}`}
                    empty={!digest?.on_this_day?.has_memories}
                    emptyText="No memories from this day yet. Start uploading photos!"
                  >
                    <PhotoStrip photos={[...(digest?.on_this_day?.uploaded ?? []), ...(digest?.on_this_day?.tagged ?? [])]} />
                  </MemoryCard>

                  {isPremium ? (
                    /* Premium & Standard extra memory cards */
                    <>
                      <MemoryCard
                        icon="fas fa-user-tag" iconCls="text-violet-600" iconBg="bg-violet-50"
                        label="You Appeared In These Photos"
                        empty={!digest?.tagged_photos?.count}
                        emptyText="No face-tagged photos found yet."
                      >
                        <PhotoStrip photos={digest?.tagged_photos?.photos ?? []} />
                      </MemoryCard>

                      <MemoryCard
                        icon="fas fa-users" iconCls="text-emerald-600" iconBg="bg-emerald-50"
                        label="People You Interacted With Most"
                        empty={!digest?.top_interactions?.peers?.length}
                        emptyText="Start messaging classmates to see your top connections."
                      >
                        <div className="flex flex-wrap gap-2">
                          {digest?.top_interactions?.peers?.map((p, i) => (
                            <Link
                              key={i} to={`/profile/${p.user.id}`}
                              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-100
                                         rounded-xl px-3 py-2 no-underline transition-colors"
                            >
                              <img
                                src={storageUrl(p.user.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.name ?? '')}&background=3f51b5&color=fff`}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                alt={p.user.name}
                              />
                              <div>
                                <p className="text-[12px] font-semibold text-[#1d2b4b] m-0">{p.user.name}</p>
                                <p className="text-[10px] text-slate-400 m-0">{p.messages} msgs · {p.shared_photos} photos</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </MemoryCard>

                      <MemoryCard
                        icon="fas fa-graduation-cap" iconCls="text-pink-600" iconBg="bg-pink-50"
                        label={`Graduation Memories${digest?.graduation?.graduation_year ? ` — ${digest.graduation.graduation_year}` : ''}`}
                        empty={!digest?.graduation?.has_photos}
                        emptyText="No graduation photos found for your batch yet."
                      >
                        <PhotoStrip photos={digest?.graduation?.photos ?? []} />
                      </MemoryCard>

                      <MemoryCard
                        icon="fas fa-fire" iconCls="text-orange-500" iconBg="bg-orange-50"
                        label="Most Viewed Alumni Today"
                        empty={!digest?.most_viewed?.students?.length}
                        emptyText="No view data yet."
                      >
                        <div className="flex flex-col divide-y divide-slate-50">
                          {digest?.most_viewed?.students?.map((s, i) => (
                            <Link
                              key={i} to={`/profile/${s.id}`}
                              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 no-underline hover:opacity-75 transition-opacity"
                            >
                              <span className="text-[11px] font-bold text-slate-300 w-5 text-center shrink-0">#{i + 1}</span>
                              <img
                                src={storageUrl(s.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name ?? '')}&background=1d2b4b&color=fdb813`}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                alt={s.name}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#1d2b4b] truncate m-0">{s.name}</p>
                                <p className="text-[10px] text-slate-400 m-0">{s.course?.split(' ').pop()}</p>
                              </div>
                              <span className="text-[11px] text-orange-500 font-semibold whitespace-nowrap">{s.views} views</span>
                            </Link>
                          ))}
                        </div>
                      </MemoryCard>
                    </>
                  ) : (
                    /* Free tier — upgrade prompt */
                    <div className="rounded-2xl bg-gradient-to-br from-[#1d2b4b] to-[#3f51b5] p-6
                                    flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white mb-1 m-0">
                          <i className="fas fa-lock text-[#fdb813] mr-2" />
                          Unlock 4 more memory cards
                        </p>
                        <p className="text-xs text-white/60 m-0">Tagged photos · Top connections · Graduation memories · Most viewed alumni</p>
                        <p className="text-[10px] text-white/40 m-0 mt-1">Available on Standard and Premium plans.</p>
                      </div>
                      <Link
                        to="/payment"
                        className="shrink-0 bg-[#fdb813] text-[#1d2b4b] font-bold text-xs px-5 py-3 rounded-xl
                                   no-underline hover:bg-yellow-300 transition-colors whitespace-nowrap"
                      >
                        <i className="fas fa-crown mr-1.5" />
                        Go Premium →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT: Profile sidebar ── */}
          <aside className="xl:sticky xl:top-6">
            <div className="bg-[#1d2b4b] rounded-2xl p-6 text-white flex flex-col gap-5">

              <span className="inline-flex items-center gap-1.5 bg-[#fdb813]/15 text-[#fdb813]
                               text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg w-fit">
                Pioneer Batch
              </span>

              {/* Avatar */}
              <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-[3px] border-[#fdb813]/40 flex-shrink-0">
                <img
                  src={avatarSrc}
                  alt={user?.name}
                  className="w-full h-full object-cover block"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=fdb813&color=1d2b4b&size=128`;
                  }}
                />
              </div>

              {/* User info */}
              <div>
                <h2 className="text-xl font-bold leading-snug mb-1">{user?.name}</h2>
                <p className="text-xs text-white/40 mb-0.5 m-0">ID: {user?.student_id ?? 'N/A'}</p>
                <p className="text-xs text-white/40 m-0">{user?.course ?? 'Student'}</p>

                {/* Tier pill */}
                <div className="mt-2">
                  {userTier === 'premium' && (
                    <span className="inline-flex items-center gap-1 bg-amber-400/15 text-amber-300
                                     text-[10px] font-bold px-2 py-1 rounded-lg leading-none">
                      Premium Plan
                    </span>
                  )}
                  {userTier === 'standard' && (
                    <span className="inline-flex items-center gap-1 bg-indigo-400/15 text-indigo-300
                                     text-[10px] font-bold px-2 py-1 rounded-lg leading-none">
                      Standard Plan
                    </span>
                  )}
                  {userTier === 'free' && (
                    <span className="inline-flex items-center gap-1 bg-white/[0.08] text-white/30
                                     text-[10px] font-semibold px-2 py-1 rounded-lg leading-none">
                      <i className="fas fa-user text-[8px]" /> Free Plan
                    </span>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <Link
                to={`/profile/${user?.id}`}
                className="block text-center py-3 bg-[#fdb813] text-[#1d2b4b] font-bold text-sm
                           rounded-xl no-underline hover:bg-yellow-300 transition-colors"
              >
                View My Profile
              </Link>

              <Link
                to="/analytics"
                className="flex items-center justify-center gap-2 py-2.5 bg-sky-500/10 text-sky-300
                           font-semibold text-xs rounded-xl no-underline hover:bg-sky-500/20 transition-colors"
              >
                <i className="fas fa-chart-bar text-xs" aria-hidden="true" />
                See who's trending this week →
              </Link>

              {!isPremium && (
                <Link
                  to="/payment"
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#fdb813]/10 text-[#fdb813]
                             font-semibold text-xs rounded-xl no-underline hover:bg-[#fdb813]/20 transition-colors
                             border border-[#fdb813]/20"
                >
                  <i className="fas fa-crown text-xs" aria-hidden="true" />
                  Upgrade Your Plan →
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 py-2 text-xs text-white/30
                           hover:text-white/70 transition-colors cursor-pointer bg-transparent border-none"
              >
                <i className="fas fa-sign-out-alt text-xs" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─── Primitive components ─────────────────────────────────────────────────────

/** Section heading with optional bottom margin */
function SectionTitle({ children, as: Tag = 'h2', noBottom }) {
  return (
    <Tag className={`text-[13px] font-semibold text-[#1d2b4b] uppercase tracking-widest ${noBottom ? '' : 'mb-4'}`}>
      {children}
    </Tag>
  );
}

/** Labelled search result group — renders nothing if no child rows */
function SearchGroup({ label, labelColor, children }) {
  const kids = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <>
      <p className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase ${labelColor} bg-slate-50 m-0`}>
        {label}
      </p>
      {children}
    </>
  );
}

/** Single search result row */
function SearchRow({ to, src, name, sub }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-slate-50 border-b border-slate-50 transition-colors"
    >
      <img src={src} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt={name} />
      <div>
        <p className="text-[13px] font-semibold text-[#1d2b4b] m-0">{name}</p>
        <p className="text-[11px] text-slate-400 m-0">{sub}</p>
      </div>
    </Link>
  );
}

/** Memory digest card wrapper */
function MemoryCard({ icon, iconCls, iconBg, label, empty, emptyText, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} ${iconCls} text-[13px]`} aria-hidden="true" />
        </div>
        <span className="text-[13px] font-semibold text-[#1d2b4b]">{label}</span>
      </div>
      {empty ? <p className="text-[12px] text-slate-400 m-0">{emptyText}</p> : children}
    </div>
  );
}

/**
 * Horizontal photo strip used inside memory cards.
 * Hides scrollbar cross-browser via Tailwind's scrollbar-hide utility.
 */
function PhotoStrip({ photos }) {
  if (!photos?.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {photos.map((p, i) => (
        <div key={i} className="relative flex-shrink-0">
          <img
            src={p.url}
            alt={p.caption ?? ''}
            className="w-20 h-20 rounded-xl object-cover border border-slate-100 block"
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/80?text=📷'; }}
          />
          {p.years_ago && (
            <span className="absolute bottom-1.5 left-1 right-1 bg-black/55 text-white text-[9px]
                             font-bold rounded px-1 py-0.5 text-center leading-none">
              {p.years_ago}y ago
            </span>
          )}
        </div>
      ))}
    </div>
  );
}