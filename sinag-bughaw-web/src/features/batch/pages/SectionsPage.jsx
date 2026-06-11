import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { batchApi } from '@/api/batch.api';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { storageUrl } from '@/api/client';


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

function studentName(student) {
  return student?.name || `${student?.first_name ?? ''} ${student?.last_name ?? ''}`.trim();
}

function allBatchStudents(batches) {
  return Object.values(batches ?? {})
    .flat()
    .flatMap(batch => (batch.sections ?? []).flatMap(section =>
      (section.students ?? []).map(student => ({
        ...student,
        name: studentName(student),
        section_name: student.section_name ?? section.name,
        section_id: student.section_id ?? section.id,
        batch_id: batch.id,
        batch_name: batch.name,
        batch_year: batch.graduation_year,
        department: batch.department,
        course: student.course ?? section.course ?? batch.course,
      }))
    ));
}

function looseCourseMatches(value, filter) {
  if (!filter) return true;
  const a = String(value ?? '').toLowerCase();
  const b = String(filter ?? '').toLowerCase();
  if (!a) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  const meaningfulWords = b
    .replace(/bachelor|science|administration|in|of|and|-/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  return meaningfulWords.length > 0 && meaningfulWords.every(word => a.includes(word));
}

function uniqueDepartmentsFromBatches(groupedBatches) {
  return Array.from(new Set(
    Object.entries(groupedBatches ?? {}).flatMap(([groupName, groupBatches]) => [
      groupName,
      ...(groupBatches ?? []).map(batch => batch.department),
    ])
      .map(dept => String(dept ?? '').trim())
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
}
export default function SectionsPage() {
  const [courseFilter, setCourseFilter] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [batches,      setBatches]      = useState({});
  const [departments,  setDepartments]  = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const [query,         setQuery]         = useState('');
  const [faceSearching, setFaceSearching] = useState(false);
  const [matchedIds,    setMatchedIds]    = useState(new Set());
  const [isFaceMode,    setIsFaceMode]    = useState(false);

  useEffect(() => {
    if (departments.length > 0) return;
    setBatchLoading(true);
    batchApi.all()
      .then(({ data }) => {
        const nextBatches = data.data ?? {};
        setBatches(nextBatches);
        setDepartments(data.departments?.length ? data.departments : uniqueDepartmentsFromBatches(nextBatches));
      })
      .finally(() => setBatchLoading(false));
  }, [departments.length]);

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

  const departmentOptions = departments.length ? departments : Object.keys(batches ?? {});
  const coursesForDepartment = (department) => Array.from(new Set(
    (batches[department] ?? [])
      .flatMap(batch => (batch.sections ?? []).map(section => section.course ?? batch.course))
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
  const activeDepartments = departmentFilter ? [departmentFilter] : departmentOptions;

  const studentResults = (() => {
    const students = allBatchStudents(batches);
    let result = students;
    if (courseFilter) result = result.filter(s => looseCourseMatches(s.course, courseFilter));
    if (isFaceMode && matchedIds.size > 0) {
      result = result.filter(s => matchedIds.has(studentUserId(s)));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.student_no?.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q) ||
        s.section_name?.toLowerCase().includes(q) ||
        String(s.batch_year ?? '').includes(q) ||
        s.department?.toLowerCase().includes(q)
      );
    }
    return result;
  })();

  const batchMatchesSearch = (batch) => {
    if (courseFilter
      && !looseCourseMatches(batch.course, courseFilter)
      && !looseCourseMatches(batch.course_code, courseFilter)
      && !(batch.sections ?? []).some(s => looseCourseMatches(s.course, courseFilter))) {
      return false;
    }
    if (isFaceMode && matchedIds.size > 0) {
      return (batch.sections ?? []).some(section =>
        (section.students ?? []).some(student => matchedIds.has(studentUserId(student)))
      );
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [
      batch.name,
      batch.course,
      batch.course_code,
      batch.department,
      batch.graduation_year,
      ...(batch.sections ?? []).flatMap(section => [
        section.name,
        section.course,
        ...(section.students ?? []).map(student => studentName(student)),
      ]),
    ].some(value => String(value ?? '').toLowerCase().includes(q));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-[Plus_Jakarta_Sans,sans-serif]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="min-h-[140px] rounded-b-[28px] bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] py-8 text-center text-white">
        <h1 className="font-extrabold mb-2 text-3xl sm:text-4xl">
          Academic <span className="text-[#fdb813]">Batches</span>
        </h1>
        <p className="text-base font-light opacity-80">
          Browse batches by department, course, section, and students.
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
                placeholder="Search students, sections, courses, departments..."
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

        </div>

      </header>

      {/* ── Course Filter Pills ───────────────────────────────────────────── */}
      <div className="px-[8%] pt-8 pb-2">
        <div className="mb-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#1d2b4b', color: '#fdb813' }}>
            <i className="fas fa-building-columns text-sm" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#64748b' }}>
            Filter by department
          </span>
        </div>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => { setDepartmentFilter(null); setCourseFilter(null); }}
            className={`sticky left-0 z-10 shrink-0 rounded-xl border-[1.5px] px-4 py-2 text-xs font-bold transition-all ${departmentFilter === null ? 'border-[#1d2b4b] bg-[#1d2b4b] text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
            All Departments
          </button>
          {departmentOptions.map(dept => (
            <button key={dept} onClick={() => { setDepartmentFilter(dept); setCourseFilter(null); }}
              className={`shrink-0 rounded-xl border-[1.5px] px-4 py-2 text-xs font-bold transition-all ${departmentFilter === dept ? 'border-[#1d2b4b] bg-[#1d2b4b] text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
              {dept}
            </button>
          ))}
        </div>

        {departmentFilter && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#eef2ff', color: '#3f51b5' }}>
                <i className="fas fa-graduation-cap text-sm" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#64748b' }}>
                Courses in {departmentFilter}
              </span>
            </div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => setCourseFilter(null)}
                className={`sticky left-0 z-10 shrink-0 rounded-xl border-[1.5px] px-4 py-2 text-xs font-bold transition-all ${courseFilter === null ? 'border-[#3f51b5] bg-[#3f51b5] text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
                All Courses
              </button>
              {coursesForDepartment(departmentFilter).map(course => (
                <button key={course} onClick={() => setCourseFilter(course)}
                  className={`shrink-0 rounded-xl border-[1.5px] px-4 py-2 text-xs font-bold transition-all ${courseFilter === course ? 'border-[#3f51b5] bg-[#3f51b5] text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {course}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 px-[8%] pb-20 pt-5">
        {(query.trim() || isFaceMode) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="m-0 text-xl font-extrabold" style={{ color: '#1d2b4b' }}>
                Student Matches
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: '#eef2ff', color: '#3f51b5' }}>
                {studentResults.length} result{studentResults.length !== 1 ? 's' : ''}
              </span>
            </div>

            {studentResults.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-400">
                <i className="fas fa-user-slash text-4xl mb-3 block text-slate-200" />
                No students matched this search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {studentResults.slice(0, 18).map(student => {
                  const avatar = storageUrl(student.profile_picture ?? student.photo ?? student.photo_url)
                    || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=1d2b4b&color=fdb813&bold=true`;
                  const profileId = student.account_user_id ?? student.user_id ?? student.id;

                  return (
                    <Link key={`${student.batch_id}-${student.section_id}-${student.id}`} to={`/profile/${profileId}`}
                      className="no-underline rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <img src={avatar} alt={student.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=1d2b4b&color=fdb813&bold=true`; }} />
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 truncate text-base font-extrabold" style={{ color: '#1d2b4b' }}>
                            {student.name}
                          </h3>
                          <p className="m-0 mt-1 text-xs font-bold" style={{ color: '#3f51b5' }}>
                            Batch {student.batch_year} - Section {student.section_name}
                          </p>
                          <p className="m-0 mt-1 truncate text-xs text-slate-500">
                            {student.department} - {student.course}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── BATCHES TAB — Generate Yearbook button added to each card ───── */}
        {
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
              {activeDepartments.map(dept => (
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
                    {(batches[dept] ?? [])
                      .filter(batch => !courseFilter || (batch.sections ?? []).some(section => looseCourseMatches(section.course, courseFilter)))
                      .filter(batchMatchesSearch)
                      .map(batch => (
                      <div key={batch.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1d2b4b]/10">
                        <div className="bg-gradient-to-br from-[#1d2b4b] via-[#253968] to-[#fdb813] px-5 py-6 text-white">
                          <p className="m-0 text-[10px] font-black uppercase tracking-widest text-[#fdb813]">{dept}</p>
                          <h4 className="m-0 mt-2 text-2xl font-black leading-tight">Batch {batch.graduation_year}</h4>
                          <p className="m-0 mt-1 text-sm font-semibold text-white/75">
                            {batch.students_count ?? 0} student{Number(batch.students_count ?? 0) === 1 ? '' : 's'}
                          </p>
                        </div>

                        <div className="p-5">
                          <div className="mb-3">
                            <h4 className="font-extrabold text-lg m-0" style={{ color: '#1d2b4b' }}>
                              {batch.name}
                            </h4>
                            {batch.course_code && (
                              <p className="text-xs font-bold mt-1 m-0" style={{ color: '#3f51b5' }}>
                                {batch.course_code}
                              </p>
                            )}
                          </div>

                          <p className="text-sm font-semibold m-0 mb-2" style={{ color: '#64748b' }}>
                            <i className="fas fa-users mr-2" />{batch.students_count ?? 0} students
                          </p>

                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <Link
                              to={`/batchmates?year=${batch.graduation_year}&department=${encodeURIComponent(dept)}${courseFilter ? `&course=${encodeURIComponent(courseFilter)}` : ''}`}
                              className="inline-flex w-full items-center justify-center rounded-xl bg-[#fdb813] px-4 py-2.5 text-sm font-black text-[#1d2b4b] no-underline transition hover:bg-amber-400">
                              View Batchmates
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </main>

      <Footer />
    </div>
  );
}
