import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';          // ← added useNavigate
import { useSection } from '@/features/batch/hooks/useBatch';
import { batchApi, COURSES } from '@/api/batch.api';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { storageUrl } from '@/api/client';

const TABS = [
  { key: 'sections', label: 'Sections', icon: 'fa-layer-group' },
  { key: 'batches',  label: 'Batches',  icon: 'fa-graduation-cap' },
];

function usableFaceMatches(matches = []) {
  const normalized = matches
    .map(m => ({
      ...m,
      user_id: studentUserId(m),
      student_record_id: m?.student_record_id ?? m?.student_id ?? null,
    }))
    .filter(m => m.user_id);

  const validMatches = normalized.filter(m =>
    m.name || m.student_id || m.course || m.profile_picture
  );
  const source = validMatches.length ? validMatches : normalized;
  return Array.from(new Map(source.map(m => [m.user_id, m])).values());
}

function studentUserId(student) {
  const id = Number(student?.account_user_id ?? student?.user_id ?? student?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

// ── NEW: Generate Yearbook Button ─────────────────────────────────────────────
/**
 * Standalone button used inside every batch card.
 * Navigates to /yearbook/:batchId  (YearbookHomePage → FlipbookViewerPage).
 * batchId  — the DB primary key of the Batch record
 * batchYear — shown in the label so users know exactly which yearbook opens
 */
function GenerateYearbookButton({ batchId, batchYear }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();          // stop Link parent from firing
        e.stopPropagation();
        navigate(`/yearbook/${batchId}/view`);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Generate ${batchYear} Yearbook`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            6,
        marginTop:      8,
        padding:        '8px 16px',
        borderRadius:   10,
        border:         'none',
        cursor:         'pointer',
        fontSize:       '0.72rem',
        fontWeight:     800,
        letterSpacing:  '0.02em',
        whiteSpace:     'nowrap',
        transition:     'all 0.2s ease',
        background:     hovered ? '#fdb813' : '#1d2b4b',
        color:          hovered ? '#1d2b4b' : '#fdb813',
        boxShadow:      hovered
          ? '0 6px 20px rgba(253,184,19,0.35)'
          : '0 3px 10px rgba(29,43,75,0.18)',
        transform:      hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Book icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      Generate Yearbook · {batchYear}
    </button>
  );
}

export default function SectionsPage() {
  const { sections, loading, error } = useSection();

  const [activeTab,    setActiveTab]    = useState('sections');
  const [courseFilter, setCourseFilter] = useState(null);
  const [batches,      setBatches]      = useState({});
  const [departments,  setDepartments]  = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const [query,         setQuery]         = useState('');
  const [faceSearching, setFaceSearching] = useState(false);
  const [matchedIds,    setMatchedIds]    = useState(new Set());
  const [isFaceMode,    setIsFaceMode]    = useState(false);

  useEffect(() => {
    if (activeTab !== 'batches' || departments.length > 0) return;
    setBatchLoading(true);
    batchApi.all()
      .then(({ data }) => {
        setBatches(data.data ?? {});
        setDepartments(data.departments ?? []);
      })
      .finally(() => setBatchLoading(false));
  }, [activeTab]);

  const onSearch = (val) => {
    setQuery(val);
    setMatchedIds(new Set());
    setIsFaceMode(false);
  };

  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setMatchedIds(new Set());
    setQuery('');
    setIsFaceMode(false);
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = usableFaceMatches(data.matches ?? []);
      if (!matches.length) { alert('No matching section found by face.'); return; }
      const ids = new Set(matches.map(m => m.user_id));
      setMatchedIds(ids);
      setIsFaceMode(true);
    } catch (err) {
      alert(err?.response?.data?.message || 'Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const clearFaceSearch = () => {
    setMatchedIds(new Set());
    setIsFaceMode(false);
    setQuery('');
  };

  const filteredSections = (() => {
    let result = sections;
    if (courseFilter) result = result.filter(s => s.course === courseFilter);
    if (isFaceMode && matchedIds.size > 0)
      result = result.filter(s => s.students?.some(st => matchedIds.has(studentUserId(st))));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q) ||
        s.batch?.name?.toLowerCase().includes(q) ||
        s.students?.some(st => st.name?.toLowerCase().includes(q))
      );
    }
    return result;
  })();

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="text-white text-center"
        style={{
          background:   'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)',
          padding:      '42px 8% 64px',
          borderRadius: '0 0 28px 28px',
        }}>
        <h1 className="font-extrabold mb-2 text-3xl sm:text-4xl">
          Sections & <span style={{ color: '#fdb813' }}>Batches</span>
        </h1>
        <p className="font-light opacity-80" style={{ fontSize: '1rem' }}>
          Browse academic sections and graduation batches.
        </p>

        <div style={{ maxWidth: 560, margin: '18px auto 0', position: 'relative' }}>
          <div style={{
            background:    'rgba(255,255,255,0.12)',
            backdropFilter:'blur(16px)',
            borderRadius:  16,
            padding:       8,
            border:        '1px solid rgba(255,255,255,0.18)',
            boxShadow:     '0 20px 48px rgba(0,0,0,0.18)',
          }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: '#fdb813', fontSize: '0.9rem',
                zIndex: 1, pointerEvents: 'none',
              }} />
              {faceSearching && (
                <i className="fas fa-spinner fa-spin" style={{
                  position: 'absolute', right: 52, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.5)',
                  zIndex: 1, pointerEvents: 'none',
                }} />
              )}
              <input
                type="text"
                value={query}
                onChange={e => onSearch(e.target.value)}
                placeholder={isFaceMode ? 'Showing face match results…' : 'Search sections, courses, students…'}
                style={{
                  width: '100%', height: 46, boxSizing: 'border-box',
                  padding: '0 52px 0 42px',
                  border: isFaceMode ? '1.5px solid #fdb813' : '1.5px solid transparent',
                  borderRadius: 10, outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '0.92rem',
                  transition: 'border 0.2s',
                }}
                onFocus={e  => (e.target.style.background = 'rgba(255,255,255,0.14)')}
                onBlur={e   => (e.target.style.background = 'rgba(255,255,255,0.08)')}
              />
              <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
            </div>
          </div>

          {isFaceMode && matchedIds.size > 0 && (
            <div style={{
              marginTop: 10, padding: '9px 16px', borderRadius: 10,
              background: '#ecfdf5', border: '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d' }}>
                <i className="fas fa-circle-check mr-2" />
                Showing sections with {matchedIds.size} face-matched student{matchedIds.size > 1 ? 's' : ''}
              </span>
              <button onClick={clearFaceSearch}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontSize: '0.78rem', fontWeight: 600 }}>
                <i className="fas fa-times mr-1" /> Clear
              </button>
            </div>
          )}
        </div>

        <div className="inline-flex gap-1 mt-6 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="font-bold text-sm px-6 py-3 rounded-xl transition-all"
              style={{
                background: activeTab === t.key ? 'white' : 'transparent',
                color:      activeTab === t.key ? '#1d2b4b' : 'rgba(255,255,255,0.7)',
                border:     'none', cursor: 'pointer',
              }}>
              <i className={`fas ${t.icon} mr-2`} />{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Course Filter Pills ───────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2 px-[8%] pt-8 pb-2">
        {COURSES.map(f => (
          <button key={String(f.value)} onClick={() => setCourseFilter(f.value)}
            className="font-bold text-xs px-4 py-2 rounded-xl transition-all"
            style={{
              background:  courseFilter === f.value ? '#1d2b4b' : 'white',
              color:       courseFilter === f.value ? 'white'   : '#64748b',
              border:      '1.5px solid',
              borderColor: courseFilter === f.value ? '#1d2b4b' : '#e2e8f0',
              cursor:      'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ padding: '20px 8% 80px' }}>

        {/* SECTIONS TAB — unchanged */}
        {activeTab === 'sections' && (
          loading ? (
            <p className="text-center py-20 text-slate-400">
              <i className="fas fa-spinner fa-spin mr-2" /> Loading sections…
            </p>
          ) : error ? (
            <p className="text-center py-16 text-red-400">{error}</p>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <i className="fas fa-folder-open text-5xl mb-4 block opacity-20" />
              <p>No sections found{isFaceMode ? ' for this face match' : ' for this filter'}.</p>
              {isFaceMode && (
                <button onClick={clearFaceSearch}
                  className="mt-3 text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
                  Clear face search
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap:                 '24px',
            }}>
              {filteredSections.map(sec => {
                const hasFaceMatch = isFaceMode && sec.students?.some(st => matchedIds.has(studentUserId(st)));
                return (
                  <Link key={sec.id} to={`/sections/${sec.id}`}
                    className="no-underline block bg-white transition-all"
                    style={{
                      borderRadius: '20px', padding: '32px',
                      boxShadow: hasFaceMatch ? '0 20px 50px rgba(253,184,19,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
                      border:  hasFaceMatch ? '2px solid #fdb813' : '1px solid #e2e8f0',
                      color:   'inherit', position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform   = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = hasFaceMatch ? '#fdb813' : '#3f51b5';
                      e.currentTarget.style.boxShadow   = hasFaceMatch ? '0 30px 60px rgba(253,184,19,0.25)' : '0 20px 40px rgba(63,81,181,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform   = 'none';
                      e.currentTarget.style.borderColor = hasFaceMatch ? '#fdb813' : '#e2e8f0';
                      e.currentTarget.style.boxShadow   = hasFaceMatch ? '0 20px 50px rgba(253,184,19,0.2)' : '0 4px 20px rgba(0,0,0,0.03)';
                    }}>
                    {hasFaceMatch && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        background: '#fdb813', color: '#1d2b4b',
                        fontSize: '0.62rem', fontWeight: 700,
                        padding: '3px 9px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <i className="fas fa-check" /> Face Match
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: '#eef2ff', color: '#3f51b5' }}>
                        <i className="fas fa-layer-group" />
                      </div>
                      {sec.batch?.graduation_year && (
                        <span className="text-xs font-bold px-3 py-1 rounded-lg"
                          style={{ background: '#f8fafc', color: '#64748b' }}>
                          {sec.batch.graduation_year}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xl mb-1" style={{ color: '#1d2b4b' }}>
                      Section {sec.name}
                    </h3>
                    {sec.course && (
                      <p className="text-xs font-semibold mb-3" style={{ color: '#3f51b5' }}>
                        {sec.course.split(' ').filter(w => w[0] === w[0]?.toUpperCase() && w.length > 2).slice(0, 3).join(' ')}
                      </p>
                    )}
                    {sec.batch?.name && (
                      <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{sec.batch.name}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm m-0" style={{ color: '#64748b' }}>
                        <i className="fas fa-users mr-2" style={{ color: '#fdb813' }} />
                        {sec.students_count ?? 0} students
                      </p>
                      {sec.students?.length > 0 && (
                        <div className="flex" style={{ gap: '-8px' }}>
                          {sec.students.slice(0, 4).map(s => (
                            <img key={s.id}
                              src={storageUrl(s.profile_picture ?? s.photo ?? s.photo_url)
                                || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.name || 'Student')}&background=1d2b4b&color=fff&size=40`}
                              alt={`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.name}
                              title={`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.name}
                              className="rounded-full"
                              style={{
                                width: '30px', height: '30px', objectFit: 'cover', marginLeft: '-8px',
                                border: matchedIds.has(studentUserId(s)) ? '2px solid #fdb813' : '2px solid white',
                              }} />
                          ))}
                          {sec.students_count > 4 && (
                            <div className="rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ width: '30px', height: '30px', marginLeft: '-8px', background: '#f1f5f9', color: '#64748b', border: '2px solid white' }}>
                              +{sec.students_count - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* ── BATCHES TAB — Generate Yearbook button added to each card ───── */}
        {activeTab === 'batches' && (
          batchLoading ? (
            <p className="text-center py-20 text-slate-400">
              <i className="fas fa-spinner fa-spin mr-2" /> Loading batches…
            </p>
          ) : departments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <i className="fas fa-graduation-cap text-5xl mb-4 block opacity-20" />
              <p>No batches generated yet.</p>
              <p className="text-xs mt-2">
                Run <code className="bg-slate-100 px-2 py-1 rounded">php artisan batches:generate --sections</code>
              </p>
            </div>
          ) : (
            <div className="space-y-12 pt-4">
              {departments.map(dept => (
                <div key={dept}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#1d2b4b', color: '#fdb813' }}>
                      <i className="fas fa-building-columns text-sm" />
                    </div>
                    <h2 className="font-extrabold text-xl m-0" style={{ color: '#1d2b4b' }}>
                      {dept}
                    </h2>
                    <span className="text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {(batches[dept] ?? []).length} batch{(batches[dept] ?? []).length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {(batches[dept] ?? []).map(batch => (
                      <div key={batch.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1d2b4b]/10">

                        {/* Batch header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>
                              {batch.name}
                            </h4>
                            <p className="text-xs font-bold mt-1 m-0" style={{ color: '#3f51b5' }}>
                              {batch.course_code}
                            </p>
                          </div>
                          <span className="font-black text-2xl" style={{ color: '#fdb813' }}>
                            {batch.graduation_year}
                          </span>
                        </div>

                        {/* Meta */}
                        <p className="text-sm font-semibold m-0 mb-2" style={{ color: '#64748b' }}>
                          <i className="fas fa-users mr-2" />{batch.students_count ?? 0} students
                        </p>
                        {batch.sections?.length > 0 && (
                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="m-0 text-xs font-bold text-slate-500">
                              <i className="fas fa-layer-group mr-1.5 text-[#fdb813]" />
                              {batch.sections.length} section{batch.sections.length !== 1 ? 's' : ''}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {batch.sections.slice(0, 3).map(s => (
                                <span key={s.id ?? s.name} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                                  {s.name}
                                </span>
                              ))}
                              {batch.sections.length > 3 && (
                                <span className="rounded-full bg-[#1d2b4b] px-2 py-1 text-[10px] font-bold text-white">
                                  +{batch.sections.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Action buttons row ─────────────────────────── */}
                        <div
                          className="flex flex-wrap items-center gap-2"
                          style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}
                        >
                          {/* Existing: View Batchmates */}
                          <Link
                            to={`/batchmates?course=${encodeURIComponent(batch.course)}&year=${batch.graduation_year}`}
                            className="inline-block text-xs font-bold no-underline px-4 py-2 rounded-lg transition-all"
                            style={{ background: '#eef2ff', color: '#3f51b5' }}>
                            View Batchmates →
                          </Link>

                          {/* ── NEW: Generate Yearbook ────────────────────── */}
                          <GenerateYearbookButton
                            batchId={batch.id}
                            batchYear={batch.graduation_year}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
