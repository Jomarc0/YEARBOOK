import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { searchApi } from '@/api/search.api';
import { storageUrl } from '@/api/client';
import Navbar from '@/components/layout/Navbar';
import axios from '@/api/client';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const [digest,   setDigest]   = useState(null);
  const [digestLoading, setDigestLoading] = useState(true);
  const searchRef = useRef();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  // ── Fetch memory digest ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const { data } = await axios.get('/memories/digest');
        setDigest(data.data);
      } catch (_) {
      } finally {
        setDigestLoading(false);
      }
    };
    fetchDigest();
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
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'U';

  const avatarSrc = storageUrl(user?.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=1d2b4b&color=fdb813&size=128`;

  const cards = [
    { to: '/directory',   icon: 'fas fa-users',             label: 'Students',    desc: 'Browse the student directory.',  color: '#eef2ff', iconColor: '#3f51b5' },
    { to: '/faculty',     icon: 'fas fa-chalkboard-teacher', label: 'Faculty',     desc: 'Meet our educators.',            color: '#f5f3ff', iconColor: '#8b5cf6' },
    { to: '/gallery',     icon: 'fas fa-images',             label: 'Gallery',     desc: 'Relive school memories.',        color: '#f0fdf4', iconColor: '#22c55e' },
    { to: '/sections',    icon: 'fas fa-layer-group',        label: 'Sections',    desc: 'View batch groupings.',          color: '#fff7ed', iconColor: '#f97316' },
    { to: '/messages',    icon: 'fas fa-comment-dots',       label: 'Messages',    desc: 'Chat with classmates.',          color: '#fef3c7', iconColor: '#d97706' },
    { to: '/flipbook',    icon: 'fas fa-book-open',          label: 'Flipbook',    desc: 'Browse the digital yearbook.',   color: '#fce7f3', iconColor: '#db2777' },
    { to: '/voice-notes', icon: 'fas fa-microphone',         label: 'Voice Notes', desc: 'Record audio memories.',         color: '#ecfdf5', iconColor: '#059669' },
    { to: '/settings',    icon: 'fas fa-cog',                label: 'Settings',    desc: 'Manage your profile.',           color: '#f1f5f9', iconColor: '#475569' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fe' }}>
      <Navbar />

      {/* Watermark */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', pointerEvents: 'none', userSelect: 'none',
        transform: 'translate(-50%,-50%) rotate(-30deg)', fontSize: '4rem', fontWeight: 900,
        color: 'rgba(0,0,0,0.025)', zIndex: 9999, whiteSpace: 'nowrap',
      }}>{user?.name}</div>

      <main style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Mabuhay, NU Lipa Pioneer!</p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d2b4b', letterSpacing: '-1px', margin: 0 }}>
            Welcome back, <span style={{ color: '#3f51b5' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 600, marginBottom: 40, zIndex: 1000 }} ref={searchRef}>
          <i className="fas fa-search" style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 14,
          }} />
          <input
            type="text"
            value={query}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search students, faculty, or content..."
            style={{
              width: '100%', padding: '13px 18px 13px 46px', fontSize: 14,
              border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff',
              outline: 'none', boxSizing: 'border-box', color: '#1d2b4b',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#3f51b5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          {showDrop && (
            <div style={{
              position: 'absolute', width: '100%', background: '#fff', marginTop: 6,
              borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9', overflow: 'hidden',
            }}>
              {results?.faculty?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#3f51b5', background: '#f8fafc', letterSpacing: 1, textTransform: 'uppercase' }}>Faculty</div>
                  {results.faculty.map(f => (
                    <Link key={f.id} to="/faculty" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', textDecoration: 'none', color: 'inherit',
                      borderBottom: '1px solid #f8fafc',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fff`}
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.title ?? 'Faculty'}</div>
                      </div>
                    </Link>
                  ))}
                </>
              )}

              {results?.students?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#d97706', background: '#f8fafc', letterSpacing: 1, textTransform: 'uppercase' }}>Students</div>
                  {results.students.map(s => (
                    <Link key={s.id} to={`/profile/${s.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', textDecoration: 'none', color: 'inherit',
                      borderBottom: '1px solid #f8fafc',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <img
                        src={storageUrl(s.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff`}
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Pioneer Student</div>
                      </div>
                    </Link>
                  ))}
                </>
              )}

              {!results?.students?.length && !results?.faculty?.length && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                  No results found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Quick Access Cards */}
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1d2b4b', marginBottom: 16, marginTop: 0 }}>Quick Access</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {cards.map(c => (
                  <Link key={c.to} to={c.to} style={{
                    background: '#fff', borderRadius: 16, padding: '20px 18px',
                    textDecoration: 'none', color: 'inherit',
                    border: '1px solid #f1f5f9', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: c.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                      <i className={c.icon} style={{ color: c.iconColor, fontSize: 16 }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b', marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{c.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Memory Digest ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1d2b4b', margin: 0 }}>
                  <i className="fas fa-clock-rotate-left" style={{ marginRight: 8, color: '#3f51b5' }} />
                  Your Memories
                </h2>
                {!user?.is_premium && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#d97706',
                    background: '#fef3c7', borderRadius: 6, padding: '3px 10px',
                  }}>
                    Upgrade for more
                  </span>
                )}
              </div>

              {digestLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 16, padding: 20,
                      border: '1px solid #f1f5f9', height: 120,
                      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                    }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* On This Day */}
                  <MemoryCard
                    icon="fas fa-calendar-day"
                    iconColor="#3f51b5"
                    iconBg="#eef2ff"
                    label={`On This Day — ${digest?.on_this_day?.date ?? ''}`}
                    empty={!digest?.on_this_day?.has_memories}
                    emptyText="No memories from this day yet. Start uploading photos!"
                  >
                    {digest?.on_this_day?.has_memories && (
                      <PhotoStrip
                        photos={[
                          ...(digest.on_this_day.uploaded ?? []),
                          ...(digest.on_this_day.tagged ?? []),
                        ]}
                      />
                    )}
                  </MemoryCard>

                  {/* Premium cards */}
                  {user?.is_premium ? (
                    <>
                      {/* Tagged Photos */}
                      <MemoryCard
                        icon="fas fa-user-tag"
                        iconColor="#8b5cf6"
                        iconBg="#f5f3ff"
                        label="You Appeared In These Photos"
                        empty={!digest?.tagged_photos?.count}
                        emptyText="No face-tagged photos found yet."
                      >
                        {digest?.tagged_photos?.count > 0 && (
                          <PhotoStrip photos={digest.tagged_photos.photos ?? []} />
                        )}
                      </MemoryCard>

                      {/* Top Interactions */}
                      <MemoryCard
                        icon="fas fa-users"
                        iconColor="#059669"
                        iconBg="#ecfdf5"
                        label="People You Interacted With Most"
                        empty={!digest?.top_interactions?.peers?.length}
                        emptyText="Start messaging classmates to see your top connections."
                      >
                        {digest?.top_interactions?.peers?.length > 0 && (
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {digest.top_interactions.peers.map((p, i) => (
                              <Link key={i} to={`/profile/${p.user.id}`} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: '#f8fafc', borderRadius: 10, padding: '8px 12px',
                                textDecoration: 'none', color: 'inherit',
                                border: '1px solid #f1f5f9',
                              }}>
                                <img
                                  src={storageUrl(p.user.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.name ?? '')}&background=3f51b5&color=fff`}
                                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1d2b4b' }}>{p.user.name}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.messages} messages · {p.shared_photos} photos</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </MemoryCard>

                      {/* Graduation Memories */}
                      <MemoryCard
                        icon="fas fa-graduation-cap"
                        iconColor="#db2777"
                        iconBg="#fce7f3"
                        label={`Graduation Memories${digest?.graduation?.graduation_year ? ` — ${digest.graduation.graduation_year}` : ''}`}
                        empty={!digest?.graduation?.has_photos}
                        emptyText="No graduation photos found for your batch yet."
                      >
                        {digest?.graduation?.has_photos && (
                          <PhotoStrip photos={digest.graduation.photos ?? []} />
                        )}
                      </MemoryCard>

                      {/* Most Viewed Today */}
                      <MemoryCard
                        icon="fas fa-fire"
                        iconColor="#f97316"
                        iconBg="#fff7ed"
                        label="Most Viewed Alumni Today"
                        empty={!digest?.most_viewed?.students?.length}
                        emptyText="No view data yet."
                      >
                        {digest?.most_viewed?.students?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {digest.most_viewed.students.map((s, i) => (
                              <Link key={i} to={`/profile/${s.id}`} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                textDecoration: 'none', color: 'inherit',
                                padding: '6px 0',
                                borderBottom: i < digest.most_viewed.students.length - 1 ? '1px solid #f1f5f9' : 'none',
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', minWidth: 20 }}>#{i + 1}</span>
                                <img
                                  src={storageUrl(s.profile_picture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name ?? '')}&background=1d2b4b&color=fdb813`}
                                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1d2b4b' }}>{s.name}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.course?.split(' ').pop()}</div>
                                </div>
                                <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>{s.views} views</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </MemoryCard>
                    </>
                  ) : (
                    /* Premium upsell */
                    <div style={{
                      background: 'linear-gradient(135deg, #1d2b4b, #3f51b5)',
                      borderRadius: 16, padding: 24, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 16,
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                          Unlock 4 more memory cards
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                          Tagged photos · Top connections · Graduation memories · Most viewed alumni
                        </div>
                      </div>
                      <Link to="/payment" style={{
                        background: '#fdb813', color: '#1d2b4b', borderRadius: 10,
                        padding: '10px 18px', fontSize: 12, fontWeight: 700,
                        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        Go Premium
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Card — unchanged */}
          <div style={{
            background: '#1d2b4b', borderRadius: 20, padding: 28,
            color: '#fff', display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(253,184,19,0.12)', borderRadius: 6,
              padding: '4px 10px', width: 'fit-content',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#fdb813', letterSpacing: 1, textTransform: 'uppercase' }}>Pioneer Batch</span>
            </div>

            <div style={{
              width: 72, height: 72, borderRadius: 16,
              overflow: 'hidden', flexShrink: 0,
              border: '3px solid rgba(253,184,19,0.4)',
            }}>
              <img
                src={avatarSrc}
                alt={user?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=fdb813&color=1d2b4b&size=128`;
                }}
              />
            </div>

            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.2 }}>{user?.name}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 3px' }}>ID: {user?.student_id ?? 'N/A'}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{user?.course ?? 'Student'}</p>
            </div>

            <Link to={`/profile/${user?.id}`} style={{
              display: 'block', textAlign: 'center', padding: '12px',
              background: '#fdb813', color: '#1d2b4b', borderRadius: 10,
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              View My Profile
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Reusable memory card wrapper ─────────────────────────────────────────────
function MemoryCard({ icon, iconColor, iconBg, label, empty, emptyText, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 20,
      border: '1px solid #f1f5f9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className={icon} style={{ color: iconColor, fontSize: 13 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>{label}</span>
      </div>
      {empty ? (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{emptyText}</p>
      ) : children}
    </div>
  );
}

// ── Horizontal photo strip ────────────────────────────────────────────────────
function PhotoStrip({ photos }) {
  if (!photos?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {photos.map((p, i) => (
        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={p.url}
            alt={p.caption ?? ''}
            style={{
              width: 80, height: 80, borderRadius: 10,
              objectFit: 'cover', display: 'block',
              border: '1px solid #f1f5f9',
            }}
            onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=📷'; }}
          />
          {p.years_ago && (
            <span style={{
              position: 'absolute', bottom: 4, left: 4, right: 4,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 9, fontWeight: 600, borderRadius: 4,
              padding: '2px 4px', textAlign: 'center',
            }}>
              {p.years_ago}y ago
            </span>
          )}
        </div>
      ))}
    </div>
  );
}