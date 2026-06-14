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
import React, { Suspense, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useYearbook } from '../hooks/useYearbook';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { recordContentView } from '@/api/analytics.api';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const FlipbookViewer = React.lazy(() =>
  import('../components/flipbook/FlipbookViewer'),
);

const BG   = '#0a0a14';

function YearbookLoadingSkeleton() {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: BG }}>
      <div className="mx-auto w-full max-w-4xl">
        <LoadingSkeleton variant="page" count={1} />
      </div>
    </div>
  );
}

export default function FlipbookViewerPage() {
  const { batchId }   = useParams();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [shareState, setShareState] = useState('idle');
  const yearbookScope = React.useMemo(() => ({
    department: searchParams.get('department') || undefined,
    course: searchParams.get('course') || undefined,
  }), [searchParams]);

  // Standard and Premium users can download PDFs; free users can only view.
  const isPremium = !!(
    currentUser?.is_subscribed ||
    currentUser?.is_premium ||
    currentUser?.tier === 'standard' ||
    currentUser?.tier === 'premium' ||
    currentUser?.subscription?.status === 'active' ||
    currentUser?.subscription?.tier === 'standard' ||
    currentUser?.subscription?.tier === 'premium'
  );

  const {
    loading, error,
    meta, pages, toc, bookmarks, searchResults,
    search, addBookmark, removeBookmark, downloadPdf,
  } = useYearbook(batchId, yearbookScope);
  const scopeLabel = meta?.scope?.label || yearbookScope.course || yearbookScope.department;

  const handleShare = React.useCallback(async () => {
    const shareUrl = window.location.href;
    const title = `${meta?.title ?? 'Sinag-Bughaw Yearbook'} ${meta?.year ?? ''}${scopeLabel ? ` - ${scopeLabel}` : ''}`.trim();

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }

      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 1800);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setShareState('error');
      window.setTimeout(() => setShareState('idle'), 2200);
    }
  }, [meta, scopeLabel]);

  React.useEffect(() => {
    if (!batchId || !meta) return;
    recordContentView({
      content_type: 'yearbook',
      content_id: Number(batchId),
      title: meta?.batch?.name || meta?.title || `Yearbook ${batchId}`,
      category: scopeLabel || (meta?.batch?.graduation_year ? `Batch ${meta.batch.graduation_year}` : 'yearbook'),
      url: `/yearbook/${batchId}/view${window.location.search}`,
    }).catch(() => {});
  }, [batchId, meta, scopeLabel]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return <YearbookLoadingSkeleton />;

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
            {meta?.title ?? 'Senior Yearbook'} · {meta?.year}{scopeLabel ? ` · ${scopeLabel}` : ''}
          </p>
        </div>

        {/* Copy share link */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{
            color: shareState === 'error' ? '#e24b4a' : shareState === 'copied' ? '#c9a84c' : 'rgba(255,255,255,.35)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
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
          {shareState === 'copied' ? 'Copied' : shareState === 'error' ? 'Share failed' : 'Share'}
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
          yearbookScope={yearbookScope}
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
  return <YearbookLoadingSkeleton />;
}
