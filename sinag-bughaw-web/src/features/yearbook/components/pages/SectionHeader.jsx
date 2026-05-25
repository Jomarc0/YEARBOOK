/**
 * SectionHeader.jsx
 * src/features/yearbook/components/pages/SectionHeader.jsx
 */
import React from 'react';
import { pageBase, GOLD, DARK, DARKER } from './pageStyles';

export default function SectionHeader({ page }) {
  const { section = {}, side } = page;

  if (side === 'right') {
    return (
      <div style={{ ...pageBase(DARKER, { alignItems: 'center', justifyContent: 'center' }) }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 120, color: 'rgba(255,255,255,.03)',
            userSelect: 'none', lineHeight: 1,
          }}
        >
          {section.name?.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
            Section
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 32, color: '#fff', lineHeight: 1.2 }}>
            {section.name}
          </div>
          {section.adviser && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 12 }}>
              Adviser: {section.adviser}
            </div>
          )}
          {section.studentCount != null && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.22)', marginTop: 6, letterSpacing: '0.1em' }}>
              {section.studentCount} students
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageBase(DARK, { justifyContent: 'flex-end' }) }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 100, color: 'rgba(255,255,255,.03)', lineHeight: 1, userSelect: 'none',
      }}>
        {section.name?.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
        Class of {section.year ?? '2025'}
      </div>
      <div style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 44, color: '#fff', lineHeight: 1.1, marginBottom: 16,
      }}>
        {section.name}
      </div>
      {section.strand && (
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '4px 12px', borderRadius: 20,
          border: `0.5px solid ${GOLD}`, color: GOLD,
          fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          {section.strand}
        </div>
      )}
      <div style={{ height: 0.5, background: 'rgba(255,255,255,.12)', marginTop: 'auto', marginBottom: 14 }} />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {section.studentCount != null ? `${section.studentCount} students` : ''}
      </div>
    </div>
  );
}