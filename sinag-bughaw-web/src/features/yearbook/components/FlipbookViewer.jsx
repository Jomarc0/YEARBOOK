import { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';



const PAGE_W = 310;
const PAGE_H = 420;
const STUDENTS_PER_SPREAD = 4; // 4 students shown per left page

// Deterministic avatar colours from student_id so they don't shift on re-render
const AVATAR_PALETTE = [
  { bg: '#e8f4d9', tc: '#2d5a1b' },
  { bg: '#dce8f5', tc: '#1a3a5c' },
  { bg: '#f5e6d9', tc: '#5c2d0e' },
  { bg: '#e8d9f5', tc: '#3a1a5c' },
  { bg: '#d9f0f0', tc: '#0e3d3d' },
  { bg: '#f5f0d9', tc: '#4a3a0e' },
  { bg: '#f0d9e8', tc: '#4a1a3a' },
  { bg: '#d9ead9', tc: '#1a4a1a' },
];

function avatarColor(studentId) {
  const n = parseInt(String(studentId).replace(/\D/g, ''), 10) || 0;
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

function initials(name = '') {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
}

// ─── Individual page components ───────────────────────────────────────────────

function CoverPageLeft({ batchYear, school }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#1c1c30', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ width: 52, height: 52, border: '1.5px solid #c9a84c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem' }}>
        <span style={{ color: '#c9a84c', fontSize: 20 }}>✦</span>
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,.88)', marginBottom: 4 }}>Senior Yearbook</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>{batchYear}</div>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginTop: 'auto', paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,.12)' }}>
        {school}
      </div>
    </div>
  );
}

function CoverPageRight({ batchYear }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#181828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 80, color: '#fff', opacity: 0.06, userSelect: 'none' }}>{batchYear}</div>
    </div>
  );
}

function StudentGridPage({ students, pageNumber, bgColor = '#fffdf8', label = 'Class of 2025', heading = 'Senior\nPortraits' }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: bgColor, padding: '1.375rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#b8860b', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1c1c30', lineHeight: 1.25, marginBottom: 12, whiteSpace: 'pre-line' }}>{heading}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
        {students.map((s) => {
          const c = avatarColor(s.student_id);
          return (
            <div key={s.id} style={{ background: '#fff', border: '0.5px solid #ece6d9', borderRadius: 5, padding: '9px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
              {s.profile_picture ? (
                <img src={s.profile_picture} alt={s.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.bg, color: c.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 500, flexShrink: 0 }}>
                  {initials(s.name).toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 10, fontWeight: 500, color: '#1c1c30', lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ fontSize: 8, color: '#aaa' }}>{s.section?.name ?? s.course}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: '#ccc', marginTop: 8 }}>— {pageNumber} —</div>
    </div>
  );
}

function BioPage({ students, pageNumber, bgColor = '#f8f5ef' }) {
  // Right-side page: shows bios / senior quotes
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: bgColor, padding: '1.375rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#b8860b', marginBottom: 5 }}>Senior quotes</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1c1c30', lineHeight: 1.25, marginBottom: 12 }}>In Their<br />Own Words</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {students.map((s) => (
          <div key={s.id} style={{ padding: '8px 10px', borderLeft: '2px solid #c9a84c', background: '#fff', borderRadius: '0 4px 4px 0' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 10, color: '#333', lineHeight: 1.55 }}>
              "{s.bio || 'Making every moment count.'}"
            </div>
            <div style={{ fontSize: 8, color: '#aaa', marginTop: 3 }}>— {s.name}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: '#ccc', marginTop: 8, textAlign: 'right' }}>— {pageNumber} —</div>
    </div>
  );
}

function BackCoverPage({ batchYear, school }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#1c1c30', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#c9a84c', lineHeight: 1.25, marginBottom: 10 }}>Until We<br />Meet Again</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.42)', lineHeight: 1.85, marginBottom: 'auto' }}>
        Thank you for the memories,<br />the laughter, and the tears.<br />Class of {batchYear}, forever.
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,.2)', letterSpacing: '0.15em', textTransform: 'uppercase', borderTop: '0.5px solid rgba(255,255,255,.1)', paddingTop: 10 }}>
        {school}
      </div>
    </div>
  );
}

// ─── Build page list from flat student array ───────────────────────────────

function buildPages(students, batchYear, school) {
  const pages = [];

  // Cover spread
  pages.push(
    <div key="cover-l"><CoverPageLeft batchYear={batchYear} school={school} /></div>,
    <div key="cover-r"><CoverPageRight batchYear={batchYear} /></div>,
  );

  // Chunk students into groups of STUDENTS_PER_SPREAD
  const chunks = [];
  for (let i = 0; i < students.length; i += STUDENTS_PER_SPREAD) {
    chunks.push(students.slice(i, i + STUDENTS_PER_SPREAD));
  }

  // Each chunk = one spread (left: portrait grid, right: bio/quote strip)
  chunks.forEach((chunk, idx) => {
    const leftPage  = (idx * 2) + 2;
    const rightPage = leftPage + 1;

    pages.push(
      <div key={`stud-l-${idx}`}>
        <StudentGridPage students={chunk} pageNumber={leftPage} bgColor={idx % 2 === 0 ? '#fffdf8' : '#f8f5ef'} />
      </div>,
      <div key={`stud-r-${idx}`}>
        <BioPage students={chunk} pageNumber={rightPage} bgColor={idx % 2 === 0 ? '#f8f5ef' : '#fffdf8'} />
      </div>,
    );
  });

  // Back cover
  const lastPage = pages.length;
  pages.push(
    <div key="back-cover"><BackCoverPage batchYear={batchYear} school={school} /></div>,
  );

  // react-pageflip needs even page count; pad with blank if needed
  if (pages.length % 2 !== 0) {
    pages.push(<div key="blank" style={{ width: PAGE_W, height: PAGE_H, background: '#f8f5ef' }} />);
  }

  return pages;
}

