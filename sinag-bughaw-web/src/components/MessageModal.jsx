import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

// ─── Axios instance (reuse your existing one if you have it) ──────────────────
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true,
});

// Attach auth token from localStorage automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MessageModal({ isOpen, onClose, student, authUser }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const inputRef                  = useRef(null);
  const bottomRef                 = useRef(null);
  const channelRef                = useRef(null);

  // ── Load thread from API ───────────────────────────────────────────────────
  const loadThread = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/messages/${student.id}`);
      // Laravel paginator returns { data: [...] }
      setMessages(data.data ?? data);
    } catch (err) {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  // ── Open / close lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setInput('');
      loadThread();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Leave Echo channel when closed
      if (channelRef.current && window.Echo) {
        window.Echo.leave(`chat.${authUser?.id}`);
        channelRef.current = null;
      }
    }
  }, [isOpen]);

  // ── Subscribe to Laravel Echo (real-time) ──────────────────────────────────
  useEffect(() => {
    if (!isOpen || !authUser?.id || !window.Echo) return;

    // Private channel: `chat.{myId}` — broadcasted by MessageSent event
    channelRef.current = window.Echo
      .private(`chat.${authUser.id}`)
      .listen('MessageSent', (e) => {
        const msg = e.message ?? e;
        // Only append if from the student we have open
        if (msg.sender_id === student?.id) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });

    return () => {
      if (window.Echo) window.Echo.leave(`chat.${authUser.id}`);
    };
  }, [isOpen, authUser?.id, student?.id]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  const avatarUrl = student?.profile_picture
    ? `http://127.0.0.1:8000/storage/${student.profile_picture}`
    : null;

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setError('');

    // Optimistic UI — add message immediately
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
      const { data } = await api.post('/api/messages', {
        receiver_id: student.id,
        body:        text,
      });

      // Replace temp message with real one from server
      setMessages((prev) => prev.map((m) => m.id === tempId ? data : m));
    } catch (err) {
      setError('Failed to send. Try again.');
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text); // restore input
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Invisible backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* ── Chat window ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: '16px', right: '16px', zIndex: 50,
          width: '288px', height: '360px',
          display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e5e7eb', overflow: 'hidden',
          animation: 'messengerIn .28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >

        {/* ── Header ── */}
        <div style={{ background: '#1d2b4b', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={student?.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fdb813', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#1d2b4b', flexShrink: 0 }}>
              {getInitials(student?.name)}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 11, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {student?.name}
            </p>
            <p style={{ margin: 0, color: '#4ade80', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
              Active now
            </p>
          </div>

          {/* Minimize */}
          <button onClick={onClose} title="Minimize"
            style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >—</button>

          {/* Close */}
          <button onClick={onClose} title="Close"
            style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >✕</button>
        </div>

        {/* ── Messages area ── */}
        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {/* Loading spinner */}
          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: '#3f51b5', fontSize: 18 }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={student?.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1d2b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fdb813' }}>
                  {getInitials(student?.name)}
                </div>
              )}
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#1d2b4b' }}>{student?.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Say hi to your fellow Pioneer! 👋</p>
            </div>
          )}

          {/* Messages */}
          {!loading && messages.map((msg) => {
            const isMe = msg.sender_id === authUser?.id || msg._pending;
            return (
              <div key={msg.id}>
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  {/* Other person's avatar */}
                  {!isMe && (
                    avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1d2b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: '#fdb813', flexShrink: 0 }}>{getInitials(student?.name)}</div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '7px 11px', fontSize: 11, lineHeight: 1.45,
                    background:   isMe ? '#1d2b4b' : '#fff',
                    color:        isMe ? '#fff'     : '#1d2b4b',
                    borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                    boxShadow:    '0 1px 3px rgba(0,0,0,0.07)',
                    border:       isMe ? 'none' : '1px solid #e5e7eb',
                    wordBreak:    'break-word',
                    opacity:      msg._pending ? 0.6 : 1,
                    transition:   'opacity .2s',
                  }}>
                    {msg.body}
                  </div>
                </div>
                {/* Timestamp */}
                <p style={{ margin: '2px 0 0', fontSize: 9, color: '#cbd5e1', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 26 }}>
                  {formatTime(msg.created_at)}
                  {isMe && msg.is_read && <span style={{ marginLeft: 4, color: '#3f51b5' }}>· Seen</span>}
                </p>
              </div>
            );
          })}

          {/* Typing dots (while sending) */}
          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(29,43,75,0.12)', borderRadius: '16px 16px 3px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d2b4b', display: 'inline-block', animation: `dotBounce .9s ${i*0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ margin: 0, fontSize: 10, color: '#ef4444', textAlign: 'center', padding: '4px 8px', background: '#fef2f2', borderRadius: 8 }}>
              {error}
            </p>
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
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 64) + 'px';
              }}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Aa"
              maxLength={500}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 12, color: '#374151', lineHeight: 1.4, maxHeight: 64, overflow: 'hidden', scrollbarWidth: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? '#1d2b4b' : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background .15s',
            }}
            onMouseEnter={e => { if (input.trim()) e.currentTarget.style.background = '#162038'; }}
            onMouseLeave={e => { if (input.trim()) e.currentTarget.style.background = '#1d2b4b'; }}
          >
            <i className="fas fa-paper-plane" style={{ fontSize: 11, color: input.trim() ? '#fdb813' : '#94a3b8' }} />
          </button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; ms-overflow-style: none; }
        @keyframes messengerIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}