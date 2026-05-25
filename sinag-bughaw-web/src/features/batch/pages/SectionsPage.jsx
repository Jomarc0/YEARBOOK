import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSection } from '@/features/batch/hooks/useBatch';
import { batchApi, COURSES } from '@/api/batch.api';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TABS = [
  { key: 'sections', label: 'Sections', icon: 'fa-layer-group' },
  { key: 'batches',  label: 'Batches',  icon: 'fa-graduation-cap' },
];

export default function SectionsPage() {
  const { sections, loading, error } = useSection();

  const [activeTab,    setActiveTab]    = useState('sections');
  const [courseFilter, setCourseFilter] = useState(null);
  const [batches,      setBatches]      = useState({});
  const [departments,  setDepartments]  = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // ── Search state ──────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('');
  const [faceSearching, setFaceSearching] = useState(false);
  const [matchedIds,    setMatchedIds]    = useState(new Set());
  const [isFaceMode,    setIsFaceMode]    = useState(false);

  // Load batches when that tab is first opened
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

  // ── Text search ────────────────────────────────────────────────────────
  const onSearch = (val) => {
    setQuery(val);
    setMatchedIds(new Set());
    setIsFaceMode(false);
  };

  // ── Face search ────────────────────────────────────────────────────────
  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setMatchedIds(new Set());
    setQuery('');
    setIsFaceMode(false);

    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = data.matches ?? [];

      if (!matches.length) {
        alert('No matching section found by face.');
        return;
      }

      // matches contain user_ids — find sections that contain those students
      const ids = new Set(matches.map(m => m.user_id));
      setMatchedIds(ids);
      setIsFaceMode(true);
    } catch {
      alert('Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const clearFaceSearch = () => {
    setMatchedIds(new Set());
    setIsFaceMode(false);
    setQuery('');
  };

  // ── Filtered sections ─────────────────────────────────────────────────
  const filteredSections = (() => {
    let result = sections;

    // Course filter
    if (courseFilter) {
      result = result.filter(s => s.course === courseFilter);
    }

    // Face mode: show sections whose students include matched user_ids
    if (isFaceMode && matchedIds.size > 0) {
      result = result.filter(s =>
        s.students?.some(st => matchedIds.has(st.id))
      );
    }

    // Text search
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header
        className="text-white text-center"
        style={{
          background:   'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)',
          padding:      '70px 8% 120px',
          borderRadius: '0 0 60px 60px',
        }}
      >
        <h1 className="font-extrabold mb-3" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Sections & <span style={{ color: '#fdb813' }}>Batches</span>
        </h1>
        <p className="font-light opacity-80" style={{ fontSize: '1rem' }}>
          Browse academic sections and graduation batches.
        </p>

        {/* Search bar — same pattern as GalleryPage/FacultyPage */}
        <div style={{ maxWidth: 560, margin: '28px auto 0', position: 'relative' }}>
          <div style={{
            background:    'rgba(255,255,255,0.12)',
            backdropFilter:'blur(16px)',
            borderRadius:  16,
            padding:       8,
            border:        '1px solid rgba(255,255,255,0.18)',
            boxShadow:     '0 20px 48px rgba(0,0,0,0.18)',
          }}>
            <div style={{ position: 'relative' }}>
              {/* Left search icon */}
              <i
                className="fas fa-search"
                style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fdb813', fontSize: '0.9rem',
                  zIndex: 1, pointerEvents: 'none',
                }}
              />

              {/* Face-searching spinner */}
              {faceSearching && (
                <i
                  className="fas fa-spinner fa-spin"
                  style={{
                    position: 'absolute', right: 52, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.5)',
                    zIndex: 1, pointerEvents: 'none',
                  }}
                />
              )}

              <input
                type="text"
                value={query}
                onChange={e => onSearch(e.target.value)}
                placeholder={
                  isFaceMode
                    ? 'Showing face match results…'
                    : 'Search sections, courses, students…'
                }
                style={{
                  width: '100%', height: 46, boxSizing: 'border-box',
                  padding: '0 52px 0 42px',
                  border:  isFaceMode ? '1.5px solid #fdb813' : '1.5px solid transparent',
                  borderRadius: 10, outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '0.92rem',
                  transition: 'border 0.2s',
                }}
                onFocus={e  => (e.target.style.background = 'rgba(255,255,255,0.14)')}
                onBlur={e   => (e.target.style.background = 'rgba(255,255,255,0.08)')}
              />

              {/* ✅ FaceSearchButton sits absolutely inside the input row */}
              <FaceSearchButton
                onFile={handleFaceFile}
                loading={faceSearching}
              />
            </div>
          </div>

          {/* Face match banner */}
          {isFaceMode && matchedIds.size > 0 && (
            <div style={{
              marginTop:     10,
              padding:       '9px 16px',
              borderRadius:  10,
              background:    '#ecfdf5',
              border:        '1px solid #bbf7d0',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'space-between',
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d' }}>
                <i className="fas fa-circle-check mr-2" />
                Showing sections with {matchedIds.size} face-matched student{matchedIds.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearFaceSearch}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#15803d', fontSize: '0.78rem', fontWeight: 600,
                }}
              >
                <i className="fas fa-times mr-1" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div
          className="inline-flex gap-1 mt-6 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="font-bold text-sm px-6 py-3 rounded-xl transition-all"
              style={{
                background: activeTab === t.key ? 'white' : 'transparent',
                color:      activeTab === t.key ? '#1d2b4b' : 'rgba(255,255,255,0.7)',
                border:     'none',
                cursor:     'pointer',
              }}
            >
              <i className={`fas ${t.icon} mr-2`} />{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Course Filter Pills ───────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2 px-[8%] pt-8 pb-2">
        {COURSES.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setCourseFilter(f.value)}
            className="font-bold text-xs px-4 py-2 rounded-xl transition-all"
            style={{
              background:  courseFilter === f.value ? '#1d2b4b' : 'white',
              color:       courseFilter === f.value ? 'white'   : '#64748b',
              border:      '1.5px solid',
              borderColor: courseFilter === f.value ? '#1d2b4b' : '#e2e8f0',
              cursor:      'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ padding: '20px 8% 80px' }}>

        {/* SECTIONS TAB */}
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
                <button
                  onClick={clearFaceSearch}
                  className="mt-3 text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                >
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
                // Highlight card if any student is a face match
                const hasFaceMatch = isFaceMode && sec.students?.some(st => matchedIds.has(st.id));

                return (
                  <Link
                    key={sec.id}
                    to={`/sections/${sec.id}`}
                    className="no-underline block bg-white transition-all"
                    style={{
                      borderRadius: '20px',
                      padding:      '32px',
                      boxShadow:    hasFaceMatch
                        ? '0 20px 50px rgba(253,184,19,0.2)'
                        : '0 4px 20px rgba(0,0,0,0.03)',
                      border:  hasFaceMatch ? '2px solid #fdb813' : '1px solid #e2e8f0',
                      color:   'inherit',
                      position:'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform   = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = hasFaceMatch ? '#fdb813' : '#3f51b5';
                      e.currentTarget.style.boxShadow   = hasFaceMatch
                        ? '0 30px 60px rgba(253,184,19,0.25)'
                        : '0 20px 40px rgba(63,81,181,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform   = 'none';
                      e.currentTarget.style.borderColor = hasFaceMatch ? '#fdb813' : '#e2e8f0';
                      e.currentTarget.style.boxShadow   = hasFaceMatch
                        ? '0 20px 50px rgba(253,184,19,0.2)'
                        : '0 4px 20px rgba(0,0,0,0.03)';
                    }}
                  >
                    {/* Face match badge */}
                    {hasFaceMatch && (
                      <div style={{
                        position:   'absolute', top: 14, right: 14,
                        background: '#fdb813', color: '#1d2b4b',
                        fontSize:   '0.62rem', fontWeight: 700,
                        padding:    '3px 9px', borderRadius: '20px',
                        display:    'flex', alignItems: 'center', gap: 4,
                      }}>
                        <i className="fas fa-check" /> Face Match
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: '#eef2ff', color: '#3f51b5' }}
                      >
                        <i className="fas fa-layer-group" />
                      </div>
                      {sec.batch?.graduation_year && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-lg"
                          style={{ background: '#f8fafc', color: '#64748b' }}
                        >
                          {sec.batch.graduation_year}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-xl mb-1" style={{ color: '#1d2b4b' }}>
                      Section {sec.name}
                    </h3>
                    {sec.course && (
                      <p className="text-xs font-semibold mb-3" style={{ color: '#3f51b5' }}>
                        {sec.course
                          .split(' ')
                          .filter(w => w[0] === w[0]?.toUpperCase() && w.length > 2)
                          .slice(0, 3)
                          .join(' ')}
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

                      {/* Avatar stack — highlight matched students */}
                      {sec.students?.length > 0 && (
                        <div className="flex" style={{ gap: '-8px' }}>
                          {sec.students.slice(0, 4).map(s => (
                            <img
                              key={s.id}
                              src={
                                s.profile_picture
                                  ? `http://127.0.0.1:8000/storage/${s.profile_picture}`
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fff&size=40`
                              }
                              alt={s.name}
                              title={s.name}
                              className="rounded-full border-2 border-white"
                              style={{
                                width:       '30px',
                                height:      '30px',
                                objectFit:   'cover',
                                marginLeft:  '-8px',
                                // Gold ring on face-matched student avatars
                                border: matchedIds.has(s.id)
                                  ? '2px solid #fdb813'
                                  : '2px solid white',
                              }}
                            />
                          ))}
                          {sec.students_count > 4 && (
                            <div
                              className="rounded-full border-2 border-white flex items-center justify-center text-xs font-bold"
                              style={{
                                width:      '30px', height: '30px',
                                marginLeft: '-8px',
                                background: '#f1f5f9', color: '#64748b',
                              }}
                            >
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

        {/* BATCHES TAB */}
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
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#1d2b4b', color: '#fdb813' }}
                    >
                      <i className="fas fa-building-columns text-sm" />
                    </div>
                    <h2 className="font-extrabold text-xl m-0" style={{ color: '#1d2b4b' }}>
                      {dept}
                    </h2>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: '#f1f5f9', color: '#64748b' }}
                    >
                      {(batches[dept] ?? []).length} batch{(batches[dept] ?? []).length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap:                 '18px',
                  }}>
                    {(batches[dept] ?? []).map(batch => (
                      <div
                        key={batch.id}
                        className="bg-white rounded-2xl p-6 border transition-all"
                        style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                      >
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

                        <p className="text-sm font-semibold m-0 mb-1" style={{ color: '#64748b' }}>
                          <i className="fas fa-users mr-2" />{batch.students_count ?? 0} students
                        </p>
                        {batch.sections?.length > 0 && (
                          <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
                            <i className="fas fa-layer-group mr-1" />
                            {batch.sections.map(s => `Section ${s.name}`).join(', ')}
                          </p>
                        )}

                        <Link
                          to={`/batchmates?course=${encodeURIComponent(batch.course)}&year=${batch.graduation_year}`}
                          className="inline-block mt-4 text-xs font-bold no-underline px-4 py-2 rounded-lg transition-all"
                          style={{ background: '#eef2ff', color: '#3f51b5' }}
                        >
                          View Batchmates →
                        </Link>
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