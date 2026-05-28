/**
 * YearbookHomePage.jsx  (MODIFIED)
 * src/features/yearbook/pages/YearbookHomePage.jsx
 *
 * Changes from original:
 *   1. Added "Alumni Tracker" deep-link button in the feature chips row.
 *   2. Added a secondary CTA below the Generate button that navigates to
 *      /alumni-tracker?batch_id={batchId} — keeping the two sections connected.
 *   3. No original logic was changed.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';  // ← added Link
import { yearbookApi } from '../../../api/yearbook.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const GOLD = '#fdb813';
const NAVY = '#1d2b4b';

const STEPS = [
  'Fetching student records…',
  'Building portrait pages…',
  'Compiling senior quotes…',
  'Laying out gallery spreads…',
  'Assembling faculty pages…',
  'Binding the yearbook…',
];

// ── Feature chips — now includes Alumni Tracker ──────────────────────────────
const FEATURE_CHIPS = [
  { icon: 'fa-book-open',       label: 'Flipbook Animation'   },
  { icon: 'fa-search',          label: 'Search Inside'        },
  { icon: 'fa-bookmark',        label: 'Bookmark Pages'       },
  { icon: 'fa-expand',          label: 'Fullscreen Mode'      },
  { icon: 'fa-file-pdf',        label: 'PDF Download'         },
  { icon: 'fa-mobile-alt',      label: 'Swipe Support'        },
  // ── NEW: Alumni Tracker chip ─────────────────────────────────────────────
  { icon: 'fa-users-line',      label: 'Alumni Tracker',  isLink: true },
];

export default function YearbookHomePage() {
  const { batchId } = useParams();
  const navigate    = useNavigate();

  const [phase,    setPhase]    = useState('idle');
  const [stepIdx,  setStepIdx]  = useState(0);
  const [progress, setProgress] = useState(0);
  const [stats,    setStats]    = useState({ students: '—', sections: '—', galleries: '—', year: '—' });
  const [meta,     setMeta]     = useState(null);

  // Fetch real stats from the API
  useEffect(() => {
    if (!batchId || batchId === 'latest') return;
    Promise.all([
      yearbookApi.meta(batchId).catch(() => null),
      yearbookApi.pages(batchId).catch(() => null),
    ]).then(([metaRes, pagesRes]) => {
      if (metaRes?.data) setMeta(metaRes.data);

      const pages     = pagesRes?.data?.pages ?? [];
      const students  = pages
        .filter(p => p.type === 'student-grid')
        .reduce((n, p) => n + (p.students?.length ?? 0), 0);
      const sections  = new Set(
        pages.filter(p => p.type === 'section-header' && p.side === 'left')
             .map(p => p.section?.name)
      ).size;
      const galleries = pages.filter(p => p.type === 'gallery' && p.side === 'left').length;
      const year      = metaRes?.data?.year ?? pagesRes?.data?.meta?.year ?? '—';

      setStats({
        students: students || '—',
        sections: sections || '—',
        galleries: galleries ? `${galleries}+` : '—',
        year,
      });
    });
  }, [batchId]);

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
    navigate(`/yearbook/${batchId ?? 'latest'}/view`);
  };

  // Build alumni tracker URL — passes batch_id so tracker filters to this batch
  const alumniTrackerUrl = batchId && batchId !== 'latest'
    ? `/alumni-tracker?batch_id=${batchId}`
    : '/alumni-tracker';

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .fade-in-1 { animation: fadeInUp 0.5s ease 0.05s both; }
        .fade-in-2 { animation: fadeInUp 0.5s ease 0.15s both; }
        .fade-in-3 { animation: fadeInUp 0.5s ease 0.25s both; }
        .fade-in-4 { animation: fadeInUp 0.5s ease 0.35s both; }
        .fade-in-5 { animation: fadeInUp 0.5s ease 0.45s both; }
      `}</style>

      <Navbar />

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <header style={{
        background:   `linear-gradient(135deg, ${NAVY} 0%, #2a3d66 100%)`,
        padding:      '80px 8% 130px',
        borderRadius: '0 0 60px 60px',
        color:        '#fff',
        textAlign:    'center',
        position:     'relative',
        overflow:     'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: -60, right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          border: `1px solid rgba(253,184,19,0.08)`, pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -40, left: '5%',
          width: 200, height: 200, borderRadius: '50%',
          border: `1px solid rgba(253,184,19,0.06)`, pointerEvents: 'none',
        }} />

        <p className="fade-in-1" style={{
          fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(253,184,19,0.6)', marginBottom: 16,
        }}>
          National University Lipa
        </p>

        <div className="fade-in-1" style={{
          width: 72, height: 72,
          border: `1.5px solid ${GOLD}`, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: GOLD, margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>

        <h1 className="fade-in-2" style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '2.8rem', fontWeight: 800,
          letterSpacing: '-1.5px', color: '#fff',
          marginBottom: 12, lineHeight: 1.15,
        }}>
          Digital <span style={{ color: GOLD }}>Yearbook</span> Generator
        </h1>

        <p className="fade-in-2" style={{
          fontSize: '0.95rem', fontWeight: 300,
          color: 'rgba(255,255,255,0.65)',
          maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7,
        }}>
          Compile your batch's portraits, senior quotes, memories,
          and galleries into a premium interactive flipbook.
        </p>

        {stats.year !== '—' && (
          <div className="fade-in-3" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(253,184,19,0.12)',
            border: '1px solid rgba(253,184,19,0.3)',
            padding: '7px 20px', borderRadius: 50,
            color: GOLD, fontSize: '0.78rem', fontWeight: 700,
          }}>
            <i className="fas fa-graduation-cap" />
            Batch {stats.year}
          </div>
        )}
      </header>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="fade-in-3" style={{
        display: 'flex', justifyContent: 'center',
        marginTop: -52, position: 'relative', zIndex: 10, padding: '0 8%',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, width: '100%', maxWidth: 620,
          background: 'white', borderRadius: 24, padding: 24,
          boxShadow: '0 20px 60px rgba(29,43,75,0.12)',
        }}>
          {[
            { icon: 'fa-users',       val: stats.students,  label: 'Students'        },
            { icon: 'fa-layer-group', val: stats.sections,  label: 'Sections'        },
            { icon: 'fa-images',      val: stats.galleries, label: 'Gallery Spreads' },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(29,43,75,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px', color: NAVY,
              }}>
                <i className={`fas ${icon}`} style={{ fontSize: 14 }} />
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.6rem', fontWeight: 800, color: NAVY, lineHeight: 1,
              }}>
                {val}
              </div>
              <div style={{
                fontSize: '0.68rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#94a3b8', marginTop: 4,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Action ──────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '40px 8% 80px',
      }}>

        {/* Feature chips — now includes Alumni Tracker link */}
        <div className="fade-in-4" style={{
          display: 'flex', flexWrap: 'wrap',
          gap: 10, justifyContent: 'center',
          marginBottom: 36, maxWidth: 600,
        }}>
          {FEATURE_CHIPS.map(({ icon, label, isLink }) =>
            isLink ? (
              // ── Alumni Tracker chip acts as a navigation deep-link ──
              <Link
                key={label}
                to={alumniTrackerUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(253,184,19,0.1)',
                  border: '1.5px solid rgba(253,184,19,0.35)',
                  padding: '6px 14px', borderRadius: 10,
                  fontSize: '0.72rem', fontWeight: 700,
                  color: '#92590e',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = GOLD;
                  e.currentTarget.style.color = NAVY;
                  e.currentTarget.style.borderColor = GOLD;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(253,184,19,0.1)';
                  e.currentTarget.style.color = '#92590e';
                  e.currentTarget.style.borderColor = 'rgba(253,184,19,0.35)';
                }}
              >
                <i className={`fas ${icon}`} style={{ fontSize: 10 }} />
                {label}
                <i className="fas fa-arrow-right" style={{ fontSize: 8, opacity: 0.6 }} />
              </Link>
            ) : (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'white',
                border: '1.5px solid #e2e8f0',
                padding: '6px 14px', borderRadius: 10,
                fontSize: '0.72rem', fontWeight: 600,
                color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <i className={`fas ${icon}`} style={{ color: NAVY, fontSize: 10 }} />
                {label}
              </div>
            )
          )}
        </div>

        {/* Generate button / progress */}
        <div className="fade-in-5" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          {phase === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {/* Primary: Generate Yearbook */}
              <button
                onClick={handleGenerate}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '0 40px', height: 56,
                  background: NAVY, color: GOLD,
                  border: 'none', borderRadius: 50,
                  cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '0.02em',
                  boxShadow: '0 10px 30px rgba(29,43,75,0.25)',
                  transition: 'all 0.2s ease',
                  width: '100%', justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = GOLD;
                  e.currentTarget.style.color = NAVY;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(253,184,19,0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = NAVY;
                  e.currentTarget.style.color = GOLD;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(29,43,75,0.25)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Generate Yearbook
              </button>

              {/* ── NEW: Secondary CTA — Alumni Tracker deep link ─────────────── */}
              <Link
                to={alumniTrackerUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 48,
                  background: 'rgba(29,43,75,0.05)',
                  border: '1.5px solid rgba(29,43,75,0.12)',
                  borderRadius: 50,
                  fontSize: '0.82rem', fontWeight: 700,
                  color: NAVY, textDecoration: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(29,43,75,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(29,43,75,0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(29,43,75,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(29,43,75,0.12)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <i className="fas fa-users-line" style={{ color: '#3f51b5', fontSize: 14 }} />
                See Where Batchmates Are Now
                <i className="fas fa-arrow-right" style={{ fontSize: 10, opacity: 0.5 }} />
              </Link>
            </div>
          )}

          {phase === 'loading' && (
            <div style={{
              background: 'white', borderRadius: 24, padding: '32px 28px',
              boxShadow: '0 20px 60px rgba(29,43,75,0.1)',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(29,43,75,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: NAVY,
              }}>
                <i className="fas fa-book-open" style={{ fontSize: 20 }} />
              </div>
              <p style={{
                fontSize: '0.82rem', fontWeight: 600,
                color: '#475569', marginBottom: 16, letterSpacing: '0.02em',
              }}>
                {STEPS[stepIdx]}
              </p>
              <div style={{
                height: 6, borderRadius: 99,
                background: '#f1f5f9', overflow: 'hidden', marginBottom: 10,
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${NAVY}, ${GOLD})`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Step {stepIdx + 1} of {STEPS.length}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: NAVY }}>
                  {progress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        {phase === 'idle' && (
          <div className="fade-in-5" style={{
            display: 'flex', flexWrap: 'wrap',
            gap: 16, justifyContent: 'center', marginTop: 32,
          }}>
            {[
              ['←→', 'Navigate pages'],
              ['F',  'Fullscreen'    ],
              ['⌕',  'Search inside' ],
              ['♥',  'Bookmark pages'],
            ].map(([k, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <kbd style={{
                  background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 6,
                  padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, color: NAVY,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}>
                  {k}
                </kbd>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
