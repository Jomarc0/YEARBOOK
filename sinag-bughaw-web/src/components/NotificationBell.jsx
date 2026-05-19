import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../services/api';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

export default function NotificationBell() {
  const [open,          setOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(false);
  const dropdownRef = useRef(null);
  const pollRef     = useRef(null);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await notificationsApi.list();
      const list = data.data ?? data;
      setNotifications(list);
      setUnread(list.filter(n => !n.read_at).length);
    } catch {
      // silently ignore — network may be flaky
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + polling every 20 s
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(() => fetchNotifications(true), 20000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mark all as read when opening dropdown
  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unread > 0) {
      // optimistic
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      try {
        // mark each unread one
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        await Promise.all(unreadIds.map(id => notificationsApi.markRead(id)));
      } catch { /* no-op */ }
    }
  };

  // Notification type → icon + color
  const typeStyle = (type) => {
    switch (type) {
      case 'message':     return { icon: 'fa-comment-dots',   bg: '#eef2ff', color: '#3f51b5' };
      case 'like':        return { icon: 'fa-heart',          bg: '#fef2f2', color: '#ef4444' };
      case 'tag':         return { icon: 'fa-tag',            bg: '#f0fdf4', color: '#22c55e' };
      case 'announcement':return { icon: 'fa-bell',           bg: '#fffbeb', color: '#d97706' };
      default:            return { icon: 'fa-bell',           bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-[38px] h-[38px] rounded-full border-none cursor-pointer transition-all"
        style={{ background: open ? 'var(--nu-blue)' : '#f1f5f9', color: open ? 'white' : '#64748b' }}
        title="Notifications"
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#e2e8f0'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = '#f1f5f9'; } }}
      >
        <i className="fas fa-bell text-sm" />

        {/* Unread badge */}
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center font-extrabold"
            style={{
              top: '-4px', right: '-4px',
              minWidth: '18px', height: '18px',
              padding: '0 4px',
              borderRadius: '9px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.6rem',
              border: '2px solid white',
              lineHeight: 1,
              animation: 'bellPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute bg-white overflow-hidden"
          style={{
            top: 'calc(100% + 12px)',
            right: 0,
            width: '360px',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
            zIndex: 9999,
            animation: 'dropIn 0.2s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div>
              <h4 className="font-extrabold text-sm" style={{ color: 'var(--nu-blue)' }}>Notifications</h4>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                {unread === 0 ? 'All caught up!' : `${unread} unread`}
              </p>
            </div>
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg transition-all"
              style={{ background: '#eef2ff', color: 'var(--nu-blue-bright)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#eef2ff'}
            >
              View All Messages
            </Link>
          </div>

          {/* Body */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 rounded-full border-2"
                  style={{ borderColor: 'rgba(63,81,181,0.2)', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite' }} />
                <p className="text-xs" style={{ color: '#94a3b8' }}>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#f1f5f9' }}>
                  <i className="fas fa-bell-slash text-2xl" style={{ color: '#cbd5e1' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#94a3b8' }}>No notifications yet</p>
                <p className="text-xs" style={{ color: '#cbd5e1' }}>You'll see messages and updates here</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const st       = typeStyle(n.type ?? 'default');
                const isUnread = !n.read_at;
                const sender   = n.data?.sender_name ?? n.sender_name ?? 'Someone';
                const preview  = n.data?.message     ?? n.body        ?? n.message ?? 'Sent you a message';
                const senderId = n.data?.sender_id   ?? n.sender_id;
                const avatar   = n.data?.sender_avatar ?? null;

                return (
                  <Link
                    key={n.id}
                    to={senderId ? `/messages/${senderId}` : '/messages'}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 no-underline transition-all border-b"
                    style={{
                      padding: '14px 20px',
                      background: isUnread ? '#fafbff' : 'white',
                      borderColor: '#f8fafc',
                      color: 'inherit',
                      animationDelay: `${i * 0.04}s`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = isUnread ? '#fafbff' : 'white'}
                  >
                    {/* Sender avatar or type icon */}
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={sender}
                          className="object-cover"
                          style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                      ) : (
                        <div className="flex items-center justify-center font-extrabold"
                          style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--nu-blue)', color: 'var(--nu-yellow)', fontSize: '0.8rem' }}>
                          {getInitials(sender)}
                        </div>
                      )}
                      {/* Type icon bubble */}
                      <div className="absolute flex items-center justify-center"
                        style={{ bottom: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: st.bg, border: '2px solid white' }}>
                        <i className={`fas ${st.icon}`} style={{ fontSize: '0.45rem', color: st.color }} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold mb-0.5 truncate" style={{ color: 'var(--nu-blue)' }}>
                        {sender}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>
                        {preview}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        <i className="fas fa-clock mr-1" style={{ fontSize: '0.6rem' }} />
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full"
                        style={{ background: 'var(--nu-blue-bright)' }} />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
              <button
                onClick={() => { setNotifications([]); setUnread(0); setOpen(false); }}
                className="text-xs font-semibold border-none bg-transparent cursor-pointer transition-all"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <i className="fas fa-trash-alt mr-1" /> Clear all
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellPop  { from{transform:scale(0)} to{transform:scale(1)} }
        @keyframes dropIn   { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}