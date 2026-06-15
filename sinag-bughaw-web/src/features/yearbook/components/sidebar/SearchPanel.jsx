/**
 * SearchPanel.jsx
 * src/features/yearbook/components/sidebar/SearchPanel.jsx
 *
 * Full-text search panel for the flipbook sidebar.
 * - Debounces input (300ms) so it doesn't fire on every keystroke
 * - Shows loading state while API is in-flight
 * - Highlights matching text in result labels
 * - Groups results by type (student / gallery / etc.)
 * - "No results" and "start typing" empty states
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const GOLD = '#c9a84c';

export default function SearchPanel({ results, onSearch, onJump }) {
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const inputRef                = useRef(null);
  const debounceRef             = useRef(null);

  // Auto-focus when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setLoading(false);
      onSearch('');
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      setLoading(false);
      onSearch(val.trim());
    }, 300);
  }, [onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleJump = (pageIndex) => {
    onJump(pageIndex);
  };

  // Determine state
  const isEmpty    = !query.trim();
  const hasResults = Array.isArray(results) && results.length > 0;
  const noResults  = Array.isArray(results) && results.length === 0 && !loading;

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      fontFamily:    "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        padding:      '16px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        flexShrink:   0,
      }}>
        <div style={{
          fontSize:      9,
          fontWeight:    800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color:         GOLD,
          marginBottom:  4,
        }}>
          Search
        </div>
        <div style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize:   18,
          color:      'rgba(255,255,255,.85)',
          lineHeight: 1.2,
        }}>
          Find in<br />Yearbook
        </div>
      </div>

      {/* Search input */}
      <div style={{
        padding:  '12px 14px',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative' }}>
          {/* Magnifier */}
          <div style={{
            position:  'absolute',
            left:      11,
            top:       '50%',
            transform: 'translateY(-50%)',
            color:     query ? GOLD : 'rgba(255,255,255,.25)',
            pointerEvents: 'none',
            transition: 'color 0.2s',
          }}>
            <SearchIcon />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Name, quote, section…"
            style={{
              width:       '100%',
              padding:     '9px 36px 9px 32px',
              borderRadius: 10,
              border:      `1px solid ${query ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'}`,
              background:  'rgba(255,255,255,.06)',
              color:       '#fff',
              fontSize:    12,
              outline:     'none',
              boxSizing:   'border-box',
              transition:  'border-color 0.2s',
              fontFamily:  "'Plus Jakarta Sans', sans-serif",
            }}
            onFocus={e  => e.target.style.borderColor = 'rgba(201,168,76,.5)'}
            onBlur={e   => e.target.style.borderColor = query ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'}
          />

          {/* Clear / spinner */}
          {query && (
            <button
              onClick={handleClear}
              style={{
                position:  'absolute',
                right:     8,
                top:       '50%',
                transform: 'translateY(-50%)',
                background:'none',
                border:    'none',
                cursor:    'pointer',
                color:     'rgba(255,255,255,.3)',
                padding:   4,
                display:   'flex',
                lineHeight: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.3)'}
            >
              {loading ? <SpinnerIcon /> : <ClearIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px' }}>

        {/* Idle state */}
        {isEmpty && (
          <div style={{
            padding:   '20px 18px',
            textAlign: 'center',
            color:     'rgba(255,255,255,.18)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              Search for a student,<br />quote, or section name
            </div>
          </div>
        )}

        {/* No results */}
        {noResults && (
          <div style={{
            padding:   '20px 18px',
            textAlign: 'center',
            color:     'rgba(255,255,255,.2)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>😕</div>
            <div style={{ fontSize: 11 }}>
              No results for<br />
              <span style={{ color: GOLD, fontWeight: 600 }}>"{query}"</span>
            </div>
          </div>
        )}

        {/* Results list */}
        {hasResults && (
          <>
            <div style={{
              padding:       '6px 18px 4px',
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,.2)',
            }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>

            {results.map((r, i) => (
              <ResultRow
                key={i}
                result={r}
                query={query}
                onJump={handleJump}
                index={i}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Result row

function ResultRow({ result, query, onJump, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onJump(result.pageIndex)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:    'flex',
        alignItems: 'flex-start',
        gap:        10,
        width:      '100%',
        padding:    '9px 18px',
        background: hovered ? 'rgba(201,168,76,.08)' : 'transparent',
        border:     'none',
        borderLeft: hovered ? `2px solid ${GOLD}` : '2px solid transparent',
        cursor:     'pointer',
        textAlign:  'left',
        transition: 'all 0.12s',
        animation:  `fadeIn 0.2s ease ${index * 0.04}s both`,
      }}
    >
      {/* Type badge */}
      <div style={{
        width:          24,
        height:         24,
        borderRadius:   6,
        background:     hovered ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.05)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        color:          hovered ? GOLD : 'rgba(255,255,255,.3)',
        marginTop:      1,
        transition:     'all 0.12s',
      }}>
        {result.type === 'student' ? <PersonIcon /> : <BookOpenIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Highlighted label */}
        <div style={{
          fontSize:     11,
          fontWeight:   600,
          color:        hovered ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.6)',
          lineHeight:   1.3,
          transition:   'color 0.12s',
        }}>
          <Highlight text={result.label} query={query} />
        </div>

        {/* Excerpt */}
        {result.excerpt && (
          <div style={{
            fontSize:     10,
            color:        'rgba(255,255,255,.25)',
            marginTop:    2,
            lineHeight:   1.5,
            overflow:     'hidden',
            display:      '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            <Highlight text={result.excerpt} query={query} />
          </div>
        )}
      </div>

      {/* Page number */}
      <div style={{
        fontSize:   9,
        color:      hovered ? GOLD : 'rgba(255,255,255,.2)',
        flexShrink: 0,
        marginTop:  2,
        transition: 'color 0.12s',
      }}>
        p.{result.pageIndex + 1}
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(-4px) } to { opacity:1; transform:none } }`}</style>
    </button>
  );
}

// Highlight matching text

function Highlight({ text = '', query = '' }) {
  if (!query.trim() || !text) return <>{text}</>;

  const regex  = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts  = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: 'rgba(201,168,76,.3)', color: GOLD, borderRadius: 2, padding: '0 1px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// Inline SVG icons

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function BookOpenIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}