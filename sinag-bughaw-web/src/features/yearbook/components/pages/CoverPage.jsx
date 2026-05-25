/**
 * CoverPage.jsx
 * src/features/yearbook/components/pages/CoverPage.jsx
 *
 * Left-side cover leaf. Uses meta.coverUrl as background if available,
 * otherwise renders the dark illustrated cover.
 */
import React from 'react';
import { pageBase, GOLD, DARK, DARKER } from './pageStyles';

export default function CoverPage({ page }) {
  const { meta = {} } = page;
  const { title = 'Senior Yearbook', year = '2025', school = '', coverUrl } = meta;

  return (
    <div
      style={{
        ...pageBase(DARK, { justifyContent: 'flex-end' }),
        ...(coverUrl
          ? {
              backgroundImage: `linear-gradient(to top, rgba(10,10,20,.95) 0%, rgba(10,10,20,.4) 60%, rgba(10,10,20,.2) 100%), url(${coverUrl})`,
              backgroundSize:  'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
    >
      {/* Decorative background text */}
      {!coverUrl && (
        <div
          aria-hidden="true"
          style={{
            position:   'absolute',
            top: '50%', left: '50%',
            transform:  'translate(-50%,-50%)',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize:   160,
            color:      'rgba(255,255,255,.025)',
            userSelect: 'none',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {year}
        </div>
      )}

      {/* Emblem */}
      <div
        style={{
          width:  60, height: 60,
          border: `1.5px solid ${GOLD}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: GOLD,
          marginBottom: '1.1rem',
          flexShrink: 0,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>

      {/* Text */}
      <div
        style={{
          fontFamily:  'Cormorant Garamond, Georgia, serif',
          fontSize:    16,
          fontStyle:   'italic',
          color:       'rgba(255,255,255,.85)',
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily:  'Cormorant Garamond, Georgia, serif',
          fontSize:    64,
          fontWeight:  700,
          color:       GOLD,
          lineHeight:  1,
          marginBottom: 4,
        }}
      >
        {year}
      </div>

      {/* Rule + school */}
      <div style={{ height: 0.5, background: 'rgba(255,255,255,.12)', marginTop: 'auto', marginBottom: 14 }} />
      <div
        style={{
          fontSize:      9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,.3)',
        }}
      >
        {school}
      </div>
    </div>
  );
}