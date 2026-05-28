// src/features/analytics/pages/AnalyticsPage.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAnalyticsDashboard } from '../hooks/useAnalytics';
import { recordProfileView } from '../../../api/analytics.api';
import {
  trackPageView,
  trackTrendingClick,
  trackTopViewedClick,
  trackAnalyticsTabSwitch,
} from '../../../utils/ga4';

const TABS = [
  { id: 'trending',   label: 'Trending',    icon: 'fas fa-fire'      },
  { id: 'top-viewed', label: 'Most Viewed', icon: 'fas fa-eye'       },
  { id: 'my-stats',   label: 'My Stats',    icon: 'fas fa-chart-bar' },
];

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 44 }) {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  if (src) {
    return (
      <img src={src} alt={name} style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0,
        border: '2px solid rgba(253,184,19,0.3)',
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#1d2b4b', color: '#fdb813',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800,
      border: '2px solid rgba(253,184,19,0.3)',
    }}>
      {initials}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px',
      border: '1.5px solid #e8edf5',
      boxShadow: '0 2px 12px rgba(29,43,75,0.06)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={icon} style={{ color, fontSize: 16 }} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1d2b4b', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ height = 16, radius = 8 }) {
  return (
    <div style={{
      height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ── Alumni Row Card ───────────────────────────────────────────────────────────
function AlumniCard({ person, rank, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', textAlign: 'left',
        background: hovered ? '#f8faff' : '#fff',
        border: hovered ? '1.5px solid #3f51b5' : '1.5px solid #e8edf5',
        borderRadius: 16, padding: '14px 18px',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: hovered ? '0 8px 24px rgba(63,81,181,0.1)' : '0 2px 8px rgba(29,43,75,0.04)',
      }}
    >
      {/* Rank */}
      <span style={{
        width: 28, flexShrink: 0, textAlign: 'center',
        fontSize: rank <= 3 ? 20 : 13, fontWeight: 700,
        color: rank <= 3 ? '#fdb813' : '#94a3b8',
      }}>
        {rank <= 3 ? medals[rank - 1] : `#${rank}`}
      </span>

      <Avatar src={person.profile_picture} name={person.name} size={44} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: '#1d2b4b',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {person.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
          {person.course} · {person.batch || person.graduation_year}
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1d2b4b' }}>
          {(badge ?? 0).toLocaleString()}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>views</p>
      </div>
    </button>
  );
}

// ── Spark Bars ────────────────────────────────────────────────────────────────
function SparkBars({ labels, values }) {
  if (!values?.length) return null;
  const max = Math.max(...values, 1);
  const step = Math.max(1, Math.floor(labels.length / 6));

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 20,
      border: '1.5px solid #e8edf5',
      boxShadow: '0 2px 8px rgba(29,43,75,0.04)',
      marginTop: 16,
    }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>
        Profile views — last {labels.length} days
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {values.map((v, i) => (
          <div key={labels[i]} title={`${labels[i]}: ${v} views`} style={{
            flex: 1,
            height: `${Math.max(4, (v / max) * 80)}px`,
            background: 'linear-gradient(to top, #3f51b5, #7986cb)',
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {labels.map((l, i) => (
          <span key={l} style={{
            flex: 1, textAlign: 'center',
            fontSize: 10, color: '#94a3b8',
          }}>
            {i % step === 0 ? l.slice(5) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ isAuthenticated = false, currentUser = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('trending');

  const { summary, trending, topViewed, myStats, trend, batchmates } =
    useAnalyticsDashboard({ isAuthenticated });

  useEffect(() => {
    trackPageView(location.pathname, 'Analytics · Alumni Yearbook');
  }, [location.pathname]);

  function handleTabSwitch(tabId) {
    setTab(tabId);
    trackAnalyticsTabSwitch(tabId);
  }

  function handleTrendingClick(person) {
    trackTrendingClick(person);
    recordProfileView(person.id);
    navigate(`/profile/${person.id}`);
  }

  function handleTopViewedClick(person) {
    trackTopViewedClick(person);
    recordProfileView(person.id);
    navigate(`/profile/${person.id}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7fe' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0e1628 0%, #1d2b4b 50%, #2d3f6e 100%)',
        padding: '48px 40px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%', background:'rgba(63,81,181,0.12)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-40, width:280, height:280, borderRadius:'50%', background:'rgba(253,184,19,0.06)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Sinag-Bughaw</span>
            <i className="fas fa-chevron-right" style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }} />
            <span style={{ fontSize:12, color:'#fdb813', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Analytics</span>
          </div>

          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
            <div>
              {/* Badge */}
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8, marginBottom:16,
                background:'rgba(253,184,19,0.12)', border:'1px solid rgba(253,184,19,0.3)',
                borderRadius:50, padding:'6px 16px',
              }}>
                <img src="/images/NU_logo.png" alt="NU" style={{ width:16, height:16, objectFit:'contain' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#fdb813', letterSpacing:2, textTransform:'uppercase' }}>
                  National University Lipa
                </span>
              </div>

              <h1 style={{ margin:'0 0 10px', fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:900, color:'#fff', letterSpacing:-1, lineHeight:1.1 }}>
                Alumni <span style={{ color:'#fdb813' }}>Analytics</span>
              </h1>
              <p style={{ margin:0, fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
                Discover trending profiles and engagement stats across your batch.
              </p>
            </div>

            {/* Summary stat pills in hero */}
            {!summary.loading && summary.data && (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[
                  { label:'Alumni',   value: summary.data.total_students, icon:'fas fa-users' },
                  { label:'Photos',   value: summary.data.total_photos,   icon:'fas fa-images' },
                  { label:'Messages', value: summary.data.total_messages, icon:'fas fa-comment-dots' },
                ].map(s => (
                  <div key={s.label} style={{
                    background:'rgba(255,255,255,0.08)', backdropFilter:'blur(8px)',
                    border:'1px solid rgba(255,255,255,0.12)',
                    borderRadius:14, padding:'12px 18px',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                    <i className={s.icon} style={{ color:'#fdb813', fontSize:14 }} />
                    <div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#fff', lineHeight:1 }}>
                        {s.value?.toLocaleString() ?? '—'}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e8edf5',
        boxShadow: '0 2px 12px rgba(29,43,75,0.06)',
        position: 'sticky', top: 64, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto', padding: '0 40px',
          display: 'flex', gap: 4,
        }}>
          {TABS.map(t => {
            const active   = t.id === tab;
            const disabled = t.id === 'my-stats' && !isAuthenticated;
            return (
              <button
                key={t.id}
                onClick={() => !disabled && handleTabSwitch(t.id)}
                title={disabled ? 'Sign in to view your personal stats' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '16px 20px',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #1d2b4b' : '2px solid transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: disabled ? '#cbd5e1' : active ? '#1d2b4b' : '#64748b',
                  opacity: disabled ? 0.5 : 1,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.color = '#1d2b4b'; }}
                onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.color = '#64748b'; }}
              >
                <i className={t.icon} style={{ fontSize: 13 }} />
                {t.label}
                {t.id === 'my-stats' && !isAuthenticated && (
                  <i className="fas fa-lock" style={{ fontSize: 10, marginLeft: 2 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '36px 40px 60px', boxSizing: 'border-box' }}>

        {/* ── Trending Tab ── */}
        {tab === 'trending' && (
          <section style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1d2b4b' }}>
                  🔥 Trending this week
                </h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#94a3b8' }}>
                  Profiles with the most views in the last 7 days
                </p>
              </div>
            </div>

            {trending.loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} height={74} radius={16} />)}
              </div>
            ) : trending.error ? (
              <EmptyState icon="fas fa-exclamation-circle" color="#ef4444" title="Failed to load" desc="Could not load trending alumni. Please try again." />
            ) : trending.data.length === 0 ? (
              <EmptyState icon="fas fa-fire" color="#f97316" title="No trending data yet" desc="Check back later — views are tracked weekly." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {trending.data.map((person, i) => (
                  <AlumniCard key={person.id} person={person} rank={i + 1} badge={person.views_this_week} onClick={() => handleTrendingClick(person)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Most Viewed Tab ── */}
        {tab === 'top-viewed' && (
          <section style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1d2b4b' }}>
                👁️ Most viewed all-time
              </h2>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#94a3b8' }}>
                Alumni with the highest total profile view counts
              </p>
            </div>

            {topViewed.loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} height={74} radius={16} />)}
              </div>
            ) : topViewed.error ? (
              <EmptyState icon="fas fa-exclamation-circle" color="#ef4444" title="Failed to load" desc="Could not load top viewed alumni. Please try again." />
            ) : topViewed.data.length === 0 ? (
              <EmptyState icon="fas fa-eye" color="#64748b" title="No data yet" desc="Profile views will appear here once alumni start getting visits." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {topViewed.data.map((person, i) => (
                  <AlumniCard key={person.id} person={person} rank={i + 1} badge={person.views} onClick={() => handleTopViewedClick(person)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My Stats Tab ── */}
        {tab === 'my-stats' && isAuthenticated && (
          <section style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1d2b4b' }}>
                📊 Your engagement stats
              </h2>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#94a3b8' }}>
                How your profile is performing among your batchmates
              </p>
            </div>

            {myStats.loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:14 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={100} radius={16} />)}
              </div>
            ) : myStats.error ? (
              <EmptyState icon="fas fa-exclamation-circle" color="#ef4444" title="Failed to load" desc="Could not load your stats. Please try again." />
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:14, marginBottom:8 }}>
                  <StatCard label="Profile views"     value={myStats.data?.profile_views?.toLocaleString()}     icon="fas fa-eye"           color="#3f51b5" />
                  <StatCard label="Photos uploaded"   value={myStats.data?.photos_uploaded?.toLocaleString()}   icon="fas fa-images"        color="#22c55e" />
                  <StatCard label="Times tagged"      value={myStats.data?.times_tagged?.toLocaleString()}      icon="fas fa-user-tag"      color="#8b5cf6" />
                  <StatCard label="Messages sent"     value={myStats.data?.messages_sent?.toLocaleString()}     icon="fas fa-paper-plane"   color="#f97316" />
                  <StatCard label="Messages received" value={myStats.data?.messages_received?.toLocaleString()} icon="fas fa-comment-dots"  color="#db2777" />
                </div>

                {trend.loading ? (
                  <Skeleton height={120} radius={16} />
                ) : (
                  <SparkBars labels={trend.labels} values={trend.values} />
                )}
              </>
            )}

            {/* Top Batchmates */}
            {batchmates.data?.top_profiles?.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:800, color:'#1d2b4b' }}>
                  Top batchmates
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {batchmates.data.top_profiles.map((person, i) => (
                    <AlumniCard
                      key={person.id} person={person} rank={i + 1} badge={person.views}
                      onClick={() => { recordProfileView(person.id); navigate(`/profile/${person.id}`); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Empty state helper ────────────────────────────────────────────────────────
function EmptyState({ icon, color, title, desc }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 40px',
      background: '#fff', borderRadius: 20,
      border: '1.5px solid #e8edf5',
      boxShadow: '0 2px 12px rgba(29,43,75,0.06)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: color + '12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <i className={icon} style={{ fontSize: 24, color }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1d2b4b', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{desc}</p>
    </div>
  );
}