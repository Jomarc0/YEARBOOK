import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// ── Generate Yearbook Button ──────────────────────────────────────────────────

function GenerateYearbookButton({ batchId, label }) {
  const navigate = useNavigate();
  if (!batchId) return null;

  return (
    <button
      onClick={() => navigate(`/yearbook/${batchId}`)}
      title={`Open yearbook for Batch ${batchId}`}
      className="
        inline-flex items-center gap-2 shrink-0
        px-4 py-2 rounded-xl border border-amber-400/50
        text-[0.72rem] font-extrabold tracking-wide whitespace-nowrap
        bg-amber-400/10 text-amber-400
        hover:bg-amber-400 hover:text-navy-900 hover:border-amber-400
        hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(253,184,19,0.3)]
        transition-all duration-200
      "
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
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
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4 px-4 py-3 rounded-2xl bg-amber-400/10 border border-amber-400/30">
      <div className="flex items-center gap-2">
        <div className="flex">
          {matches.slice(0, 3).map((m, i) => (
            <img
              key={m.user_id}
              src={imageUrl(m.profile_picture) || avatarUrl(m.name)}
              alt={m.name}
              className={`w-7 h-7 rounded-lg border-2 border-amber-400 object-cover ${i > 0 ? '-ml-2' : ''}`}
            />
          ))}
        </div>
        <span className="text-[0.8rem] font-bold text-amber-700">
          <i className="fas fa-brain mr-1 text-amber-400" />
          {matches.length} face match{matches.length > 1 ? 'es' : ''} — showing matched students only
        </span>
      </div>
      <button
        onClick={onClear}
        className="bg-transparent border border-amber-400/40 rounded-lg text-amber-700 cursor-pointer text-xs font-bold px-2.5 py-1 hover:bg-amber-400/20 transition-colors"
      >
        <i className="fas fa-times mr-1" /> Clear
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

// ── Student Card ──────────────────────────────────────────────────────────────

function StudentCard({ student, isPremium, index = 0, isMatched = false, matchSimilarity = null }) {
  const shortCourse = COURSE_LABELS[student.course] ?? student.course?.split(' ').slice(-2).join(' ') ?? 'Student';

  return (
    <Link
      to={`/profile/${student.id}`}
      className="no-underline group block"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div
        className={`
          bg-white rounded-2xl overflow-hidden transition-all duration-300
          group-hover:-translate-y-2
          ${isMatched
            ? 'border-2 border-amber-400 shadow-[0_8px_28px_rgba(253,184,19,0.2)] group-hover:shadow-[0_16px_40px_rgba(253,184,19,0.28)]'
            : 'border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-hover:shadow-[0_16px_40px_rgba(29,43,75,0.12)]'
          }
        `}
      >
        {/* Photo area */}
        <div className="h-[185px] overflow-hidden bg-[#1d2b4b] relative">
          {student.profile_picture ? (
            <img
              src={imageUrl(student.profile_picture)}
              alt={student.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[2.8rem] font-black text-amber-400">
              {getInitials(student.name)}
            </div>
          )}

          {student.graduation_year && (
            <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-lg bg-black/50 text-white">
              '{String(student.graduation_year).slice(-2)}
            </span>
          )}

          {isMatched && (
            <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-amber-400 text-[#1d2b4b]">
              <i className="fas fa-brain" />
              {matchSimilarity != null ? `${matchSimilarity.toFixed(0)}%` : 'Match'}
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="px-4 pt-3.5 pb-4">
          <h4 className="font-black truncate m-0 text-[0.9rem] text-[#1d2b4b]">
            {student.name}
          </h4>
          <span className="inline-block text-xs font-bold mt-1 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600">
            {shortCourse}
          </span>
          {student.student_id && (
            <p className="text-xs m-0 mt-1 text-slate-400">{student.student_id}</p>
          )}
          {isPremium && student.section?.name && (
            <p className="text-xs font-semibold m-0 mt-1 text-indigo-600">
              Section {student.section.name}
            </p>
          )}
          {isPremium && student.motto && (
            <p className="text-xs italic m-0 mt-2 truncate text-slate-500">
              "{student.motto}"
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Student Grid ──────────────────────────────────────────────────────────────

function StudentGrid({ students, isPremium, loading, emptyMsg = 'No students found.', matchedIds = new Set(), faceMatches = [] }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <i className="fas fa-spinner fa-spin text-4xl mb-4 text-indigo-600" />
      <p className="text-sm">Loading…</p>
    </div>
  );

  if (students.length === 0) return (
    <div className="text-center py-24 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <i className="fas fa-users-slash text-6xl mb-5 block opacity-10 text-[#1d2b4b]" />
      <h3 className="font-extrabold text-xl mb-2 text-[#1d2b4b]">No Results</h3>
      <p className="text-sm text-slate-400">{emptyMsg}</p>
    </div>
  );

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))' }}>
      {students.map((s, i) => {
        const matchData = faceMatches.find(m => m.user_id === s.id);
        return (
          <StudentCard
            key={s.id} student={s} isPremium={isPremium} index={i}
            isMatched={matchedIds.has(s.id)}
            matchSimilarity={matchData?.similarity ?? null}
          />
        );
      })}
    </div>
  );
}

// ── Upgrade Banner ────────────────────────────────────────────────────────────

function UpgradeBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 mb-6 bg-gradient-to-r from-[#1d2b4b] to-indigo-600 text-white">
      <div className="flex items-center gap-3">
        <i className="fas fa-lock text-xl text-amber-400" />
        <div>
          <p className="font-extrabold text-sm m-0">Unlock Full Discovery</p>
          <p className="text-xs m-0 opacity-70">
            Premium sees all students, full profiles, mottos & contact info.
          </p>
        </div>
      </div>
      <Link
        to="/payment"
        className="no-underline font-bold text-xs px-5 py-3 rounded-xl whitespace-nowrap bg-amber-400 text-[#1d2b4b] hover:bg-amber-300 transition-colors"
      >
        Upgrade Now <i className="fas fa-arrow-right ml-1" />
      </Link>
    </div>
  );
}

// ── Filters Panel ─────────────────────────────────────────────────────────────

function FiltersPanel({ filters, onChange, showCourse = true, showYear = true, showDept = true }) {
  const selectClass = "text-xs font-bold px-4 py-2 rounded-xl border-none outline-none bg-slate-100 text-slate-500 cursor-pointer";

  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      {showDept && (
        <select
          value={filters.department ?? ''}
          onChange={e => onChange('department', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {showCourse && (
        <select
          value={filters.course ?? ''}
          onChange={e => onChange('course', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Programs</option>
          {COURSES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      )}
      {showYear && (
        <select
          value={filters.year ?? ''}
          onChange={e => onChange('year', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Years</option>
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>Batch {y}</option>)}
        </select>
      )}
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder, hasMatch }) {
  return (
    <div className="relative flex-1 max-w-[300px]">
      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 z-[1]" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full text-sm rounded-xl outline-none
          pl-8 pr-12 py-2.5 border
          text-[#1d2b4b] bg-white
          ${hasMatch ? 'border-amber-400' : 'border-slate-200'}
          focus:border-indigo-400 transition-colors
        `}
      />
    </div>
  );
}

// ── Result count text ─────────────────────────────────────────────────────────

function ResultCount({ matchedIds, displayed, results, total, label = 'student', extra = null }) {
  return (
    <p className="text-sm font-semibold mb-4 text-slate-500">
      {matchedIds.size > 0
        ? <><i className="fas fa-brain mr-1 text-amber-400" />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''}</>
        : total !== undefined
          ? <>{total?.toLocaleString()} {label}{total !== 1 ? 's' : ''} in the school</>
          : `${results.length} ${label}${results.length !== 1 ? 's' : ''}`}
      {extra}
    </p>
  );
}

// ── BatchView ─────────────────────────────────────────────────────────────────

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

  const displayed  = matchedIds.size > 0 ? results.filter(s => matchedIds.has(s.id)) : results;
  const activeYear = filters.year ?? userYear ?? null;

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <SearchInput
          value={query}
          onChange={e => { setQuery(e.target.value); clearFace(); }}
          placeholder="Fuzzy search by name, ID, motto…"
          hasMatch={matchedIds.size > 0}
        />
        <div className="relative flex-1 max-w-[300px]">
          {/* FaceSearchButton sits on top of the search input */}
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilter} showDept={false} />
        <div className="ml-auto">
          <GenerateYearbookButton
            batchId={activeYear}
            label={activeYear ? `Generate Yearbook · Batch ${activeYear}` : undefined}
          />
        </div>
      </div>

      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}

      <p className="text-sm font-semibold mb-4 text-slate-500">
        {matchedIds.size > 0
          ? <><i className="fas fa-brain mr-1 text-amber-400" />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''}</>
          : hasQuery
            ? `${results.length} fuzzy match${results.length !== 1 ? 'es' : ''}`
            : `${students.length} batchmate${students.length !== 1 ? 's' : ''}`}
        {!isPremium && <span className="text-slate-400"> · Public profiles only</span>}
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

// ── SectionView ───────────────────────────────────────────────────────────────

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
          <div className="px-4 py-2 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-600">
            <i className="fas fa-layer-group mr-2" />Section {section.name}
          </div>
        )}
        <div className="relative flex-1 max-w-[300px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 z-[1]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); clearFace(); }}
            placeholder="Fuzzy search classmates…"
            className={`
              w-full text-sm rounded-xl outline-none
              pl-8 pr-12 py-2.5 border bg-white
              ${matchedIds.size > 0 ? 'border-amber-400' : 'border-slate-200'}
              focus:border-indigo-400 transition-colors
            `}
          />
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
      </div>

      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}

      <p className="text-sm font-semibold mb-4 text-slate-500">
        {matchedIds.size > 0
          ? <><i className="fas fa-brain mr-1 text-amber-400" />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''}</>
          : hasQuery
            ? `${results.length} match${results.length !== 1 ? 'es' : ''}`
            : `${students.length} classmate${students.length !== 1 ? 's' : ''}`}
      </p>

      <StudentGrid
        students={displayed}
        isPremium={isPremium}
        loading={loading}
        matchedIds={matchedIds}
        faceMatches={faceMatches}
        emptyMsg="No section assigned. Contact your administrator."
      />
    </div>
  );
}

// ── SchoolView ────────────────────────────────────────────────────────────────

function SchoolView({ isPremium }) {
  const [students,   setStudents]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState({});
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
        <div className="relative flex-1 max-w-[300px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 z-[1]" />
          <input
            value={serverSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search all students…"
            className={`
              w-full text-sm rounded-xl outline-none
              pl-8 pr-12 py-2.5 border bg-white
              ${matchedIds.size > 0 ? 'border-amber-400' : 'border-slate-200'}
              focus:border-indigo-400 transition-colors
            `}
          />
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>
        <FiltersPanel filters={filters} onChange={setFilter} />
      </div>

      <FaceResultBanner matches={faceMatches} onClear={clearFace} />
      {!isPremium && <UpgradeBanner />}

      {pagination && (
        <p className="text-sm font-semibold mb-4 text-slate-500">
          {matchedIds.size > 0
            ? <><i className="fas fa-brain mr-1 text-amber-400" />{displayed.length} face match{displayed.length !== 1 ? 'es' : ''} on this page</>
            : <>{pagination.total?.toLocaleString()} student{pagination.total !== 1 ? 's' : ''} in the school</>}
          {!isPremium && <span className="text-slate-400"> · Public profiles only</span>}
        </p>
      )}

      <StudentGrid
        students={displayed}
        isPremium={isPremium}
        loading={loading}
        matchedIds={matchedIds}
        faceMatches={faceMatches}
        emptyMsg="No students match your filters."
      />

      {!matchedIds.size && pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          {Array.from({ length: Math.min(pagination.last_page, 10) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => loadPage(page)}
              className={`
                w-10 h-10 rounded-xl font-bold text-sm transition-all border border-slate-200 cursor-pointer
                ${page === pagination.current_page
                  ? 'bg-[#1d2b4b] text-white'
                  : 'bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}
              `}
            >
              {page}
            </button>
          ))}
          {pagination.last_page > 10 && (
            <span className="text-sm text-slate-400">… {pagination.last_page} pages</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── CrossProgramView ──────────────────────────────────────────────────────────

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
  const grouped   = displayed.reduce((acc, s) => {
    const key = s.course ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const statsItems = [
    { icon: 'fa-users',            val: stats?.total_students?.toLocaleString(), label: 'students from other programs' },
    { icon: 'fa-book',             val: stats?.total_programs,                   label: 'different programs'           },
    { icon: 'fa-building-columns', val: stats?.departments?.length,              label: 'colleges'                     },
  ];

  return (
    <div>
      {stats && (
        <div className="flex flex-wrap gap-4 mb-6">
          {statsItems.map(s => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200">
              <i className={`fas ${s.icon} text-amber-400 text-[1.1rem]`} />
              <div>
                <p className="font-black text-lg m-0 text-[#1d2b4b]">{s.val}</p>
                <p className="text-xs m-0 text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 max-w-[320px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 z-[1]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); clearFace(); }}
            placeholder="Fuse.js fuzzy search across programs…"
            className={`
              w-full text-sm rounded-xl outline-none
              pl-8 pr-12 py-2.5 border bg-white
              ${matchedIds.size > 0 ? 'border-amber-400' : 'border-slate-200'}
              focus:border-indigo-400 transition-colors
            `}
          />
          {query && !matchedIds.size && (
            <span className="absolute right-11 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg font-bold pointer-events-none bg-amber-400 text-[#1d2b4b]">
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
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-indigo-600" />
          <p className="text-sm">Discovering other programs…</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <i className="fas fa-shuffle text-6xl mb-5 block opacity-10 text-[#1d2b4b]" />
          <h3 className="font-extrabold text-xl mb-2 text-[#1d2b4b]">No Results</h3>
          <p className="text-sm text-slate-400">
            {matchedIds.size > 0
              ? 'No face matches in other programs.'
              : hasQuery ? 'No fuzzy matches.' : 'No students from other programs found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([course, courseStudents]) => (
            <div key={course}>
              {/* Course group header */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1d2b4b] text-amber-400 text-[0.8rem]">
                  <i className="fas fa-book" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black m-0 text-[1rem] text-[#1d2b4b]">
                    {COURSE_LABELS[course] ?? course}
                  </h3>
                  <p className="text-xs m-0 text-slate-400">
                    {courseStudents.length} student{courseStudents.length !== 1 ? 's' : ''} · {course}
                  </p>
                </div>
              </div>

              <div
                className="grid gap-[18px]"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))' }}
              >
                {courseStudents.map((s, i) => {
                  const matchData = faceMatches.find(m => m.user_id === s.id);
                  return (
                    <StudentCard
                      key={s.id} student={s} isPremium={isPremium} index={i}
                      isMatched={matchedIds.has(s.id)}
                      matchSimilarity={matchData?.similarity ?? null}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!matchedIds.size && hasMore && !hasQuery && (
        <div className="text-center mt-10">
          <button
            onClick={loadMore}
            disabled={loading}
            className="font-bold text-sm px-8 py-3 rounded-xl bg-[#1d2b4b] text-white border-none cursor-pointer transition-opacity disabled:opacity-60 hover:bg-[#253563]"
          >
            {loading
              ? <i className="fas fa-spinner fa-spin mr-2" />
              : <i className="fas fa-chevron-down mr-2" />}
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-[Plus_Jakarta_Sans,sans-serif]">
      <Navbar />

      {/* Hero */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-indigo-600 px-[8%] pt-[60px] pb-[110px] rounded-b-[60px] text-white text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
          National University Lipa
        </p>
        <h1 className="font-extrabold mb-3 text-[2.8rem] tracking-tight">
          Student <span className="text-amber-400">Discovery</span>
        </h1>
        <p className="font-light opacity-75 mx-auto text-base max-w-[500px]">
          Find classmates, explore other programs, and connect with the NU community.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {isPremium && (
            <span className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-400">
              <i className="fas fa-crown" /> Premium · Full Access
            </span>
          )}
          <span className="inline-flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/60">
            <i className="fas fa-camera text-amber-400" /> Click the camera icon in any search to find by face
          </span>
        </div>
      </header>

      {/* View mode tabs */}
      <div className="flex justify-center -mt-10 relative z-10 px-[8%]">
        <div className="flex flex-wrap gap-3 justify-center p-2 rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`
                flex flex-col items-center gap-1 px-5 py-3 rounded-xl transition-all font-bold text-xs
                border-none cursor-pointer min-w-[100px]
                ${viewMode === mode.key
                  ? 'bg-[#1d2b4b] text-white'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100'}
              `}
            >
              <i
                className={`fas ${mode.icon} text-base ${viewMode === mode.key ? 'text-amber-400' : ''}`}
              />
              {mode.label}
              <span className="font-normal opacity-70 text-xs">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="px-[8%] pt-10 pb-20 flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1d2b4b] text-amber-400">
            <i className={`fas ${activeMode?.icon} text-sm`} />
          </div>
          <div>
            <h2 className="font-black m-0 text-[1.3rem] text-[#1d2b4b]">
              {activeMode?.label}
            </h2>
            <p className="text-xs m-0 text-slate-400">{activeMode?.desc}</p>
          </div>
        </div>

        {viewMode === 'batch'         && <BatchView        isPremium={isPremium} userYear={user?.graduation_year} />}
        {viewMode === 'section'       && <SectionView      isPremium={isPremium} />}
        {viewMode === 'school'        && <SchoolView       isPremium={isPremium} />}
        {viewMode === 'cross_program' && <CrossProgramView isPremium={isPremium} />}
      </main>

      <Footer />
    </div>
  );
}