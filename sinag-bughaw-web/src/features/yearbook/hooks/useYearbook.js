/**
 * useYearbook.js
 * src/features/yearbook/hooks/useYearbook.js
 *
 * Central data hook for the entire yearbook feature.
 * Fetches meta + pages from the backend (which builds the full ordered
 * page manifest server-side via YearbookController@pages), then layers
 * in bookmarks. No client-side page building needed.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { downloadYearbookPdf, yearbookApi } from '../../../api/yearbook.api';

const TOC_ENTRIES_PER_PAGE = 7;

export function useYearbook(batchId, scope = {}) {
  const [state, setState] = useState({
    loading:       true,
    error:         null,
    meta:          null,   // { title, school, year, coverUrl, theme, status, pdfReady }
    pages:         [],     // ordered page descriptor array built by backend
    toc:           [],     // table of contents entries derived from pages
    bookmarks:     [],     // user's saved page indices
    searchResults: null,   // null = idle | [] = no results | [...] = hits
  });

  const abortRef = useRef(null);
  const cleanScope = useMemo(() => ({
    department: scope.department || undefined,
    course: scope.course || undefined,
  }), [scope.department, scope.course]);

  const load = useCallback(async () => {
    if (!batchId) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Fetch pages manifest + bookmarks in parallel.
      // yearbookApi.pages() returns { meta, pages[] } fully built by the backend.
      // yearbookApi.meta() returns cover meta separately (pdfReady, theme, etc.)
      const [metaRes, pagesRes, bookmarksRes] = await Promise.all([
        yearbookApi.meta(batchId),
        yearbookApi.pages(batchId, cleanScope),
        yearbookApi.getBookmarks(batchId),
      ]);

      // Backend response shape: { meta: {...}, toc: [...], pages: [...] }
      const serverMeta  = pagesRes.data?.meta  ?? {};
      const pages       = pagesRes.data?.pages ?? [];

      // Merge with the richer meta from /api/yearbooks/:batchId
      // (adds pdfReady, coverUrl, theme, status which pages endpoint omits)
      const meta = {
        ...serverMeta,
        ...(metaRes.data ?? {}),
      };

      const bookmarks = bookmarksRes.data ?? [];

      const serverToc = pagesRes.data?.toc;
      const tocFromPages = pages.find((page) => page?.type === 'toc' && Array.isArray(page?.toc))?.toc;
      const toc = Array.isArray(serverToc) && serverToc.length
        ? serverToc
        : Array.isArray(tocFromPages) && tocFromPages.length
          ? tocFromPages
          : buildTOC(pages);

      const firstTocIndex = pages.findIndex((page) => page?.type === 'toc');
      const pagesWithToc = pages.map((page, index) => {
        if (page?.type !== 'toc') return page;

        const tocOffset = firstTocIndex >= 0
          ? Math.max(0, index - firstTocIndex) * TOC_ENTRIES_PER_PAGE
          : 0;

        return {
          ...page,
          toc,
          tocStart: Number.isFinite(page.tocStart) ? page.tocStart : tocOffset,
        };
      });

      setState({
        loading:       false,
        error:         null,
        meta,
        pages:         pagesWithToc,
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
  }, [batchId, cleanScope]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Actions

  const search = useCallback(async (q) => {
    if (!q?.trim()) {
      setState((s) => ({ ...s, searchResults: null }));
      return;
    }
    try {
      const { data } = await yearbookApi.search(batchId, q.trim(), cleanScope);
      setState((s) => ({ ...s, searchResults: data }));
    } catch {
      setState((s) => ({ ...s, searchResults: [] }));
    }
  }, [batchId, cleanScope]);

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
   * downloadPdf delegates to DownloadYearbookButton for the main
   * batch yearbook, but keeps the per-student & certificate flows here
   * for backward compatibility with onDownload prop in FlipbookViewer.
   */
  const downloadPdf = useCallback(async () => {
    try {
      const suffix = cleanScope.course || cleanScope.department || batchId;
      await downloadYearbookPdf(batchId, cleanScope, `yearbook-${suffix}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [batchId, cleanScope]);

  return {
    ...state,
    reload:         load,
    search,
    addBookmark,
    removeBookmark,
    downloadPdf,
  };
}

// Helpers

/**
 * Build a flat TOC array from the server-returned page manifest.
 * One entry per spread (left pages only), skipping types that
 * don't warrant their own TOC entry.
 */
function buildTOC(pages) {
  const toc = [];

  pages.forEach((page, idx) => {
    // One TOC entry per spread use the left page only
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
    'course-header':  { label: page.course?.name ?? 'Course',     icon: 'book'      },
    'section-header': { label: sectionLabel(page.section),       icon: 'users'     },
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

function sectionLabel(section = {}) {
  const name = section?.name || 'Section';
  const course = section?.strand || section?.course;

  return course && course !== name ? `${course} - ${name}` : name;
}
