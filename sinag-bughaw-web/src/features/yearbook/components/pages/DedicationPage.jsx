import React from 'react';
import { pageBase, GOLD, DARKER, smallCaps } from './pageStyles';

export default function DedicationPage({ page }) {
  const { meta = {} } = page;

  return (
    <div style={{ ...pageBase(DARKER, { alignItems: 'center', justifyContent: 'center' }) }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 140,
          color: 'rgba(255,255,255,.035)',
          userSelect: 'none',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        NU
      </div>

      <div style={{ textAlign: 'center', maxWidth: 250, position: 'relative', zIndex: 1 }}>
        <div style={{ ...smallCaps(GOLD), marginBottom: 18 }}>Opening Dedication</div>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 17,
          color: 'rgba(255,255,255,.78)',
          lineHeight: 1.8,
          marginBottom: 24,
        }}>
          For the graduates who made scholarship personal, friendship enduring,
          and every difficult season part of a larger becoming.
        </p>

        <div style={{ height: 0.5, background: 'rgba(255,255,255,.1)', marginBottom: 16 }} />

        <p style={{
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.24)',
        }}>
          {meta.school} / Class of {meta.year}
        </p>
      </div>
    </div>
  );
}
