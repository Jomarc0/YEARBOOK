/**
 * ControlBar.jsx
 * src/features/yearbook/components/controls/ControlBar.jsx
 *
 * Bottom control strip: navigation, zoom, fullscreen,
 * sidebar toggles (TOC / search / bookmarks), download.
 * Uses Tailwind classes consistent with your existing design system.
 */
import React from 'react';

const GOLD = '#c9a84c';

export default function ControlBar({
  currentPage, totalPages,
  currentSpread, totalSpreads,
  zoom, zoomMin, zoomMax,
  fullscreen, sidebarTab, isBookmarked,
  onPrev, onNext,
  onZoomIn, onZoomOut, onZoomReset,
  onToggleFullscreen,
  onToggleTOC, onToggleSearch, onToggleBookmarks,
  onBookmark, onDownload,
}) {
  const atStart = currentPage === 0;
  const atEnd   = currentPage >= totalPages - 1;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 mt-2"
      style={{ maxWidth: 780 }}
      role="toolbar"
      aria-label="Yearbook controls"
    >
      {/* Navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
        <CtrlBtn onClick={onPrev} disabled={atStart} aria-label="Previous spread" title="← Previous">
          <ChevronLeft />
        </CtrlBtn>

        <span
          className="min-w-[100px] text-center text-xs tracking-widest select-none"
          style={{ color: 'rgba(255,255,255,.45)' }}
        >
          {currentPage === 0
            ? 'Cover'
            : currentPage >= totalPages - 1
              ? 'Back cover'
              : `${currentSpread} / ${totalSpreads - 1}`}
        </span>

        <CtrlBtn onClick={onNext} disabled={atEnd} aria-label="Next spread" title="Next →">
          <ChevronRight />
        </CtrlBtn>
      </div>

      <Divider />

      {/* Zoom */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
        <CtrlBtn onClick={onZoomOut} disabled={zoomMin} aria-label="Zoom out" title="Zoom out">
          <ZoomOut />
        </CtrlBtn>
        <button
          onClick={onZoomReset}
          className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,.45)', minWidth: 44 }}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <CtrlBtn onClick={onZoomIn} disabled={zoomMax} aria-label="Zoom in" title="Zoom in">
          <ZoomIn />
        </CtrlBtn>
      </div>

      <Divider />

      {/* Sidebar toggles */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
        <CtrlBtn
          onClick={onToggleTOC}
          active={sidebarTab === 'toc'}
          aria-label="Table of contents"
          title="Contents"
        >
          <ListIcon />
        </CtrlBtn>
        <CtrlBtn
          onClick={onToggleSearch}
          active={sidebarTab === 'search'}
          aria-label="Search yearbook"
          title="Search"
        >
          <SearchIcon />
        </CtrlBtn>
        <CtrlBtn
          onClick={onToggleBookmarks}
          active={sidebarTab === 'bookmarks'}
          aria-label="Bookmarks"
          title="Bookmarks"
        >
          <BookmarkIcon />
        </CtrlBtn>
      </div>

      <Divider />

      {/* Actions */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
        <CtrlBtn
          onClick={onBookmark}
          active={isBookmarked}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          title="Bookmark page"
        >
          <HeartIcon filled={isBookmarked} />
        </CtrlBtn>
        <CtrlBtn
          onClick={onToggleFullscreen}
          active={fullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title="Fullscreen (F)"
        >
          {fullscreen ? <Minimize /> : <Maximize />}
        </CtrlBtn>
      </div>

      {/* Download */}
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-90 active:scale-95"
        style={{
          border:     `0.5px solid ${GOLD}`,
          color:      GOLD,
          background: 'rgba(201,168,76,.08)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,.08)')}
        title="Download PDF"
      >
        <DownloadIcon />
        Download PDF
      </button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CtrlBtn({ children, onClick, disabled, active, 'aria-label': label, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={`
        w-8 h-8 flex items-center justify-center rounded-md transition-all
        ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 active:scale-95'}
        ${active   ? 'bg-white/15' : ''}
      `}
      style={{ color: active ? GOLD : 'rgba(255,255,255,.55)' }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-white/10 mx-1" aria-hidden="true" />;
}

// ── Minimal inline SVG icons (no external dep) ────────────────────────────────

const icon = (d, vb = '0 0 24 24') => (
  <svg width="16" height="16" viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const ChevronLeft  = () => icon('M15 18l-6-6 6-6');
const ChevronRight = () => icon('M9 18l6-6-6-6');
const ZoomIn       = () => icon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>);
const ZoomOut      = () => icon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></>);
const ListIcon     = () => icon(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>);
const SearchIcon   = () => icon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>);
const BookmarkIcon = () => icon('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
const DownloadIcon = () => icon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>);
const Maximize     = () => icon(<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>);
const Minimize     = () => icon(<><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>);

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? GOLD : 'none'} stroke={filled ? GOLD : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}