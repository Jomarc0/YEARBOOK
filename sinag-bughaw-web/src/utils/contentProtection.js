import { useEffect, useRef } from 'react';

export function disableContextMenu(el) {
  if (!el) return;
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function disableDrag(el) {
  if (!el) return;
  el.addEventListener('dragstart', (e) => e.preventDefault());
  el.setAttribute('draggable', 'false');
}

export function applyElementProtection(el) {
  if (!el) return;
  disableContextMenu(el);
  disableDrag(el);
  el.style.userSelect         = 'none';
  el.style.webkitUserSelect   = 'none';
  el.style.webkitTouchCallout = 'none';
}

export function installKeyboardGuard() {
  const BLOCKED_CTRL       = new Set(['s', 'u', 'p']);
  const BLOCKED_CTRL_SHIFT = new Set(['i', 'j', 'c']);

  const handler = (e) => {
    const key = e.key?.toLowerCase();
    if (e.ctrlKey && !e.shiftKey && BLOCKED_CTRL.has(key))       { e.preventDefault(); return; }
    if (e.ctrlKey && e.shiftKey && BLOCKED_CTRL_SHIFT.has(key))  { e.preventDefault(); return; }
    if (e.key === 'F12')                                          { e.preventDefault(); }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

export function useContentProtection() {
  const ref = useRef(null);

  useEffect(() => {
    applyElementProtection(ref.current);
    const cleanup = installKeyboardGuard();
    return cleanup;
  }, []);

  return ref;
}

export const PROTECTION_CSS = `
  .protected-media-wrapper {
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    position: relative;
  }
  .protected-media-wrapper .protected-media {
    pointer-events: none;
    display: block;
    width: 100%;
    -webkit-user-drag: none;
  }
  .protected-media-wrapper .media-shield {
    position: absolute;
    inset: 0;
    z-index: 2;
    cursor: default;
  }
  @media print {
    .protected-media-wrapper { display: none !important; }
    .print-blocked-notice { display: block !important; text-align: center; padding: 40px; font-weight: bold; color: #1d2b4b; }
  }
`;