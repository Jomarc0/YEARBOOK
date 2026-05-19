import { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { yearbookApi } from '../services/api';
import Navbar from '../components/Navbar';
import React from 'react';

const CoverPage = React.forwardRef((_, ref) => (
  <div ref={ref} style={{ height: '100%', background: 'linear-gradient(160deg, #1d2b4b 0%, #3f51b5 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px 30px', textAlign: 'center', boxSizing: 'border-box' }}>
    <div style={{ width: '70px', height: '70px', background: 'rgba(253,184,19,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '2px solid rgba(253,184,19,0.3)' }}>
      <i className="fas fa-book-open" style={{ color: '#fdb813', fontSize: '2rem' }} />
    </div>
    <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>NATIONAL UNIVERSITY LIPA</p>
    <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '10px' }}>
      Sinag-Bughaw
    </h1>
    <p style={{ color: '#fdb813', fontWeight: 700, marginBottom: '6px' }}>Digital Yearbook</p>
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>A.Y. 2025–2026</p>
    <div style={{ marginTop: '40px', width: '60px', height: '3px', background: '#fdb813', borderRadius: '2px' }} />
  </div>
));
CoverPage.displayName = 'CoverPage';

const StudentPage = React.forwardRef(({ student, pageNum }, ref) => (
  <div ref={ref} style={{ height: '100%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 24px', boxSizing: 'border-box', borderLeft: '1px solid #f1f5f9', position: 'relative' }}>
    {/* Page number */}
    <p style={{ position: 'absolute', top: '14px', fontSize: '0.6rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '2px' }}>— {pageNum} —</p>

    {/* Decorative top bar */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #1d2b4b, #3f51b5)' }} />

    {student ? (
      <>
        <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '5px solid white', boxShadow: '0 8px 20px rgba(29,43,75,0.12)', marginBottom: '16px', background: '#f1f5f9' }}>
          <img
            src={student.profile_picture
              ? `http://127.0.0.1:8000/storage/${student.profile_picture}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fff&size=200`}
            alt={student.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h3 style={{ fontWeight: 900, color: '#1d2b4b', textAlign: 'center', fontSize: '1rem', marginBottom: '6px', letterSpacing: '-0.3px', lineHeight: 1.2, textTransform: 'capitalize' }}>
          {student.name}
        </h3>

        <span style={{ background: '#eef2ff', color: '#3f51b5', fontSize: '0.6rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          {student.course ?? 'Student'}
        </span>

        <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '12px' }}>
          <i className="fas fa-id-card" style={{ color: '#fdb813', marginRight: '4px' }} />
          {student.student_id ?? 'N/A'}
        </p>

        {student.bio && (
          <p style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5, maxWidth: '220px' }}>
            "{student.bio}"
          </p>
        )}
      </>
    ) : (
      <p style={{ color: '#e2e8f0', fontSize: '2rem' }}>—</p>
    )}

    {/* NU badge bottom */}
    <p style={{ position: 'absolute', bottom: '12px', fontSize: '0.55rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '2px' }}>NU LIPA</p>
  </div>
));
StudentPage.displayName = 'StudentPage';

const BackCoverPage = React.forwardRef((_, ref) => (
  <div ref={ref} style={{ height: '100%', background: '#0e1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px 30px', textAlign: 'center', boxSizing: 'border-box' }}>
    <i className="fas fa-graduation-cap" style={{ color: '#fdb813', fontSize: '3rem', marginBottom: '20px' }} />
    <h3 style={{ fontWeight: 900, marginBottom: '10px' }}>End of Yearbook</h3>
    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>© 2026 National University Lipa</p>
    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', marginTop: '6px' }}>Sinag-Bughaw Project</p>
  </div>
));
BackCoverPage.displayName = 'BackCoverPage';

export default function FlipbookPage() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const flipBook = useRef();

  useEffect(() => {
    yearbookApi.flipbookData()
      .then(({ data }) => setStudents(data))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = students.length + 2; // cover + students + back cover

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0e1628' }}>
      <div className="w-12 h-12 rounded-full border-4 mb-4"
        style={{ borderColor: 'rgba(253,184,19,0.2)', borderTopColor: '#fdb813', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading yearbook...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e1628' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {!fullscreen && <Navbar />}

      <main className="flex-1 flex flex-col items-center justify-center py-10 gap-8" style={{ animation: 'fadeIn 0.4s ease' }}>

        {/* Title */}
        {!fullscreen && (
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#fdb813', opacity: 0.8 }}>
              Digital Yearbook A.Y. 2025–2026
            </p>
            <h1 className="font-extrabold" style={{ color: 'white', fontSize: '2rem', letterSpacing: '-1px' }}>
              Sinag-Bughaw Flipbook
            </h1>
          </div>
        )}

        {/* Flipbook */}
        <div style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.6))' }}>
          <HTMLFlipBook
            ref={flipBook}
            width={320}
            height={460}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={e => setPage(e.data)}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          >
            <CoverPage />
            {students.map((student, i) => (
              <StudentPage key={student.id} student={student} pageNum={i + 2} />
            ))}
            <BackCoverPage />
          </HTMLFlipBook>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => flipBook.current?.pageFlip().flipPrev()}
            className="flex items-center gap-2 font-bold border-none cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 22px', borderRadius: '12px', fontSize: '0.85rem' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <i className="fas fa-chevron-left" /> Prev
          </button>

          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600, minWidth: '90px', textAlign: 'center' }}>
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => flipBook.current?.pageFlip().flipNext()}
            className="flex items-center gap-2 font-bold border-none cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 22px', borderRadius: '12px', fontSize: '0.85rem' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            Next <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '320px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
          <div style={{ height: '100%', background: '#fdb813', borderRadius: '2px', width: `${((page + 1) / totalPages) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Footer note */}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
          {students.length} students in this yearbook
        </p>
      </main>
    </div>
  );
}