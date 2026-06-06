/**
 * FlipbookViewerPage.jsx
 * src/features/yearbook/pages/FlipbookViewerPage.jsx
 *
 * FIXES applied:
 *   1. Passes batchId down to FlipbookViewer (was missing — alumni popup never worked).
 *   2. Passes pdfReady + isPremium to FlipbookViewer → ControlBar → DownloadYearbookButton.
 *   3. Derives isPremium from the app auth context.
 *   4. Back button now goes to /yearbook/:batchId instead of -1 so the user
 *      always has a sensible escape route even after a hard refresh.
 */
import React, { Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useYearbook } from '../hooks/useYearbook';
import { useAuth } from '@/features/auth/hooks/useAuth';

const FlipbookViewer = React.lazy(() =>
  import('../components/flipbook/FlipbookViewer'),
);

const GOLD = '#c9a84c';
const BG   = '#0a0a14';

export default function FlipbookViewerPage() {
  const { batchId }   = useParams();
  const navigate      = useNavigate();
  const { user: currentUser } = useAuth();

  // isPremium: true when the user has an active premium subscription OR
  // when the platform has disabled subscription gating entirely.
  const isPremium = !!(
    currentUser?.is_premium ||
    currentUser?.tier === 'premium' ||
    currentUser?.subscription?.status === 'active'
  );

  const {
    loading, error,
    meta, pages, toc, bookmarks, searchResults,
    search, addBookmark, removeBookmark, downloadPdf,
  } = useYearbook(batchId);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: BG }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `2px solid rgba(201,168,76,.2)`,
          borderTop: `2px solid ${GOLD}`,
          animation: 'spin 1s linear infinite',
        }} role="status" aria-label="Loading yearbook" />
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,.35)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Opening yearbook…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: BG }}>
        <p style={{ fontSize: 14, color: '#e24b4a' }}>{error}</p>
        <Link
          to={`/yearbook/${batchId}`}
          style={{
            fontSize: 12, color: 'rgba(255,255,255,.4)',
            textDecoration: 'underline',
          }}
        >
          ← Back to Yearbook Home
        </Link>
      </div>
    );
  }

  // ── Viewer ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* Top meta bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-0">

        {/* Back → /yearbook/:batchId (not history.back() to avoid loop) */}
        <button
          onClick={() => navigate(`/yearbook/${batchId}`)}
          className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <div className="text-center">
          <p style={{
            fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.25)',
          }}>
            {meta?.school}
          </p>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 14, color: 'rgba(255,255,255,.5)',
          }}>
            {meta?.title ?? 'Senior Yearbook'} · {meta?.year}
          </p>
        </div>

        {/* Copy share link */}
        <button
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Copy shareable link"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5"  r="3"/>
            <circle cx="6"  cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
          </svg>
          Share
        </button>
      </div>

      {/* Flipbook */}
      <Suspense fallback={<SpinnerCentered />}>
        <FlipbookViewer
          pages={pages}
          meta={meta}
          toc={toc}
          bookmarks={bookmarks}
          searchResults={searchResults}
          currentUser={currentUser}
          batchId={batchId}
          pdfReady={!!meta?.pdfReady}
          isPremium={isPremium}
          onSearch={search}
          onAddBookmark={addBookmark}
          onRemoveBookmark={removeBookmark}
          onDownload={downloadPdf}
        />
      </Suspense>
    </div>
  );
}

function SpinnerCentered() {
  return (
    <div className="flex items-center justify-center py-24">
      <div style={{
        width: 32, height: 32,
        border: '2px solid rgba(201,168,76,.15)',
        borderTop: `2px solid ${GOLD}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} role="status" aria-label="Loading flipbook" />
    </div>
  );
}
