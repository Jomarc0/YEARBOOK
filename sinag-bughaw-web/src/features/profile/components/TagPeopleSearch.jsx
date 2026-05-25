import { useState, useEffect, useRef } from 'react';
import { studentsApi } from '@/api/student.api';

export default function TagPeopleSearch({ tagged = [], onTag, onUntag, excludeId }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await studentsApi.search({ q: query, per_page: 8 }); // FIXED
        const list = data.data ?? data ?? [];
        setResults(list.filter(u => u.id !== excludeId));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query, excludeId]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTagged = (id) => tagged.some(u => u.id === id);

  const avatar = (user) =>
    user.profile_picture
      ? user.profile_picture
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1d2b4b&color=fff&size=80`;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginTop: 12 }}>

      {/* Tagged chips */}
      {tagged.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tagged.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f0f3fa', border: '1px solid #dbe3f0',
              borderRadius: 20, padding: '4px 10px 4px 6px',
            }}>
              <img
                src={avatar(user)}
                alt={user.name}
                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1d2b4b' }}>
                {user.name}
              </span>
              <button
                onClick={() => onUntag(user.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', fontSize: 11, padding: 0, lineHeight: 1,
                }}
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid #e2e8f0', borderRadius: 12,
        padding: '9px 12px', background: '#f8fafc',
      }}>
        <i className="fas fa-user-tag" style={{ color: '#94a3b8', fontSize: 12 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Tag classmates or alumni..."
          style={{
            flex: 1, border: 'none', background: 'none',
            fontSize: 13, color: '#1d2b4b', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {loading && <i className="fas fa-spinner fa-spin" style={{ color: '#94a3b8', fontSize: 11 }} />}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, marginTop: 4,
          boxShadow: '0 8px 24px rgba(29,43,75,0.12)',
          zIndex: 9000, overflow: 'hidden',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map(user => (
            <div
              key={user.id}
              onClick={() => {
                if (isTagged(user.id)) {
                  onUntag(user.id);
                } else {
                  onTag(user);
                }
                setQuery('');
                setOpen(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', cursor: 'pointer',
                background: isTagged(user.id) ? '#f0f3fa' : '#fff',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = isTagged(user.id) ? '#f0f3fa' : '#fff'}
            >
              <img
                src={avatar(user)}
                alt={user.name}
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.course ?? user.student_id ?? ''}</div>
              </div>
              {isTagged(user.id) && (
                <i className="fas fa-check-circle" style={{ color: '#3f51b5', fontSize: 14 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}