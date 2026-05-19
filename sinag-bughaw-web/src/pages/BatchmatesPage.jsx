import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

export default function BatchmatesPage() {
  const { user }                    = useAuth();
  const [batchmates, setBatchmates] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    analyticsApi.batchmates()
      .then(({ data }) => setBatchmates(data))
      .finally(()      => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .batch-card { animation: fadeInUp 0.45s ease forwards; opacity: 0; }
        .batch-card:hover { transform: translateY(-10px) !important; box-shadow: 0 25px 50px rgba(29,43,75,0.12) !important; }
      `}</style>

      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">National University Lipa</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Your <span style={{ color: '#fdb813' }}>Batchmates</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Connect with your fellow Pioneers from Batch {user?.graduation_year ?? new Date().getFullYear()}.
        </p>
      </header>

      {/* Count pill */}
      {!loading && (
        <div className="flex justify-center" style={{ marginTop: '-24px', zIndex: 10, position: 'relative' }}>
          <div className="font-bold text-sm flex items-center gap-2"
            style={{ background: 'white', padding: '12px 28px', borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', color: '#475569' }}>
            <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} />
            {batchmates.length} batchmate{batchmates.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* Grid */}
      <main style={{ padding: '50px 8% 80px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#3f51b5' }} />
            <p className="text-sm">Loading batchmates...</p>
          </div>
        ) : batchmates.length === 0 ? (
          <div className="text-center bg-white py-24 px-8"
            style={{ borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-users-slash text-6xl mb-5 block opacity-10" style={{ color: '#1d2b4b' }} />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: '#1d2b4b' }}>No Batchmates Found</h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Make sure your graduation year is set in your profile settings.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '28px' }}>
            {batchmates.map((student, i) => {
              const hasPhoto = !!student.profile_picture;
              return (
                <Link key={student.id} to={`/profile/${student.id}`}
                  className="batch-card bg-white no-underline block overflow-hidden transition-all"
                  style={{ borderRadius: '25px', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', animationDelay: `${i * 0.05}s` }}>

                  {/* Photo */}
                  <div className="overflow-hidden" style={{ height: '220px', background: '#1d2b4b' }}>
                    {hasPhoto ? (
                      <img src={`http://127.0.0.1:8000/storage/${student.profile_picture}`}
                        alt={student.name} className="w-full h-full object-cover transition-all duration-700"
                        style={{ filter: 'brightness(0.9)' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.07)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fdb813', letterSpacing: '-2px' }}>
                        {getInitials(student.name)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center" style={{ padding: '24px 20px' }}>
                    <h4 className="font-extrabold capitalize mb-2" style={{ fontSize: '1.1rem', color: '#1d2b4b', lineHeight: 1.2 }}>
                      {student.name}
                    </h4>
                    <span className="inline-block font-extrabold text-xs uppercase tracking-wider mb-3"
                      style={{ background: 'rgba(63,81,181,0.06)', color: '#3f51b5', padding: '5px 14px', borderRadius: '10px' }}>
                      {student.course?.split(' ').filter(w => w[0] === w[0]?.toUpperCase() && w.length > 2).slice(0, 2).join(' ') || 'Student'}
                    </span>
                    {student.student_id && (
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{student.student_id}</p>
                    )}
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