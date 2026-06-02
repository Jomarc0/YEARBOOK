import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams }              from 'react-router-dom';
import { useAuth }                                   from '@/features/auth/hooks/useAuth';
import { studentsApi }                               from '@/api/student.api';
import Navbar                                        from '@/components/layout/Navbar';
import { useMessaging }                              from '@/features/messaging/hooks/useMessaging';
import { imageUrl, avatarUrl }                       from '@/utils/imageUrl';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '';
  const d        = new Date(iso);
  const now      = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
// Generates colored initials; falls back to user photo if available.

const PALETTES = [
  { bg: '#fff3cd', fg: '#1d2b4b' },  // NU gold tint
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

function Avatar({ src, name, size = 44, radius = 12 }) {
  const [errored, setErrored] = useState(false);
  const resolved = (!errored && src) ? imageUrl(src) : null;
  const palette  = getPalette(name);

  if (!resolved) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: palette.bg, color: palette.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: size * 0.34, flexShrink: 0,
        fontFamily: "'Figtree', sans-serif", letterSpacing: '0.02em',
      }}>
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={resolved} alt={name} onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

function OnlineDot({ online, size = 10, borderColor = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%',
      background: online ? '#22c55e' : '#d1d5db',
      border: `2px solid ${borderColor}`,
      flexShrink: 0,
    }} />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { id: recipientId } = useParams();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  const {
    conversations, thread, loading, isTyping,
    onlineUsers, unreadTotal, sendMessage, onKeystroke,
  } = useMessaging(recipientId ? Number(recipientId) : null);

  const [body,      setBody]      = useState('');
  const [recipient, setRecipient] = useState(null);
  const [search,    setSearch]    = useState('');

  const bottomRef = useRef();
  const inputRef  = useRef();

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

  const filtered = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = conv.sender_id === user?.id ? conv.receiver : conv.sender;
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  // ── CSS ──────────────────────────────────────────────────────────────────────

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap');
    .nu-msg * { box-sizing: border-box; }
    .nu-msg {
      font-family: 'Figtree', -apple-system, sans-serif;
      display: flex; flex-direction: column; height: 100vh; background: #eef0f5;
    }

    /* ── Sidebar ── */
    .nu-sidebar {
      width: 280px; flex-shrink: 0; background: #fff;
      border-right: 1px solid #e4e7ed;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .sb-head { padding: 20px 16px 10px; }
    .sb-title {
      font-size: 15px; font-weight: 600; color: #1d2b4b;
      margin: 0 0 12px; letter-spacing: -0.2px;
      display: flex; align-items: center; gap: 8px;
    }
    .sb-title-pip {
      width: 8px; height: 8px; border-radius: 50%;
      background: #fdb813; flex-shrink: 0;
    }
    .sb-search {
      display: flex; align-items: center; gap: 8px;
      background: #f4f6fa; border-radius: 10px; padding: 8px 12px;
      border: 1px solid transparent; transition: border-color .15s, background .15s;
    }
    .sb-search:focus-within { border-color: #fdb813; background: #fff; }
    .sb-search input {
      background: none; border: none; outline: none;
      font-size: 13px; color: #1d2b4b; width: 100%; font-family: inherit;
    }
    .sb-search input::placeholder { color: #9aa3b5; }

    .conv-list { flex: 1; overflow-y: auto; }
    .conv-list::-webkit-scrollbar { width: 3px; }
    .conv-list::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 4px; }
    .conv-empty { font-size: 12px; color: #9aa3b5; padding: 20px 16px; text-align: center; }

    .conv-item {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 16px; cursor: pointer;
      border-bottom: 1px solid #f2f4f7;
      text-decoration: none; color: inherit;
      transition: background .12s;
      border-left: 3px solid transparent;
    }
    .conv-item:hover { background: #f8f9fc; }
    .conv-item.active { background: #fffbeb; border-left-color: #fdb813; padding-left: 13px; }

    .conv-av-wrap { position: relative; flex-shrink: 0; }
    .conv-dot { position: absolute; bottom: -2px; right: -2px; }
    .conv-info { flex: 1; min-width: 0; }
    .conv-name {
      font-size: 13px; font-weight: 600; color: #1d2b4b;
      margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .conv-preview { font-size: 11.5px; color: #9aa3b5; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .conv-time { font-size: 10.5px; color: #9aa3b5; }
    .unread-badge {
      background: #fdb813; color: #1d2b4b;
      border-radius: 20px; font-size: 10px; font-weight: 700;
      padding: 1px 6px; min-width: 18px; text-align: center;
    }

    .sb-footer { padding: 12px 14px; border-top: 1px solid #f2f4f7; flex-shrink: 0; }
    .find-btn {
      display: block; text-align: center;
      background: #1d2b4b; color: #fff; border-radius: 10px;
      padding: 10px; font-size: 12.5px; font-weight: 600;
      text-decoration: none; transition: background .15s;
    }
    .find-btn:hover { background: #263654; }

    /* ── Chat ── */
    .nu-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .chat-header {
      background: #fff; border-bottom: 1px solid #e4e7ed;
      padding: 14px 24px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .ch-back {
      background: none; border: none; cursor: pointer;
      font-size: 18px; color: #5a6a8a; padding: 0;
    }
    .ch-info { flex: 1; }
    .ch-name { font-size: 14px; font-weight: 600; color: #1d2b4b; margin: 0; }
    .ch-status { font-size: 12px; margin: 0; display: flex; align-items: center; gap: 5px; }
    .ch-status-pip { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .ch-actions { display: flex; gap: 8px; }
    .ch-btn {
      width: 34px; height: 34px; border-radius: 8px;
      background: #f4f6fa; border: 1px solid #e4e7ed;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #5a6a8a; font-size: 15px; transition: background .12s, color .12s;
    }
    .ch-btn:hover { background: #ebedf2; color: #1d2b4b; }

    /* Messages */
    .nu-messages {
      flex: 1; overflow-y: auto; padding: 24px;
      display: flex; flex-direction: column; gap: 8px; background: #f4f6fa;
    }
    .nu-messages::-webkit-scrollbar { width: 3px; }
    .nu-messages::-webkit-scrollbar-thumb { background: #dde1ea; border-radius: 4px; }

    .day-label {
      text-align: center; font-size: 11px; color: #9aa3b5;
      margin: 4px 0 8px; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .day-label::before, .day-label::after { content: ''; flex: 1; height: 1px; background: #e4e7ed; }

    .msg-loading { text-align: center; font-size: 13px; color: #9aa3b5; padding: 20px 0; }

    .msg-row { display: flex; }
    .msg-row.mine { justify-content: flex-end; }
    .msg-row.theirs { justify-content: flex-start; align-items: flex-end; gap: 7px; }

    .bubble { max-width: 320px; padding: 10px 15px; font-size: 13.5px; line-height: 1.55; word-break: break-word; }
    .bubble.mine {
      background: #1d2b4b; color: #fff;
      border-radius: 18px 18px 4px 18px;
    }
    .bubble.mine.optimistic { opacity: 0.6; }
    .bubble.theirs {
      background: #fff; color: #1d2b4b;
      border-radius: 18px 18px 18px 4px;
      border: 1px solid #e4e7ed;
    }

    .msg-meta { font-size: 10.5px; color: #9aa3b5; margin: 3px 4px 0; }
    .msg-meta.right { text-align: right; }
    .seen-check { color: #fdb813; margin-left: 4px; font-size: 9px; }

    /* Typing */
    .typing-row { display: flex; align-items: flex-end; gap: 7px; }
    .typing-bub {
      background: #fff; border: 1px solid #e4e7ed;
      border-radius: 18px 18px 18px 4px;
      padding: 12px 16px; display: flex; gap: 4px; align-items: center;
    }
    .t-dot { width: 6px; height: 6px; border-radius: 50%; background: #c8cdd8; animation: tBounce 1.2s ease-in-out infinite; }
    .t-dot:nth-child(2) { animation-delay: .2s; }
    .t-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes tBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    /* Input */
    .input-bar {
      background: #fff; border-top: 1px solid #e4e7ed;
      padding: 12px 24px; display: flex; gap: 10px; align-items: center; flex-shrink: 0;
    }
    .input-wrap {
      flex: 1; background: #f4f6fa; border-radius: 12px;
      padding: 9px 14px; display: flex; align-items: center; gap: 8px;
      border: 1px solid transparent; transition: border-color .15s, background .15s;
    }
    .input-wrap:focus-within { border-color: #fdb813; background: #fff; }
    .input-wrap input {
      flex: 1; background: none; border: none; outline: none;
      font-size: 13.5px; color: #1d2b4b; font-family: inherit;
    }
    .input-wrap input::placeholder { color: #9aa3b5; }
    .in-icon { font-size: 16px; color: #9aa3b5; cursor: pointer; flex-shrink: 0; }
    .in-icon:hover { color: #5a6a8a; }

    .send-btn {
      width: 40px; height: 40px; border-radius: 11px;
      background: #fdb813; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #1d2b4b; font-size: 15px; flex-shrink: 0;
      transition: background .15s, transform .1s;
    }
    .send-btn:hover:not(:disabled) { background: #e6a510; transform: scale(1.05); }
    .send-btn:disabled { background: #e4e7ed; color: #9aa3b5; cursor: default; }

    /* Empty state */
    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #9aa3b5; gap: 8px; padding: 40px;
    }
    .empty-icon { font-size: 52px; opacity: 0.15; color: #1d2b4b; margin-bottom: 8px; }
    .empty-heading { font-size: 15px; font-weight: 600; color: #344054; margin: 0; }
    .empty-sub { font-size: 13px; color: #9aa3b5; margin: 0; }
    .empty-cta {
      margin-top: 16px; background: #1d2b4b; color: #fff;
      padding: 11px 28px; border-radius: 10px;
      font-weight: 600; font-size: 13px; text-decoration: none;
      transition: background .15s;
    }
    .empty-cta:hover { background: #263654; }

    @media (max-width: 640px) {
      .nu-sidebar { display: none !important; }
      .ch-back { display: block !important; }
    }
  `;

  return (
    <div className="nu-msg">
      <style>{css}</style>
      <Navbar unreadMessageCount={unreadTotal} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', maxWidth: 1400, width: '100%', margin: '0 auto' }}>

        {/* ── Sidebar ── */}
        <div className="nu-sidebar">
          <div className="sb-head">
            <p className="sb-title">
              <span className="sb-title-pip" />
              Messages
            </p>
            <div className="sb-search">
              <i className="fas fa-search" style={{ fontSize: 13, color: '#9aa3b5', flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" />
            </div>
          </div>

          <div className="conv-list">
            {filtered.length === 0 && (
              <p className="conv-empty">{search ? 'No results found.' : 'No conversations yet.'}</p>
            )}

            {filtered.map(conv => {
              const other    = conv.sender_id === user?.id ? conv.receiver : conv.sender;
              if (!other) return null;
              const isActive = String(recipientId) === String(other.id);
              const isOnline = onlineUsers.has(other.id);

              return (
                <Link key={conv.id} to={`/messages/${other.id}`}
                  className={`conv-item${isActive ? ' active' : ''}`}
                >
                  <div className="conv-av-wrap">
                    <Avatar src={other.profile_picture} name={other.name} size={42} radius={12} />
                    <span className="conv-dot">
                      <OnlineDot online={isOnline} size={9} borderColor={isActive ? '#fffbeb' : '#fff'} />
                    </span>
                  </div>
                  <div className="conv-info">
                    <p className="conv-name">{other.name}</p>
                    <p className="conv-preview">{conv.body}</p>
                  </div>
                  <div className="conv-meta">
                    <span className="conv-time">{formatTime(conv.created_at)}</span>
                    {conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="sb-footer">
            <Link to="/directory" className="find-btn">
              <i className="fas fa-search" style={{ marginRight: 6 }} />Find Students
            </Link>
          </div>
        </div>

        {/* ── Chat ── */}
        <div className="nu-chat">
          {recipientId ? (
            <>
              <div className="chat-header">
                <button onClick={() => navigate('/messages')} className="ch-back" style={{ display: 'none' }}>
                  <i className="fas fa-arrow-left" />
                </button>

                {recipient && (
                  <>
                    <div className="conv-av-wrap">
                      <Avatar src={recipient.profile_picture} name={recipient.name} size={38} radius={10} />
                      <span className="conv-dot">
                        <OnlineDot online={onlineUsers.has(recipient.id)} size={9} />
                      </span>
                    </div>
                    <div className="ch-info">
                      <p className="ch-name">{recipient.name}</p>
                      <p className="ch-status" style={{ color: onlineUsers.has(recipient.id) ? '#22c55e' : '#9aa3b5' }}>
                        <span className="ch-status-pip" style={{ background: onlineUsers.has(recipient.id) ? '#22c55e' : '#d1d5db' }} />
                        {onlineUsers.has(recipient.id) ? 'Online' : (recipient.course ?? 'Offline')}
                      </p>
                    </div>
                    <div className="ch-actions">
                      <button className="ch-btn"><i className="fas fa-phone" /></button>
                      <button className="ch-btn"><i className="fas fa-ellipsis-h" /></button>
                    </div>
                  </>
                )}
              </div>

              <div className="nu-messages">
                {loading && <p className="msg-loading">Loading messages…</p>}
                {thread.length > 0 && <div className="day-label">Today</div>}

                {thread.map(msg => {
                  const isMine = String(msg.sender_id) === String(user?.id);
                  return (
                    <div key={msg.id} className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <Avatar src={recipient?.profile_picture} name={recipient?.name ?? ''} size={26} radius={7} />
                      )}
                      <div>
                        <div className={`bubble ${isMine ? 'mine' : 'theirs'}${msg._optimistic ? ' optimistic' : ''}`}>
                          {msg.body}
                        </div>
                        <p className={`msg-meta${isMine ? ' right' : ''}`}>
                          {formatTime(msg.created_at)}
                          {isMine && msg.is_read && (
                            <span className="seen-check">
                              <i className="fas fa-check-double" style={{ fontSize: 9 }} /> Seen
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="typing-row">
                    <Avatar src={recipient?.profile_picture} name={recipient?.name ?? ''} size={26} radius={7} />
                    <div className="typing-bub">
                      <span className="t-dot" /><span className="t-dot" /><span className="t-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="input-bar">
                <div className="input-wrap">
                  <i className="far fa-smile in-icon" />
                  <input
                    ref={inputRef} value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                  />
                  <i className="fas fa-paperclip in-icon" />
                </div>
                <button type="submit" className="send-btn" disabled={!body.trim()}>
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-comment-dots" /></div>
              <p className="empty-heading">No conversation selected</p>
              <p className="empty-sub">Pick one from the list or find someone to chat with.</p>
              <Link to="/directory" className="empty-cta">
                <i className="fas fa-search" style={{ marginRight: 7 }} />Find Students
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}