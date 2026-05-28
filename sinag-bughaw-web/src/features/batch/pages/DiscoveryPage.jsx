import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';          // ← added useNavigate
import { useAuth } from '@/features/auth/hooks/useAuth';
import { batchApi, COURSES, DEPARTMENTS, YEAR_OPTIONS, COURSE_LABELS } from '@/api/batch.api';
import { useFuseSearch, STUDENT_FUSE_KEYS, CROSS_PROGRAM_FUSE_KEYS } from '@/features/batch/hooks/useFuseSearch';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

// ── Constants ─────────────────────────────────────────────────────────────────

const VIEW_MODES = [
  { key: 'batch',         label: 'My Batch',      icon: 'fa-graduation-cap',  desc: 'Same course & year' },
  { key: 'section',       label: 'My Section',    icon: 'fa-layer-group',     desc: 'My classmates'      },
  { key: 'school',        label: 'Whole School',  icon: 'fa-school',          desc: 'All students'       },
  { key: 'cross_program', label: 'Cross-Program', icon: 'fa-shuffle',         desc: 'Other programs'     },
];

// ── NEW: Generate Yearbook Button ─────────────────────────────────────────────
/**
 * Used in BatchView header to open the yearbook for the currently
 * filtered batch. batchId is the graduation year (or real DB id when
 * available via useBatch/filterMeta).
 */
