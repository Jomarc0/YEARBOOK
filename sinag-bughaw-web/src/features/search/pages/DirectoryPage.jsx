import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { studentsApi } from '@/api/student.api';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

const COURSE_FILTERS = [
  { label: 'All Programs', value: 'All Programs' },
  { label: 'BSCS',        value: 'Bachelor of Science in Computer Science'       },
  { label: 'BSIT',        value: 'Bachelor of Science in Information Technology' },
  { label: 'BSCE',        value: 'Bachelor of Science in Civil Engineering'      },
  { label: 'BSME',        value: 'Bachelor of Science in Mechanical Engineering' },
  { label: 'Nursing',     value: 'Bachelor of Science in Nursing'                },
  { label: 'Accountancy', value: 'Bachelor of Science in Accountancy'            },
  { label: 'Psychology',  value: 'Bachelor of Science in Psychology'             },
  { label: 'Education',   value: 'Bachelor of Education'                         },
];

const SHORT_MAP = Object.fromEntries(
  COURSE_FILTERS.slice(1).map(({ label, value }) => [value, label])
);

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function AutocompleteDropdown({ suggestions, onSelect, visible }) {
  if (!visible || !suggestions.length) return null;
  return (
    <div className="absolute left-0 top-full mt-2 z-50 overflow-hidden"
      style={{ right:0, background:'white', borderRadius:'18px', boxShadow:'0 24px 60px rgba(29,43,75,0.18)', border:'1px solid rgba(63,81,181,0.1)' }}>
      {suggestions.map((s, i) => (
        <button key={s.id} onMouseDown={() => onSelect(s)}
          className="w-full flex items-center gap-3 text-left border-none cursor-pointer"
          style={{ padding:'12px 20px', background:'transparent', borderBottom: i < suggestions.length-1 ? '1px solid #f1f5f9' : 'none' }}
          onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div className="flex-shrink-0 flex items-center justify-center font-black text-sm overflow-hidden"
            style={{ width:38, height:38, borderRadius:10, background:'#1d2b4b', color:'#fdb813' }}>
            {s.profile_picture
              ? <img src={imageUrl(s.profile_picture)} alt={s.name} className="w-full h-full object-cover" />
              : getInitials(s.name)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block font-bold text-sm truncate" style={{ color:'#1d2b4b' }}>{s.name}</span>
            <span className="block text-xs" style={{ color:'#94a3b8' }}>{s.student_id} · {s.course_short}</span>
          </div>
          <i className="fas fa-arrow-right text-xs flex-shrink-0" style={{ color:'#cbd5e1' }} />
        </button>
      ))}
    </div>
  );
}

function FaceMatchBanner({ matches, onClear }) {
  if (!matches.length) return null;
  return (
    <div style={{ marginTop:'10px', padding:'10px 16px', borderRadius:'12px', background:'rgba(253,184,19,0.12)', border:'1px solid rgba(253,184,19,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', backdropFilter:'blur(8px)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ display:'flex' }}>
          {matches.slice(0,3).map((m,i) => (
            <img key={m.user_id}
              src={imageUrl(m.profile_picture) || avatarUrl(m.name)}
              alt={m.name}
              style={{ width:'26px', height:'26px', borderRadius:'7px', border:'2px solid #fdb813', objectFit:'cover', marginLeft: i>0 ? '-7px' : 0 }} />
          ))}
        </div>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#fdb813' }}>
          <i className="fas fa-brain mr-1" />
          {matches.length} face match{matches.length>1?'es':''} found
          {matches[0] && <span style={{ fontWeight:400, color:'rgba(255,255,255,0.7)', marginLeft:'6px' }}>· Best: {matches[0].name} ({matches[0].similarity}%)</span>}
        </span>
      </div>
      <button onClick={onClear} style={{ background:'none', border:'1px solid rgba(253,184,19,0.4)', borderRadius:'7px', color:'#fdb813', cursor:'pointer', fontSize:'0.72rem', fontWeight:700, padding:'3px 9px', flexShrink:0 }}>
        <i className="fas fa-times mr-1" /> Clear
      </button>
    </div>
  );
}

export default function DirectoryPage() {
  const [searchParams]           = useSearchParams();
  const [students,  setStudents] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [query,     setQuery]    = useState(searchParams.get('q') || '');
  const [course,    setCourse]   = useState('All Programs');
  const [total,     setTotal]    = useState(0);
  const [page,      setPage]     = useState(1);
  const [lastPage,  setLastPage] = useState(1);

  const [suggestions,    setSuggestions]    = useState([]);
  const [showSuggest,    setShowSuggest]    = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches,   setFaceMatches]   = useState([]);
  const [matchedIds,    setMatchedIds]    = useState(new Set());

  const searchTimer  = useRef(null);
  const suggestTimer = useRef(null);

  const fetchStudents = useCallback(async (q=query, c=course, p=1) => {
    setLoading(true);
    try {
      const params = { per_page:20, page:p };
      if (q) params.q = q;
      if (c !== 'All Programs') params.course = c;
      const { data } = await studentsApi.search(params);
      setStudents(data.data ?? []);
      setTotal(data.meta?.total ?? (data.data??[]).length);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setSuggestLoading(true);
    try { const { data } = await studentsApi.suggest({ q }); setSuggestions(data.suggestions ?? []); }
    catch { setSuggestions([]); }
    finally { setSuggestLoading(false); }
  }, []);

  useEffect(() => { fetchStudents(); }, []); // eslint-disable-line

  const handleSearch = (val) => {
    setQuery(val); clearFaceResults();
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(val), 150);
    clearTimeout(searchTimer.current);
    searchTimer.current  = setTimeout(() => fetchStudents(val, course, 1), 380);
  };

  const handleSuggestSelect = (s) => {
    setQuery(s.name); setShowSuggest(false); setSuggestions([]);
    fetchStudents(s.name, course, 1);
  };

  const handleFilter = (value) => { setCourse(value); clearFaceResults(); fetchStudents(query, value, 1); };

  const reset = () => {
    setQuery(''); setCourse('All Programs'); setSuggestions([]);
    clearFaceResults(); fetchStudents('', 'All Programs', 1);
  };

  const handleFaceFile = async (file) => {
    setFaceSearching(true); clearFaceResults(); setQuery('');
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = data.matches ?? [];
      if (!matches.length) { alert('No matching student found. Ensure the photo shows a clear face.'); return; }
      setFaceMatches(matches);
      setMatchedIds(new Set(matches.map(m => m.user_id)));
      const topName = matches[0]?.name ?? '';
      if (topName) { fetchStudents(topName, 'All Programs', 1); setQuery(topName); }
    } catch { alert('Face search failed. Please try again.'); }
    finally { setFaceSearching(false); }
  };

  const clearFaceResults = () => { setFaceMatches([]); setMatchedIds(new Set()); };
  const isFaceMode = faceMatches.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(253,184,19,0.5)}70%{box-shadow:0 0 0 10px rgba(253,184,19,0)}100%{box-shadow:0 0 0 0 rgba(253,184,19,0)}}
        .student-card{animation:fadeInUp 0.42s ease forwards;opacity:0}
        .student-card:hover .card-img{transform:scale(1.07)}
        .student-card:hover .card-overlay{opacity:1!important}
        .face-matched-card{animation:pulseRing 1.5s ease 0.3s 2}
        .initials-box{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1d2b4b;font-size:4rem;font-weight:900;color:#fdb813;letter-spacing:-2px}
      `}</style>
      <Navbar />

      <header className="px-[8%] py-24 text-center text-white rounded-b-[60px] shadow-lg overflow-hidden"
        style={{ background:"linear-gradient(135deg,rgba(29,43,75,0.95),rgba(63,81,181,0.88)), url('/images/NU-building.jpg') center/cover no-repeat" }}>
        <h1 className="text-5xl font-black tracking-tight mb-3">
          Sinag-Bughaw <span className="text-[#fdb813]">Pioneers</span>
        </h1>
        <p className="text-white/80 text-base max-w-lg mx-auto mb-10 leading-relaxed font-light">
          Connecting the innovators of National University Lipa. Built by Pioneers, for Pioneers.
        </p>

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)',
            borderRadius: 16, padding: 8,
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#fdb813', fontSize: '0.9rem', zIndex: 1, pointerEvents: 'none',
              }} />
              {suggestLoading && (
                <i className="fas fa-spinner fa-spin" style={{
                  position: 'absolute', right: 52, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)', zIndex: 1, pointerEvents: 'none',
                }} />
              )}
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 160)}
                placeholder={isFaceMode ? 'Showing face match results…' : 'Search names, student IDs, or programs…'}
                style={{
                  width: '100%', height: 46, boxSizing: 'border-box',
                  padding: '0 52px 0 42px',
                  border: isFaceMode ? '1.5px solid #fdb813' : '1.5px solid transparent',
                  borderRadius: 10, outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '0.92rem',
                  transition: 'border 0.2s',
                }}
              />
              <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
              <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 50 }}>
                <AutocompleteDropdown
                  suggestions={suggestions}
                  onSelect={handleSuggestSelect}
                  visible={showSuggest}
                />
              </div>
            </div>
          </div>
          <FaceMatchBanner matches={faceMatches} onClear={() => { clearFaceResults(); reset(); }} />
        </div>
      </header>

      <div className="flex flex-wrap justify-center gap-3 px-[8%] pt-10 pb-2 -mt-6 relative z-10">
        {COURSE_FILTERS.map(({ label, value }) => (
          <button key={value} onClick={() => handleFilter(value)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-none cursor-pointer transition-all duration-300 shadow-md ${course===value?'bg-[#3f51b5] text-white scale-105':'bg-white text-[#1d2b4b] hover:-translate-y-1 hover:shadow-lg'}`}>
            {label}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-center text-xs text-slate-400 mt-4 mb-0">
          {isFaceMode ? (
            <><i className="fas fa-brain mr-1" style={{ color:'#3f51b5' }} />Showing <span className="font-bold text-[#1d2b4b]">{faceMatches.length}</span> face match{faceMatches.length!==1?'es':''}</>
          ) : query ? (
            <>Found <span className="font-bold text-[#1d2b4b]">{total}</span> result{total!==1?'s':''} for "<span className="font-bold text-[#3f51b5]">{query}</span>"</>
          ) : (
            <>Showing <span className="font-bold text-[#1d2b4b]">{total}</span> student{total!==1?'s':''}
              {course!=='All Programs' && <> in <span className="font-bold text-[#3f51b5]">{COURSE_FILTERS.find(f=>f.value===course)?.label}</span></>}
            </>
          )}
        </p>
      )}

      <main className="px-[8%] py-10 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <i className="fas fa-spinner fa-spin text-4xl mb-4" />
            <p className="text-sm font-medium">{faceSearching?'Scanning faces…':'Searching…'}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
            <i className="fas fa-user-slash text-8xl text-slate-100 mb-6 block" />
            <h3 className="text-2xl font-black text-[#1d2b4b] mb-2">No Students Found</h3>
            <p className="text-slate-400 mb-8 text-sm">{isFaceMode?'No student profiles matched the uploaded face.':'Try adjusting your search or filters.'}</p>
            <button onClick={reset} className="bg-[#1d2b4b] text-white font-bold px-8 py-3 rounded-xl border-none cursor-pointer inline-flex items-center gap-2 hover:bg-[#162038] transition">
              <i className="fas fa-redo" /> Reset
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
              {students.map((student, i) => {
                const batchYear   = student.batch_year || new Date().getFullYear();
                const hasPhoto    = !!student.profile_picture;
                const courseShort = SHORT_MAP[student.course] || student.course_short || 'Student';
                const isMatched   = matchedIds.has(student.id);
                const matchData   = faceMatches.find(m => m.user_id === student.id);
                return (
                  <Link key={student.id} to={`/profile/${student.id}`}
                    className={`student-card ${isMatched?'face-matched-card':''} bg-white rounded-3xl overflow-hidden shadow-sm hover:-translate-y-3 hover:shadow-xl transition-all duration-500 no-underline block`}
                    style={{ animationDelay:`${i*0.04}s`, border:isMatched?'2px solid #fdb813':'2px solid transparent', boxShadow:isMatched?'0 8px 30px rgba(253,184,19,0.2)':undefined }}>
                    <div className="h-64 relative overflow-hidden bg-[#1d2b4b]">
                      {hasPhoto
                        ? <img className="card-img w-full h-full object-cover transition-transform duration-700"
                            src={imageUrl(student.profile_picture)}
                            alt={student.name}
                            onError={e=>{e.target.style.display='none';}} />
                        : <div className="initials-box">{getInitials(student.name)}</div>}
                      <div className="absolute top-3 right-3 bg-[#1d2b4b]/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 z-10 shadow">
                        <i className="fas fa-graduation-cap text-[#fdb813]" /> {batchYear}
                      </div>
                      {isMatched && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 font-black text-[10px] px-3 py-1.5 rounded-xl"
                          style={{ background: '#fdb813', color: '#1d2b4b' }}>
                          <i className="fas fa-brain" />
                          {matchData?.similarity?.toFixed(0) ?? '—'}% match
                        </div>
                      )}
                      <div className="card-overlay absolute inset-0 bg-[#1d2b4b]/70 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300 z-20">
                        <span className="bg-white text-[#1d2b4b] font-black text-sm px-6 py-3 rounded-xl flex items-center gap-2"><i className="fas fa-eye" /> View Profile</span>
                      </div>
                    </div>
                    <div className="p-5 text-center">
                      <h4 className="text-base font-black text-[#1d2b4b] mb-2 leading-tight capitalize">{student.name}</h4>
                      <span className="inline-block bg-indigo-50 text-[#3f51b5] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl">{courseShort}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            {lastPage > 1 && (
              <div className="flex justify-center gap-3 mt-12">
                <button onClick={() => fetchStudents(query, course, page-1)} disabled={page<=1||loading} className="px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer transition disabled:opacity-30" style={{ background:'#1d2b4b', color:'white' }}>
                  <i className="fas fa-chevron-left mr-1" /> Prev
                </button>
                <span className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-[#1d2b4b] shadow-sm">{page} / {lastPage}</span>
                <button onClick={() => fetchStudents(query, course, page+1)} disabled={page>=lastPage||loading} className="px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer transition disabled:opacity-30" style={{ background:'#1d2b4b', color:'white' }}>
                  Next <i className="fas fa-chevron-right ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}