import { useFacultyGroups } from '@/features/faculty/hooks/useFacultyGroups';
import DepartmentSection from '../components/DepartmentSection';
import Navbar  from '@/components/layout/Navbar';
import Footer  from '@/components/layout/Footer';

/* ─────────────────────────────────────────────────────────────────────────
   Inline styles are kept as a <style> block injected once so the JSX
   stays readable. All class names are scoped to this page.
───────────────────────────────────────────────────────────────────────── */
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&display=swap');

  .faculty-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0f1724;
    font-family: 'DM Sans', -apple-system, sans-serif;
    color: #e2e8f0;
  }

  /* ── HERO ──────────────────────────────────────────────────────────── */
  .faculty-hero {
    position: relative;
    padding: 100px 6% 72px;
    overflow: hidden;
    background: #0f1724;
  }
  .faculty-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 55% at 70% 40%, rgba(253,184,19,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 20% 80%, rgba(29,43,75,0.6) 0%, transparent 60%);
    pointer-events: none;
  }

  /* Decorative grid lines */
  .faculty-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 780px;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #fdb813;
    margin-bottom: 18px;
  }
  .hero-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #fdb813;
    display: inline-block;
  }

  .hero-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2.6rem, 5vw, 4rem);
    font-weight: 400;
    line-height: 1.08;
    color: #f8fafc;
    margin: 0 0 16px;
    letter-spacing: -0.5px;
  }
  .hero-title em {
    font-style: italic;
    color: #fdb813;
  }

  .hero-sub {
    font-size: 1rem;
    color: rgba(226,232,240,0.6);
    max-width: 500px;
    line-height: 1.75;
    font-weight: 300;
    margin: 0 0 36px;
  }

  /* Stats row */
  .hero-stats {
    display: flex;
    gap: 28px;
    margin-bottom: 44px;
    flex-wrap: wrap;
  }
  .hero-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .hero-stat-num {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    color: #fdb813;
    line-height: 1;
  }
  .hero-stat-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(226,232,240,0.45);
  }
  .hero-stat-divider {
    width: 1px;
    background: rgba(255,255,255,0.1);
    align-self: stretch;
    margin: 4px 0;
  }

  /* Search */
  .search-wrap {
    position: relative;
    max-width: 560px;
  }
  .search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #fdb813;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    box-sizing: border-box;
    height: 54px;
    padding: 0 52px 0 52px;
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #f1f5f9;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    backdrop-filter: blur(8px);
  }
  .search-input::placeholder { color: rgba(226,232,240,0.35); }
  .search-input:focus {
    border-color: rgba(253,184,19,0.5);
    background: rgba(255,255,255,0.1);
  }
  .search-clear {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(226,232,240,0.6);
    transition: background 0.15s;
  }
  .search-clear:hover { background: rgba(255,255,255,0.18); color: #f1f5f9; }

  /* ── DEPARTMENT TABS ──────────────────────────────────────────────── */
  .dept-tabs-wrap {
    background: #0f1724;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 6%;
  }
  .dept-tabs {
    display: flex;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .dept-tabs::-webkit-scrollbar { display: none; }

  .dept-tab {
    flex-shrink: 0;
    padding: 16px 20px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(226,232,240,0.45);
    background: none;
    border: none;
    border-bottom: 2.5px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dept-tab:hover { color: rgba(226,232,240,0.75); }
  .dept-tab.active {
    color: #fdb813;
    border-bottom-color: #fdb813;
  }
  .dept-tab-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dept-tab-count {
    font-size: 10px;
    font-weight: 600;
    opacity: 0.6;
  }

  /* ── BODY ─────────────────────────────────────────────────────────── */
  .faculty-body {
    flex: 1;
    padding: 52px 6% 100px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── DEPARTMENT SECTION ───────────────────────────────────────────── */
  .dept-section {
    margin-bottom: 72px;
  }
  .dept-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .dept-bar {
    width: 4px;
    min-height: 48px;
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 4px;
  }
  .dept-meta { flex: 1; }
  .dept-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .dept-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    font-weight: 400;
    color: #f8fafc;
    margin: 0;
    letter-spacing: -0.3px;
  }
  .dept-code {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 6px;
  }
  .dept-count {
    font-size: 12px;
    font-weight: 600;
    color: rgba(226,232,240,0.35);
    margin-left: auto;
  }
  .dept-desc {
    font-size: 13px;
    color: rgba(226,232,240,0.45);
    margin: 0;
    font-weight: 300;
    line-height: 1.6;
  }

  /* ── FACULTY GRID ─────────────────────────────────────────────────── */
  .faculty-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  /* ── FACULTY CARD ─────────────────────────────────────────────────── */
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .faculty-card {
    position: relative;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    overflow: hidden;
    text-align: center;
    padding: 0 0 24px;
    transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275),
                box-shadow 0.3s ease,
                border-color 0.3s ease;
    animation: cardIn 0.4s ease both;
    cursor: default;
  }
  .faculty-card:hover {
    transform: translateY(-8px);
    border-color: rgba(255,255,255,0.16);
    box-shadow: 0 20px 48px rgba(0,0,0,0.3);
  }

  .card-accent {
    height: 5px;
    width: 100%;
  }

  .card-avatar-wrap {
    padding: 24px 24px 0;
  }
  .card-avatar {
    width: 100px; height: 100px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto;
    border: 3px solid rgba(255,255,255,0.1);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    background: #1d2b4b;
  }
  .card-avatar img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }

  .card-body {
    padding: 16px 20px 0;
  }
  .card-position {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .card-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.1rem;
    font-weight: 400;
    color: #f8fafc;
    margin: 0 0 10px;
    line-height: 1.25;
  }
  .card-bio {
    font-size: 12px;
    color: rgba(226,232,240,0.45);
    font-style: italic;
    font-weight: 300;
    line-height: 1.6;
    margin: 0 0 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-email {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(226,232,240,0.4);
    text-decoration: none;
    transition: color 0.15s;
  }
  .card-email:hover { color: #fdb813; }

  /* ── EMPTY STATE ─────────────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: 80px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .empty-icon {
    width: 64px; height: 64px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .empty-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.4rem;
    color: #f8fafc;
    font-weight: 400;
  }
  .empty-sub {
    font-size: 14px;
    color: rgba(226,232,240,0.4);
    font-weight: 300;
  }

  /* ── LOADING ──────────────────────────────────────────────────────── */
  .loading-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 120px 0;
    flex-direction: column;
    gap: 14px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.08);
    border-top-color: #fdb813;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .loading-text {
    font-size: 13px;
    color: rgba(226,232,240,0.35);
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  /* ── ERROR ──────────────────────────────────────────────────────── */
  .error-banner {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 24px;
  }

  /* ── RESPONSIVE ─────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .faculty-hero { padding: 80px 5% 56px; }
    .hero-title   { font-size: 2.4rem; }
    .faculty-body { padding: 36px 5% 80px; }
    .dept-tabs-wrap { padding: 0 5%; }
    .faculty-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .card-avatar  { width: 80px; height: 80px; }
    .hero-stats   { gap: 18px; }
    .hero-stat-num { font-size: 1.6rem; }
  }
`;

/* ──────────────────────────────────────────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export default function FacultyPage() {
  const {
    groups,
    visibleGroups,
    activeDeptId,
    search,
    loading,
    error,
    totalFaculty,
    totalDepts,
    handleSearch,
    handleDeptTab,
    clearSearch,
  } = useFacultyGroups();

  return (
    <>
      <style>{PAGE_STYLES}</style>

      <div className="faculty-page">
        <Navbar />

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <header className="faculty-hero">
          <div className="hero-inner">
            <span className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              National University · Lipa
            </span>

            <h1 className="hero-title">
              Meet Our<br />
              <em>Faculty</em>
            </h1>

            <p className="hero-sub">
              The dedicated educators who mentor, inspire, and guide every
              Nationalian toward excellence.
            </p>

            {/* Stats */}
            {!loading && (
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-num">{totalFaculty}</span>
                  <span className="hero-stat-label">Faculty Members</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">{totalDepts}</span>
                  <span className="hero-stat-label">Departments</span>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="search-wrap">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, position, or department…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                aria-label="Search faculty"
              />
              {search && (
                <button
                  className="search-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── DEPARTMENT TABS ───────────────────────────────────────── */}
        {!loading && !search && groups.length > 1 && (
          <nav className="dept-tabs-wrap" aria-label="Filter by department">
            <div className="dept-tabs" role="tablist">
              {/* "All" tab */}
              <button
                role="tab"
                aria-selected={activeDeptId === null}
                className={`dept-tab${activeDeptId === null ? ' active' : ''}`}
                onClick={() => handleDeptTab(null)}
              >
                All Departments
                <span className="dept-tab-count">({totalFaculty})</span>
              </button>

              {groups.map(g => (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={activeDeptId === g.id}
                  className={`dept-tab${activeDeptId === g.id ? ' active' : ''}`}
                  onClick={() => handleDeptTab(g.id)}
                >
                  <span
                    className="dept-tab-dot"
                    style={{ background: g.color ?? '#fdb813' }}
                    aria-hidden="true"
                  />
                  {g.code ?? g.name}
                  <span className="dept-tab-count">({g.faculty_count})</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="faculty-body" id="faculty-content">
          {loading ? (
            <div className="loading-wrap" aria-live="polite" aria-busy="true">
              <div className="spinner" />
              <span className="loading-text">Loading faculty…</span>
            </div>

          ) : error ? (
            <div className="error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>

          ) : visibleGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(226,232,240,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h2 className="empty-title">No faculty found</h2>
              <p className="empty-sub">Try a different search term or browse all departments.</p>
              {search && (
                <button
                  onClick={clearSearch}
                  style={{
                    marginTop: 8, padding: '10px 22px', borderRadius: 12,
                    background: '#fdb813', color: '#0f1724',
                    border: 'none', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Clear search
                </button>
              )}
            </div>

          ) : (
            visibleGroups.map(dept => (
              <DepartmentSection
                key={dept.id}
                department={dept}
                isOnly={visibleGroups.length === 1}
              />
            ))
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}