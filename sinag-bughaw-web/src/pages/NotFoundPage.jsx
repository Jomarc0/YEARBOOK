import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      <div className="text-center text-white" style={{ padding: '40px' }}>
        <div className="font-extrabold mb-4" style={{ fontSize: '8rem', color: '#fdb813', lineHeight: 1 }}>404</div>
        <h1 className="font-extrabold text-3xl mb-3">Page Not Found</h1>
        <p className="mb-8 opacity-70" style={{ fontSize: '1rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard"
          className="font-bold no-underline inline-flex items-center gap-3 transition-all"
          style={{ background: '#fdb813', color: '#1d2b4b', padding: '16px 40px', borderRadius: '15px', fontSize: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <i className="fas fa-home" /> Go Back Home
        </Link>
      </div>

      <p className="absolute bottom-8 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        © 2026 National University Lipa — Sinag-Bughaw
      </p>
    </div>
  );
}