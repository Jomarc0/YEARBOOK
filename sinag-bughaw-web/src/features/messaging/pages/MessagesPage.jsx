import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { studentsApi } from '@/api/student.api';
import Navbar from '@/components/layout/Navbar';
import { useMessaging } from '@/features/messaging/hooks/useMessaging';
import { imageUrl } from '@/utils/imageUrl';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

const PALETTES = [
  ['bg-amber-100', 'text-[#1d2b4b]'],
  ['bg-indigo-100', 'text-indigo-800'],
  ['bg-emerald-100', 'text-emerald-800'],
  ['bg-sky-100', 'text-sky-800'],
  ['bg-violet-100', 'text-violet-800'],
];

function paletteFor(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[code % PALETTES.length];
}

function Avatar({ src, name, size = 'h-11 w-11', radius = 'rounded-xl' }) {
  const [errored, setErrored] = useState(false);
  const resolved = !errored && src ? imageUrl(src) : null;
  const [bg, fg] = paletteFor(name);

  if (!resolved) {
    return (
      <div className={`${size} ${radius} ${bg} ${fg} grid shrink-0 place-items-center text-sm font-black`}>
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={name}
      onError={() => setErrored(true)}
      className={`${size} ${radius} shrink-0 object-cover`}
    />
  );
}

function OnlineDot({ online }) {
  return (
    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  );
}

export default function MessagesPage() {
  const { id: recipientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    conversations, thread, loading, isTyping,
    onlineUsers, unreadTotal, sendMessage, onKeystroke,
  } = useMessaging(recipientId ? Number(recipientId) : null);

  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [search, setSearch] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    if (!recipientId) { setRecipient(null); return; }
    studentsApi.show(recipientId).then(({ data }) => setRecipient(data)).catch(() => {});
  }, [recipientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || !recipientId) return;
    const text = body;
    setBody('');
    try { await sendMessage(Number(recipientId), text); }
    catch { setBody(text); }
  };

  const handleKeyDown = useCallback(() => {
    if (recipientId) onKeystroke(Number(recipientId));
  }, [recipientId, onKeystroke]);

  const filtered = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const other = conv.sender_id === user?.id ? conv.receiver : conv.sender;
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-screen flex-col bg-[#eef2f8]">
      <Navbar unreadMessageCount={unreadTotal} />

      <main className="mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 grid-cols-1 overflow-hidden bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${recipientId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200 bg-white`}>
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="m-0 flex items-center gap-2 text-base font-black text-[#1d2b4b]">
                <span className="h-2 w-2 rounded-full bg-[#fdb813]" />
                Messages
              </h1>
              {unreadTotal > 0 && (
                <span className="rounded-full bg-[#fdb813] px-2 py-0.5 text-[11px] font-black text-[#1d2b4b]">
                  {unreadTotal}
                </span>
              )}
            </div>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-transparent bg-slate-100 px-3 text-slate-400 transition focus-within:border-[#fdb813] focus-within:bg-white">
              <i className="fas fa-search text-xs" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full border-0 bg-transparent text-sm text-[#1d2b4b] outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                {search ? 'No results found.' : 'No conversations yet.'}
              </div>
            )}

            {filtered.map((conv) => {
              const other = conv.sender_id === user?.id ? conv.receiver : conv.sender;
              if (!other) return null;
              const active = String(recipientId) === String(other.id);
              const online = onlineUsers.has(other.id);
              return (
                <Link
                  key={conv.id}
                  to={`/messages/${other.id}`}
                  className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 no-underline transition ${active ? 'border-l-4 border-l-[#fdb813] bg-amber-50' : 'border-l-4 border-l-transparent hover:bg-slate-50'}`}
                >
                  <div className="relative">
                    <Avatar src={other.profile_picture} name={other.name} />
                    <OnlineDot online={online} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-black text-[#1d2b4b]">{other.name}</p>
                    <p className="m-0 truncate text-xs text-slate-400">{conv.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] text-slate-400">{formatTime(conv.created_at)}</span>
                    {conv.unread_count > 0 && (
                      <span className="min-w-5 rounded-full bg-[#fdb813] px-1.5 py-0.5 text-center text-[10px] font-black text-[#1d2b4b]">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 p-3">
            <Link to="/directory" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1d2b4b] text-sm font-black text-white no-underline transition hover:bg-[#263654]">
              <i className="fas fa-search text-xs" />
              Find Students
            </Link>
          </div>
        </aside>

        <section className={`${recipientId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col bg-[#f4f7fe]`}>
          {recipientId ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate('/messages')}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 lg:hidden"
                >
                  <i className="fas fa-arrow-left" />
                </button>

                {recipient && (
                  <>
                    <div className="relative">
                      <Avatar src={recipient.profile_picture} name={recipient.name} size="h-10 w-10" radius="rounded-xl" />
                      <OnlineDot online={onlineUsers.has(recipient.id)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-black text-[#1d2b4b]">{recipient.name}</p>
                      <p className={`m-0 text-xs font-semibold ${onlineUsers.has(recipient.id) ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {onlineUsers.has(recipient.id) ? 'Online' : (recipient.course ?? 'Offline')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {loading && <p className="text-center text-sm text-slate-400">Loading messages...</p>}
                {thread.length > 0 && (
                  <div className="mb-4 flex items-center gap-3 text-center text-[11px] font-bold text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    Today
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {thread.map((msg) => {
                    const mine = String(msg.sender_id) === String(user?.id);
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[min(78%,520px)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${mine ? 'rounded-br-md bg-[#1d2b4b] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-[#1d2b4b]'}`}>
                          {msg.body}
                          <div className={`mt-1 text-[10px] ${mine ? 'text-white/45' : 'text-slate-400'}`}>
                            {formatTime(msg.created_at)}
                            {mine && msg.is_read && <span className="ml-1 text-[#fdb813]">Seen</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-slate-200 bg-white p-3">
                <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-transparent bg-slate-100 px-3 transition focus-within:border-[#fdb813] focus-within:bg-white">
                  <i className="far fa-smile text-slate-400" />
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full border-0 bg-transparent text-sm text-[#1d2b4b] outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!body.trim()}
                  className="grid h-11 w-11 place-items-center rounded-xl border-0 bg-[#fdb813] text-[#1d2b4b] transition hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-200 text-3xl text-slate-400">
                <i className="fas fa-comment-dots" />
              </div>
              <p className="m-0 text-base font-black text-[#1d2b4b]">No conversation selected</p>
              <p className="m-0 mt-2 text-sm text-slate-400">Pick one from the list or find someone to chat with.</p>
              <Link to="/directory" className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-[#1d2b4b] px-6 text-sm font-black text-white no-underline transition hover:bg-[#263654]">
                <i className="fas fa-search text-xs" />
                Find Students
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
