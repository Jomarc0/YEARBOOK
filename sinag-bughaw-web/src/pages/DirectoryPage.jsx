import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { studentsApi } from '../services/api';

function getInitials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

// Short labels for filter chips → must match exact DB values stored on registration
const COURSE_FILTERS = [
  { label: 'All Programs',  value: 'All Programs' },
  { label: 'BSCS',         value: 'Bachelor of Science in Computer Science'      },
  { label: 'BSIT',         value: 'Bachelor of Science in Information Technology' },
  { label: 'BSCE',         value: 'Bachelor of Science in Civil Engineering'      },
  { label: 'BSME',         value: 'Bachelor of Science in Mechanical Engineering' },
  { label: 'Nursing',      value: 'Bachelor of Science in Nursing'                },
  { label: 'Accountancy',  value: 'Bachelor of Science in Accountancy'            },
  { label: 'Psychology',   value: 'Bachelor of Science in Psychology'             },
  { label: 'Education',    value: 'Bachelor of Education'                         },
];

export default function DirectoryPage() {
  const [searchParams]             = useSearchParams();
  const [students,    setStudents] = useState([]);
  const [allStudents, setAll]      = useState([]);
  const [loading,     setLoading]  = useState(true);
  const [query,       setQuery]    = useState(searchParams.get('q') || '');
  const [course,      setCourse]   = useState('All Programs');
  const searchTimer                = useRef(null);

  useEffect(() => {
    studentsApi.list({ per_page: 999 }).then(({ data }) => {
      const list = data.data || data;
      setAll(list);
      setStudents(list);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchStudents = async (q = query, c = course) => {
    setLoading(true);
    try {
      const params = {};
      if (q)                    params.q      = q;
      if (c !== 'All Programs') params.course = c;
      const { data } = await studentsApi.list(params);
      setStudents(data.data || data);
    } catch (_) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (!val) {
      setStudents(course === 'All Programs' ? allStudents : allStudents.filter((s) => s.course === course));
      return;
    }
    searchTimer.current = setTimeout(() => fetchStudents(val, course), 350);
  };

  const handleFilter = (value) => {
    setCourse(value);
    if (!query) {
      setStudents(value === 'All Programs' ? allStudents : allStudents.filter((s) => s.course === value));
    } else {
      fetchStudents(query, value);
    }
  };

  const reset = () => { setQuery(''); setCourse('All Programs'); setStudents(allStudents); };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .student-card { animation: fadeInUp 0.45s ease forwards; opacity:0; }
        .student-card:hover .card-img     { transform: scale(1.07); }
        .student-card:hover .card-overlay { opacity: 1 !important; }
        .initials-box {
          width:100%; height:100%;
          display:flex; align-items:center; justify-content:center;
          background:#1d2b4b;
          font-size:4.5rem; font-weight:900; letter-spacing:-2px;
          color:#fdb813;
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <header
        className="px-[8%] py-24 text-center text-white rounded-b-[60px] shadow-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg,rgba(29,43,75,0.95),rgba(63,81,181,0.88)), url('/images/NU-building.jpg') center/cover no-repeat",
        }}
      >
        <h1 className="text-5xl font-black tracking-tight mb-3">
          Sinag-Bughaw <span className="text-[#fdb813]">Pioneers</span>
        </h1>
        <p className="text-white/80 text-base max-w-lg mx-auto mb-10 leading-relaxed font-light">
          Connecting the innovators of National University Lipa.
          Built by Pioneers, for Pioneers.
        </p>
        <div className="max-w-2xl mx-auto relative">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-[#fdb813] text-lg" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search names, student IDs, or programs..."
            className="w-full pl-14 pr-6 py-5 rounded-2xl border border-white/20 bg-white/15 backdrop-blur text-white placeholder-white/60 text-base outline-none focus:bg-white/25 transition shadow-xl"
          />
        </div>
      </header>

      {/* ── FILTER CHIPS ── */}
      <div className="flex flex-wrap justify-center gap-3 px-[8%] pt-10 pb-2 -mt-6 relative z-10">
        {COURSE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-none cursor-pointer transition-all duration-300 shadow-md
              ${course === value
                ? 'bg-[#3f51b5] text-white scale-105 shadow-indigo-200'
                : 'bg-white text-[#1d2b4b] hover:-translate-y-1 hover:shadow-lg'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── COUNT ── */}
      {!loading && (
        <p className="text-center text-xs text-slate-400 mt-3 mb-0">
          Showing <span className="font-bold text-[#1d2b4b]">{students.length}</span> student{students.length !== 1 ? 's' : ''}
          {course !== 'All Programs' && (
            <> in <span className="font-bold text-[#3f51b5]">
              {COURSE_FILTERS.find(f => f.value === course)?.label}
            </span></>
          )}
        </p>
      )}

      {/* ── STUDENT GRID ── */}
      <main className="px-[8%] py-10 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <i className="fas fa-spinner fa-spin text-4xl mb-4" />
            <p className="text-sm">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
            <i className="fas fa-search text-8xl text-slate-100 mb-6 block" />
            <h3 className="text-2xl font-black text-[#1d2b4b] mb-2">No Students Found</h3>
            <p className="text-slate-400 mb-8">Try adjusting your search or filters.</p>
            <button
              onClick={reset}
              className="bg-[#1d2b4b] text-white font-bold px-8 py-3 rounded-xl border-none cursor-pointer inline-flex items-center gap-2 hover:bg-[#162038] transition"
            >
              <i className="fas fa-redo" /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {students.map((student, i) => {
              const batchYear = student.section?.batch_year || new Date().getFullYear();
              const hasPhoto  = !!student.profile_picture;
              // Show short course code on card
              const courseShort = COURSE_FILTERS.find(f => f.value === student.course)?.label || student.course || 'Student';

              return (
                <Link
                  key={student.id}
                  to={`/profile/${student.id}`}
                  className="student-card bg-white rounded-3xl overflow-hidden shadow-sm hover:-translate-y-3 hover:shadow-xl transition-all duration-500 no-underline block"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Photo / Initials */}
                  <div className="h-64 relative overflow-hidden bg-[#1d2b4b]">
                    {hasPhoto ? (
                      <img
                        className="card-img w-full h-full object-cover transition-transform duration-700"
                       src={`${import.meta.env.VITE_APP_URL}/storage/${student.profile_picture}`}
                        alt={student.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="initials-box">
                        {getInitials(student.name)}
                      </div>
                    )}

                    {/* Batch year badge */}
                    <div className="absolute top-3 right-3 bg-[#1d2b4b]/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 z-10 shadow">
                      <i className="fas fa-graduation-cap text-[#fdb813]" /> {batchYear}
                    </div>

                    {/* Hover overlay */}
                    <div className="card-overlay absolute inset-0 bg-[#1d2b4b]/70 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300 z-20">
                      <span className="bg-white text-[#1d2b4b] font-black text-sm px-6 py-3 rounded-xl flex items-center gap-2">
                        <i className="fas fa-eye" /> View Profile
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 text-center">
                    <h4 className="text-base font-black text-[#1d2b4b] mb-2 leading-tight capitalize">
                      {student.name}
                    </h4>
                    <span className="inline-block bg-indigo-50 text-[#3f51b5] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl">
                      {courseShort}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}