/**
 * BookmarkPanel.jsx
 * src/features/yearbook/components/sidebar/BookmarkPanel.jsx
 *
 * Sidebar: lists the user's bookmarked pages.
 * Each row shows the page label and a remove button.
 */
import React from 'react';

const GOLD = '#c9a84c';

export default function BookmarkPanel({ bookmarks, onJump, onRemove }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span className="text-xs tracking-widest uppercase" style={{ color: GOLD }}>
          Bookmarks
        </span>
        <span
          className="ml-auto text-[10px] rounded-full px-1.5 py-0.5"
          style={{ background: 'rgba(201,168,76,.15)', color: GOLD }}
        >
          {bookmarks.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,.2)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-xs text-white/25 text-center leading-relaxed">
              No bookmarks yet.<br />Tap ♥ while reading to save a page.
            </p>
          </div>
        ) : (
          <ul className="space-y-1" role="list">
            {bookmarks.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <button
                  onClick={() => onJump(b.pageIndex)}
                  className="flex-1 flex flex-col gap-0.5 text-left"
                  aria-label={`Go to ${b.label}`}
                >
                  <span className="text-xs text-white/75 font-medium leading-snug truncate">
                    {b.label}
                  </span>
                  <span className="text-[10px]" style={{ color: GOLD }}>
                    Page {b.pageIndex + 1}
                  </span>
                </button>

                {/* Remove */}
                <button
                  onClick={() => onRemove(b.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
                  aria-label={`Remove bookmark: ${b.label}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}