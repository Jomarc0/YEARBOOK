import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function GalleryPage() {
  const [albums,    setAlbums]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [matches,   setMatches]   = useState([]);
  const [faceEnabled] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    galleryApi.list().then(({ data }) => setAlbums(data.data ?? [])).finally(() => setLoading(false));
  }, []);

  const handleFaceSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSearching(true); setMatches([]);
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await galleryApi.faceSearch(formData);
      setMatches(data.matches ?? []);
    } catch { alert('Face search failed.'); }
    finally { setSearching(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#f8fafc', color:'var(--nu-blue)' }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center animate-up"
        style={{ background:'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding:'80px 8% 120px', borderRadius:'0 0 60px 60px' }}>
        <p className="text-sm mb-2" style={{ opacity:0.7 }}>National University Lipa</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize:'3rem' }}>
          The <span style={{ color:'var(--nu-yellow)' }}>Visual Archive</span>
        </h1>
        <p className="font-light mx-auto" style={{ opacity:0.8, fontSize:'1rem', maxWidth:'600px' }}>
          Relive the milestones and pioneer memories through our AI-powered digital gallery.
        </p>
      </header>

      {/* Face Search Panel */}
      <div className="mx-auto px-5 animate-up" style={{ maxWidth:'1000px', width:'100%', marginTop:'-35px', animationDelay:'0.25s' }}>
        <div className="bg-white" style={{ borderRadius:'24px', boxShadow:'0 18px 36px rgba(29,43,75,0.08)', padding:'24px' }}>
          <div className="inline-flex items-center gap-2 font-bold text-xs mb-3 px-3 py-2 rounded-full"
            style={{ background: faceEnabled ? '#ecfdf3' : '#fff7ed', color: faceEnabled ? '#15803d' : '#c2410c' }}>
            <i className={`fas ${faceEnabled ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
            {faceEnabled ? 'Facial search is ready' : 'Facial search needs setup'}
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color:'var(--nu-blue)' }}>Identify a Student by Face</h3>
          <p className="text-sm mb-5" style={{ color:'#64748b', lineHeight:1.6 }}>
            Upload a clear portrait or cropped face image and Sinag-Bughaw will compare it against indexed student profile photos.
          </p>
          <div className="flex gap-3 flex-wrap items-center">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFaceSearch} />
            <input className="flex-1 text-sm outline-none" style={{ minWidth:'260px', padding:'14px 16px', border:'1px solid #dbe3f0', borderRadius:'14px', background:'#f8fafc' }}
              placeholder="Click button to select face image..." readOnly onClick={() => fileRef.current.click()} />
            <button onClick={() => fileRef.current.click()} disabled={searching}
              className="text-white font-bold border-none cursor-pointer"
              style={{ background:'var(--nu-blue)', borderRadius:'14px', padding:'14px 18px', opacity: searching ? 0.7 : 1 }}>
              {searching ? <><i className="fas fa-spinner fa-spin mr-2" />Searching...</> : <><i className="fas fa-user-check mr-2" />Search Face</>}
            </button>
          </div>

          {matches.length > 0 && (
            <div className="mt-5 grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {matches.map(m => (
                <Link key={m.user_id} to={`/profile/${m.user_id}`}
                  className="no-underline transition-all"
                  style={{ border:'1px solid #e2e8f0', borderRadius:'18px', padding:'16px', background:'#f8fafc' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--nu-blue-bright)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';}}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1d2b4b&color=fff`}
                    className="rounded-[16px] object-cover border-2 mb-3" style={{ width:'56px',height:'56px',borderColor:'var(--nu-yellow)' }} />
                  <h4 className="font-bold text-base mb-1" style={{ color:'var(--nu-blue)' }}>{m.name}</h4>
                  <p className="text-sm" style={{ color:'#64748b' }}>{m.similarity}% match</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Albums */}
      <section style={{ padding:'40px 8% 100px' }}>
        <h2 className="font-extrabold text-xl mb-8" style={{ color:'var(--nu-blue)' }}>Photo Albums</h2>
        {loading ? (
          <p className="text-center py-20" style={{ color:'#94a3b8' }}>Loading...</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'30px' }}>
            {albums.map(album => (
              <Link key={album.id} to={`/gallery/${album.id}`} className="no-underline block"
                style={{ background:'white', borderRadius:'30px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.02)', transition:'0.4s cubic-bezier(0.175,0.885,0.32,1.275)', color:'inherit' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-12px)';e.currentTarget.style.boxShadow='0 25px 50px rgba(29,43,75,0.12)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>

                <div className="relative overflow-hidden" style={{ height:'260px', background:'#f1f5f9' }}>
                  {/* AI Scanner animation */}
                  <div className="absolute left-0 w-full z-10" style={{ height:'3px', background:'var(--nu-yellow)', boxShadow:'0 0 15px var(--nu-yellow)', animation:'scan 2.5s infinite linear', top:0, opacity: 0 }}
                    onMouseEnter={e => e.target.style.opacity=1} />
                  <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background:'linear-gradient(135deg, #e8edf5, #dbe3f0)' }}>
                    📷
                  </div>
                  <div className="absolute top-5 right-5 flex items-center gap-1 font-extrabold text-xs z-10"
                    style={{ background:'rgba(255,255,255,0.95)', padding:'6px 14px', borderRadius:'12px', color:'var(--nu-blue)' }}>
                    <i className="fas fa-images" /> {album.photos_count ?? 0} photos
                  </div>
                </div>

                <div style={{ padding:'25px' }}>
                  <h4 className="font-extrabold mb-2" style={{ fontSize:'1.2rem', color:'var(--nu-blue)' }}>{album.title}</h4>
                  <p className="flex items-center gap-2 text-sm font-medium" style={{ color:'#94a3b8' }}>
                    <i className="fas fa-calendar" /> {album.event_date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}