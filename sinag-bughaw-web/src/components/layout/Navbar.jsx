import { Link, useLocation }           from 'react-router-dom';
import { useAuth }                      from '../../features/auth/hooks/useAuth';
import { storageUrl }                   from '@/api/client';
import NotificationBell                 from '@/components/feedback/NotificationBell';
import { useState, useRef, useEffect }  from 'react';
import { messagesApi }                  from '@/api/messaging.api';

function useUnreadMessages() {
  const [count, setCount] = useState(0);

  const refresh = async () => {
    try {
      const { data } = await messagesApi.unreadCount();
      setCount(data.unread_count ?? 0);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    window.addEventListener('messaging:unread-updated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('messaging:unread-updated', refresh);
    };
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) setCount(0);
  }, [location.pathname]);

  return count;
}

function UnreadBadge({ count }) {
  if (!count || count < 1) return null;
  return (
    <span style={{
      position:     'absolute',
      top:          '-5px',
      right:        '-6px',
      background:   '#ef4444',
      color:        'white',
      borderRadius: '50px',
      fontSize:     '10px',
      fontWeight:   800,
      padding:      '1px 5px',
      lineHeight:   '15px',
      minWidth:     '15px',
      textAlign:    'center',
      pointerEvents:'none',
      border:       '1.5px solid #1d2b4b',
    }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef        = useRef(null);
  const unreadMessages = useUnreadMessages();

  const avatarSrc = storageUrl(user?.profile_picture)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=fdb813&color=1d2b4b&size=64`;

  const links = [
    { to: '/dashboard', label: 'Home'      },
    { to: '/directory', label: 'Directory' },
    { to: '/faculty',   label: 'Faculty'   },
    { to: '/gallery',   label: 'Gallery'   },
    { to: '/yearbook',  label: 'Yearbook'  }, // ← was /flipbook
    { to: '/sections',  label: 'Sections'  },
    { to: '/discover',  label: 'Discovery' },
  ];

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'U';

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 64, background: '#1d2b4b',
      position: 'sticky', top: 0, zIndex: 1000,
      boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
    }}>

      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/images/NU_logo.png" alt="NU Lipa" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 }}>Sinag-Bughaw</span>
          <span style={{ fontSize: 9, color: '#fdb813', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1 }}>National University Lipa</span>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2 }}>
        {links.map(link => {
          const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
          return (
            <Link key={link.to} to={link.to}
              style={{
                textDecoration: 'none', fontSize: 13,
                color:      isActive ? '#fdb813' : 'rgba(255,255,255,0.6)',
                padding:    '7px 16px', borderRadius: 7,
                background: isActive ? 'rgba(253,184,19,0.12)' : 'transparent',
                transition: 'all 0.15s', fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        <NotificationBell />

        {/* Messages icon */}
        <Link
          to="/messages"
          style={{
            position:       'relative',
            width:          34, height: 34,
            borderRadius:   8,
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            color:          location.pathname.startsWith('/messages') ? '#fdb813' : 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            transition:     'all 0.15s',
            background:     location.pathname.startsWith('/messages') ? 'rgba(253,184,19,0.12)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (!location.pathname.startsWith('/messages')) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color      = '#fff';
            }
          }}
          onMouseLeave={e => {
            if (!location.pathname.startsWith('/messages')) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color      = 'rgba(255,255,255,0.6)';
            }
          }}
        >
          <i className="fas fa-comment-dots" style={{ fontSize: 16 }} />
          <UnreadBadge count={unreadMessages} />
        </Link>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />

        {/* Avatar dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 6px', borderRadius: 10,
              background: dropOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!dropOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', background: '#fdb813', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profile_picture ? (
                <img src={avatarSrc} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:12px;font-weight:700;color:#1d2b4b">${initials}</span>`; }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1d2b4b' }}>{initials}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
                {user?.name?.split(' ')[0]}
              </span>
              {user?.tier === 'premium' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg, #fdb813, #e5a70e)', color: '#1d2b4b', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}>
                  <i className="fas fa-crown" style={{ fontSize: 8 }} /> Premium
                </span>
              ) : user?.tier === 'standard' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(63,81,181,0.3)', color: '#a5b4fc', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}>
                  <i className="fas fa-bolt" style={{ fontSize: 8 }} /> Standard
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}>
                  Free Tier
                </span>
              )}
            </div>

            <i className="fas fa-chevron-down" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginLeft: 2, transition: 'transform 0.15s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', borderRadius: 14,
              boxShadow: '0 12px 40px rgba(29,43,75,0.18)',
              border: '1px solid #e8edf5',
              minWidth: 200, overflow: 'hidden',
              animation: 'dropIn 0.18s cubic-bezier(0.34,1.2,0.64,1)',
              zIndex: 9999,
            }}>
              <style>{`@keyframes dropIn { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>

              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2b4b' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{user?.email}</div>
              </div>

              {[
                { icon: 'fa-user',  color: '#3f51b5', label: 'View Profile', to: `/profile/${user?.id}` },
                { icon: 'fa-cog',   color: '#64748b', label: 'Settings',     to: '/settings'            },
                { icon: 'fa-crown', color: '#fdb813', label: 'Go Premium',   to: '/premium'             },
              ].map(item => (
                <Link key={item.label} to={item.to}
                  onClick={() => setDropOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px', textDecoration: 'none',
                    color: '#1d2b4b', fontSize: 13, fontWeight: 500,
                    transition: 'background 0.1s', borderBottom: '1px solid #f8fafc',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f7fe'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: 13, width: 16, textAlign: 'center' }} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', border: 'none', background: '#fff',
                  color: '#ef4444', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.1s',
                  borderTop: '1px solid #f1f5f9',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <i className="fas fa-sign-out-alt" style={{ fontSize: 13, width: 16, textAlign: 'center' }} />
                Log Out
              </button>
            </div>
          )}
        </div>

        <Link to="/settings"
          style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <i className="fas fa-cog" style={{ fontSize: 15 }} />
        </Link>
      </div>
    </nav>
  );
}