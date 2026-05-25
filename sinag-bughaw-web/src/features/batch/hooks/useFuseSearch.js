import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js'; // Import Fuse.js directly here

/**
 * useFuseSearch — client-side fuzzy search powered by Fuse.js
 *
 * @param {Array}  items   - The data array to search through
 * @param {Array}  keys   - Fields to search on (Fuse.js key config)
 * @param {Object} options - Override default Fuse.js options
 */
export function useFuseSearch(items = [], keys = [], options = {}) {
  const [query, setQuery] = useState('');

  // Build Fuse instance — only rebuilt when items or keys change
  const fuse = useMemo(() => {
    if (!items || items.length === 0) return null;

    const defaultOptions = {
      threshold:          0.35,   // 0 = exact, 1 = anything — 0.35 is a good balance
      distance:           200,    // How far from start of string to look
      minMatchCharLength: 2,      // Ignore single-char queries
      includeScore:       true,
      shouldSort:         true,
      ignoreLocation:     true,   // Search entire string, not just start
      keys,
    };

    return new Fuse(items, { ...defaultOptions, ...options });
  }, [items, keys]);

  // Run search — returns original items if no query
  const results = useMemo(() => {
    if (! query.trim() || ! fuse) return items;
    return fuse.search(query.trim()).map(r => r.item);
  }, [query, fuse, items]);

  const clear = useCallback(() => setQuery(''), []);

  return {
    query,
    setQuery,
    results,
    hasQuery:   query.trim().length > 0,
    totalItems: items.length,
    clear,
  };
}

/**
 * Fuse.js key configs for common student data shapes
 */
export const STUDENT_FUSE_KEYS = [
  { name: 'name',        weight: 0.5 },
  { name: 'student_id',  weight: 0.25 },
  { name: 'course',      weight: 0.15 },
  { name: 'motto',       weight: 0.1 },
];

export const CROSS_PROGRAM_FUSE_KEYS = [
  { name: 'name',        weight: 0.4 },
  { name: 'course',      weight: 0.3 },  // higher weight — cross-program search
  { name: 'student_id',  weight: 0.2 },
  { name: 'motto',       weight: 0.1 },
];