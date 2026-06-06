/**
 * useYearbook.js
 * src/features/yearbook/hooks/useYearbook.js
 *
 * Central data hook for the entire yearbook feature.
 * Fetches meta + pages from the backend (which builds the full ordered
 * page manifest server-side via YearbookController@pages), then layers
 * in bookmarks. No client-side page building needed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { yearbookApi } from '../../../api/yearbook.api';

export function useYearbook(batchId) {
  const [state, setState] = useState({
    loading:       true,
    error:         null,
    meta:          null,   // { title, school, year, coverUrl, theme, status, pdfReady }
    pages:         [],     // ordered page descriptor array — built by backend
    toc:           [],     // table of contents entries derived from pages
    bookmarks:     [],     // user's saved page indices
    searchResults: null,   // null = idle | [] = no results | [...] = hits
  });

  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (!batchId) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Fetch pages manifest + bookmarks in parallel.
      // yearbookApi.pages() returns { meta, pages[] } — fully built by the backend.
      // yearbookApi.meta()  returns cover meta separately (pdfReady, theme, etc.)
      const [metaRes, pagesRes, bookmarksRes] = await Promise.all([
        yearbookApi.meta(batchId),
        yearbookApi.pages(batchId),
        yearbookApi.getBookmarks(batchId),
      ]);

      // Backend response shape: { meta: {...}, pages: [...] }
      const serverMeta  = pagesRes.data?.meta  ?? {};
      const pages       = pagesRes.data?.pages ?? [];

      // Merge with the richer meta from /api/yearbooks/:batchId
      // (adds pdfReady, coverUrl, theme, status which pages endpoint omits)
      const meta = {
        ...serverMeta,
        ...(metaRes.data ?? {}),
      };

      const bookmarks = bookmarksRes.data ?? [];

      // Build TOC from the page manifest returned by the server
      const toc = buildTOC(pages);

      // Patch TOC pages (index 2 & 3) with the real toc data
      if (pages[2]?.type === 'toc') pages[2].toc = toc;
      if (pages[3]?.type === 'toc') pages[3].toc = toc;

      setState({
        loading:       false,
        error:         null,
        meta,
        pages,
        toc,
        bookmarks,
        searchResults: null,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setState((s) => ({
        ...s,
        loading: false,
        error:   err?.response?.data?.message ?? 'Failed to load yearbook.',
      }));
    }
  }, [batchId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const search = useCallback(async (q) => {
    if (!q?.trim()) {
      setState((s) => ({ ...s, searchResults: null }));
      return;
    }
    try {
      const { data } = await yearbookApi.search(batchId, q.trim());
      setState((s) => ({ ...s, searchResults: data }));
    } catch {
      setState((s) => ({ ...s, searchResults: [] }));
    }
  }, [batchId]);

  const addBookmark = useCallback(async (pageIndex, label) => {
    try {
      const { data } = await yearbookApi.addBookmark({ batchId, pageIndex, label });
      setState((s) => ({
        ...s,
        // Replace if already bookmarked on the same page, otherwise append
        bookmarks: [
          ...s.bookmarks.filter((b) => b.pageIndex !== pageIndex),
          data,
        ],
      }));
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  }, [batchId]);

  const removeBookmark = useCallback(async (bookmarkId) => {
    try {
      await yearbookApi.removeBookmark(bookmarkId);
      setState((s) => ({
        ...s,
        bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId),
      }));
    } catch (err) {
      console.error('Remove bookmark failed:', err);
    }
  }, []);

  /**
   * downloadPdf — delegates to DownloadYearbookButton for the main
   * batch yearbook, but keeps the per-student & certificate flows here
   * for backward compatibility with onDownload prop in FlipbookViewer.
   */
  const downloadPdf = useCallback(async () => {
    try {
      const { data } = await yearbookApi.exportBatchPdf(batchId);

      const blob   = new Blob([data], { type: 'application/pdf' });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = `yearbook-${batchId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [batchId]);

  return {
    ...state,
    reload:         load,
    search,
    addBookmark,
    removeBookmark,
    downloadPdf,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a flat TOC array from the server-returned page manifest.
 * One entry per spread (left pages only), skipping types that
 * don't warrant their own TOC entry.
 */
function buildTOC(pages) {
  const toc = [];

  pages.forEach((page, idx) => {
    // One TOC entry per spread — use the left page only
    if (page.side !== 'left') return;

    const entry = tocEntry(page, idx);
    if (entry) toc.push(entry);
  });

  return toc;
}

function tocEntry(page, idx) {
  const map = {
    'cover':          { label: 'Cover',                          icon: 'book'      },
    'dedication':     null,
    'toc':            { label: 'Contents',                       icon: 'list'      },
    'section-header': { label: page.section?.name ?? 'Section',  icon: 'users'     },
    'student-grid':   null,
    'student-profile': null,
    'gallery':        { label: page.gallery?.name ?? 'Gallery',  icon: 'photo'     },
    'faculty':        { label: 'Faculty',                        icon: 'school'    },
    'stats':          { label: 'At a Glance',                    icon: 'chart-bar' },
    'closing':        { label: 'Closing',                        icon: 'heart'     },
    'blank':          null,
  };

  const entry = map[page.type];
  if (!entry) return null;

  return { pageIndex: idx, ...entry };
}
