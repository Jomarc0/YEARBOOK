/**
 * DownloadYearbookButton.jsx
 * src/features/yearbook/components/controls/DownloadYearbookButton.jsx
 *
 * Handles the full download flow:
 *   1. If PDF is already generated → streams directly via
 *      GET /api/yearbooks/:batchId/download (premium route).
 *   2. If PDF is not ready → shows "Generating…" state, polls
 *      GET /api/yearbooks/:batchId every 5 s until pdfReady = true.
 *
 * Props:
 *   batchId   {string|number}  The batch DB id
 *   pdfReady  {boolean}        Is the PDF already generated?
 *   isPremium {boolean}        Does the user have premium?
 *
 * Non-premium users see a disabled button that links to /premium.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { yearbookApi } from '../../../../api/yearbook.api';

const GOLD   = '#c9a84c';
const DARK   = '#1a1a2e';
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS        = 24; // 2 minutes max

export default function DownloadYearbookButton({ batchId, pdfReady: initialPdfReady, isPremium }) {
  const navigate = useNavigate();

  const [phase,     setPhase]     = useState('idle');    // idle | checking | downloading | polling | error
  const [pdfReady,  setPdfReady]  = useState(initialPdfReady);
  const [pollCount, setPollCount] = useState(0);
  const [errorMsg,  setErrorMsg]  = useState(null);

  // ── Non-premium: show upgrade prompt ─────────────────────────────────────
  if (!isPremium) {
    return (
      <button
        onClick={() => navigate('/premium')}
        style={buttonStyle({ hover: false, disabled: false, variant: 'outline' })}
        title="Upgrade to Premium to download the yearbook PDF"
      >
        <LockIcon />
        Download PDF · Premium
      </button>
    );
  }

  // ── Poll until PDF is ready ───────────────────────────────────────────────
  const startPolling = useCallback(() => {
    setPhase('polling');
    setPollCount(0);

    let count = 0;
    const interval = setInterval(async () => {
      count++;
      setPollCount(count);

      if (count > MAX_POLLS) {
        clearInterval(interval);
        setPhase('error');
        setErrorMsg('PDF generation is taking longer than expected. Try again in a few minutes.');
        return;
      }

      try {
        const { data } = await yearbookApi.meta(batchId);
        if (data.pdfReady) {
          clearInterval(interval);
          setPdfReady(true);
          setPhase('idle');
        }
      } catch {
        // silently ignore poll errors — keep trying
      }
    }, POLL_INTERVAL_MS);
  }, [batchId]);

  // ── Trigger download ──────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (phase === 'downloading' || phase === 'polling') return;

    // If PDF not yet generated, trigger generation then poll
    if (!pdfReady) {
      try {
        setPhase('checking');
        await yearbookApi.generate(batchId);
        startPolling();
      } catch (err) {
        setPhase('error');
        setErrorMsg(err?.response?.data?.message ?? 'Failed to start PDF generation.');
      }
      return;
    }

    // PDF is ready — download it
    setPhase('downloading');
    setErrorMsg(null);

    try {
      const { data } = await yearbookApi.download(batchId);

      const blob   = new Blob([data], { type: 'application/pdf' });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = `yearbook-${batchId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setPhase('done');
      // Reset to idle after 3 s so user can download again
      setTimeout(() => setPhase('idle'), 3000);
    } catch (err) {
      setPhase('error');
      const status = err?.response?.status;
      if (status === 403) {
        setErrorMsg('Premium subscription required.');
      } else if (status === 404) {
        setErrorMsg('PDF not ready yet. Please wait and try again.');
      } else {
        setErrorMsg('Download failed. Please try again.');
      }
    }
  }, [phase, pdfReady, batchId, startPolling]);

  // ── Label + icon based on phase ───────────────────────────────────────────
  const { label, icon, disabled, variant } = phaseConfig(phase, pdfReady, pollCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={handleDownload}
        disabled={disabled}
        title={pdfReady ? 'Download watermarked PDF' : 'Generate and download PDF'}
        style={buttonStyle({ hover: false, disabled, variant })}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = variant === 'gold' ? '#d4b55e' : 'rgba(201,168,76,.18)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = variant === 'gold'
              ? GOLD
              : variant === 'green'
                ? 'rgba(34,197,94,.15)'
                : 'rgba(201,168,76,.08)';
          }
        }}
      >
        {icon}
        {label}
      </button>

      {/* Error message */}
      {phase === 'error' && errorMsg && (
        <p style={{ fontSize: 10, color: '#e24b4a', textAlign: 'center', maxWidth: 220 }}>
          {errorMsg}
          <button
            onClick={() => { setPhase('idle'); setErrorMsg(null); }}
            style={{ marginLeft: 6, background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: 10, textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </p>
      )}

      {/* Polling progress hint */}
      {phase === 'polling' && (
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center' }}>
          Generating PDF… ({pollCount * 5}s elapsed)
        </p>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function phaseConfig(phase, pdfReady, pollCount) {
  switch (phase) {
    case 'checking':
      return { label: 'Starting…',    icon: <Spinner />, disabled: true,  variant: 'outline' };
    case 'polling':
      return { label: 'Generating PDF…', icon: <Spinner />, disabled: true, variant: 'outline' };
    case 'downloading':
      return { label: 'Downloading…', icon: <Spinner />, disabled: true,  variant: 'outline' };
    case 'done':
      return { label: 'Downloaded!',  icon: <CheckIcon />, disabled: false, variant: 'green' };
    case 'error':
      return { label: 'Try again',    icon: <DownloadIcon />, disabled: false, variant: 'outline' };
    default:
      return pdfReady
        ? { label: 'Download PDF',       icon: <DownloadIcon />, disabled: false, variant: 'gold' }
        : { label: 'Generate & Download', icon: <BookIcon />,     disabled: false, variant: 'outline' };
  }
}

function buttonStyle({ disabled, variant }) {
  const base = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           6,
    height:        38,
    padding:       '0 18px',
    borderRadius:  19,
    cursor:        disabled ? 'not-allowed' : 'pointer',
    fontSize:      12,
    fontFamily:    'inherit',
    fontWeight:    600,
    letterSpacing: '0.04em',
    transition:    'all 0.15s',
    opacity:       disabled ? 0.55 : 1,
    border:        'none',
    whiteSpace:    'nowrap',
  };

  if (variant === 'gold') {
    return { ...base, background: GOLD, color: DARK };
  }
  if (variant === 'green') {
    return { ...base, background: 'rgba(34,197,94,.15)', color: '#22c55e', border: '0.5px solid #22c55e' };
  }
  // outline
  return { ...base, background: 'rgba(201,168,76,.08)', color: GOLD, border: `0.5px solid ${GOLD}` };
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true"
      style={{ animation: 'spin 1s linear infinite' }}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}