function GenerateYearbookButton({ batchId, label }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  if (!batchId) return null;

  return (
    <button
      onClick={() => navigate(`/yearbook/${batchId}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`Open yearbook for Batch ${batchId}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           7,
        padding:       '9px 18px',
        borderRadius:  12,
        border:        `1.5px solid ${hov ? '#fdb813' : 'rgba(253,184,19,0.5)'}`,
        cursor:        'pointer',
        fontSize:      '0.72rem',
        fontWeight:    800,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
        transition:    'all 0.2s ease',
        background:    hov ? '#fdb813'                      : 'rgba(253,184,19,0.08)',
        color:         hov ? '#1d2b4b'                      : '#fdb813',
        boxShadow:     hov ? '0 6px 20px rgba(253,184,19,0.3)' : 'none',
        transform:     hov ? 'translateY(-1px)'             : 'none',
        flexShrink:    0,
      }}>
      {/* Book icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {label ?? `Generate Yearbook · Batch ${batchId}`}
    </button>
  );
}

// ── Shared face search hook ───────────────────────────────────────────────────

function useFaceSearch() {
  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches,   setFaceMatches]   = useState([]);
  const [matchedIds,    setMatchedIds]    = useState(new Set());

  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setFaceMatches([]);
    setMatchedIds(new Set());
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = data.matches ?? [];
      if (!matches.length) { alert('No matching student found. Ensure the photo shows a clear face.'); return; }
      setFaceMatches(matches);
      setMatchedIds(new Set(matches.map(m => m.user_id)));
    } catch {
      alert('Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const clearFace = () => { setFaceMatches([]); setMatchedIds(new Set()); };

  return { faceSearching, faceMatches, matchedIds, handleFaceFile, clearFace };
}

// ── Face result banner ────────────────────────────────────────────────────────

function FaceResultBanner({ matches, onClear }) {
  if (!matches.length) return null;
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4 px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(253,184,19,0.08)', border: '1.5px solid rgba(253,184,19,0.3)' }}>
      <div className="flex items-center gap-2">
        <div style={{ display: 'flex' }}>
          {matches.slice(0, 3).map((m, i) => (
            <img key={m.user_id}
              src={imageUrl(m.profile_picture) || avatarUrl(m.name)}
              alt={m.name}
              style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid #fdb813', objectFit: 'cover', marginLeft: i > 0 ? -8 : 0 }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92660a' }}>
          <i className="fas fa-brain mr-1" style={{ color: '#fdb813' }} />
          {matches.length} face match{matches.length > 1 ? 'es' : ''} — showing matched students only
        </span>
      </div>
      <button onClick={onClear}
        style={{ background: 'none', border: '1px solid rgba(253,184,19,0.4)', borderRadius: 8, color: '#92660a', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px' }}>
        <i className="fas fa-times mr-1" /> Clear
      </button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function StudentCard({ student, isPremium, index = 0, isMatched = false, matchSimilarity = null }) {
  const shortCourse = COURSE_LABELS[student.course] ?? student.course?.split(' ').slice(-2).join(' ') ?? 'Student';

  return (
    <Link to={`/profile/${student.id}`} className="no-underline group"
      style={{ display: 'block', animationDelay: `${index * 0.03}s` }}>
      <div className="bg-white rounded-2xl overflow-hidden border transition-all duration-300 group-hover:-translate-y-2"
        style={{
          border:    isMatched ? '2px solid #fdb813' : '1px solid #e8ecf4',
          boxShadow: isMatched ? '0 8px 28px rgba(253,184,19,0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = isMatched ? '0 16px 40px rgba(253,184,19,0.28)' : '0 16px 40px rgba(29,43,75,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = isMatched ? '0 8px 28px rgba(253,184,19,0.2)' : '0 4px 16px rgba(0,0,0,0.04)'}>
        <div style={{ height: '185px', overflow: 'hidden', background: '#1d2b4b', position: 'relative' }}>
          {student.profile_picture ? (
            <img src={imageUrl(student.profile_picture)} alt={student.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black"
              style={{ fontSize: '2.8rem', color: '#fdb813' }}>
              {getInitials(student.name)}
            </div>
          )}
          {student.graduation_year && (
            <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
              '{String(student.graduation_year).slice(-2)}
            </span>
          )}
          {isMatched && (
            <div className="absolute top-2 left-2 flex items-center gap-1 font-black text-[10px] px-2 py-1 rounded-lg"
              style={{ background: '#fdb813', color: '#1d2b4b' }}>
              <i className="fas fa-brain" />
              {matchSimilarity != null ? `${matchSimilarity.toFixed(0)}%` : 'Match'}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <h4 className="font-black truncate m-0" style={{ fontSize: '0.9rem', color: '#1d2b4b' }}>
            {student.name}
          </h4>
          <span className="inline-block text-xs font-bold mt-1 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(63,81,181,0.08)', color: '#3f51b5' }}>
            {shortCourse}
          </span>
          {student.student_id && (
            <p className="text-xs m-0 mt-1" style={{ color: '#94a3b8' }}>{student.student_id}</p>
          )}
          {isPremium && student.section?.name && (
            <p className="text-xs font-semibold m-0 mt-1" style={{ color: '#3f51b5' }}>
              Section {student.section.name}
            </p>
          )}
          {isPremium && student.motto && (
            <p className="text-xs italic m-0 mt-2 truncate" style={{ color: '#64748b' }}>
              "{student.motto}"
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function StudentGrid({ students, isPremium, loading, emptyMsg = 'No students found.', matchedIds = new Set(), faceMatches = [] }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24" style={{ color: '#94a3b8' }}>
      <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
      <p className="text-sm">Loading…</p>
    </div>
  );
  if (students.length === 0) return (
    <div className="text-center py-24 bg-white rounded-3xl"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <i className="fas fa-users-slash text-6xl mb-5 block opacity-10" style={{ color: '#1d2b4b' }} />
      <h3 className="font-extrabold text-xl mb-2" style={{ color: '#1d2b4b' }}>No Results</h3>
      <p className="text-sm" style={{ color: '#94a3b8' }}>{emptyMsg}</p>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '20px' }}>
      {students.map((s, i) => {
        const matchData = faceMatches.find(m => m.user_id === s.id);
        return (
          <StudentCard key={s.id} student={s} isPremium={isPremium} index={i}
            isMatched={matchedIds.has(s.id)}
            matchSimilarity={matchData?.similarity ?? null} />
        );
      })}
    </div>
  );
}

function UpgradeBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 mb-6"
      style={{ background: 'linear-gradient(135deg, #1d2b4b, #3f51b5)', color: 'white' }}>
      <div className="flex items-center gap-3">
        <i className="fas fa-lock text-xl" style={{ color: '#fdb813' }} />
        <div>
          <p className="font-extrabold text-sm m-0">Unlock Full Discovery</p>
          <p className="text-xs m-0" style={{ opacity: 0.7 }}>
            Premium sees all students, full profiles, mottos & contact info.
          </p>
        </div>
      </div>
      <Link to="/payment" className="no-underline font-bold text-xs px-5 py-3 rounded-xl whitespace-nowrap"
        style={{ background: '#fdb813', color: '#1d2b4b' }}>
        Upgrade Now <i className="fas fa-arrow-right ml-1" />
      </Link>
    </div>
  );
}

// ── Filters Panel ─────────────────────────────────────────────────────────────

function FiltersPanel({ filters, onChange, showCourse = true, showYear = true, showDept = true }) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      {showDept && (
        <select value={filters.department ?? ''} onChange={e => onChange('department', e.target.value || null)}
          className="text-xs font-bold px-4 py-2 rounded-xl border-none outline-none"
          style={{ background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {showCourse && (
        <select value={filters.course ?? ''} onChange={e => onChange('course', e.target.value || null)}
          className="text-xs font-bold px-4 py-2 rounded-xl border-none outline-none"
          style={{ background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
          <option value="">All Programs</option>
          {COURSES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      )}
      {showYear && (
        <select value={filters.year ?? ''} onChange={e => onChange('year', e.target.value || null)}
          className="text-xs font-bold px-4 py-2 rounded-xl border-none outline-none"
          style={{ background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
          <option value="">All Years</option>
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>Batch {y}</option>)}
        </select>
      )}
    </div>
  );
}

// ── BatchView — Generate Yearbook button added ────────────────────────────────

function BatchView({ isPremium, userYear }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ course: null, year: null });
  const { query, setQuery, results, hasQuery } = useFuseSearch(students, STUDENT_FUSE_KEYS);
  const { faceSearching, faceMatches, matchedIds, handleFaceFile, clearFace } = useFaceSearch();

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.course) params.course = filters.course;
    if (filters.year)   params.year   = filters.year;
    const { data } = await batchApi.batchmates(params);
    setStudents(data.data ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); clearFace(); };

  const displayed = matchedIds.size > 0
    ? results.filter(s => matchedIds.has(s.id))
    : results;

  // The active batch year: from filter or from the authenticated user's profile
  const activeYear = filters.year ?? userYear ?? null;

  return (
    <div>
      {/* ── Search + filters row ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1" style={{ maxWidth: '300px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8', zIndex: 1 }} />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); clearFace(); }}
            placeholder="Fuzzy search by name, ID, motto…"
            className="w-full text-sm rounded-xl border outline-none"
            style={{ padding: '10px 52px 10px 32px', border: matchedIds.size > 0 ? '1.5px solid #fdb813' : '1.5px solid #e2e8f0', color: '#1d2b4b' }}
          />
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilter} showDept={false} />

        {/* ── NEW: Generate Yearbook button — right-aligned in the toolbar ── */}
        <div style={{ marginLeft: 'auto' }}>
          <GenerateYearbookButton
            batchId={activeYear}
            label={activeYear ? `Generate Yearbook · Batch ${activeYear}` : undefined}
          />
        </div>
      </div>

      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}

      <p className="text-sm font-semibold mb-4" style={{ color: '#64748b' }}>
        {matchedIds.size > 0
          ? <><i className="fas fa-brain mr-1" style={{ color: '#fdb813' }} />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''}</>
          : hasQuery
            ? `${results.length} fuzzy match${results.length !== 1 ? 'es' : ''}`
            : `${students.length} batchmate${students.length !== 1 ? 's' : ''}`}
        {!isPremium && <span style={{ color: '#94a3b8' }}> · Public profiles only</span>}
      </p>

      <StudentGrid
        students={displayed}
        isPremium={isPremium}
        loading={loading}
        matchedIds={matchedIds}
        faceMatches={faceMatches}
        emptyMsg="No batchmates found. Check your graduation year in Profile Settings."
      />
    </div>
  );
}

