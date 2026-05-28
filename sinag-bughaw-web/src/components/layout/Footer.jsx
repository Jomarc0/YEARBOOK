import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/directory',  label: 'Student Directory' },
  { to: '/faculty',    label: 'Faculty'            },
  { to: '/gallery',    label: 'Gallery'            },
  { to: '/sections',   label: 'Sections'           },
  { to: '/flipbook',   label: 'Flipbook'           },
  { to: '/analytics',  label: 'Analytics'          },
];

const PLATFORM_LINKS = [
  { to: '/register',   label: 'Join Free'          },
  { to: '/login',      label: 'Log In'             },
  { to: '/premium',    label: 'Go Premium'         },
  { to: '/settings',   label: 'Settings'           },
];

export default function Footer() {
  return (
    <footer className="bg-[#0e1628] text-slate-400 mt-auto">

      {/* Main footer content */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/dashboard" className="no-underline inline-flex items-center gap-2.5 mb-4">
              <img src="/images/NU_logo.png" alt="NU Lipa" className="w-9 h-9 object-contain" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-white font-black text-[13px] uppercase tracking-widest">Sinag-Bughaw</span>
                <span className="text-[#fdb813] text-[9px] font-semibold uppercase tracking-[0.18em]">Digital Yearbook</span>
              </div>
            </Link>
            <p className="text-[12px] leading-relaxed text-slate-500 m-0 max-w-xs">
              Celebrating academic excellence and cherished memories. The official digital yearbook platform of National University Lipa.
            </p>

            {/* Social placeholder icons */}
            <div className="flex gap-2 mt-5">
              {['fa-facebook-f', 'fa-twitter', 'fa-instagram'].map(icon => (
                <span
                  key={icon}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center
                             text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/15
                             transition-all cursor-pointer text-[12px]"
                  aria-hidden="true"
                >
                  <i className={`fab ${icon}`} />
                </span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-[13px] font-semibold mb-4 mt-0 pl-3 border-l-[3px] border-[#fdb813] leading-none">
              Quick Links
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-500 hover:text-white text-[12px] no-underline transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white text-[13px] font-semibold mb-4 mt-0 pl-3 border-l-[3px] border-[#fdb813] leading-none">
              Platform
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {PLATFORM_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-500 hover:text-white text-[12px] no-underline transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-[13px] font-semibold mb-4 mt-0 pl-3 border-l-[3px] border-[#fdb813] leading-none">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-[12px]">
              <div className="flex items-start gap-2.5 text-slate-500">
                <i className="fas fa-map-marker-alt text-[#fdb813] text-[11px] mt-0.5 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">Lipa City, Batangas<br />National University Lipa</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <i className="fas fa-envelope text-[#fdb813] text-[11px] shrink-0" aria-hidden="true" />
                <span>sinagbughaw@nu-lipa.edu.ph</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-600 m-0">
            &copy; {new Date().getFullYear()} National University Lipa. Sinag-Bughaw Project.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Use'].map(label => (
              <span key={label} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}