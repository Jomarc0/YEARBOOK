import { useEffect, useState } from 'react';
import { facultyApi } from '@/api/yearbook.api';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function FacultyPage() {
  const [faculty,       setFaculty]       = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [query,         setQuery]         = useState('');
  const [loading,       setLoading]       = useState(true);
  const [faceSearching, setFaceSearching] = useState(false);
  const [matchedIds,    setMatchedIds]    = useState(new Set());

  useEffect(() => {
    facultyApi.list()
      .then(({ data }) => { setFaculty(data.data ?? []); setFiltered(data.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const onSearch = (val) => {
    setQuery(val);
    setMatchedIds(new Set());
    setFiltered(faculty.filter(f =>
      f.name.toLowerCase().includes(val.toLowerCase()) ||
      f.department?.toLowerCase().includes(val.toLowerCase())
    ));
  };

  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setMatchedIds(new Set());
    setQuery('');
    setFiltered(faculty);
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches  = data.matches ?? [];
      if (!matches.length) { alert('No matching faculty found.'); return; }
      const ids     = new Set(matches.map(m => m.user_id));
      const matched = faculty.filter(f => ids.has(f.id));
      setMatchedIds(ids);
      setFiltered(matched.length ? matched : faculty);
      if (!matched.length) alert('Face matched but no faculty profile found.');
    } catch {
      alert('Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const clearFaceSearch = () => {
    setMatchedIds(new Set());
    setFiltered(faculty);
    setQuery('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7fe', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      {/* Hero — search bar lives inside */}
      <header style={{
        background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)',
        padding: '90px 8% 60px', textAlign: 'center', color: '#fff',
        borderRadius: '0 0 70px 70px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: '10rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)', userSelect: 'none', pointerEvents: 'none' }}>
          FACULTY
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
          National University Lipa
        </p>
        <h1 style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 14px', lineHeight: 1.1 }}>
          Meet Our <span style={{ color: '#fdb813' }}>Mentors</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7, fontWeight: 300 }}>
          The dedicated educators who shaped the Nationalian journey.
        </p>

        {/* Search bar inside hero */}
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#fdb813', fontSize: 15, zIndex: 1, pointerEvents: 'none' }} />
            <input
              type="text"
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search faculty by name or department..."
              style={{
                width: '100%', height: 52, boxSizing: 'border-box',
                padding: '0 56px 0 50px',
                border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: 14, outline: 'none',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                fontSize: 14, fontWeight: 500,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'rgba(253,184,19,0.6)'; }}
              onBlur={e  => { e.target.style.background = 'rgba(255,255,255,0.1)';  e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            />
            <FaceSearchButton onFile={handleFaceFile} loading={faceSearching} />
          </div>

          {/* Match banner */}
          {matchedIds.size > 0 && (
            <div style={{
              marginTop: 10, padding: '10px 16px', borderRadius: 12,
              background: '#ecfdf5', border: '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                <i className="fas fa-circle-check" style={{ marginRight: 8 }} />
                {matchedIds.size} faculty member{matchedIds.size > 1 ? 's' : ''} matched by face
              </span>
              <button onClick={clearFaceSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                <i className="fas fa-times" style={{ marginRight: 4 }} /> Clear
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Faculty Grid */}
      <section style={{ padding: '48px 8% 100px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: '#94a3b8' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24 }}>
            <i className="fas fa-user-slash" style={{ fontSize: 48, color: '#e2e8f0', display: 'block', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d2b4b', margin: '0 0 8px' }}>No Faculty Found</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Try a different search term.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
            {filtered.map((f, i) => {
              const isMatched = matchedIds.has(f.id);
              return (
                <div key={f.id} style={{
                  background: '#fff', borderRadius: 32, padding: '40px 28px',
                  textAlign: 'center', position: 'relative', overflow: 'hidden',
                  border: isMatched ? '2px solid #fdb813' : '1px solid #f1f5f9',
                  boxShadow: isMatched ? '0 16px 48px rgba(253,184,19,0.18)' : '0 2px 12px rgba(29,43,75,0.06)',
                  transition: '0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
                  animationDelay: `${i * 0.08}s`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.boxShadow = isMatched ? '0 24px 56px rgba(253,184,19,0.22)' : '0 24px 48px rgba(29,43,75,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isMatched ? '0 16px 48px rgba(253,184,19,0.18)' : '0 2px 12px rgba(29,43,75,0.06)'; }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: '#f8fafc', zIndex: 0 }} />

                  {isMatched && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14, zIndex: 2,
                      background: '#fdb813', color: '#1d2b4b',
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <i className="fas fa-check" /> Face Match
                    </div>
                  )}

                  <div style={{ position: 'relative', zIndex: 1, width: 120, height: 120, margin: '0 auto 20px', borderRadius: 36, overflow: 'hidden', border: isMatched ? '5px solid #fdb813' : '5px solid #fff', boxShadow: '0 8px 24px rgba(29,43,75,0.12)' }}>
                    <img
                      src={f.image
                        ? `/storage/${f.image}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1d2b4b&color=fdb813&bold=true&size=200`}
                      alt={f.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fdb813', marginBottom: 6 }}>
                      {f.title ?? 'Faculty'}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1d2b4b', margin: '0 0 6px' }}>{f.name}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>{f.department}</p>
                    {f.bio && (
                      <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.6 }}>"{f.bio}"</p>
                    )}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f4f7fe', color: '#1d2b4b',
                      fontSize: 12, fontWeight: 700, padding: '10px 24px', borderRadius: 12,
                    }}>
                      <i className="fas fa-user" style={{ color: '#fdb813', fontSize: 10 }} /> View Profile
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}