// ── SectionView — unchanged ───────────────────────────────────────────────────

function SectionView({ isPremium }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [section,  setSection]  = useState(null);
  const { query, setQuery, results, hasQuery } = useFuseSearch(students, STUDENT_FUSE_KEYS);
  const { faceSearching, faceMatches, matchedIds, handleFaceFile, clearFace } = useFaceSearch();

  useEffect(() => {
    batchApi.sectionmates()
      .then(({ data }) => { setStudents(data.data ?? []); setSection(data.section); })
      .finally(() => setLoading(false));
  }, []);

  const displayed = matchedIds.size > 0 ? results.filter(s => matchedIds.has(s.id)) : results;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {section && (
          <div className="px-4 py-2 rounded-xl font-bold text-sm"
            style={{ background: '#eef2ff', color: '#3f51b5' }}>
            <i className="fas fa-layer-group mr-2" />Section {section.name}
          </div>
        )}
        <div className="relative flex-1" style={{ maxWidth: '300px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8', zIndex: 1 }} />
          <input value={query}
            onChange={e => { setQuery(e.target.value); clearFace(); }}
            placeholder="Fuzzy search classmates…"
            className="w-full text-sm rounded-xl border outline-none"
            style={{ padding: '10px 52px 10px 32px', border: matchedIds.size > 0 ? '1.5px solid #fdb813' : '1.5px solid #e2e8f0' }}
          />
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
      </div>
      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}
      <p className="text-sm font-semibold mb-4" style={{ color: '#64748b' }}>
        {matchedIds.size > 0
          ? <><i className="fas fa-brain mr-1" style={{ color: '#fdb813' }} />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''}</>
          : hasQuery ? `${results.length} match${results.length !== 1 ? 'es' : ''}` : `${students.length} classmate${students.length !== 1 ? 's' : ''}`}
      </p>
      <StudentGrid students={displayed} isPremium={isPremium} loading={loading} matchedIds={matchedIds} faceMatches={faceMatches} emptyMsg="No section assigned. Contact your administrator." />
    </div>
  );
}

