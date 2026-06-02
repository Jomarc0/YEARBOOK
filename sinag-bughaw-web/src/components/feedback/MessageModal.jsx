import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d        = new Date(dateStr);
  const now      = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const PALETTES = [
  { bg: '#fff3cd', fg: '#1d2b4b' },
  { bg: '#e0e7ff', fg: '#3730a3' },
  { bg: '#d1fae5', fg: '#065f46' },
  { bg: '#fce7f3', fg: '#9d174d' },
  { bg: '#e0f2fe', fg: '#0369a1' },
  { bg: '#f3e8ff', fg: '#7e22ce' },
];

function getPalette(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[code % PALETTES.length];
}

function resolveAvatar(picture) {
  if (!picture) return null;
  if (picture.startsWith('http')) return picture;
  return `${import.meta.env.VITE_APP_URL ?? 'http://127.0.0.1:8000'}/storage/${picture}`;
}

function Avatar({ picture, name, size = 34 }) {
  const [errored, setErrored] = useState(false);
  const src     = !errored ? resolveAvatar(picture) : null;
  const palette = getPalette(name);

  if (!src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: palette.bg, color: palette.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: size * 0.36, flexShrink: 0,
        fontFamily: "'Figtree', sans-serif",
      }}>
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src} alt={name} onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

