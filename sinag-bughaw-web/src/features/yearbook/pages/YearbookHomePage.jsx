import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const GOLD = '#c9a84c';
const BG   = '#0a0a14';

const STEPS = [
  'Fetching student records…',
  'Building portrait pages…',
  'Compiling senior quotes…',
  'Laying out gallery spreads…',
  'Assembling faculty pages…',
  'Binding the yearbook…',
];

export default function YearbookHomePage() {
  const { batchId } = useParams();
  const navigate    = useNavigate();

  const [phase,     setPhase]     = useState('idle');   
  const [stepIdx,   setStepIdx]   = useState(0);
  const [progress,  setProgress]  = useState(0);

  const handleGenerate = async () => {
    setPhase('loading');
    setStepIdx(0);
    setProgress(0);

    for (let i = 0; i < STEPS.length; i++) {
      await delay(550);
      setStepIdx(i);
      setProgress(Math.round(((i + 1) / STEPS.length) * 100));
    }

    await delay(300);
    // Navigate to the viewer — it fetches its own data via useYearbook
    navigate(`/yearbook/${batchId ?? 'latest'}/view`);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: BG }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center text-center max-w-lg gap-6">

        {/* Emblem */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 80, height: 80, border: `1.5px solid ${GOLD}`, color: GOLD }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>

        <div>
          <h1
            className="text-4xl mb-3"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#fff', fontWeight: 400, lineHeight: 1.2 }}
          >
            Digital Yearbook<br />Generator
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.4)' }}>
            Compile your batch's portraits, senior quotes, memories,
            and galleries into a premium interactive flipbook — in seconds.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[['248', 'Students'], ['12', 'Sections'], ['6+', 'Gallery spreads']].map(([n, l]) => (
            <div
              key={l}
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.08)' }}
            >
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, color: GOLD }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Generate button */}
        {phase === 'idle' && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-3 rounded-full font-medium transition-all active:scale-95"
            style={{
              padding:    '0 36px',
              height:     54,
              background: GOLD,
              color:      BG,
              border:     'none',
              cursor:     'pointer',
              fontSize:   15,
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#d4b55e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>
            </svg>
            Generate Yearbook
          </button>
        )}

        {/* Progress */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', letterSpacing: '0.05em' }}>
              {STEPS[stepIdx]}
            </p>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, background: 'rgba(255,255,255,.08)' }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Generation progress"
            >
              <div
                style={{
                  height:     '100%',
                  width:      `${progress}%`,
                  background: GOLD,
                  borderRadius: 9999,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>{progress}%</p>
          </div>
        )}

        {/* Navigation hints */}
        {phase === 'idle' && (
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            {[
              ['←→', 'Navigate pages'],
              ['F', 'Fullscreen'],
              ['⌕', 'Search inside'],
              ['♥', 'Bookmark pages'],
            ].map(([k, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <kbd
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)', border: '0.5px solid rgba(255,255,255,.1)' }}
                >
                  {k}
                </kbd>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}