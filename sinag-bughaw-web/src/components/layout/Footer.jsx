import { Link } from 'react-router-dom';
import { useAppConfig } from '@/features/platform/AppConfigProvider';

const QUICK_LINKS = [
  { to: '/directory', label: 'Directory' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/sections', label: 'Sections' },
  { to: '/flipbook', label: 'Flipbook' },
  { to: '/analytics', label: 'Analytics' },
];

export default function Footer() {
  const { isOn } = useAppConfig();

  const quickLinks = QUICK_LINKS.filter((link) => {
    if (link.to === '/directory') return isOn('enable_student_directory_search');
    if (link.to === '/flipbook') return isOn('enable_flipbook_viewer');
    return true;
  });

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0e1628] text-slate-500">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-5 py-4 text-[12px] sm:flex-row sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link to="/dashboard" className="inline-flex items-center gap-2 no-underline">
            <img src="/images/NU_logo.png" alt="NU Lipa" className="h-6 w-6 object-contain" />
            <span className="font-black uppercase tracking-widest text-white">Sinag-Bughaw</span>
          </Link>
          <span className="hidden text-slate-700 sm:inline">|</span>
          <span>&copy; {new Date().getFullYear()} National University Lipa</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Footer links">
          {quickLinks.slice(0, 4).map(({ to, label }) => (
            <Link key={to} to={to} className="text-slate-500 no-underline transition-colors hover:text-white">
              {label}
            </Link>
          ))}
          <span className="text-slate-700">|</span>
          <Link to="/privacy" className="text-slate-500 no-underline transition-colors hover:text-white">Privacy</Link>
          <Link to="/terms" className="text-slate-500 no-underline transition-colors hover:text-white">Terms</Link>
          <a href="mailto:sinagbughaw@nu-lipa.edu.ph" className="text-slate-500 no-underline transition-colors hover:text-white">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
