import { useEffect, useState } from 'react';
import { facultyApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function FacultyPage() {
  const [faculty,  setFaculty]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    facultyApi.list().then(({ data }) => {
      setFaculty(data.data ?? []);
      setFiltered(data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const onSearch = (val) => {
    setQuery(val);
    setFiltered(faculty.filter(f => f.name.toLowerCase().includes(val.toLowerCase()) || f.department?.toLowerCase().includes(val.toLowerCase())));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#f8fafc', color:'var(--nu-blue)' }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center relative overflow-hidden"
        style={{ background:'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding:'100px 8% 150px', borderRadius:'0 0 80px 80px' }}>
        <div className="absolute pointer-events-none select-none" style={{ right:'-20px',bottom:'-20px',fontSize:'12rem',fontWeight:900,color:'rgba(255,255,255,0.03)' }}>FACULTY</div>
        <h1 className="font-extrabold mb-4" style={{ fontSize:'3.5rem', lineHeight:1.1 }}>
          Meet Our <span style={{ color:'var(--nu-yellow)' }}>Mentors</span>
        </h1>
        <p className="font-light mx-auto" style={{ opacity:0.8, fontSize:'1.1rem', maxWidth:'600px' }}>
          The dedicated educators who shaped the Nationalian journey.
        </p>
      </header>

      {/* Search */}
      <div className="relative mx-auto px-5 z-10" style={{ maxWidth:'800px', marginTop:'-40px', width:'100%' }}>
        <div className="relative">
          <i className="fas fa-search absolute" style={{ left:'30px',top:'50%',transform:'translateY(-50%)',color:'var(--nu-yellow)',fontSize:'1.4rem' }} />
          <input type="text" value={query} onChange={e => onSearch(e.target.value)}
            placeholder="Search faculty by name or department..."
            className="w-full outline-none font-semibold transition-all"
            style={{ padding:'25px 35px 25px 70px', borderRadius:'25px', border:'none', background:'white', fontSize:'1.1rem', boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}
            onFocus={e=>{e.target.style.transform='translateY(-5px)';e.target.style.boxShadow='0 25px 50px rgba(0,0,0,0.15)';}}
            onBlur={e=>{e.target.style.transform='none';e.target.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';}} />
        </div>
      </div>

      {/* Faculty Grid */}
      <section style={{ padding:'80px 8% 120px' }}>
        {loading ? (
          <p className="text-center py-20" style={{ color:'#94a3b8' }}>Loading...</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'35px' }}>
            {filtered.map((f, i) => (
              <div key={f.id} className="bg-white text-center relative overflow-hidden animate-up"
                style={{ borderRadius:'40px', padding:'45px 30px', border:'1px solid rgba(0,0,0,0.02)', transition:'0.4s cubic-bezier(0.175,0.885,0.32,1.275)', animationDelay:`${i*0.1}s` }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-15px)';e.currentTarget.style.borderColor='var(--nu-yellow)';e.currentTarget.style.boxShadow='0 30px 60px rgba(29,43,75,0.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='rgba(0,0,0,0.02)';e.currentTarget.style.boxShadow='none';}}>

                {/* Card top bg */}
                <div className="absolute top-0 left-0 w-full" style={{ height:'120px', background:'#f8fafc', zIndex:0 }} />

                <div className="relative mx-auto mb-6 z-10" style={{ width:'140px', height:'140px' }}>
                  <img src={f.image ? `/storage/${f.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fff&size=200`}
                    alt={f.name} className="w-full h-full object-cover"
                    style={{ borderRadius:'45px', border:'6px solid white', boxShadow:'0 10px 25px rgba(0,0,0,0.1)' }} />
                </div>

                <div className="relative z-10">
                  <span className="block font-extrabold uppercase tracking-widest mb-2 text-xs" style={{ color:'var(--nu-yellow)' }}>
                    {f.title ?? 'Faculty'}
                  </span>
                  <h3 className="font-extrabold mb-2" style={{ fontSize:'1.4rem', color:'var(--nu-blue)' }}>{f.name}</h3>
                  <p className="mb-8 text-sm" style={{ color:'#64748b' }}>{f.department}</p>
                  {f.bio && <p className="text-xs italic mb-6" style={{ color:'#94a3b8' }}>"{f.bio}"</p>}
                  <span className="inline-block font-extrabold text-sm no-underline transition-all"
                    style={{ color:'var(--nu-blue)', background:'#f1f5f9', padding:'12px 30px', borderRadius:'15px' }}>
                    View Profile
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}