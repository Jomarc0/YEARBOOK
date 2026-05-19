import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PremiumBadge from './PremiumBadge';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Home'      },
    { to: '/directory', label: 'Directory' },
    { to: '/faculty',   label: 'Faculty'   },
    { to: '/gallery',   label: 'Gallery'   },
    { to: '/sections',  label: 'Sections'  },
  ];

  const avatar = user?.profile_picture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=3f51b5&color=fff`;

  return (
    <nav
      className="flex justify-between items-center px-[8%] py-[15px] bg-white sticky top-0 z-[1000]"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="no-underline">
        <h3 className="text-[1.1rem] font-extrabold uppercase leading-none" style={{ color: 'var(--nu-blue)' }}>
          NU LIPA
        </h3>
        <span className="text-[0.65rem] font-normal tracking-widest block" style={{ color: 'var(--nu-yellow)' }}>
          SINAG-BUGHAW
        </span>
      </Link>

      {/* Nav Links */}
      <ul className="flex gap-[30px] list-none items-center">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className="text-[0.85rem] font-semibold no-underline transition-all duration-300 relative"
                style={{ color: isActive ? 'var(--nu-blue)' : '#64748b' }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute left-0 w-5 h-[3px] rounded-full"
                    style={{ bottom: '-5px', background: 'var(--nu-yellow)' }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <NotificationBell />

        {/* User name + premium badge */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-0.5">
            <b className="text-[0.8rem]" style={{ color: 'var(--nu-blue)' }}>{user?.name}</b>
            {user?.is_premium && <PremiumBadge size="sm" />}
          </div>
          <span className="text-[0.65rem] block" style={{ color: '#94a3b8' }}>
            {user?.course ?? 'Student'}
          </span>
        </div>

        {/* Avatar → own profile */}
        <Link to={`/profile/${user?.id}`}>
          <div
            className="w-[42px] h-[42px] rounded-full p-[2px] flex items-center justify-center"
            style={{ background: 'linear-gradient(45deg, var(--nu-blue), var(--nu-yellow))' }}
          >
            <img
              src={avatar}
              alt={user?.name}
              className="w-full h-full rounded-full object-cover border-2 border-white"
            />
          </div>
        </Link>

        {/* Settings gear */}
        <Link
          to="/settings"
          className="flex items-center justify-center w-[34px] h-[34px] rounded-full transition-all no-underline"
          style={{ background: '#f1f5f9', color: '#64748b' }}
          title="Settings"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--nu-blue)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
        >
          <i className="fas fa-cog text-sm" />
        </Link>
      </div>
    </nav>
  );
}