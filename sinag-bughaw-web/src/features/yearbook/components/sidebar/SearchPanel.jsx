/**
 * SearchPanel.jsx
 * src/features/yearbook/components/sidebar/SearchPanel.jsx
 *
 * Sidebar panel: search inside the yearbook.
 * Calls onSearch (debounced in parent) and lists results.
 * Each result is clickable → jumps to that page.
 */
import React, { useState, useCallback } from 'react';

const GOLD = '#c9a84c';

function useDebounce(fn, delay) {
  const timer = React.useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function SearchPanel({ results, onSearch, onJump }) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebounce(onSearch, 350);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    debouncedSearch(q);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span className="text-xs tracking-widest uppercase" style={{ color: GOLD }}>
          Search
        </span>
      </div>

      {/* Input */}
      <div className="px-3 py-3">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Search students, quotes…"
            aria-label="Search yearbook"
            className="
              w-full bg-white/5 border border-white/10 rounded-lg
              px-3 py-2 text-xs text-white/80 placeholder-white/25
              focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8
              transition-colors
            "
            style={{ fontFamily: 'inherit' }}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {results === null && (
          <p className="text-xs text-white/25 text-center py-6 leading-relaxed">
            Type to search<br />students, quotes, sections…
          </p>
        )}
        {results !== null && results.length === 0 && (
          <p className="text-xs text-white/30 text-center py-6">No results for "{query}"</p>
        )}
        {results !== null && results.length > 0 && (
          <ul className="space-y-1" role="list">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => onJump(r.pageIndex)}
                  className="w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs text-white/80 font-medium leading-snug">
                    {r.label}
                  </span>
                  {r.excerpt && (
                    <span className="text-[10px] text-white/35 leading-snug line-clamp-2">
                      {r.excerpt}
                    </span>
                  )}
                  <span className="text-[10px] mt-0.5" style={{ color: GOLD }}>
                    Page {r.pageIndex + 1}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}