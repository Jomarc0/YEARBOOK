/**
 * useYearbook.js
 * src/features/yearbook/hooks/useYearbook.js
 *
 * Central data hook for the entire yearbook feature.
 * Fetches all required data in parallel and assembles an ordered
 * page manifest that FlipbookViewer renders leaf-by-leaf.
 *
 * Reuses existing student/section/gallery data — no duplication.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { yearbookApi } from '../../../api/yearbook.api';

/**
 * Page types — each maps to a leaf component in /components/pages/
 * cover | dedication | toc | section-header | student-grid |
 * student-quotes | gallery | faculty | stats | closing
 */

export function useYearbook(batchId) {
  const [state, setState] = useState({
    loading:     true,
    error:       null,
    meta:        null,      // { title, school, year, coverUrl, theme }
    pages:       [],        // ordered array of page descriptor objects
    toc:         [],        // table of contents entries
    bookmarks:   [],        // user's bookmarked page indices
    searchResults: null,    // null = idle, [] = no results, [...] = hits
  });

  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (!batchId) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // All requests in parallel — they are independent
      const [metaRes, studentsRes, sectionsRes, galleriesRes, facultyRes, bookmarksRes] =
        await Promise.all([
          yearbookApi.meta(batchId),
          yearbookApi.flipbookData(),          // existing endpoint
          yearbookApi.sectionPages(batchId),
          yearbookApi.galleryPages(batchId),
          yearbookApi.facultyPage(batchId),
          yearbookApi.getBookmarks(batchId),
        ]);

      const meta      = metaRes.data;
      const students  = studentsRes.data;      // flat array
      const sections  = sectionsRes.data;      // [{ id, name, students[] }]
      const galleries = galleriesRes.data;     // [{ id, name, photos[] }]
      const faculty   = facultyRes.data;       // [{ id, name, role, photo }]
      const bookmarks = bookmarksRes.data;     // [{ id, pageIndex, label }]

      // ── Build ordered page manifest ─────────────────────────────────────
      const pages = [];

      // 1. Cover (left) + Dedication (right)
      pages.push({ type: 'cover',       side: 'left',  meta });
      pages.push({ type: 'dedication',  side: 'right', meta });

      // 2. Table of contents (two pages = one spread)
      pages.push({ type: 'toc', side: 'left',  toc: [] }); // filled below
      pages.push({ type: 'toc', side: 'right', toc: [] });

      // 3. Section spreads — each section gets a header + portrait grid pages
      sections.forEach((section) => {
        pages.push({ type: 'section-header', side: 'left',  section });
        pages.push({ type: 'section-header', side: 'right', section });

        // Chunk students 4 per page (portrait grid)
        const chunks = chunkArray(section.students, 4);
        chunks.forEach((chunk, idx) => {
          pages.push({
            type:    'student-grid',
            side:    idx % 2 === 0 ? 'left' : 'right',
            students: chunk,
            section,
            pageNum:  pages.length + 1,
          });
          pages.push({
            type:    'student-quotes',
            side:    idx % 2 === 0 ? 'right' : 'left',
            students: chunk,
            section,
            pageNum:  pages.length + 1,
          });
        });
      });

      // 4. Gallery spreads
      galleries.forEach((gallery) => {
        pages.push({ type: 'gallery', side: 'left',  gallery });
        pages.push({ type: 'gallery', side: 'right', gallery });
      });

      // 5. Faculty page
      if (faculty.length > 0) {
        pages.push({ type: 'faculty', side: 'left',  faculty });
        pages.push({ type: 'faculty', side: 'right', faculty });
      }

      // 6. Batch stats
      pages.push({ type: 'stats', side: 'left',  meta, students, sections });
      pages.push({ type: 'stats', side: 'right', meta, students, sections });

      // 7. Closing / back cover
      pages.push({ type: 'closing', side: 'left',  meta });
      pages.push({ type: 'closing', side: 'right', meta });

      // Pad to even count (react-pageflip requirement)
      if (pages.length % 2 !== 0) {
        pages.push({ type: 'blank', side: 'right' });
      }

      // Build TOC from assembled pages
      const toc = buildTOC(pages);
      // Patch TOC pages with real data
      pages[2].toc = toc;
      pages[3].toc = toc;

      setState({
        loading:      false,
        error:        null,
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

  // ── Actions ──────────────────────────────────────────────────────────────

  const search = useCallback(async (q) => {
    if (!q.trim()) {
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
      setState((s) => ({ ...s, bookmarks: [...s.bookmarks, data] }));
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

  const downloadPdf = useCallback(async (userId) => {
    try {
      const { data } = userId
        ? await yearbookApi.exportStudentPdf(userId)
        : await yearbookApi.exportCertificate();

      const blob   = new Blob([data], { type: 'application/pdf' });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = userId ? `profile-${userId}.pdf` : 'graduation-certificate.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, []);

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

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildTOC(pages) {
  const toc = [];
  pages.forEach((page, idx) => {
    if (page.side !== 'left') return; // one TOC entry per spread
    const entry = tocEntry(page, idx);
    if (entry) toc.push(entry);
  });
  return toc;
}

function tocEntry(page, idx) {
  const map = {
    'cover':          { label: 'Cover',           icon: 'book' },
    'dedication':     null,
    'toc':            { label: 'Contents',         icon: 'list' },
    'section-header': { label: page.section?.name, icon: 'users' },
    'student-grid':   null,
    'student-quotes': null,
    'gallery':        { label: page.gallery?.name, icon: 'photo' },
    'faculty':        { label: 'Faculty',          icon: 'school' },
    'stats':          { label: 'At a Glance',      icon: 'chart-bar' },
    'closing':        { label: 'Closing',          icon: 'heart' },
  };
  const entry = map[page.type];
  if (!entry) return null;
  return { pageIndex: idx, ...entry };
}