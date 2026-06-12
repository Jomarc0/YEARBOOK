import { useState, useCallback } from 'react';
import { downloadYearbookPdf } from '../../../../api/yearbook.api';

const GOLD = '#c9a84c';
const DARK = '#1a1a2e';

export default function DownloadYearbookButton({ batchId, pdfReady: initialPdfReady, isPremium = false, scope = {} }) {
  const [phase, setPhase] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDownload = useCallback(async () => {
    if (!isPremium) return;
    if (phase === 'downloading') return;

    setPhase('downloading');
    setErrorMsg(null);

    try {
      const suffix = scope.course || scope.department || batchId;
      await downloadYearbookPdf(batchId, scope, `yearbook-${suffix}.pdf`);

      setPhase('done');
      setTimeout(() => setPhase('idle'), 3000);
    } catch (err) {
      setPhase('error');
      const status = err?.response?.status;
      if (status === 402 || status === 403) {
        setErrorMsg('Standard or Premium subscription required.');
      } else if (status === 404) {
        setErrorMsg('Yearbook PDF endpoint was not found.');
      } else {
        setErrorMsg(err?.response?.data?.message ?? err?.message ?? 'Download failed. Please try again.');
      }
    }
  }, [phase, batchId, scope, isPremium]);

  const { label, icon, disabled, variant } = phaseConfig(phase, initialPdfReady, isPremium);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={handleDownload}
        disabled={disabled}
        title={isPremium ? 'Download yearbook PDF' : 'Standard or Premium subscription required'}
        style={buttonStyle({ disabled, variant })}
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
    </div>
  );
}

function phaseConfig(phase, pdfReady, canDownload) {
  if (!canDownload) {
    return { label: 'PDF Locked', icon: <LockIcon />, disabled: true, variant: 'locked' };
  }

  switch (phase) {
    case 'downloading':
      return { label: 'Downloading...', icon: <Spinner />, disabled: true, variant: 'outline' };
    case 'done':
      return { label: 'Downloaded!', icon: <CheckIcon />, disabled: false, variant: 'green' };
    case 'error':
      return { label: 'Try again', icon: <DownloadIcon />, disabled: false, variant: 'outline' };
    default:
      return pdfReady
        ? { label: 'Download PDF', icon: <DownloadIcon />, disabled: false, variant: 'gold' }
        : { label: 'Download PDF', icon: <DownloadIcon />, disabled: false, variant: 'outline' };
  }
}

function buttonStyle({ disabled, variant }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 38,
    padding: '0 18px',
    borderRadius: 19,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'all 0.15s',
    opacity: disabled ? 0.55 : 1,
    border: 'none',
    whiteSpace: 'nowrap',
  };

  if (variant === 'gold') {
    return { ...base, background: GOLD, color: DARK };
  }
  if (variant === 'green') {
    return { ...base, background: 'rgba(34,197,94,.15)', color: '#22c55e', border: '0.5px solid #22c55e' };
  }
  if (variant === 'locked') {
    return { ...base, background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.38)', border: '0.5px solid rgba(255,255,255,.14)' };
  }
  return { ...base, background: 'rgba(201,168,76,.08)', color: GOLD, border: `0.5px solid ${GOLD}` };
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
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
