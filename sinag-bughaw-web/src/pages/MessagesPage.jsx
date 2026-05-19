import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { messagesApi, studentsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function MessagesPage() {
  const { id: recipientId }   = useParams();
  const { user }              = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [body,       setBody]       = useState('');
  const [recipient,  setRecipient]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    messagesApi.conversations().then(({ data }) => setConversations(data));
  }, []);

  useEffect(() => {
    if (!recipientId) return;
    setLoading(true);
    messagesApi.thread(recipientId).then(({ data }) => setMessages((data.data ?? []).reverse())).finally(() => setLoading(false));
    studentsApi.show(recipientId).then(({ data }) => setRecipient(data));
  }, [recipientId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !recipientId) return;
    const optimistic = { id: Date.now(), sender_id: user.id, body, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setBody('');
    await messagesApi.send(recipientId, body);
  };

  return (
    <div className="flex flex-col" style={{ height:'100vh', background:'#f8fafc' }}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden" style={{ maxWidth:'1400px', width:'100%', margin:'0 auto' }}>
        {/* Sidebar */}
        <div className="flex-shrink-0 bg-white border-r overflow-y-auto hidden sm:block" style={{ width:'280px', borderColor:'#e2e8f0' }}>
          <div className="font-bold p-5 border-b text-sm" style={{ color:'var(--nu-blue)', borderColor:'#e2e8f0' }}>
            <i className="fas fa-comment-dots mr-2" style={{ color:'var(--nu-blue-bright)' }} />Conversations
          </div>
          {conversations.length === 0 && <p className="text-xs p-4" style={{ color:'#94a3b8' }}>No conversations yet. Find a student in the directory and start a chat!</p>}
          {conversations.map(conv => {
            const other = conv.sender_id === user?.id ? conv.receiver : conv.sender;
            if (!other) return null;
            return (
              <Link key={conv.id} to={`/messages/${other.id}`}
                className="flex items-center gap-3 no-underline border-b transition-all"
                style={{ padding:'16px 20px', color:'inherit', borderColor:'#f1f5f9', background: recipientId === String(other.id) ? '#eef2ff' : 'white' }}
                onMouseEnter={e=>{if(recipientId!==String(other.id))e.currentTarget.style.background='#f8fafc';}}
                onMouseLeave={e=>{if(recipientId!==String(other.id))e.currentTarget.style.background='white';}}>
                <img src={other.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=1d2b4b&color=fff`}
                  className="object-cover flex-shrink-0" style={{ width:'42px',height:'42px',borderRadius:'12px' }} />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color:'var(--nu-blue)' }}>{other.name}</p>
                  <p className="text-xs truncate" style={{ color:'#94a3b8' }}>{conv.body}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {recipientId ? (
            <>
              {/* Header */}
              <div className="bg-white border-b flex items-center gap-3 flex-shrink-0" style={{ padding:'16px 24px', borderColor:'#e2e8f0' }}>
                {recipient && (
                  <>
                    <img src={recipient.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.name)}&background=1d2b4b&color=fff`}
                      className="object-cover" style={{ width:'38px',height:'38px',borderRadius:'10px' }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color:'var(--nu-blue)' }}>{recipient.name}</p>
                      <p className="text-xs" style={{ color:'#94a3b8' }}>{recipient.course}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background:'#f8fafc' }}>
                {loading && <p className="text-center text-sm" style={{ color:'#94a3b8' }}>Loading messages...</p>}
                {messages.map(msg => {
                  const isMine = String(msg.sender_id) === String(user?.id);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs text-sm"
                        style={{ padding:'12px 18px', borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: isMine ? 'var(--nu-blue-bright)' : 'white', color: isMine ? 'white' : 'var(--nu-blue)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={send} className="bg-white border-t flex gap-3 flex-shrink-0" style={{ padding:'16px 24px', borderColor:'#e2e8f0' }}>
                <input value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 outline-none text-sm"
                  style={{ padding:'12px 20px', borderRadius:'50px', border:'1px solid #e2e8f0', background:'#f8fafc' }} />
                <button type="submit" disabled={!body.trim()}
                  className="font-bold text-sm text-white border-none cursor-pointer flex items-center gap-2"
                  style={{ padding:'12px 24px', borderRadius:'50px', background:'var(--nu-blue-bright)', opacity: !body.trim() ? 0.5 : 1 }}>
                  <i className="fas fa-paper-plane" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color:'#94a3b8' }}>
              <i className="fas fa-comment-dots text-6xl mb-4 opacity-20" />
              <p className="font-semibold">Select a conversation to start chatting</p>
              <Link to="/directory" className="mt-4 font-bold no-underline text-sm px-6 py-3 rounded-xl"
                style={{ background:'var(--nu-blue)', color:'white' }}>
                Find Students
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}