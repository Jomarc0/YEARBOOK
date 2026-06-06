/**
 * useFlipbookAlumniLink.js
 * src/hooks/useFlipbookAlumniLink.js
 *
 * WHY THIS FILE EXISTS:
 *   FlipbookViewer.jsx imports this hook but it was never created,
 *   causing a hard crash the moment the flipbook page loaded.
 *
 * WHAT IT DOES:
 *   When a student portrait is clicked inside the flipbook, the viewer
 *   calls lookup(batchId, pageIndex). This hook hits the backend to find
 *   the first student on that page, then fetches their alumni/career data.
 *   The result is shown in the alumni popup overlay.
 *
 * API calls:
 *   GET /api/yearbook/alumni-from-page?batch_id=&page=N
 *     → { id, name, batch_year, career: { job_title, company, location, field } }
 *       or 404 if no alumni record exists for that page
 */
import { useState, useCallback, useRef } from 'react';
import api from '../api/client';

export function useFlipbookAlumniLink() {
  const [alumniData,   setAlumniData]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const controllerRef                   = useRef(null);

  /**
   * lookup(batchId, pageIndex)
   * Fetches alumni data for whoever appears on `pageIndex` in `batchId`.
   * Safe to call multiple times — cancels the previous request automatically.
   */
  const lookup = useCallback(async (batchId, pageIndex) => {
    if (!batchId || pageIndex == null) return;

    // Cancel any in-flight request
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    setAlumniData(null);

    try {
      const { data } = await api.get('/yearbook/alumni-from-page', {
        params: { batch_id: batchId, page: pageIndex },
        signal: controllerRef.current.signal,
      });

      // Attach a ready-made tracker URL so the viewer can navigate on click
      setAlumniData({
        ...data,
        tracker_url: `/alumni-tracker?batch_id=${batchId}&highlight=${data.id}`,
      });
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      // 404 = no alumni record for this page — silently clear
      // Any other error = also clear so popup doesn't show broken state
      setAlumniData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Dismiss the popup and reset state */
  const clear = useCallback(() => {
    controllerRef.current?.abort();
    setAlumniData(null);
    setLoading(false);
  }, []);

  return { alumniData, loading, lookup, clear };
}