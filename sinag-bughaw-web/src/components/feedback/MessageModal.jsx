import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/api/client';

function initials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const palettes = [
  ['bg-amber-100', 'text-[#1d2b4b]'],
  ['bg-indigo-100', 'text-indigo-800'],
  ['bg-emerald-100', 'text-emerald-800'],
  ['bg-pink-100', 'text-pink-800'],
  ['bg-sky-100', 'text-sky-800'],
  ['bg-violet-100', 'text-violet-800'],
];

function getPalette(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palettes[code % palettes.length];
}

function resolveAvatar(picture) {
  if (!picture) return null;
  if (picture.startsWith('http')) return picture;
  return `${import.meta.env.VITE_APP_URL ?? 'http://127.0.0.1:8000'}/storage/${picture}`;
}

function Avatar({ picture, name, size = 'h-9 w-9' }) {
  const [errored, setErrored] = useState(false);
  const src = !errored ? resolveAvatar(picture) : null;
  const [bg, fg] = getPalette(name);

  if (!src) {
    return (
      <div className={`${size} grid shrink-0 place-items-center rounded-full ${bg} ${fg} text-xs font-black`}>
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  );
}

export default function MessageModal({ isOpen, onClose, student, authUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const iAmTypingRef = useRef(false);

  const loadThread = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/messages/${student.id}`);
      setMessages(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setMinimized(false);
      setIsTyping(false);
      setError('');
      loadThread();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      if (window.Echo && authUser?.id) window.Echo.leave(`chat.${authUser.id}`);
      clearTimeout(typingTimerRef.current);
      iAmTypingRef.current = false;
    }
  }, [isOpen, authUser?.id, loadThread]);

  useEffect(() => {
    if (!isOpen || !authUser?.id || !window.Echo) return;
    const channel = window.Echo.private(`chat.${authUser.id}`)
      .listen('.message.sent', (payload) => {
        if (String(payload.sender_id) === String(student?.id)) {
          setMessages((prev) => prev.find((m) => m.id === payload.id) ? prev : [...prev, payload]);
          api.patch(`/messages/${payload.id}/read`).catch(() => {});
        }
        window.dispatchEvent(new Event('messaging:unread-updated'));
      })
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
      if (channel?.unsubscribe) channel.unsubscribe();
    };
  }, [isOpen, authUser?.id, student?.id]);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, minimized]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
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
    setInput('');
    setError('');
    clearTimeout(typingTimerRef.current);
    if (iAmTypingRef.current) {
      iAmTypingRef.current = false;
      api.post('/messages/typing', { receiver_id: student.id, is_typing: false }).catch(() => {});
    }
    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      sender_id: authUser?.id,
      receiver_id: student?.id,
      body: text,
      is_read: false,
      created_at: new Date().toISOString(),
      _pending: true,
    }]);
    setSending(true);
    try {
      const { data } = await api.post('/messages', { receiver_id: student.id, body: text });
      setMessages((prev) => prev.map((m) => m.id === tempId ? data : m));
    } catch {
      setError('Failed to send. Try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
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

  const hasInput = input.trim().length > 0;

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      <section
        className={`fixed bottom-5 right-5 z-[9999] flex w-[320px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/15 transition-all ${minimized ? 'h-auto' : 'h-[420px]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 cursor-pointer select-none items-center gap-2.5 bg-[#1d2b4b] px-3.5 py-3" onClick={() => setMinimized((v) => !v)}>
          <div className="relative shrink-0">
            <span className="block rounded-full border-2 border-[#fdb813]">
              <Avatar picture={student?.profile_picture} name={student?.name ?? ''} />
            </span>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1d2b4b] bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[13px] font-bold text-white">{student?.name}</p>
            <p className={`m-0 flex items-center gap-1 text-[11px] ${isTyping ? 'text-[#fdb813]' : 'text-emerald-300'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isTyping ? 'bg-[#fdb813]' : 'bg-emerald-300'}`} />
              {isTyping ? 'typing...' : 'Active now'}
            </p>
          </div>
          <button type="button" className="grid h-6 w-6 place-items-center rounded-full border-0 bg-white/10 text-[11px] text-white/70 hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}>
            {minimized ? <i className="fas fa-chevron-up" /> : <i className="fas fa-minus" />}
          </button>
          <button type="button" className="grid h-6 w-6 place-items-center rounded-full border-0 bg-white/10 text-[11px] text-white/70 hover:bg-red-500/60" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <i className="fas fa-times" />
          </button>
        </header>

        {!minimized && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#f4f6fa] px-3 py-3.5">
              {loading && (
                <div className="flex flex-1 items-center justify-center pt-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#1d2b4b]" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                  <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size="h-14 w-14" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[#1d2b4b]">{student?.name}</p>
                    <p className="m-0 text-xs text-slate-400">Say hi to your fellow Pioneer.</p>
                  </div>
                </div>
              )}

              {!loading && messages.map((msg) => {
                const isMe = String(msg.sender_id) === String(authUser?.id);
                return (
                  <div key={msg.id}>
                    <div className={`flex ${isMe ? 'justify-end' : 'items-end justify-start gap-1.5'}`}>
                      {!isMe && <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size="h-6 w-6" />}
                      <div className={`max-w-[75%] break-words px-3 py-2 text-[12.5px] leading-relaxed ${isMe ? 'rounded-2xl rounded-br bg-[#1d2b4b] text-white' : 'rounded-2xl rounded-bl border border-slate-200 bg-white text-[#1d2b4b]'} ${msg._pending ? 'opacity-60' : ''}`}>
                        {msg.body}
                      </div>
                    </div>
                    <p className={`m-0 mt-0.5 text-[9.5px] text-slate-400 ${isMe ? 'text-right' : 'pl-7'}`}>
                      {formatTime(msg.created_at)}
                      {isMe && msg.is_read && <span className="ml-1 text-[#fdb813]"><i className="fas fa-check-double text-[8px]" /> Seen</span>}
                    </p>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-end gap-1.5">
                  <Avatar picture={student?.profile_picture} name={student?.name ?? ''} size="h-6 w-6" />
                  <div className="flex gap-1 rounded-2xl rounded-bl border border-slate-200 bg-white px-3 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-2.5 py-2">
                  <p className="m-0 text-[11px] text-red-500">{error}</p>
                  <button type="button" className="border-0 bg-transparent text-xs text-red-500" onClick={() => setError('')}>
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
              <div className="flex-1 rounded-2xl border border-transparent bg-slate-100 px-3 py-2 transition focus-within:border-[#fdb813] focus-within:bg-white">
                <textarea
                  ref={inputRef}
                  value={input}
                  rows={1}
                  placeholder="Aa"
                  maxLength={500}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTyping();
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 70)}px`;
                  }}
                  onKeyDown={handleKey}
                  className="max-h-[70px] w-full resize-none border-0 bg-transparent text-[12.5px] leading-snug text-[#1d2b4b] outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 transition ${hasInput ? 'bg-[#fdb813] text-[#1d2b4b] hover:scale-105' : 'bg-slate-200 text-slate-400'}`}
                onClick={handleSend}
                disabled={!hasInput || sending}
              >
                <i className="fas fa-paper-plane text-xs" />
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
