/**
 * DedicationPage.jsx
 * src/features/yearbook/components/pages/DedicationPage.jsx
 */
import React from 'react';
import { pageBase, GOLD, DARKER } from './pageStyles';

export function DedicationPage({ page }) {
  const { meta = {} } = page;
  return (
    <div style={{ ...pageBase(DARKER, { alignItems: 'center', justifyContent: 'center' }) }}>
      {/* Large watermark year */}
      <div
        aria-hidden="true"
        style={{
          position:    'absolute',
          top: '50%', left: '50%',
          transform:   'translate(-50%,-50%)',
          fontFamily:  'Cormorant Garamond, Georgia, serif',
          fontSize:    140,
          color:       'rgba(255,255,255,.03)',
          userSelect:  'none',
          lineHeight:  1,
        }}
      >
        {meta.year}
      </div>

      <div style={{ textAlign: 'center', maxWidth: 240, position: 'relative' }}>
        {/* Gold star */}
        <div style={{ color: GOLD, fontSize: 20, marginBottom: 20 }} aria-hidden="true">✦</div>

        <p
          style={{
            fontFamily:  'Cormorant Garamond, Georgia, serif',
            fontStyle:   'italic',
            fontSize:    15,
            color:       'rgba(255,255,255,.7)',
            lineHeight:  1.8,
            marginBottom: 24,
          }}
        >
          Dedicated to every student who turned struggles into stories
          and memories into milestones.
        </p>

        <div style={{ height: 0.5, background: 'rgba(255,255,255,.1)', marginBottom: 16 }} />

        <p
          style={{
            fontSize:      9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,.2)',
          }}
        >
          {meta.school} · {meta.year}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * TOCPage.jsx
 * src/features/yearbook/components/pages/TOCPage.jsx
 */
export function TOCPage({ page, onNavigate }) {
  const { toc = [], side } = page;
  const half     = Math.ceil(toc.length / 2);
  const entries  = side === 'left' ? toc.slice(0, half) : toc.slice(half);

  return (
    <div style={pageBase(side === 'left' ? '#fffdf8' : '#f7f3ec')}>
      {side === 'left' && (
        <>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
            Contents
          </div>
          <div
            style={{
              fontFamily:   'Cormorant Garamond, Georgia, serif',
              fontSize:     26,
              color:        '#1a1a2e',
              marginBottom: 20,
              lineHeight:   1.2,
            }}
          >
            Table of<br />Contents
          </div>
        </>
      )}

      <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entries.map((entry, i) => (
          <li key={i}>
            <button
              onClick={() => onNavigate?.(entry.pageIndex)}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                gap:            8,
                padding:        '8px 6px',
                background:     'transparent',
                border:         'none',
                borderBottom:   '0.5px solid #ece5d4',
                cursor:         'pointer',
                textAlign:      'left',
                transition:     'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ flex: 1, fontSize: 11, color: '#1a1a2e', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                {entry.label}
              </span>
              <span style={{ fontSize: 9, color: '#bbb', flexShrink: 0 }}>
                {entry.pageIndex + 1}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * SectionHeader.jsx
 * src/features/yearbook/components/pages/SectionHeader.jsx
 */
export function SectionHeader({ page }) {
  const { section = {}, side } = page;

  if (side === 'right') {
    // Right: minimal decorative complement
    return (
      <div
        style={{
          ...pageBase('#1a1a2e', { alignItems: 'center', justifyContent: 'center' }),
        }}
      >
        <div
          aria-hidden="true"
          style={{
            fontFamily:  'Cormorant Garamond, Georgia, serif',
            fontSize:    100,
            color:       'rgba(255,255,255,.03)',
            userSelect:  'none',
            lineHeight:  1,
            textAlign:   'center',
          }}
        >
          {section.name?.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
            Section
          </div>
          <div
            style={{
              fontFamily:  'Cormorant Garamond, Georgia, serif',
              fontSize:    28,
              color:       '#fff',
              lineHeight:  1.2,
            }}
          >
            {section.name}
          </div>
          {section.adviser && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>
              Adviser: {section.adviser}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageBase('#1a1a2e', { justifyContent: 'flex-end' }) }}>
      <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
        Class of {section.year ?? '2025'}
      </div>
      <div
        style={{
          fontFamily:  'Cormorant Garamond, Georgia, serif',
          fontSize:    42,
          color:       '#fff',
          lineHeight:  1.1,
          marginBottom: 12,
        }}
      >
        {section.name}
      </div>
      {section.strand && (
        <div
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           6,
            padding:       '4px 10px',
            borderRadius:  20,
            border:        `0.5px solid ${GOLD}`,
            color:         GOLD,
            fontSize:      9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom:  'auto',
          }}
        >
          {section.strand}
        </div>
      )}
      <div style={{ height: 0.5, background: 'rgba(255,255,255,.12)', marginTop: 'auto', marginBottom: 12 }} />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {section.studentCount ?? ''} {section.studentCount ? 'students' : ''}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * BlankPage.jsx — placeholder for padding pages
 */
export function BlankPage() {
  return <div style={pageBase('#f7f3ec')} aria-hidden="true" />;
}

// Re-export as defaults for the renderer's dynamic imports
export default DedicationPage;