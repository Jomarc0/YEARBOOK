/**
 * TOCPage.jsx
 * src/features/yearbook/components/pages/TOCPage.jsx
 */
import React from 'react';
import { pageBase, GOLD } from './pageStyles';

export default function TOCPage({ page, onNavigate }) {
  const { toc = [], side } = page;
  const half    = Math.ceil(toc.length / 2);
  const entries = side === 'left' ? toc.slice(0, half) : toc.slice(half);

  return (
    <div style={pageBase(side === 'left' ? '#fffdf8' : '#f7f3ec')}>
      {side === 'left' && (
        <>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
            Index
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, color: '#1a1a2e', marginBottom: 20, lineHeight: 1.2 }}>
            Table of<br />Contents
          </div>
        </>
      )}

      <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {entries.map((entry, i) => (
          <li key={i} style={{ borderBottom: '0.5px solid #ece5d4' }}>
            <button
              onClick={() => onNavigate?.(entry.pageIndex)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 8, padding: '9px 4px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
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

      <div style={{ fontSize: 9, color: '#ccc', paddingTop: 8, textAlign: side === 'right' ? 'right' : 'left' }}>
        {side === 'left' ? '— 3 —' : '— 4 —'}
      </div>
    </div>
  );
}