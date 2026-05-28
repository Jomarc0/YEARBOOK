// src/hooks/useFlipbookAlumniLink.js
import { useState, useCallback } from 'react';
import { alumniApi } from '@/api/alumni.api';

/**
 * Given a batch + current page index, fetches the alumni
 * profile linked to that yearbook page.
 *
 * Usage in FlipbookViewer:
 *   const { alumniData, loading, lookup, clear } = useFlipbookAlumniLink();
 *   // call lookup(batchId, pageIndex) when user hovers/clicks a student portrait
 */
export function useFlipbookAlumniLink() {
  const [alumniData, setAlumniData] = useState(null);
  const [loading,    setLoading]    = useState(false);

  const lookup = useCallback(async (batchId, pageIndex) => {
    if (!batchId || pageIndex === undefined) return;
    setLoading(true);
    setAlumniData(null);
    try {
      const { data } = await alumniApi.fromYearbookPage(batchId, pageIndex);
      setAlumniData(data?.data ?? null);
    } catch {
      setAlumniData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setAlumniData(null), []);

  return { alumniData, loading, lookup, clear };
}