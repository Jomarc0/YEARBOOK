import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { searchApi } from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [showDrop,setShowDrop]= useState(false);
  const searchRef = useRef();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const onSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) { setShowDrop(false); return; }
    const { data } = await searchApi.search(val);
    setResults(data.results);
    setShowDrop(true);
  };

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatar = user?.profile_picture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=1d2b4b&color=fff`;

  const cards = [
    { to:'/directory', icon:'fas fa-users',            label:'Students',   desc:'Browse directory.',   cls:'bg-[#eef2ff] text-[#3f51b5]' },
    { to:'/faculty',   icon:'fas fa-chalkboard-teacher',label:'Faculty',    desc:'Our educators.',      cls:'bg-[#f5f3ff] text-[#8b5cf6]' },
    { to:'/gallery',   icon:'fas fa-images',            label:'Gallery',    desc:'School memories.',    cls:'bg-[#f0fdf4] text-[#22c55e]' },
    { to:'/sections',  icon:'fas fa-layer-group',       label:'Sections',   desc:'Batch groupings.',    cls:'bg-[#fff7ed] text-[#f97316]' },
    { to:'/messages',  icon:'fas fa-comment-dots',      label:'Messages',   desc:'Chat classmates.',    cls:'bg-[#fef3c7] text-[#d97706]' },
    { to:'/flipbook',  icon:'fas fa-book-open',         label:'Flipbook',   desc:'Digital yearbook.',   cls:'bg-[#fce7f3] text-[#db2777]' },
    { to:'/voice-notes',icon:'fas fa-microphone',       label:'Voice Notes',desc:'Audio memories.',     cls:'bg-[#ecfdf5] text-[#059669]' },
    { to:'/settings',  icon:'fas fa-cog',               label:'Settings',   desc:'Manage profile.',     cls:'bg-[#f1f5f9] text-[#475569]' },
  ];

  return (
    <div className="min-h-screen" style={{ background:'var(--bg-gray, #f4f7fe)', color:'var(--nu-blue)' }}>

      {/* Security Watermark */}
      <div className="fixed pointer-events-none select-none"
        style={{ top:'50%',left:'50%',transform:'translate(-50%,-50%) rotate(-30deg)',fontSize:'4rem',fontWeight:900,color:'rgba(0,0,0,0.03)',zIndex:9999,whiteSpace:'nowrap' }}>
        {user?.name}
      </div>

      {/* Top Nav */}
      <nav className="flex justify-between items-center bg-white sticky top-0 z-[100] animate-up"
        style={{ padding:'20px 8%', boxShadow:'0 4px 30px rgba(0,0,0,0.03)' }}>
        <div className="font-extrabold text-[1.4rem] tracking-tight uppercase" style={{ color:'var(--nu-blue)', letterSpacing:'-1px' }}>
          NU LIPA <span style={{ color:'var(--nu-blue-bright)' }}>SINAG-BUGHAW</span>
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={handleLogout}
            className="bg-transparent border-none font-bold cursor-pointer flex items-center gap-2"
            style={{ color:'#ef4444' }}>
            <i className="fas fa-power-off" /> Logout
          </button>
          <Link to={`/profile/${user?.id}`} className="flex items-center gap-4 no-underline" style={{ color:'inherit' }}>
            <div className="text-right">
              <b className="block text-sm">{user?.name?.split(' ')[0]}</b>
              <small className="text-xs" style={{ color:'#94a3b8' }}>Pioneer Student</small>
            </div>
            <img src={avatar} alt={user?.name}
              className="w-[45px] h-[45px] object-cover border-2"
              style={{ borderRadius:'14px', borderColor:'var(--nu-yellow)' }} />
          </Link>
        </div>
      </nav>

      <main style={{ padding:'40px 8%', maxWidth:'1600px', margin:'0 auto' }}>

        {/* Welcome */}
        <section className="animate-up delay-1 mb-2">
          <p className="text-sm" style={{ color:'#6c757d' }}>Mabuhay, NU Lipa Pioneer!</p>
          <h1 className="font-extrabold" style={{ fontSize:'2.8rem', letterSpacing:'-1.5px' }}>
            Welcome Back, <span style={{ color:'var(--nu-blue-bright)' }}>{user?.name?.split(' ')[0]}</span>!
          </h1>
        </section>

        {/* Search */}
        <div className="relative mb-12 animate-up delay-2" style={{ maxWidth:'700px', zIndex:1000 }} ref={searchRef}>
          <i className="fas fa-search absolute" style={{ left:'25px',top:'50%',transform:'translateY(-50%)',color:'var(--nu-blue-bright)',fontSize:'1rem',zIndex:1 }} />
          <input type="text" value={query} onChange={e => onSearch(e.target.value)}
            placeholder="Search batchmates, faculty, or memories..."
            className="w-full outline-none"
            style={{ padding:'20px 30px 20px 65px',borderRadius:'20px',border:'2px solid transparent',background:'white',boxShadow:'0 10px 40px rgba(0,0,0,0.05)',fontSize:'1rem',transition:'0.3s' }}
            onFocus={e => e.target.style.borderColor='var(--nu-blue-bright)'}
            onBlur={e => e.target.style.borderColor='transparent'} />

          {/* Dropdown */}
          {showDrop && (
            <div className="absolute w-full bg-white overflow-hidden mt-2"
              style={{ borderRadius:'20px',boxShadow:'0 15px 50px rgba(0,0,0,0.1)',border:'1px solid rgba(0,0,0,0.05)' }}>
              {results?.faculty?.length > 0 && (
                <>
                  <div className="px-6 py-2 text-xs font-extrabold" style={{ background:'#f8fafc',color:'var(--nu-blue-bright)' }}>MENTORS</div>
                  {results.faculty.map(f => (
                    <Link key={f.id} to={`/faculty`}
                      className="flex items-center gap-4 no-underline border-b transition-all"
                      style={{ padding:'15px 25px',color:'inherit',borderColor:'#f1f5f9' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='white'}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fff`}
                        className="w-10 h-10 rounded-[10px] object-cover" />
                      <div><b className="block text-sm">{f.name}</b><small style={{color:'#888'}}>{f.title ?? 'Faculty'}</small></div>
                    </Link>
                  ))}
                </>
              )}
              {results?.students?.length > 0 && (
                <>
                  <div className="px-6 py-2 text-xs font-extrabold" style={{ background:'#f8fafc',color:'var(--nu-yellow)' }}>STUDENTS</div>
                  {results.students.map(s => (
                    <Link key={s.id} to={`/profile/${s.id}`}
                      className="flex items-center gap-4 no-underline border-b transition-all"
                      style={{ padding:'15px 25px',color:'inherit',borderColor:'#f1f5f9' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='white'}>
                      <img src={s.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3f51b5&color=fff`}
                        className="w-10 h-10 rounded-[10px] object-cover" />
                      <div><b className="block text-sm">{s.name}</b><small style={{color:'#888'}}>Pioneer Student</small></div>
                    </Link>
                  ))}
                </>
              )}
              {(!results?.students?.length && !results?.faculty?.length) && (
                <div className="p-5 text-center text-sm" style={{ color:'#888' }}>No results found.</div>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid gap-10" style={{ gridTemplateColumns:'1.2fr 0.8fr' }}>
          <div>
            <h3 className="font-bold mb-5 text-lg">Quick Access</h3>
            <div className="grid grid-cols-2 gap-5">
              {cards.map((c,i) => (
                <Link key={c.to} to={c.to}
                  className={`animate-scale bg-white rounded-[25px] no-underline p-[30px] transition-all delay-${i+1}`}
                  style={{ boxShadow:'0 10px 30px rgba(0,0,0,0.03)',color:'inherit',textDecoration:'none' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-10px)';e.currentTarget.style.boxShadow='0 20px 40px rgba(63,81,181,0.1)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,0.03)';}}>
                  <div className={`w-[50px] h-[50px] rounded-[15px] flex items-center justify-center mb-4 ${c.cls}`}>
                    <i className={c.icon} />
                  </div>
                  <h4 className="font-bold mb-1">{c.label}</h4>
                  <p className="text-sm" style={{ color:'#94a3b8' }}>{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Card */}
          <div>
            <div className="animate-scale rounded-[40px] p-10 text-white flex flex-col justify-between"
              style={{ background:'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)', minHeight:'400px' }}>
              <div>
                <div className="inline-block text-xs px-4 py-1 rounded-full mb-5"
                  style={{ background:'rgba(255,255,255,0.1)' }}>PIONEER BATCH</div>
                <h2 className="font-extrabold text-[2rem] mb-2">{user?.name}</h2>
                <p className="text-sm opacity-90">ID: {user?.student_id ?? 'N/A'}</p>
                <p className="text-sm opacity-70 mt-1">{user?.course ?? 'Student'}</p>
              </div>
              <Link to={`/profile/${user?.id}`}
                className="block text-center font-extrabold rounded-[15px] no-underline mt-5"
                style={{ background:'var(--nu-yellow)',color:'var(--nu-blue)',padding:'15px' }}>
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}