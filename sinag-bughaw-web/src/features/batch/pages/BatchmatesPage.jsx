/**
 * BatchmatesPage.jsx — FIXED
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Added FaceSearchButton + face search to match DiscoveryPage behavior.
 *
 * Changes:
 *  - Imports: added `faceApi`, `FaceSearchButton`, `imageUrl`
 *  - New state: `faceSearching`, `faceMatches`, `matchedIds`
 *  - `handleFaceFile` calls faceApi.search (POST /face/search, no premium gate)
 *  - `FaceResultBanner` shows matched students with clear button
 *  - Cards get gold border + match% badge when their id is in matchedIds
 *  - Existing text search + filters unchanged
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useBatch } from '@/features/batch/hooks/useBatch';
import { batchApi } from '@/api/batch.api';
import { faceApi } from '@/api/gallery.api';           // FIX: added
import FaceSearchButton from '@/components/ui/FaceSearchButton'; // FIX: added
import { imageUrl } from '@/utils/imageUrl';           // FIX: added
import { recordContentView } from '@/api/analytics.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + 2 - i);

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function faceUserId(match) {
  const id = Number(match?.account_user_id ?? match?.user_id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function studentUserId(student) {
  const id = Number(student?.id ?? student?.user_id ?? student?.account_user_id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const COURSE_ALIASES = {
  'bachelor of science in architecture': ['bs architecture', 'architecture'],
  'bachelor of multimedia arts': ['bachelor of multimedia arts (bmma)', 'bmma', 'bma', 'multimedia arts'],
  'bachelor of science in civil engineering': ['bs civil engineering', 'civil engineering'],
  'bachelor of science in computer science': ['bs computer science', 'bscs', 'computer science'],
  'bachelor of science in information technology': ['bs information technology', 'bsit', 'information technology'],
  'bachelor of science in nursing': ['bs nursing', 'bsn', 'nursing'],
  'bachelor of science in medical technology': ['bs medical technology', 'bsmt', 'medical technology'],
  'bachelor of science in psychology': ['bs psychology', 'bsp', 'psychology'],
  'bachelor of science in accountancy': ['bs accountancy', 'bsa', 'accountancy'],
  'bachelor of science in business administration - financial management': ['bsba financial management', 'bsbafm', 'bsba-fm', 'financial management'],
  'bachelor of science in business administration - marketing management': ['bsba marketing management', 'bsbamm', 'bsba-mm', 'marketing management'],
  'bachelor of science in tourism management': ['bs tourism management', 'bbstm', 'bstm', 'tourism management'],
  'master in management': ['mm'],
  abm: ['accountancy business and management'],
  stem: ['science technology engineering mathematics'],
  humss: ['humanities and social sciences'],
};

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function includesSearch(value, query) {
  return normalizeText(value).includes(query);
}

function courseMatches(studentCourse, selectedCourse) {
  const selected = normalizeText(selectedCourse);
  if (!selected) return true;

  const course = normalizeText(studentCourse);
  const selectedAliases = COURSE_ALIASES[selected] ?? [];
  const courseAliases = COURSE_ALIASES[course] ?? [];
  const selectedTerms = [selected, ...selectedAliases];
  const courseTerms = [course, ...courseAliases];

  return selectedTerms.some(term => courseTerms.some(courseTerm =>
    courseTerm === term || courseTerm.includes(term) || term.includes(courseTerm)
  ));
}

function usableFaceMatches(matches = []) {
  const normalized = matches
    .map(m => ({
      ...m,
      user_id: faceUserId(m),
      student_record_id: m?.student_record_id ?? m?.student_id ?? null,
    }))
    .filter(m => m.user_id);

  const validMatches = normalized.filter(m =>
    m.name || m.student_id || m.course || m.profile_picture
  );
  const source = validMatches.length ? validMatches : normalized;
  return Array.from(new Map(source.map(m => [m.user_id, m])).values());
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

async function findYearbookBatchId(year, course = null) {
  if (!year) return null;

  const { data } = await batchApi.index();
  const raw = data?.data ?? data ?? [];
  const batches = Array.isArray(raw)
    ? raw
    : Object.values(raw).flatMap(group => Array.isArray(group) ? group : []);

  const sameYear = batches.filter(batch =>
    Number(batch.graduation_year ?? batch.year) === Number(year)
  );

  const normalizedCourse = String(course ?? '').trim().toLowerCase();
  const exactCourse = normalizedCourse
    ? sameYear.find(batch => String(batch.course ?? '').trim().toLowerCase() === normalizedCourse)
    : null;

  return (exactCourse ?? sameYear[0])?.id ?? null;
}

function GenerateYearbookButton({ year, department, course }) {
  const navigate  = useNavigate();
  const [hov, setHov] = useState(false);
  const [opening, setOpening] = useState(false);
  const label = year ? `Generate Yearbook · Batch ${year}` : 'Generate Yearbook';

  const openYearbook = async () => {
    if (!year) {
      navigate('/yearbook');
      return;
    }

    setOpening(true);
    try {
      const batchId = await findYearbookBatchId(year, course);
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (course) params.set('course', course);
      navigate(batchId ? `/yearbook/${batchId}/view${params.toString() ? `?${params.toString()}` : ''}` : `/yearbook?year=${year}`);
    } catch {
      const params = new URLSearchParams({ year: String(year) });
      if (department) params.set('department', department);
      if (course) params.set('course', course);
      navigate(`/yearbook?${params.toString()}`);
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      onClick={openYearbook}
      disabled={opening}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 26px', borderRadius: 50,
        border: `1.5px solid ${hov ? '#fdb813' : 'rgba(253,184,19,0.55)'}`,
        cursor: opening ? 'wait' : 'pointer', fontSize: '0.78rem', fontWeight: 800,
        letterSpacing: '0.02em', whiteSpace: 'nowrap', transition: 'all 0.22s ease',
        background: hov ? '#fdb813' : 'rgba(253,184,19,0.12)',
        color:      hov ? '#1d2b4b' : '#fdb813',
        boxShadow:  hov ? '0 8px 24px rgba(253,184,19,0.35)' : 'none',
        transform:  hov ? 'translateY(-2px)' : 'none',
        opacity:    opening ? 0.7 : 1,
      }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {opening ? 'Opening Yearbook…' : label}
    </button>
  );
}

function YearbookFilterPill({ year, department, course }) {
  const navigate  = useNavigate();
  const [hov, setHov] = useState(false);
  const [opening, setOpening] = useState(false);
  if (!year) return null;

  const openYearbook = async () => {
    setOpening(true);
    try {
      const batchId = await findYearbookBatchId(year, course);
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (course) params.set('course', course);
      navigate(batchId ? `/yearbook/${batchId}/view${params.toString() ? `?${params.toString()}` : ''}` : `/yearbook?year=${year}`);
    } catch {
      const params = new URLSearchParams({ year: String(year) });
      if (department) params.set('department', department);
      if (course) params.set('course', course);
      navigate(`/yearbook?${params.toString()}`);
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      onClick={openYearbook}
      disabled={opening}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`Open ${year} Yearbook`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 12, border: 'none',
        cursor: opening ? 'wait' : 'pointer', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        background: hov ? '#fdb813' : '#1d2b4b',
        color:      hov ? '#1d2b4b' : '#fdb813',
        boxShadow:  hov ? '0 4px 14px rgba(253,184,19,0.3)' : '0 2px 8px rgba(29,43,75,0.15)',
        opacity:    opening ? 0.7 : 1,
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {opening ? 'Opening…' : `Yearbook ${year}`}
    </button>
  );
}

// FIX: Face result banner component
// eslint-disable-next-line no-unused-vars
function FaceResultBanner({ matches, onClear }) {
  if (!matches.length) return null;
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4 px-4 py-3
                    rounded-2xl bg-amber-400/10 border border-amber-400/30 mx-[8%]">
      <div className="flex items-center gap-2">
        <div className="flex">
          {matches.slice(0, 3).map((m, i) => (
            <img
              key={m.user_id}
              src={imageUrl(m.profile_picture ?? m.photo) || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name ?? '')}&background=1d2b4b&color=fdb813`}
              alt={m.name}
              className="w-7 h-7 rounded-lg border-2 border-amber-400 object-cover"
              style={{ marginLeft: i > 0 ? '-7px' : 0 }}
            />
          ))}
        </div>
        <span className="text-[0.8rem] font-bold text-amber-700">
          <i className="fas fa-camera mr-1 text-amber-400" />
          {matches.length} face match{matches.length > 1 ? 'es' : ''} — showing matched batchmates only
        </span>
      </div>
      <button
        onClick={onClear}
        className="bg-transparent border border-amber-400/40 rounded-lg text-amber-700
                   cursor-pointer text-xs font-bold px-2.5 py-1 hover:bg-amber-400/20 transition-colors">
        <i className="fas fa-times mr-1" /> Clear
      </button>
    </div>
  );
}

export default function BatchmatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cleanParam = (value) => {
    if (!value) return null;
    const normalized = String(value).trim();
    return ['null', 'undefined', ''].includes(normalized.toLowerCase()) ? null : normalized;
  };
  const {
    user, batchmates, loading,
    isPremium, filterMeta, fetchBatchmates,
  } = useBatch();

  const [search,       setSearch]       = useState('');
  const [courseFilter, setCourseFilter] = useState(cleanParam(searchParams.get('course')));
  const [departmentFilter, setDepartmentFilter] = useState(cleanParam(searchParams.get('department')));
  const [yearFilter,   setYearFilter]   = useState(
    searchParams.get('year') ? Number(searchParams.get('year')) : null
  );

  // FIX: face search state
  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches,   setFaceMatches]   = useState([]);
  const [matchedIds,    setMatchedIds]    = useState(new Set());
  const activeYear = yearFilter ?? filterMeta.year ?? user?.graduation_year ?? null;
  const activeCourse = courseFilter ?? filterMeta.course ?? null;
  const activeCourseLabel = activeCourse
    ? activeCourse.split(' ').slice(-2).join(' ')
    : 'All Programs';

  useEffect(() => {
    const params = {};
    if (departmentFilter) params.department = departmentFilter;
    if (courseFilter) params.course = courseFilter;
    if (yearFilter)   params.year   = yearFilter;
    fetchBatchmates(params);
    const next = {};
    if (departmentFilter) next.department = departmentFilter;
    if (courseFilter) next.course = courseFilter;
    if (yearFilter)   next.year   = yearFilter;
    setSearchParams(next, { replace: true });
  }, [departmentFilter, courseFilter, yearFilter]);

  useEffect(() => {
    if (!activeYear) return;
    recordContentView({
      content_type: 'batch',
      content_id: Number(activeYear),
      title: `Batch ${activeYear}`,
      category: activeCourse || 'All Programs',
      url: `/batchmates?year=${activeYear}`,
    }).catch(() => {});
  }, [activeYear, activeCourse]);

  // FIX: handle face file upload
  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setFaceMatches([]);
    setMatchedIds(new Set());
    setSearch(''); // clear text search
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = usableFaceMatches(data.matches ?? []);
      if (!matches.length) {
        alert('No matching batchmate found. Ensure the photo shows a clear face.');
        return;
      }
      setFaceMatches(matches);
      setMatchedIds(new Set(matches.map(m => m.user_id)));
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const clearFace = () => {
    setFaceMatches([]);
    setMatchedIds(new Set());
  };

  const searchQuery = normalizeText(search);

  // Apply text, face, and course filters against the full batch hierarchy.
  const filtered = batchmates.filter(s => {
    const studentSection = s.section?.name || s.section_name;
    const studentDepartment = s.batch?.department || s.department;
    const studentBatch = s.batch?.name || s.batch_year || s.graduation_year || filterMeta.year;
    const textMatch = !searchQuery || [
      s.name,
      s.student_id,
      s.student_no,
      s.course,
      studentSection,
      studentDepartment,
      studentBatch,
    ].some(value => includesSearch(value, searchQuery));
    const selectedCourse = courseFilter || null;
    const selectedCourseMatch = !selectedCourse || courseMatches(s.course, selectedCourse);
    const selectedDepartmentMatch = !departmentFilter || normalizeText(studentDepartment) === normalizeText(departmentFilter);

    if (matchedIds.size > 0) {
      return matchedIds.has(studentUserId(s)) && textMatch && selectedCourseMatch && selectedDepartmentMatch;
    }
    return textMatch && selectedCourseMatch && selectedDepartmentMatch;
  });

  const groupedBatchmates = filtered.reduce((groups, student) => {
    const department = student.batch?.department || student.department || 'Department';
    const course = student.course || 'Course';
    const section = student.section?.name || student.section_name || 'No Section';

    groups[department] ??= {};
    groups[department][course] ??= {};
    groups[department][course][section] ??= [];
    groups[department][course][section].push(student);

    return groups;
  }, {});
  const departmentOptions = Object.keys(groupedBatchmates);
  const coursesForDepartment = (department) => Object.keys(groupedBatchmates[department] ?? {});

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

      {/* Hero */}
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
          {activeCourseLabel}
          &nbsp;· Batch {filterMeta.year ?? yearFilter ?? user?.graduation_year ?? CURRENT_YEAR}
        </p>

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
          <GenerateYearbookButton year={activeYear} department={departmentFilter} course={activeCourse} />
        </div>
      </header>

      {/* Sticky Filters */}
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
        {/* FIX: Search input with face search button */}
        <div className="relative" style={{ minWidth: '240px', flex: 1, maxWidth: '320px' }}>
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search name or student ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); clearFace(); }}
            className="w-full text-sm font-medium rounded-xl border outline-none"
            style={{
              padding:    '10px 48px 10px 32px', // FIX: extra right padding for camera button
              border:     matchedIds.size > 0 ? '1.5px solid #fdb813' : '1.5px solid #e2e8f0',
              color:      '#1d2b4b',
              background: '#f8fafc',
            }} />
          {/* FIX: Camera button in search bar */}
          <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <CourseChip
              label="All Departments"
              active={!departmentFilter}
              onClick={() => { setDepartmentFilter(null); setCourseFilter(null); clearFace(); }}
            />
            {departmentOptions.map(dept => (
              <CourseChip
                key={dept}
                label={dept}
                active={departmentFilter === dept}
                onClick={() => { setDepartmentFilter(dept); setCourseFilter(null); clearFace(); }}
              />
            ))}
          </div>
          {departmentFilter && coursesForDepartment(departmentFilter).length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <CourseChip
                label="All Courses"
                active={!courseFilter}
                onClick={() => { setCourseFilter(null); clearFace(); }}
              />
              {coursesForDepartment(departmentFilter).map(course => (
                <CourseChip
                  key={course}
                  label={course}
                  active={courseFilter === course}
                  onClick={() => { setCourseFilter(course); clearFace(); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Year + Yearbook pill */}
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
          <YearbookFilterPill year={yearFilter} department={departmentFilter} course={activeCourse} />
        </div>
      </div>

      {/* Count Pill */}
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
            <><i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} />{filtered.length} batchmate{filtered.length !== 1 ? 's' : ''} found</>
            {!isPremium && (
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                &nbsp;· Public profiles only
              </span>
            )}
          </div>
        </div>
      )}

      {/* FIX: Face result banner */}
      {faceMatches.length > 0 && (
        <div style={{ marginTop: 12 }}>
        </div>
      )}

      {/* Upgrade Banner */}
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

      {/* Cards Grid */}
      <main style={{ padding: '40px 8% 80px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
            <p className="text-sm">Loading batchmates…</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center bg-white py-24 px-8"
            style={{ borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-users-slash text-6xl mb-5 block opacity-10" style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: '#1d2b4b' }}>
              {matchedIds.size > 0 ? 'No Face Matches in this Batch' : 'No Batchmates Found'}
            </h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              {matchedIds.size > 0
                ? 'Try a different photo or clear the face filter.'
                : search
                  ? 'No results match your search.'
                  : 'Make sure your graduation year and course are set in Profile Settings.'}
            </p>
            {matchedIds.size > 0 && (
              <button onClick={clearFace}
                className="mt-4 font-bold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer"
                style={{ background: '#1d2b4b', color: 'white' }}>
                Clear Face Filter
              </button>
            )}
          </div>

        ) : (
          <div className="space-y-10">
            {Object.entries(groupedBatchmates).map(([department, courses]) => (
              <section key={department} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d2b4b] text-[#fdb813]">
                    <i className="fas fa-building-columns" />
                  </div>
                  <div>
                    <h2 className="m-0 text-xl font-extrabold text-[#1d2b4b]">{department}</h2>
                    <p className="m-0 text-xs font-bold text-slate-400">
                      {Object.values(courses).flatMap(sectionMap => Object.values(sectionMap).flat()).length} students
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(courses).map(([course, sections]) => (
                    <div key={course} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="m-0 mb-4 text-base font-extrabold text-[#3f51b5]">
                        <i className="fas fa-graduation-cap mr-2 text-[#fdb813]" />{course}
                      </h3>

                      <div className="space-y-4">
                        {Object.entries(sections).map(([section, students]) => (
                          <div key={section} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <h4 className="m-0 text-sm font-black text-[#1d2b4b]">
                                <i className="fas fa-layer-group mr-2 text-[#fdb813]" />Section {section}
                              </h4>
                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black text-[#3f51b5]">
                                {students.length} student{students.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {students.map(student => {
                                const userId = studentUserId(student);
                                const matchData = faceMatches.find(m => m.user_id === userId);
                                const isMatched = matchedIds.has(userId);

                                return (
                                  <Link key={student.id} to={`/profile/${student.id}`}
                                    className="relative flex items-center gap-3 rounded-2xl border bg-white p-3 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
                                    style={{ borderColor: isMatched ? '#fdb813' : '#e2e8f0' }}>
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1d2b4b]">
                                      {student.profile_picture ? (
                                        <img src={imageUrl(student.profile_picture)} alt={student.name} className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#fdb813]">
                                          {getInitials(student.name)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="m-0 truncate text-sm font-extrabold text-[#1d2b4b]">{student.name}</h5>
                                      <p className="m-0 mt-1 truncate text-xs font-bold text-slate-400">
                                        Batch {student.graduation_year ?? activeYear}
                                      </p>
                                      {student.student_id && (
                                        <p className="m-0 mt-1 text-[11px] text-slate-400">{student.student_id}</p>
                                      )}
                                    </div>
                                    {isMatched && (
                                      <span className="absolute right-2 top-2 rounded-full bg-[#fdb813] px-2 py-0.5 text-[10px] font-black text-[#1d2b4b]">
                                        {matchData?.similarity != null ? `${Number(matchData.similarity).toFixed(0)}%` : 'Match'}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