// ── Inject CSS once ───────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap');

  .mm * { box-sizing: border-box; }
  .mm   { font-family: 'Figtree', -apple-system, sans-serif; }

  .mm-win {
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    width: 320px; display: flex; flex-direction: column;
    background: #fff; border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06);
    border: 1px solid #e4e7ed; overflow: hidden;
    animation: mmUp .28s cubic-bezier(0.34,1.56,0.64,1);
    transition: height .2s ease;
  }
  @keyframes mmUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }

  /* Header */
  .mm-hdr {
    background: #1d2b4b; padding: 11px 14px;
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0; cursor: pointer; user-select: none;
  }
  .mm-hdr-av { position: relative; flex-shrink: 0; }
  .mm-hdr-av-ring {
    display: block; border-radius: 50%;
    border: 2px solid #fdb813; line-height: 0;
  }
  .mm-hdr-dot {
    position: absolute; bottom: 0; right: 0;
    width: 9px; height: 9px; border-radius: 50%;
    background: #22c55e; border: 2px solid #1d2b4b;
  }
  .mm-hdr-info { flex: 1; min-width: 0; }
  .mm-hdr-name {
    font-size: 13px; font-weight: 600; color: #fff; margin: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mm-hdr-status {
    font-size: 11px; margin: 0;
    display: flex; align-items: center; gap: 5px;
  }
  .mm-hdr-pip { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .mm-ctrl {
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255,255,255,0.1); border: none;
    cursor: pointer; color: rgba(255,255,255,0.7); font-size: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .15s; font-family: inherit;
  }
  .mm-ctrl:hover         { background: rgba(255,255,255,0.2); }
  .mm-ctrl.close:hover   { background: rgba(239,68,68,0.55); }

  /* Messages area */
  .mm-msgs {
    flex: 1; overflow-y: auto; padding: 14px 12px;
    background: #f4f6fa; display: flex; flex-direction: column; gap: 6px;
  }
  .mm-msgs::-webkit-scrollbar { width: 3px; }
  .mm-msgs::-webkit-scrollbar-thumb { background: #dde1ea; border-radius: 4px; }

  .mm-loading {
    flex: 1; display: flex; align-items: center;
    justify-content: center; padding-top: 40px;
  }
  .mm-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid #e2e8f0; border-top-color: #1d2b4b;
    animation: mmSpin .7s linear infinite;
  }
  @keyframes mmSpin { to { transform: rotate(360deg); } }

  .mm-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; text-align: center; padding: 24px 16px;
  }
  .mm-empty-name { font-size: 13px; font-weight: 600; color: #1d2b4b; margin: 0; }
  .mm-empty-sub  { font-size: 11.5px; color: #9aa3b5; margin: 0; }

  .mm-row        { display: flex; }
  .mm-row.mine   { justify-content: flex-end; }
  .mm-row.theirs { justify-content: flex-start; align-items: flex-end; gap: 6px; }

  .mm-bub { max-width: 75%; padding: 8px 12px; font-size: 12.5px; line-height: 1.5; word-break: break-word; }
  .mm-bub.mine   { background: #1d2b4b; color: #fff; border-radius: 16px 16px 4px 16px; transition: opacity .2s; }
  .mm-bub.mine.pending { opacity: 0.55; }
  .mm-bub.theirs { background: #fff; color: #1d2b4b; border-radius: 16px 16px 16px 4px; border: 1px solid #e4e7ed; }

  .mm-meta       { font-size: 9.5px; color: #b0b9c8; margin: 2px 0 0; }
  .mm-meta.right { text-align: right; }
  .mm-meta.left  { padding-left: 28px; }
  .mm-seen       { color: #fdb813; margin-left: 4px; }

  /* Typing */
  .mm-typing-row { display: flex; justify-content: flex-start; align-items: flex-end; gap: 6px; }
  .mm-typing-bub {
    padding: 10px 13px; background: #fff;
    border-radius: 16px 16px 16px 4px; border: 1px solid #e4e7ed;
    display: flex; gap: 4px; align-items: center;
  }
  .mm-dot { width: 5px; height: 5px; border-radius: 50%; background: #c8cdd8; animation: mmBounce .9s infinite; }
  .mm-dot:nth-child(2) { animation-delay: .15s; }
  .mm-dot:nth-child(3) { animation-delay: .30s; }
  @keyframes mmBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }

  /* Error */
  .mm-err {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
  }
  .mm-err p  { margin: 0; font-size: 11px; color: #ef4444; }
  .mm-err button { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 12px; padding: 0; margin-left: 8px; font-family: inherit; }

  /* Input */
  .mm-ibar {
    padding: 10px 12px; border-top: 1px solid #eaecf0;
    display: flex; align-items: flex-end; gap: 8px;
    background: #fff; flex-shrink: 0;
  }
  .mm-iwrap {
    flex: 1; background: #f4f6fa; border-radius: 18px; padding: 8px 13px;
    border: 1px solid transparent; transition: border-color .15s, background .15s;
  }
  .mm-iwrap:focus-within { border-color: #fdb813; background: #fff; }
  .mm-iwrap textarea {
    width: 100%; background: transparent; border: none; outline: none;
    resize: none; font-size: 12.5px; color: #1d2b4b; line-height: 1.45;
    max-height: 70px; overflow: hidden; scrollbar-width: none;
    font-family: 'Figtree', inherit;
  }
  .mm-iwrap textarea::placeholder { color: #9aa3b5; }

  .mm-send {
    width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .15s, transform .1s;
  }
  .mm-send:not(:disabled):hover { transform: scale(1.07); }
  .mm-send:disabled { cursor: default; }
`;

let injected = false;
function injectCSS() {
  if (injected) return;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageModal({ isOpen, onClose, student, authUser }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const [minimized, setMinimized] = useState(false);

  const inputRef       = useRef(null);
  const bottomRef      = useRef(null);
  const channelRef     = useRef(null);
  const typingTimerRef = useRef(null);
  const iAmTypingRef   = useRef(false);

  injectCSS();

  const loadThread = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/messages/${student.id}`);
      setMessages(Array.isArray(data) ? data : (data.data ?? []));
    } catch { setError('Could not load messages.'); }
    finally  { setLoading(false); }
  }, [student?.id]);

  useEffect(() => {
    if (isOpen) {
      setInput(''); setMinimized(false); setIsTyping(false); setError('');
      loadThread();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      if (window.Echo && authUser?.id) { window.Echo.leave(`chat.${authUser.id}`); channelRef.current = null; }
      clearTimeout(typingTimerRef.current);
      iAmTypingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !authUser?.id || !window.Echo) return;
    channelRef.current = window.Echo.private(`chat.${authUser.id}`)
      .listen('.message.sent', payload => {
        if (String(payload.sender_id) === String(student?.id)) {
          setMessages(prev => prev.find(m => m.id === payload.id) ? prev : [...prev, payload]);
          api.patch(`/messages/${payload.id}/read`).catch(() => {});
        }
        window.dispatchEvent(new Event('messaging:unread-updated'));
      })
      .listen('.user.typing', payload => {
        if (String(payload.sender_id) === String(student?.id)) {
          setIsTyping(payload.is_typing);
          if (payload.is_typing) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      });
    return () => { if (window.Echo) window.Echo.leave(`chat.${authUser.id}`); };
  }, [isOpen, authUser?.id, student?.id]);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, minimized]);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  const handleTyping = () => {
    if (!iAmTypingRef.current) {
      iAmTypingRef.current = true;
      api.post('/messages/typing', { receiver_id: student.id, is_typing: true }).catch(() => {});
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      iAmTypingRef.current = false;
      api.post('/messages/typing', { receiver_id: student.id, is_typing: false }).catch(() => {});
    }, 1500);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput(''); setError('');
    clearTimeout(typingTimerRef.current);
    if (iAmTypingRef.current) {
      iAmTypingRef.current = false;
      api.post('/messages/typing', { receiver_id: student.id, is_typing: false }).catch(() => {});
    }
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, sender_id: authUser?.id, receiver_id: student?.id,
      body: text, is_read: false, created_at: new Date().toISOString(), _pending: true,
    }]);
    setSending(true);
    try {
      const { data } = await api.post('/messages', { receiver_id: student.id, body: text });
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch {
      setError('Failed to send. Try again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    } finally { setSending(false); }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="mm">
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />

      <div className="mm-win" onClick={e => e.stopPropagation()}
        style={{ height: minimized ? 'auto' : 420 }}
      >
        {/* Header */}
        <div className="mm-hdr" onClick={() => setMinimized(v => !v)}>
          <div className="mm-hdr-av">
            <span className="mm-hdr-av-ring">
              <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size={34} />
            </span>
            <span className="mm-hdr-dot" />
          </div>
          <div className="mm-hdr-info">
            <p className="mm-hdr-name">{student?.name}</p>
            <p className="mm-hdr-status" style={{ color: isTyping ? '#fdb813' : '#4ade80' }}>
              <span className="mm-hdr-pip" style={{ background: isTyping ? '#fdb813' : '#4ade80' }} />
              {isTyping ? 'typing…' : 'Active now'}
            </p>
          </div>
          <button className="mm-ctrl" onClick={e => { e.stopPropagation(); setMinimized(v => !v); }}
            title={minimized ? 'Expand' : 'Minimize'}
          >{minimized ? '▲' : '–'}</button>
          <button className="mm-ctrl close" onClick={e => { e.stopPropagation(); onClose(); }}
            title="Close"
          >✕</button>
        </div>

        {/* Body */}
        {!minimized && (
          <>
            <div className="mm-msgs">
              {loading && <div className="mm-loading"><div className="mm-spinner" /></div>}

              {!loading && messages.length === 0 && (
                <div className="mm-empty">
                  <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size={52} />
                  <div>
                    <p className="mm-empty-name">{student?.name}</p>
                    <p className="mm-empty-sub">Say hi to your fellow Pioneer! 👋</p>
                  </div>
                </div>
              )}

              {!loading && messages.map(msg => {
                const isMe = String(msg.sender_id) === String(authUser?.id);
                return (
                  <div key={msg.id}>
                    <div className={`mm-row ${isMe ? 'mine' : 'theirs'}`}>
                      {!isMe && <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size={22} />}
                      <div className={`mm-bub ${isMe ? 'mine' : 'theirs'}${msg._pending ? ' pending' : ''}`}>
                        {msg.body}
                      </div>
                    </div>
                    <p className={`mm-meta ${isMe ? 'right' : 'left'}`}>
                      {formatTime(msg.created_at)}
                      {isMe && msg.is_read && (
                        <span className="mm-seen">
                          <i className="fas fa-check-double" style={{ fontSize: 8 }} /> Seen
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}

              {isTyping && (
                <div className="mm-typing-row">
                  <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size={22} />
                  <div className="mm-typing-bub">
                    <span className="mm-dot" /><span className="mm-dot" /><span className="mm-dot" />
                  </div>
                </div>
              )}

              {error && (
                <div className="mm-err">
                  <p>{error}</p>
                  <button onClick={() => setError('')}>✕</button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="mm-ibar">
              <div className="mm-iwrap">
                <textarea
                  ref={inputRef} value={input} rows={1}
                  placeholder="Aa" maxLength={500}
                  onChange={e => {
                    setInput(e.target.value); handleTyping();
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 70) + 'px';
                  }}
                  onKeyDown={handleKey}
                />
              </div>
              <button
                className="mm-send"
                onClick={handleSend}
                disabled={!hasInput || sending}
                style={{ background: hasInput ? '#fdb813' : '#e4e7ed', color: hasInput ? '#1d2b4b' : '#9aa3b5' }}
              >
                <i className="fas fa-paper-plane" style={{ fontSize: 12 }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}