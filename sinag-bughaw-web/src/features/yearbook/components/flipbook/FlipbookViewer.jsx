/**
 * FlipbookViewer.jsx
 * src/features/yearbook/components/flipbook/FlipbookViewer.jsx
 *
 * Core flipbook engine. Wraps react-pageflip with:
 *   - Keyboard navigation (←/→, Home/End)
 *   - Swipe support (built into react-pageflip)
 *   - Zoom (CSS scale)
 *   - Fullscreen API
 *   - Thumbnail sidebar toggle
 *   - Bookmark integration
 *   - Search jump
 *   - Page corner click hotspots
 *
 * Install: npm install react-pageflip
 */
import React, {
  useRef, useState, useEffect, useCallback, forwardRef,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import YearbookPageRenderer from './YearbookPageRenderer';
import ControlBar     from '../controls/ControlBar';
import ThumbnailSidebar from '../sidebar/ThumbnailSidebar';
import SearchPanel    from '../sidebar/SearchPanel';
import BookmarkPanel  from '../sidebar/BookmarkPanel';

const ZOOM_STEPS = [0.75, 1, 1.15, 1.3];

export default function FlipbookViewer({
  pages        = [],
  meta         = {},
  toc          = [],
  bookmarks    = [],
  searchResults = null,
  onSearch,
  onAddBookmark,
  onRemoveBookmark,
  onDownload,
  currentUser,
}) {
  const bookRef      = useRef(null);
  const wrapRef      = useRef(null);

  const [currentPage,  setCurrentPage]  = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [zoomIndex,    setZoomIndex]    = useState(1);     // index into ZOOM_STEPS
  const [fullscreen,   setFullscreen]   = useState(false);
  const [sidebarTab,   setSidebarTab]   = useState(null);  // null | 'toc' | 'search' | 'bookmarks'
  const [isAnimating,  setIsAnimating]  = useState(false);

  const currentSpread = Math.floor(currentPage / 2);
  const totalSpreads  = Math.ceil(pages.length / 2);
  const zoom          = ZOOM_STEPS[zoomIndex];

  // ── Flipbook event handlers ───────────────────────────────────────────────

  const handleFlip      = useCallback((e) => setCurrentPage(e.data), []);
  const handleInit      = useCallback((e) => setTotalPages(e.object.getPageCount()), []);
  const handleFlipStart = useCallback(() => setIsAnimating(true), []);
  const handleFlipEnd   = useCallback(() => setIsAnimating(false), []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const flipNext = useCallback(() => {
    if (!isAnimating) bookRef.current?.pageFlip().flipNext();
  }, [isAnimating]);

  const flipPrev = useCallback(() => {
    if (!isAnimating) bookRef.current?.pageFlip().flipPrev();
  }, [isAnimating]);

  const goToPage = useCallback((pageIndex) => {
    bookRef.current?.pageFlip().flip(pageIndex);
    setSidebarTab(null);
  }, []);

  const goToSpread = useCallback((spreadIndex) => {
    goToPage(spreadIndex * 2);
  }, [goToPage]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown':  flipNext(); break;
        case 'ArrowLeft':  case 'ArrowUp':    flipPrev(); break;
        case 'Home':  goToPage(0);                       break;
        case 'End':   goToPage(pages.length - 1);        break;
        case 'f': case 'F': toggleFullscreen();           break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipNext, flipPrev, goToPage, pages.length]);

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const zoomIn  = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const zoomReset = () => setZoomIndex(1);

  // ── Fullscreen ────────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Search jump ───────────────────────────────────────────────────────────

  const handleSearchJump = useCallback((pageIndex) => {
    goToPage(pageIndex);
  }, [goToPage]);

  // ── Bookmark current page ─────────────────────────────────────────────────

  const handleBookmarkCurrent = useCallback(() => {
    const page  = pages[currentPage];
    const label = pageLabel(page, currentPage);
    onAddBookmark?.(currentPage, label);
  }, [currentPage, pages, onAddBookmark]);

  const isCurrentBookmarked = bookmarks.some((b) => b.pageIndex === currentPage);

  // ── Sidebar toggle ────────────────────────────────────────────────────────

  const toggleSidebar = (tab) =>
    setSidebarTab((cur) => (cur === tab ? null : tab));

  // ── Render ────────────────────────────────────────────────────────────────

  if (!pages.length) return null;

  return (
    <div
      ref={wrapRef}
      className={`
        flex flex-col items-center
        ${fullscreen ? 'fixed inset-0 z-50 bg-[#0a0a14] overflow-auto' : 'relative'}
      `}
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Main layout: sidebar + book */}
      <div className="flex w-full justify-center items-start gap-4 px-4 py-6">

        {/* Left sidebar (TOC / Search / Bookmarks) */}
        {sidebarTab && (
          <aside className="w-64 flex-shrink-0 sticky top-6 max-h-[80vh] overflow-y-auto rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            {sidebarTab === 'toc' && (
              <ThumbnailSidebar
                toc={toc}
                currentSpread={currentSpread}
                onNavigate={goToSpread}
              />
            )}
            {sidebarTab === 'search' && (
              <SearchPanel
                results={searchResults}
                onSearch={onSearch}
                onJump={handleSearchJump}
              />
            )}
            {sidebarTab === 'bookmarks' && (
              <BookmarkPanel
                bookmarks={bookmarks}
                onJump={goToPage}
                onRemove={onRemoveBookmark}
              />
            )}
          </aside>
        )}

        {/* Book stage */}
        <div
          className="flex-shrink-0 relative"
          style={{
            transform:       `scale(${zoom})`,
            transformOrigin: 'top center',
            transition:      'transform 0.3s ease',
            marginBottom:    zoom > 1 ? `${(zoom - 1) * 420}px` : 0,
          }}
        >
          {/* Page-corner click zones */}
          <button
            onClick={flipPrev}
            disabled={currentPage === 0}
            aria-label="Previous page"
            className="absolute left-0 bottom-0 w-14 h-14 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            style={{
              clipPath: 'polygon(0 100%, 100% 100%, 0 0)',
              background: 'linear-gradient(135deg, rgba(201,168,76,.25) 0%, transparent 70%)',
            }}
          />
          <button
            onClick={flipNext}
            disabled={currentPage >= pages.length - 1}
            aria-label="Next page"
            className="absolute right-0 bottom-0 w-14 h-14 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            style={{
              clipPath: 'polygon(100% 100%, 0 100%, 100% 0)',
              background: 'linear-gradient(225deg, rgba(201,168,76,.25) 0%, transparent 70%)',
            }}
          />

          <HTMLFlipBook
            ref={bookRef}
            width={340}
            height={460}
            size="fixed"
            minWidth={260}
            maxWidth={340}
            minHeight={360}
            maxHeight={460}
            showCover={true}
            flippingTime={700}
            useMouseEvents={true}
            swipeDistance={40}
            showPageCorners={true}
            clickEventForward={false}
            usePortrait={false}
            startZIndex={0}
            onFlip={handleFlip}
            onInit={handleInit}
            onFlipStart={handleFlipStart}
            onFlipEnd={handleFlipEnd}
            className="yearbook-flipbook"
          >
            {pages.map((page, idx) => (
              <YearbookPageRenderer
                key={idx}
                page={page}
                pageIndex={idx}
                onNavigate={goToPage}
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Control bar */}
      <ControlBar
        currentPage={currentPage}
        totalPages={pages.length}
        currentSpread={currentSpread}
        totalSpreads={totalSpreads}
        zoom={zoom}
        zoomMin={zoomIndex === 0}
        zoomMax={zoomIndex === ZOOM_STEPS.length - 1}
        fullscreen={fullscreen}
        sidebarTab={sidebarTab}
        isBookmarked={isCurrentBookmarked}
        onPrev={flipPrev}
        onNext={flipNext}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        onToggleFullscreen={toggleFullscreen}
        onToggleTOC={() => toggleSidebar('toc')}
        onToggleSearch={() => toggleSidebar('search')}
        onToggleBookmarks={() => toggleSidebar('bookmarks')}
        onBookmark={handleBookmarkCurrent}
        onDownload={() => onDownload?.(currentUser?.id)}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pageLabel(page, idx) {
  if (!page) return `Page ${idx + 1}`;
  const labels = {
    cover:           'Cover',
    dedication:      'Dedication',
    toc:             'Table of Contents',
    'section-header': page.section?.name ?? 'Section',
    'student-grid':  `${page.section?.name ?? 'Students'} — portraits`,
    'student-quotes': `${page.section?.name ?? 'Students'} — quotes`,
    gallery:         page.gallery?.name ?? 'Gallery',
    faculty:         'Faculty',
    stats:           'Batch at a Glance',
    closing:         'Closing',
  };
  return labels[page.type] ?? `Page ${idx + 1}`;
}