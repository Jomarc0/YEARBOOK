import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';   // ← added useNavigate
import { useBatch } from '@/features/batch/hooks/useBatch';
import { COURSES } from '@/api/batch.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + 2 - i);

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function CourseChip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="font-bold text-xs px-4 py-2 rounded-xl transition-all whitespace-nowrap"
      style={{
        background:  active ? '#1d2b4b' : 'white',
        color:       active ? 'white'   : '#64748b',
        border:      '1.5px solid',
        borderColor: active ? '#1d2b4b' : '#e2e8f0',
        cursor:      'pointer',
      }}>
      {label}
    </button>
  );
}

// ── NEW: Generate Yearbook Button ─────────────────────────────────────────────
/**
 * Shown in the hero when a year (batch) is selected.
 * Navigates to /yearbook/:batchId — batchId here is the graduation year
 * which YearbookHomePage passes through to the API (Batch is fetched by ID
 * on the backend; if your Batch route-model uses the DB id, wire the real
 * batch.id here once you have it available in useBatch/filterMeta).
 *
 * For now we use the graduation year as the identifier, consistent with how
 * the URL is structured in yearbook.routes.jsx (`:batchId` param).
 */
function GenerateYearbookButton({ year, course }) {
  const navigate  = useNavigate();
  const [hov, setHov] = useState(false);

  const label = year
    ? `Generate Yearbook · Batch ${year}`
    : 'Generate Yearbook';

  return (
    <button
      onClick={() => navigate(`/yearbook/${year ?? 'latest'}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           8,
        padding:       '11px 26px',
        borderRadius:  50,
        border:        `1.5px solid ${hov ? '#fdb813' : 'rgba(253,184,19,0.55)'}`,
        cursor:        'pointer',
        fontSize:      '0.78rem',
        fontWeight:    800,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
        transition:    'all 0.22s ease',
        background:    hov ? '#fdb813'                    : 'rgba(253,184,19,0.12)',
        color:         hov ? '#1d2b4b'                    : '#fdb813',
        boxShadow:     hov ? '0 8px 24px rgba(253,184,19,0.35)' : 'none',
        transform:     hov ? 'translateY(-2px)'           : 'none',
      }}>
      {/* Book icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {label}
    </button>
  );
}

// ── NEW: Compact inline yearbook pill for the sticky filter bar ───────────────
function YearbookFilterPill({ year }) {
  const navigate  = useNavigate();
  const [hov, setHov] = useState(false);
  if (!year) return null;   // only show when a year is actively filtered

  return (
    <button
      onClick={() => navigate(`/yearbook/${year}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`Open ${year} Yearbook`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        padding:       '9px 16px',
        borderRadius:  12,
        border:        'none',
        cursor:        'pointer',
        fontSize:      '0.72rem',
        fontWeight:    800,
        whiteSpace:    'nowrap',
        transition:    'all 0.2s ease',
        background:    hov ? '#fdb813' : '#1d2b4b',
        color:         hov ? '#1d2b4b' : '#fdb813',
        boxShadow:     hov ? '0 4px 14px rgba(253,184,19,0.3)' : '0 2px 8px rgba(29,43,75,0.15)',
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      Yearbook {year}
    </button>
  );
}

export default function BatchmatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user, batchmates, loading, error,
    isPremium, filterMeta, fetchBatchmates,
  } = useBatch();

  const [search,       setSearch]       = useState('');
  const [courseFilter, setCourseFilter] = useState(searchParams.get('course') || null);
  const [yearFilter,   setYearFilter]   = useState(
    searchParams.get('year') ? Number(searchParams.get('year')) : null
  );

  useEffect(() => {
    const params = {};
    if (courseFilter) params.course = courseFilter;
    if (yearFilter)   params.year   = yearFilter;
    fetchBatchmates(params);
    const next = {};
    if (courseFilter) next.course = courseFilter;
    if (yearFilter)   next.year   = yearFilter;
    setSearchParams(next, { replace: true });
  }, [courseFilter, yearFilter]);

  const filtered = batchmates.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.includes(search)
  );

  // Resolve active batch year for the yearbook button
  const activeYear = yearFilter ?? filterMeta.year ?? user?.graduation_year ?? null;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(24px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .batch-card { animation: fadeInUp 0.45s ease forwards; opacity: 0; }
        .batch-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: 0 25px 50px rgba(29,43,75,0.12) !important;
        }
      `}</style>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="text-white text-center"
        style={{
          background:   'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)',
          padding:      '80px 8% 120px',
          borderRadius: '0 0 60px 60px',
        }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
          National University Lipa
        </p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Your <span style={{ color: '#fdb813' }}>Batchmates</span>
        </h1>
        <p className="font-light mx-auto opacity-80"
          style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Connect with fellow Pioneers ·{' '}
          {filterMeta.course
            ? filterMeta.course.split(' ').slice(-2).join(' ')
            : user?.course?.split(' ').slice(-2).join(' ')}
          &nbsp;· Batch {filterMeta.year ?? yearFilter ?? user?.graduation_year ?? CURRENT_YEAR}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {isPremium && (
            <span className="inline-flex items-center gap-2 font-bold text-xs"
              style={{
                background:   'rgba(253,184,19,0.15)',
                border:       '1px solid rgba(253,184,19,0.4)',
                padding:      '8px 20px',
                borderRadius: '50px',
                color:        '#fdb813',
              }}>
              <i className="fas fa-crown" /> Premium · Viewing All Profiles
            </span>
          )}

          {/* ── NEW: Generate Yearbook button in hero ─────────────────────── */}
          <GenerateYearbookButton year={activeYear} course={courseFilter} />
        </div>
      </header>

      {/* ── Sticky Filters ───────────────────────────────────────────────── */}
      <div style={{
        background:     'white',
        padding:        '18px 8%',
        boxShadow:      '0 4px 20px rgba(0,0,0,0.04)',
        borderBottom:   '1px solid #e2e8f0',
        position:       'sticky',
        top:            0,
        zIndex:         20,
        display:        'flex',
        flexWrap:       'wrap',
        gap:            '12px',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        {/* Search */}
        <div className="relative" style={{ minWidth: '240px', flex: 1, maxWidth: '320px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search name or student ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm font-medium rounded-xl border outline-none"
            style={{
              padding:    '10px 14px 10px 32px',
              border:     '1.5px solid #e2e8f0',
              color:      '#1d2b4b',
              background: '#f8fafc',
            }} />
        </div>

        {/* Course pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {COURSES.slice(0, 6).map(c => (
            <CourseChip key={c.label} label={c.label}
              active={courseFilter === c.value}
              onClick={() => setCourseFilter(c.value)} />
          ))}
          <select
            value={courseFilter ?? ''}
            onChange={e => setCourseFilter(e.target.value || null)}
            className="font-bold text-xs px-3 py-2 rounded-xl border-none outline-none"
            style={{ background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
            <option value="">More ▾</option>
            {COURSES.slice(6).map(c => (
              <option key={String(c.value)} value={c.value ?? ''}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Year + Generate Yearbook pill ───────── */}
        <div className="flex items-center gap-2">
          <select
            value={yearFilter ?? ''}
            onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)}
            className="font-bold text-xs px-4 py-2 rounded-xl border-none outline-none"
            style={{ background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
            <option value="">All Years</option>
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>Batch {y}</option>
            ))}
          </select>

          {/* ── NEW: compact pill — appears as soon as a year is selected ── */}
          <YearbookFilterPill year={yearFilter} />
        </div>
      </div>

      {/* ── Count Pill ───────────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex justify-center" style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <div className="font-bold text-sm flex items-center gap-2"
            style={{
              background:   'white',
              padding:      '12px 28px',
              borderRadius: '50px',
              boxShadow:    '0 10px 25px rgba(0,0,0,0.08)',
              color:        '#475569',
            }}>
            <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} />
            {filtered.length} batchmate{filtered.length !== 1 ? 's' : ''} found
            {!isPremium && (
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                &nbsp;· Public profiles only
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Upgrade Banner ───────────────────────────────────────────────── */}
      {!isPremium && !loading && batchmates.length > 0 && (
        <div className="mx-[8%] mt-6 flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #1d2b4b, #3f51b5)', color: 'white' }}>
          <div className="flex items-center gap-3">
            <i className="fas fa-lock text-xl" style={{ color: '#fdb813' }} />
            <div>
              <p className="font-extrabold text-sm m-0">Unlock Full Batchmate Profiles</p>
              <p className="text-xs opacity-70 m-0">
                Premium sees all batchmates, full bios, section info, mottos & contact details.
              </p>
            </div>
          </div>
          <Link to="/payment"
            className="no-underline font-bold text-xs px-5 py-3 rounded-xl whitespace-nowrap"
            style={{ background: '#fdb813', color: '#1d2b4b' }}>
            Upgrade Now <i className="fas fa-arrow-right ml-1" />
          </Link>
        </div>
      )}

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      <main style={{ padding: '40px 8% 80px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
            <p className="text-sm">Loading batchmates…</p>
          </div>

        ) : error ? (
          <div className="text-center py-16" style={{ color: '#ef4444' }}>
            <i className="fas fa-exclamation-triangle text-4xl mb-3 block" />
            <p>{error}</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center bg-white py-24 px-8"
            style={{ borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-users-slash text-6xl mb-5 block opacity-10"
              style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: '#1d2b4b' }}>
              No Batchmates Found
            </h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              {search
                ? 'No results match your search.'
                : 'Make sure your graduation year and course are set in Profile Settings.'}
            </p>
          </div>

        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap:                 '28px',
          }}>
            {filtered.map((student, i) => (
              <Link
                key={student.id}
                to={`/profile/${student.id}`}
                className="batch-card bg-white no-underline block overflow-hidden transition-all relative"
                style={{
                  borderRadius:   '25px',
                  border:         '1px solid rgba(0,0,0,0.04)',
                  boxShadow:      '0 8px 24px rgba(0,0,0,0.04)',
                  animationDelay: `${i * 0.04}s`,
                }}>
                <div style={{ height: '220px', overflow: 'hidden', background: '#1d2b4b' }}>
                  {student.profile_picture ? (
                    <img
                      src={`http://127.0.0.1:8000/storage/${student.profile_picture}`}
                      alt={student.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      style={{ filter: 'brightness(0.9)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fdb813' }}>
                      {getInitials(student.name)}
                    </div>
                  )}
                </div>
                <div className="text-center" style={{ padding: '22px 18px 18px' }}>
                  <h4 className="font-extrabold capitalize mb-2"
                    style={{ fontSize: '1.05rem', color: '#1d2b4b', lineHeight: 1.25 }}>
                    {student.name}
                  </h4>
                  <span className="inline-block font-extrabold text-xs uppercase tracking-wider mb-3"
                    style={{
                      background:   'rgba(63,81,181,0.07)',
                      color:        '#3f51b5',
                      padding:      '5px 14px',
                      borderRadius: '10px',
                    }}>
                    {student.course
                      ?.split(' ')
                      .filter(w => w[0] === w[0]?.toUpperCase() && w.length > 2)
                      .slice(0, 2)
                      .join(' ') || 'Student'}
                  </span>
                  {student.student_id && (
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{student.student_id}</p>
                  )}
                  {isPremium && student.section?.name && (
                    <p className="text-xs font-semibold mt-1" style={{ color: '#3f51b5' }}>
                      Section {student.section.name}
                    </p>
                  )}
                  {isPremium && student.motto && (
                    <p className="text-xs italic mt-2" style={{ color: '#64748b' }}>
                      "{student.motto}"
                    </p>
                  )}
                </div>
                {!isPremium && (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-2"
                    style={{
                      backdropFilter: 'blur(4px)',
                      background:     'rgba(255,255,255,0.6)',
                      borderTop:      '1px solid #f1f5f9',
                    }}>
                    <i className="fas fa-lock text-xs" style={{ color: '#cbd5e1' }} />
                    <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                      Limited view
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}