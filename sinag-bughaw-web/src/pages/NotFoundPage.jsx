import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] font-sans">
      <div className="p-10 text-center text-white">
        <div className="mb-4 text-[8rem] font-extrabold leading-none text-[#fdb813]">404</div>
        <h1 className="mb-3 text-3xl font-extrabold">Page Not Found</h1>
        <p className="mb-8 text-base text-white/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-3 rounded-2xl bg-[#fdb813] px-10 py-4 text-base font-bold text-[#1d2b4b] no-underline transition hover:-translate-y-0.5 hover:bg-amber-400"
        >
          <i className="fas fa-home" /> Go Back Home
        </Link>
      </div>

      <p className="absolute bottom-8 text-xs text-white/20">
        © 2026 National University Lipa - Sinag-Bughaw
      </p>
    </div>
  );
}