// ── SchoolView — unchanged ────────────────────────────────────────────────────

function SchoolView({ isPremium }) {
  const [students,     setStudents]     = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filters,      setFilters]      = useState({});
  const [serverSearch, setServerSearch] = useState('');
  const { faceSearching, faceMatches, matchedIds, handleFaceFile, clearFace } = useFaceSearch();
  const debounceRef = useRef(null);

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await batchApi.wholeSchool(params);
      setStudents(data.data?.data ?? []);
      setPagination(data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filters); }, [filters]);

  const handleSearch = (val) => {
    setServerSearch(val);
    clearFace();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val || undefined }));
    }, 400);
  };

  const setFilter = (key, val) => { clearFace(); setFilters(f => ({ ...f, [key]: val || undefined })); };
  const loadPage  = (page) => load({ ...filters, page });

  const displayed = matchedIds.size > 0 ? students.filter(s => matchedIds.has(s.id)) : students;

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1" style={{ maxWidth: '300px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8', zIndex: 1 }} />
          <input value={serverSearch} onChange={e => handleSearch(e.target.value)} placeholder="Search all students…"
            className="w-full text-sm rounded-xl border outline-none"
            style={{ padding: '10px 52px 10px 32px', border: matchedIds.size > 0 ? '1.5px solid #fdb813' : '1.5px solid #e2e8f0' }} />
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilter} />
      </div>
      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}
      {pagination && (
        <p className="text-sm font-semibold mb-4" style={{ color: '#64748b' }}>
          {matchedIds.size > 0
            ? <><i className="fas fa-brain mr-1" style={{ color: '#fdb813' }} />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''} on this page</>
            : <>{pagination.total?.toLocaleString()} student{pagination.total !== 1 ? 's' : ''} in the school</>}
          {!isPremium && <span style={{ color: '#94a3b8' }}> · Public profiles only</span>}
        </p>
      )}
      <StudentGrid students={displayed} isPremium={isPremium} loading={loading} matchedIds={matchedIds} faceMatches={faceMatches} emptyMsg="No students match your filters." />
      {!matchedIds.size && pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          {Array.from({ length: Math.min(pagination.last_page, 10) }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => loadPage(page)}
              className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
              style={{
                background: page === pagination.current_page ? '#1d2b4b' : 'white',
                color:      page === pagination.current_page ? 'white'   : '#64748b',
                border: '1.5px solid #e2e8f0', cursor: 'pointer',
              }}>
              {page}
            </button>
          ))}
          {pagination.last_page > 10 && (
            <span className="text-sm" style={{ color: '#94a3b8' }}>… {pagination.last_page} pages</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── CrossProgramView — Generate Yearbook added to each grouped course header ──

function CrossProgramView({ isPremium }) {
  const [allStudents, setAllStudents] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState({});
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const { query, setQuery, results, hasQuery } = useFuseSearch(allStudents, CROSS_PROGRAM_FUSE_KEYS);
  const { faceSearching, faceMatches, matchedIds, handleFaceFile, clearFace } = useFaceSearch();

  const load = useCallback(async (params = {}, append = false) => {
    setLoading(true);
    try {
      const { data } = await batchApi.crossProgram(params);
      const newStudents = data.data?.data ?? [];
      setAllStudents(prev => append ? [...prev, ...newStudents] : newStudents);
      setStats(data.stats);
      setHasMore(data.data?.current_page < data.data?.last_page);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setPage(1); setAllStudents([]); load(filters); }, [filters]);

  const loadMore  = () => { const n = page + 1; setPage(n); load({ ...filters, page: n }, true); };
  const setFilter = (key, val) => { clearFace(); setFilters(f => ({ ...f, [key]: val || undefined })); };

  const displayed = matchedIds.size > 0 ? results.filter(s => matchedIds.has(s.id)) : results;

  const grouped = displayed.reduce((acc, s) => {
    const key = s.course ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      {stats && (
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { icon: 'fa-users',            val: stats.total_students?.toLocaleString(), label: 'students from other programs' },
            { icon: 'fa-book',             val: stats.total_programs,                   label: 'different programs'           },
            { icon: 'fa-building-columns', val: stats.departments?.length,              label: 'colleges'                     },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border"
              style={{ border: '1px solid #e2e8f0' }}>
              <i className={`fas ${s.icon}`} style={{ color: '#fdb813', fontSize: '1.1rem' }} />
              <div>
                <p className="font-black text-lg m-0" style={{ color: '#1d2b4b' }}>{s.val}</p>
                <p className="text-xs m-0" style={{ color: '#94a3b8' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1" style={{ maxWidth: '320px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8', zIndex: 1 }} />
          <input value={query}
            onChange={e => { setQuery(e.target.value); clearFace(); }}
            placeholder="Fuse.js fuzzy search across programs…"
            className="w-full text-sm rounded-xl border outline-none"
            style={{ padding: '10px 52px 10px 32px', border: matchedIds.size > 0 ? '1.5px solid #fdb813' : '1.5px solid #e2e8f0' }}
          />
          {query && !matchedIds.size && (
            <span className="absolute text-xs px-2 py-1 rounded-lg font-bold pointer-events-none"
              style={{ right: 44, top: '50%', transform: 'translateY(-50%)', background: '#fdb813', color: '#1d2b4b' }}>
              Fuse.js
            </span>
          )}
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilter} />
      </div>

      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}

      {loading && allStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: '#94a3b8' }}>
          <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
          <p className="text-sm">Discovering other programs…</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <i className="fas fa-shuffle text-6xl mb-5 block opacity-10" style={{ color: '#1d2b4b' }} />
          <h3 className="font-extrabold text-xl mb-2" style={{ color: '#1d2b4b' }}>No Results</h3>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            {matchedIds.size > 0 ? 'No face matches in other programs.' : hasQuery ? 'No fuzzy matches.' : 'No students from other programs found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([course, courseStudents]) => {
            // Derive a year from the first student so we can offer a yearbook link
            const sampleYear = courseStudents[0]?.graduation_year ?? null;

            return (
              <div key={course}>
                {/* Course group header + optional yearbook button */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#1d2b4b', color: '#fdb813', fontSize: '0.8rem' }}>
                    <i className="fas fa-book" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black m-0" style={{ fontSize: '1rem', color: '#1d2b4b' }}>
                      {COURSE_LABELS[course] ?? course}
                    </h3>
                    <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
                      {courseStudents.length} student{courseStudents.length !== 1 ? 's' : ''} · {course}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '18px' }}>
                  {courseStudents.map((s, i) => {
                    const matchData = faceMatches.find(m => m.user_id === s.id);
                    return (
                      <StudentCard key={s.id} student={s} isPremium={isPremium} index={i}
                        isMatched={matchedIds.has(s.id)}
                        matchSimilarity={matchData?.similarity ?? null} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!matchedIds.size && hasMore && !hasQuery && (
        <div className="text-center mt-10">
          <button onClick={loadMore} disabled={loading}
            className="font-bold text-sm px-8 py-3 rounded-xl transition-all"
            style={{ background: '#1d2b4b', color: 'white', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <i className="fas fa-chevron-down mr-2" />}
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main DiscoveryPage ────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const { user }                = useAuth();
  const isPremium               = user?.is_premium === true || user?.tier === 'premium';
  const [viewMode, setViewMode] = useState('batch');
  const activeMode              = VIEW_MODES.find(m => m.key === viewMode);

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      <header style={{
        background:   'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)',
        padding:      '60px 8% 110px',
        borderRadius: '0 0 60px 60px',
        color:        'white',
        textAlign:    'center',
      }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
          National University Lipa
        </p>
        <h1 className="font-extrabold mb-3" style={{ fontSize: '2.8rem', letterSpacing: '-2px' }}>
          Student <span style={{ color: '#fdb813' }}>Discovery</span>
        </h1>
        <p className="font-light opacity-75 mx-auto" style={{ fontSize: '1rem', maxWidth: '500px' }}>
          Find classmates, explore other programs, and connect with the NU community.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {isPremium && (
            <span className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2 rounded-full"
              style={{ background: 'rgba(253,184,19,0.15)', border: '1px solid rgba(253,184,19,0.35)', color: '#fdb813' }}>
              <i className="fas fa-crown" /> Premium · Full Access
            </span>
          )}
          <span className="inline-flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            <i className="fas fa-camera" style={{ color: '#fdb813' }} /> Click the camera icon in any search to find by face
          </span>
        </div>
      </header>

      {/* View mode tabs */}
      <div className="flex justify-center" style={{ marginTop: '-40px', position: 'relative', zIndex: 10, padding: '0 8%' }}>
        <div className="flex flex-wrap gap-3 justify-center p-2 rounded-2xl"
          style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          {VIEW_MODES.map(mode => (
            <button key={mode.key} onClick={() => setViewMode(mode.key)}
              className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl transition-all font-bold text-xs"
              style={{
                background: viewMode === mode.key ? '#1d2b4b' : 'transparent',
                color:      viewMode === mode.key ? 'white'   : '#64748b',
                border:     'none', cursor: 'pointer', minWidth: '100px',
              }}>
              <i className={`fas ${mode.icon} text-base`} style={{ color: viewMode === mode.key ? '#fdb813' : 'currentColor' }} />
              {mode.label}
              <span className="font-normal opacity-70 text-xs">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: '40px 8% 80px', flex: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#1d2b4b', color: '#fdb813' }}>
            <i className={`fas ${activeMode?.icon} text-sm`} />
          </div>
          <div>
            <h2 className="font-black m-0" style={{ fontSize: '1.3rem', color: '#1d2b4b' }}>
              {activeMode?.label}
            </h2>
            <p className="text-xs m-0" style={{ color: '#94a3b8' }}>{activeMode?.desc}</p>
          </div>
        </div>

        {/* Pass user's graduation year to BatchView so it can pre-fill the yearbook link */}
        {viewMode === 'batch'         && <BatchView        isPremium={isPremium} userYear={user?.graduation_year} />}
        {viewMode === 'section'       && <SectionView      isPremium={isPremium} />}
        {viewMode === 'school'        && <SchoolView       isPremium={isPremium} />}
        {viewMode === 'cross_program' && <CrossProgramView isPremium={isPremium} />}
      </main>

      <Footer />
    </div>
  );
}