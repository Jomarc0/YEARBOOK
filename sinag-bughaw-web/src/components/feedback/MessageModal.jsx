import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/api/client';   // ← your existing axios instance

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Resolve a profile picture to a usable URL.
 * Handles: Cloudinary https URLs, local storage paths, and null.
 */
function resolveAvatar(picture, name) {
  if (!picture) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? 'U')}&background=1d2b4b&color=fdb813`;
  if (picture.startsWith('http')) return picture;
  return `${import.meta.env.VITE_APP_URL ?? 'http://127.0.0.1:8000'}/storage/${picture}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageModal({ isOpen, onClose, student, authUser }) {
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [minimized,    setMinimized]    = useState(false);

  const inputRef       = useRef(null);
  const bottomRef      = useRef(null);
  const channelRef     = useRef(null);
  const typingTimerRef = useRef(null);
  const iAmTypingRef   = useRef(false);

  // ── Load thread ────────────────────────────────────────────────────────────

  const loadThread = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/messages/${student.id}`);
      // Laravel paginator wraps in { data: [...] }
      const msgs = Array.isArray(data) ? data : (data.data ?? []);
      setMessages(msgs);
    } catch {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  // ── Open / close lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setMinimized(false);
      setIsTyping(false);
      setError('');
      loadThread();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Leave Echo channel when modal closes
      if (window.Echo && authUser?.id) {
        window.Echo.leave(`chat.${authUser.id}`);
        channelRef.current = null;
      }
      // Cancel any pending typing timer
      clearTimeout(typingTimerRef.current);
      iAmTypingRef.current = false;
    }
  }, [isOpen]);

  // ── WebSocket: subscribe to private chat channel ───────────────────────────

  useEffect(() => {
    if (!isOpen || !authUser?.id || !window.Echo) return;

    channelRef.current = window.Echo
      .private(`chat.${authUser.id}`)

      // New incoming message
      .listen('.message.sent', (payload) => {
        if (String(payload.sender_id) === String(student?.id)) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          // Auto mark as read since modal is open
          api.patch(`/messages/${payload.id}/read`).catch(() => {});
        }
        // Update Navbar unread badge
        window.dispatchEvent(new Event('messaging:unread-updated'));
      })

      // Typing indicator from recipient
      .listen('.user.typing', (payload) => {
        if (String(payload.sender_id) === String(student?.id)) {
          setIsTyping(payload.is_typing);
          if (payload.is_typing) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      });

    return () => {
      if (window.Echo) window.Echo.leave(`chat.${authUser.id}`);
    };
  }, [isOpen, authUser?.id, student?.id]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, minimized]);

  // ── Escape key ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  const avatarSrc = resolveAvatar(student?.profile_picture, student?.name);

  // ── Outbound typing indicator ──────────────────────────────────────────────

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

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setError('');

    // Stop typing immediately
    clearTimeout(typingTimerRef.current);
    if (iAmTypingRef.current) {
      iAmTypingRef.current = false;
      api.post('/messages/typing', { receiver_id: student.id, is_typing: false }).catch(() => {});
    }

    // Optimistic message
    const tempId  = `temp_${Date.now()}`;
    const tempMsg = {
      id:          tempId,
      sender_id:   authUser?.id,
      receiver_id: student?.id,
      body:        text,
      is_read:     false,
      created_at:  new Date().toISOString(),
      _pending:    true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setSending(true);

    try {
      const { data } = await api.post('/messages', {
        receiver_id: student.id,
        body:        text,
      });
      // Replace optimistic with real message from server
      setMessages((prev) => prev.map((m) => m.id === tempId ? data : m));
    } catch {
      setError('Failed to send. Try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text); // restore input
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Invisible backdrop — click outside to close */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />

      {/* ── Chat window ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:      'fixed',
          bottom:        16,
          right:         16,
          zIndex:        50,
          width:         300,
          height:        minimized ? 'auto' : 420,
          display:       'flex',
          flexDirection: 'column',
          background:    '#fff',
          borderRadius:  16,
          boxShadow:     '0 8px 40px rgba(0,0,0,0.2)',
          border:        '1px solid #e5e7eb',
          overflow:      'hidden',
          animation:     'messengerIn .28s cubic-bezier(0.34,1.56,0.64,1)',
          transition:    'height .2s ease',
        }}
      >

        {/* ── Header ── */}
        <div
          style={{
            background:  '#1d2b4b',
            padding:     '10px 12px',
            display:     'flex',
            alignItems:  'center',
            gap:         10,
            flexShrink:  0,
            cursor:      'pointer',
            userSelect:  'none',
          }}
          onClick={() => setMinimized(v => !v)}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={avatarSrc}
              alt={student?.name}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fdb813', display: 'block' }}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name ?? 'U')}&background=fdb813&color=1d2b4b`; }}
            />
            {/* Online dot */}
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #1d2b4b' }} />
          </div>

          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {student?.name}
            </p>
            <p style={{ margin: 0, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: isTyping ? '#fdb813' : '#4ade80' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isTyping ? '#fdb813' : '#4ade80', display: 'inline-block' }} />
              {isTyping ? 'typing…' : 'Active now'}
            </p>
          </div>

          {/* Minimize button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(v => !v); }}
            title={minimized ? 'Expand' : 'Minimize'}
            style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            {minimized ? '▲' : '—'}
          </button>

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close"
            style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.5)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            ✕
          </button>
        </div>

        {/* ── Body — hidden when minimized ── */}
        {!minimized && (
          <>
            {/* ── Messages area ── */}
            <div
              className="mm-scroll"
              style={{
                flex:          1,
                overflowY:     'auto',
                padding:       '12px',
                background:    '#f9fafb',
                display:       'flex',
                flexDirection: 'column',
                gap:           6,
              }}
            >
              {/* Loading spinner */}
              {loading && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#1d2b4b', animation: 'mmSpin 0.7s linear infinite' }} />
                </div>
              )}

              {/* Empty state */}
              {!loading && messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', paddingTop: 24 }}>
                  <img
                    src={avatarSrc}
                    alt={student?.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0' }}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name ?? 'U')}&background=fdb813&color=1d2b4b`; }}
                  />
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#1d2b4b' }}>{student?.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Say hi to your fellow Pioneer! 👋</p>
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {!loading && messages.map((msg) => {
                const isMe = String(msg.sender_id) === String(authUser?.id);
                return (
                  <div key={msg.id}>
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>

                      {/* Recipient avatar (left side) */}
                      {!isMe && (
                        <img
                          src={avatarSrc}
                          alt=""
                          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name ?? 'U')}&background=fdb813&color=1d2b4b`; }}
                        />
                      )}

                      {/* Bubble */}
                      <div style={{
                        maxWidth:     '75%',
                        padding:      '8px 12px',
                        fontSize:     12,
                        lineHeight:   1.45,
                        background:   isMe ? '#1d2b4b' : '#fff',
                        color:        isMe ? '#fff'     : '#1d2b4b',
                        borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                        boxShadow:    '0 1px 3px rgba(0,0,0,0.07)',
                        border:       isMe ? 'none' : '1px solid #e5e7eb',
                        wordBreak:    'break-word',
                        opacity:      msg._pending ? 0.55 : 1,
                        transition:   'opacity .2s',
                      }}>
                        {msg.body}
                      </div>
                    </div>

                    {/* Timestamp + read receipt */}
                    <p style={{ margin: '2px 0 0', fontSize: 9, color: '#cbd5e1', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 28 }}>
                      {formatTime(msg.created_at)}
                      {isMe && msg.is_read && (
                        <span style={{ marginLeft: 4, color: '#3f51b5' }}>
                          <i className="fas fa-check-double" style={{ fontSize: 8 }} /> Seen
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}

              {/* Typing indicator — recipient is typing */}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  <img
                    src={avatarSrc}
                    alt=""
                    style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name ?? 'U')}&background=fdb813&color=1d2b4b`; }}
                  />
                  <div style={{ padding: '8px 12px', background: '#fff', borderRadius: '16px 16px 16px 3px', border: '1px solid #e5e7eb', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', animation: `mmBounce .9s ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sending dots — my message is sending */}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(29,43,75,0.1)', borderRadius: '16px 16px 3px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d2b4b', display: 'inline-block', animation: `mmBounce .9s ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#ef4444' }}>{error}</p>
                  <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: 0, marginLeft: 8 }}>✕</button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div style={{ padding: '8px 10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-end', gap: 8, background: '#fff', flexShrink: 0 }}>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 20, padding: '7px 12px' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTyping();
                    // Auto-grow
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 64) + 'px';
                  }}
                  onKeyDown={handleKey}
                  rows={1}
                  placeholder="Aa"
                  maxLength={500}
                  style={{
                    width:        '100%',
                    background:   'transparent',
                    border:       'none',
                    outline:      'none',
                    resize:       'none',
                    fontSize:     12,
                    color:        '#374151',
                    lineHeight:   1.4,
                    maxHeight:    64,
                    overflow:     'hidden',
                    scrollbarWidth: 'none',
                    fontFamily:   'inherit',
                  }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  width:          34,
                  height:         34,
                  borderRadius:   '50%',
                  border:         'none',
                  flexShrink:     0,
                  cursor:         input.trim() ? 'pointer' : 'default',
                  background:     input.trim() ? '#1d2b4b' : '#e5e7eb',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  transition:     'background .15s, transform .1s',
                }}
                onMouseEnter={e => { if (input.trim()) { e.currentTarget.style.background = '#3f51b5'; e.currentTarget.style.transform = 'scale(1.08)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = input.trim() ? '#1d2b4b' : '#e5e7eb'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <i className="fas fa-paper-plane" style={{ fontSize: 11, color: input.trim() ? '#fdb813' : '#94a3b8' }} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        .mm-scroll::-webkit-scrollbar { display: none; }
        .mm-scroll { scrollbar-width: none; }

        @keyframes messengerIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes mmBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
        @keyframes mmSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}