/**
 * ThumbnailSidebar.jsx
 * src/features/yearbook/components/sidebar/ThumbnailSidebar.jsx
 *
 * Left sidebar showing the auto-generated Table of Contents.
 * Each entry is a clickable row that jumps to that spread.
 */
import React from 'react';

const GOLD = '#c9a84c';

const ICONS = {
  book:      'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  photo:     'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  school:    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  'chart-bar':'M18 20V10M12 20V4M6 20v-6',
  heart:     'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
};

function TocIcon({ name }) {
  const d = ICONS[name] || ICONS.book;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.includes('M') && <path d={d} />}
    </svg>
  );
}

function splitTocLabel(label = '') {
  const parts = String(label).split(' - ').map(part => part.trim()).filter(Boolean);

  if (parts.length < 2) {
    return { title: label, subtitle: null };
  }

  return {
    title: parts.at(-1),
    subtitle: parts.slice(0, -1).join(' - '),
  };
}

export default function ThumbnailSidebar({ toc, currentSpread, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center gap-2"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <span className="text-xs tracking-widest uppercase" style={{ color: GOLD }}>
          Contents
        </span>
      </div>

      {/* TOC entries */}
      <nav aria-label="Table of contents" className="flex-1 overflow-y-auto py-2">
        {toc.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">No entries</p>
        ) : (
          <ul className="space-y-0.5 px-2">
            {toc.map((entry, i) => {
              const spreadIndex = Math.floor(entry.pageIndex / 2);
              const isActive    = spreadIndex === currentSpread;
              const label = splitTocLabel(entry.label);

              return (
                <li key={i}>
                  <button
                    onClick={() => onNavigate(entry.pageIndex)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      transition-all duration-150
                      ${isActive
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Icon */}
                    <span
                      className="flex-shrink-0"
                      style={{ color: isActive ? GOLD : 'rgba(255,255,255,.35)' }}
                    >
                      <TocIcon name={entry.icon} />
                    </span>

                    <span
                      className="min-w-0 flex-1 leading-snug"
                      style={{
                        color:      isActive ? '#fff' : 'rgba(255,255,255,.55)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <span className="block break-words text-[12px]">
                        {label.title}
                      </span>
                      {label.subtitle && (
                        <span
                          className="mt-0.5 block break-words text-[10px] leading-tight"
                          style={{ color: isActive ? 'rgba(255,255,255,.68)' : 'rgba(255,255,255,.36)' }}
                        >
                          {label.subtitle}
                        </span>
                      )}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: GOLD }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
