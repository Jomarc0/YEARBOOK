import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams }              from 'react-router-dom';
import { useAuth }                                   from '@/features/auth/hooks/useAuth';
import { studentsApi }                               from '@/api/student.api';
import Navbar                                        from '@/components/layout/Navbar';
import { useMessaging }                              from '@/features/messaging/hooks/useMessaging';

// ── Avatar helpers ─────────────────────────────────────────────────────────────

function avatarSrc(profilePicture, name) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? 'User')}&background=1d2b4b&color=fff`;
  if (!profilePicture?.trim()) return fallback;
  if (profilePicture.startsWith('http')) return profilePicture;
  // relative path → prepend storage base
  return `${import.meta.env.VITE_API_URL}/storage/${profilePicture}`;
}

function avatarError(e, name) {
  e.currentTarget.onerror = null; // prevent infinite loop
  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? 'User')}&background=1d2b4b&color=fff`;
}

// ── Tiny helpers ───────────────────────────────────────────────────────────────

function OnlineDot({ online }) {
  return (
    <span
      style={{
        display:      'inline-block',
        width:        '10px',
        height:       '10px',
        borderRadius: '50%',
        background:   online ? '#22c55e' : '#94a3b8',
        border:       '2px solid white',
        flexShrink:   0,
      }}
    />
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { id: recipientId } = useParams();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  const {
    conversations,
    thread,
    loading,
    isTyping,
    onlineUsers,
    unreadTotal,
    sendMessage,
    onKeystroke,
    fetchConversations,
  } = useMessaging(recipientId ? Number(recipientId) : null);

  const [body,      setBody]      = useState('');
  const [recipient, setRecipient] = useState(null);
  const [search,    setSearch]    = useState('');

  const bottomRef = useRef();
  const inputRef  = useRef();

  // ── Load recipient profile ──────────────────────────────────────────────────

  useEffect(() => {
    if (!recipientId) { setRecipient(null); return; }
    studentsApi.show(recipientId).then(({ data }) => setRecipient(data)).catch(() => {});
  }, [recipientId]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread, isTyping]);

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || !recipientId) return;
    const text = body;
    setBody('');
    try {
      await sendMessage(Number(recipientId), text);
    } catch {
      setBody(text); // restore on error
    }
  };

  // ── Typing ──────────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(() => {
    if (recipientId) onKeystroke(Number(recipientId));
  }, [recipientId, onKeystroke]);

  // ── Filtered conversations ──────────────────────────────────────────────────

  const filtered = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = conv.sender_id === user?.id ? conv.receiver : conv.sender;
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  // ── Styles ──────────────────────────────────────────────────────────────────

  const S = {
    page:        { display:'flex', flexDirection:'column', height:'100vh', background:'#f8fafc' },
    body:        { display:'flex', flex:1, overflow:'hidden', maxWidth:'1400px', width:'100%', margin:'0 auto' },
    sidebar:     { width:'300px', flexShrink:0, background:'white', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' },
    sidebarHead: { padding:'20px', borderBottom:'1px solid #e2e8f0', flexShrink:0 },
    searchWrap:  { padding:'0 16px 12px', flexShrink:0 },
    searchInput: { width:'100%', padding:'8px 14px', borderRadius:'50px', border:'1px solid #e2e8f0', fontSize:'13px', outline:'none', background:'#f8fafc', boxSizing:'border-box' },
    convList:    { overflowY:'auto', flex:1 },
    chatArea:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
    chatHeader:  { background:'white', borderBottom:'1px solid #e2e8f0', padding:'16px 24px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 },
    messages:    { flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'12px', background:'#f8fafc' },
    inputArea:   { background:'white', borderTop:'1px solid #e2e8f0', padding:'16px 24px', display:'flex', gap:'12px', alignItems:'center', flexShrink:0 },
  };

  return (
    <div style={S.page}>
      <Navbar unreadMessageCount={unreadTotal} />

      <div style={S.body}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={S.sidebar} className="hidden sm:flex flex-col">

          {/* Header */}
          <div style={S.sidebarHead}>
            <p style={{ fontWeight:700, fontSize:'15px', color:'var(--nu-blue)', margin:0 }}>
              <i className="fas fa-comment-dots mr-2" style={{ color:'var(--nu-blue-bright)' }} />
              Messages
            </p>
          </div>

          {/* Search */}
          <div style={S.searchWrap}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={S.searchInput}
            />
          </div>

          {/* List */}
          <div style={S.convList}>
            {filtered.length === 0 && (
              <p style={{ fontSize:'12px', color:'#94a3b8', padding:'16px' }}>
                {search ? 'No matches found.' : 'No conversations yet.'}
              </p>
            )}

            {filtered.map(conv => {
              const other    = conv.sender_id === user?.id ? conv.receiver : conv.sender;
              if (!other) return null;
              const isActive = String(recipientId) === String(other.id);
              const isOnline = onlineUsers.has(other.id);

              return (
                <Link
                  key={conv.id}
                  to={`/messages/${other.id}`}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '12px',
                    padding:        '14px 16px',
                    borderBottom:   '1px solid #f1f5f9',
                    background:     isActive ? '#eef2ff' : 'white',
                    textDecoration: 'none',
                    color:          'inherit',
                    transition:     'background .15s',
                  }}
                >
                  {/* ✅ FIXED: Avatar with onError fallback */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img
                      src={avatarSrc(other.profile_picture, other.name)}
                      onError={e => avatarError(e, other.name)}
                      alt={other.name}
                      style={{ width:'44px', height:'44px', borderRadius:'12px', objectFit:'cover' }}
                    />
                    <span style={{ position:'absolute', bottom:'-2px', right:'-2px' }}>
                      <OnlineDot online={isOnline} />
                    </span>
                  </div>

                  {/* Name + preview */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ fontWeight:700, fontSize:'13px', color:'var(--nu-blue)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {other.name}
                      </p>
                      <span style={{ fontSize:'11px', color:'#94a3b8', flexShrink:0, marginLeft:'8px' }}>
                        {formatTime(conv.created_at)}
                      </span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ fontSize:'12px', color:'#94a3b8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'150px' }}>
                        {conv.body}
                      </p>
                      {conv.unread_count > 0 && (
                        <span style={{ background:'var(--nu-blue-bright)', color:'white', borderRadius:'50px', fontSize:'11px', fontWeight:700, padding:'2px 7px', flexShrink:0 }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Find students CTA */}
          <div style={{ padding:'16px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
            <Link
              to="/directory"
              style={{ display:'block', textAlign:'center', background:'var(--nu-blue)', color:'white', borderRadius:'12px', padding:'10px', fontSize:'13px', fontWeight:700, textDecoration:'none' }}
            >
              <i className="fas fa-search mr-2" />Find Students
            </Link>
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <div style={S.chatArea}>
          {recipientId ? (
            <>
              {/* Header */}
              <div style={S.chatHeader}>
                {/* Mobile back button */}
                <button
                  onClick={() => navigate('/messages')}
                  className="sm:hidden"
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'var(--nu-blue)', padding:0 }}
                >
                  <i className="fas fa-arrow-left" />
                </button>

                {recipient && (
                  <>
                    {/* ✅ FIXED: Avatar with onError fallback */}
                    <div style={{ position:'relative' }}>
                      <img
                        src={avatarSrc(recipient.profile_picture, recipient.name)}
                        onError={e => avatarError(e, recipient.name)}
                        alt={recipient.name}
                        style={{ width:'40px', height:'40px', borderRadius:'10px', objectFit:'cover' }}
                      />
                      <span style={{ position:'absolute', bottom:'-2px', right:'-2px' }}>
                        <OnlineDot online={onlineUsers.has(recipient.id)} />
                      </span>
                    </div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:'14px', color:'var(--nu-blue)', margin:0 }}>
                        {recipient.name}
                      </p>
                      <p style={{ fontSize:'12px', color: onlineUsers.has(recipient.id) ? '#22c55e' : '#94a3b8', margin:0 }}>
                        {onlineUsers.has(recipient.id) ? 'Online' : (recipient.course ?? '')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div style={S.messages}>
                {loading && (
                  <p style={{ textAlign:'center', fontSize:'13px', color:'#94a3b8' }}>Loading messages…</p>
                )}

                {thread.map(msg => {
                  const isMine = String(msg.sender_id) === String(user?.id);
                  return (
                    <div key={msg.id} style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div>
                        <div
                          style={{
                            maxWidth:     '320px',
                            padding:      '11px 17px',
                            borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background:   isMine ? 'var(--nu-blue-bright)' : 'white',
                            color:        isMine ? 'white' : 'var(--nu-blue)',
                            fontSize:     '14px',
                            boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
                            opacity:      msg._optimistic ? 0.7 : 1,
                          }}
                        >
                          {msg.body}
                        </div>
                        <p style={{ fontSize:'11px', color:'#94a3b8', margin:'4px 4px 0', textAlign: isMine ? 'right' : 'left' }}>
                          {formatTime(msg.created_at)}
                          {isMine && msg.is_read && (
                            <span style={{ marginLeft:'6px', color:'var(--nu-blue-bright)' }}>
                              <i className="fas fa-check-double" style={{ fontSize:'10px' }} />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display:'flex', justifyContent:'flex-start' }}>
                    <div style={{ background:'white', borderRadius:'20px 20px 20px 4px', padding:'12px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', gap:'4px', alignItems:'center' }}>
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          style={{
                            width:'7px', height:'7px', borderRadius:'50%',
                            background:'#94a3b8',
                            animation:`typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={S.inputArea}>
                <input
                  ref={inputRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  style={{ flex:1, padding:'12px 20px', borderRadius:'50px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'14px', outline:'none' }}
                />
                <button
                  type="submit"
                  disabled={!body.trim()}
                  style={{
                    padding:'12px 24px', borderRadius:'50px', background:'var(--nu-blue-bright)',
                    color:'white', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px',
                    opacity: !body.trim() ? 0.5 : 1, display:'flex', alignItems:'center', gap:'6px',
                  }}
                >
                  <i className="fas fa-paper-plane" /> Send
                </button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
              <i className="fas fa-comment-dots" style={{ fontSize:'64px', opacity:0.2, marginBottom:'16px' }} />
              <p style={{ fontWeight:600, margin:0 }}>Select a conversation</p>
              <p style={{ fontSize:'13px', marginTop:'4px' }}>or find someone to chat with</p>
              <Link
                to="/directory"
                style={{ marginTop:'20px', background:'var(--nu-blue)', color:'white', padding:'12px 24px', borderRadius:'12px', fontWeight:700, fontSize:'13px', textDecoration:'none' }}
              >
                Find Students
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Typing bounce animation */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}