// ─── Main component ────────────────────────────────────────────────────────

export default function FlipbookViewer({
  students = [],
  batchYear = '2025',
  school = 'Lakewood High School',
  onDownload,
  currentUser,
}) {
  const bookRef   = useRef(null);
  const wrapRef   = useRef(null);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const [zoomed,        setZoomed]        = useState(false);
  const [fullscreen,    setFullscreen]    = useState(false);

  const pages      = buildPages(students, batchYear, school);
  const totalSpreads = Math.ceil(pages.length / 2);

  const onFlip    = useCallback((e) => setCurrentSpread(Math.floor(e.data / 2)), []);
  const onInit    = useCallback((e) => setTotalPages(e.object.getPageCount()), []);

  const goNext    = () => bookRef.current?.pageFlip().flipNext();
  const goPrev    = () => bookRef.current?.pageFlip().flipPrev();
  const goTo      = (spreadIdx) => bookRef.current?.pageFlip().flip(spreadIdx * 2);

  const toggleZoom = () => setZoomed((z) => !z);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const handleDownload = () => {
    // exportStudentPdf expects a userId; falls back to certificate export
    if (onDownload) onDownload(currentUser?.id);
  };

  const spreadLabel = currentSpread === 0
    ? 'Cover'
    : currentSpread === totalSpreads - 1
      ? 'Back cover'
      : `${currentSpread * 2}–${currentSpread * 2 + 1} of ${(totalSpreads - 2) * 2}`;

  return (
    <div
      ref={wrapRef}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        padding:        '2rem 1rem',
        background:     fullscreen ? '#0f0f1e' : 'transparent',
        minHeight:      fullscreen ? '100vh' : 'auto',
        transition:     'background 0.3s',
      }}
    >
      {/* Book */}
      <div
        style={{
          transform:       zoomed ? 'scale(1.15)' : 'scale(1)',
          transformOrigin: 'top center',
          transition:      'transform 0.3s ease',
          marginBottom:    zoomed ? 64 : 0,
          filter:          'drop-shadow(0 20px 48px rgba(0,0,0,0.24))',
        }}
      >
        <HTMLFlipBook
          ref={bookRef}
          width={PAGE_W}
          height={PAGE_H}
          size="fixed"
          showCover={true}
          flippingTime={650}
          useMouseEvents={true}
          swipeDistance={40}
          showPageCorners={true}
          onFlip={onFlip}
          onInit={onInit}
          className="flipbook-book"
        >
          {pages}
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={goPrev}
          disabled={currentSpread === 0}
          aria-label="Previous spread"
          style={{ width: 38, height: 38, borderRadius: '50%', border: '0.5px solid rgba(201,168,76,.4)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', opacity: currentSpread === 0 ? 0.3 : 1, transition: 'opacity .15s' }}
        >
          <ChevronLeft size={18} />
        </button>

        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '0.1em', minWidth: 96, textAlign: 'center' }}>
          {spreadLabel}
        </span>

        <button
          onClick={goNext}
          disabled={currentSpread >= totalSpreads - 1}
          aria-label="Next spread"
          style={{ width: 38, height: 38, borderRadius: '50%', border: '0.5px solid rgba(201,168,76,.4)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', opacity: currentSpread >= totalSpreads - 1 ? 0.3 : 1, transition: 'opacity .15s' }}
        >
          <ChevronRight size={18} />
        </button>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.12)', margin: '0 4px' }} />

        <button onClick={toggleZoom} aria-label={zoomed ? 'Zoom out' : 'Zoom in'} style={{ width: 34, height: 34, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,.15)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.55)', transition: 'color .15s' }}>
          {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
        </button>

        <button onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{ width: 34, height: 34, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,.15)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.55)' }}>
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {onDownload && (
          <button
            onClick={handleDownload}
            style={{ height: 34, padding: '0 14px', borderRadius: 17, border: '0.5px solid #c9a84c', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#c9a84c', fontSize: 11, fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Download size={13} />
            Download PDF
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {totalSpreads > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: '1rem', overflowX: 'auto', paddingBottom: 4, maxWidth: 640 }}>
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to spread ${i + 1}`}
              style={{
                width:        46,
                height:       30,
                borderRadius: 3,
                border:       i === currentSpread ? '1.5px solid #c9a84c' : '0.5px solid rgba(255,255,255,.15)',
                background:   i === 0 || i === totalSpreads - 1 ? '#1c1c30' : '#f8f5ef',
                cursor:       'pointer',
                fontSize:     8,
                color:        i === currentSpread ? '#c9a84c' : 'rgba(255,255,255,.4)',
                flexShrink:   0,
                transition:   'all .14s',
                fontFamily:   'inherit',
              }}
            >
              {i === 0 ? 'Cover' : i === totalSpreads - 1 ? 'End' : `${i * 2}–${i * 2 + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}