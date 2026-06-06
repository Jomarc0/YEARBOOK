import React from 'react';
import { YEARBOOK_ASSETS, yb } from '../../theme/yearbookTheme';

export function EditorialPage({ children, tone = 'paper', className = '', pageNum, right = false }) {
  const base = tone === 'dark' ? yb.darkPage : tone === 'cream' ? yb.creamPage : yb.paperPage;

  return (
    <section className={`${base} flex-col ${className}`}>
      {children}
      {pageNum ? <PageNumber value={pageNum} right={right} dark={tone === 'dark'} /> : null}
    </section>
  );
}

export function DarkImageLayer({ src = YEARBOOK_ASSETS.building, opacity = 'opacity-45' }) {
  return (
    <>
      <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover ${opacity}`} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#031225]/95 via-[#071a33]/88 to-[#031225]/72" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_78%_62%,rgba(200,155,60,0.10),transparent_28%)]" />
    </>
  );
}

export function GoldFrame({ subtle = false }) {
  return (
    <>
      <div className={`pointer-events-none absolute inset-4 border ${subtle ? 'border-[#c89b3c]/35' : 'border-[#c89b3c]/75'}`} />
      <div className="pointer-events-none absolute inset-7 border border-white/10" />
    </>
  );
}

export function NUSeal({ className = '', faint = false }) {
  return (
    <img
      src={YEARBOOK_ASSETS.logo}
      alt="National University"
      className={`${className} ${faint ? 'opacity-10 grayscale' : ''} object-contain`}
    />
  );
}

export function EditorialHeader({ eyebrow, title, kicker, dark = false, compact = false, className = '' }) {
  return (
    <header className={`relative z-10 ${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {eyebrow ? <p className={yb.eyebrow}>{eyebrow}</p> : null}
      <h1 className={`${dark ? yb.titleDark : yb.title} mt-2`}>{title}</h1>
      <GoldRule className="mt-4" />
      {kicker ? <p className={`${dark ? 'text-[#f7f1e6]/65' : 'text-[#172033]/65'} mt-4 max-w-[26rem] font-serif text-[10px] leading-6`}>{kicker}</p> : null}
    </header>
  );
}

export function GoldRule({ className = '' }) {
  return <div className={`${yb.rule} ${className}`} />;
}

export function PageNumber({ value, right = false, dark = false }) {
  return (
    <div className={`relative z-10 mt-auto flex items-center gap-3 pt-3 text-[8px] uppercase tracking-[0.18em] ${right ? 'justify-end' : ''} ${dark ? 'text-white/38' : 'text-[#9b927e]'}`}>
      <span className="h-px w-16 bg-current opacity-40" />
      <span>{String(value).padStart(2, '0')}</span>
    </div>
  );
}

export function StatBlock({ value, label, dark = false }) {
  return (
    <div className={`${dark ? 'border-white/10 bg-white/5 text-[#f7f1e6]' : 'border-[#d8c7a2]/45 bg-white/55 text-[#172033]'} border p-4`}>
      <div className="font-serif text-[25px] font-bold leading-none text-[#c89b3c]">{value ?? 0}</div>
      <div className={`mt-2 font-sans text-[7px] font-black uppercase tracking-[0.18em] ${dark ? 'text-white/62' : 'text-[#172033]/55'}`}>{label}</div>
    </div>
  );
}

export function QuoteCard({ quote, name, meta }) {
  return (
    <article className="relative border border-[#d8c7a2]/45 bg-white/55 p-4 shadow-[0_10px_28px_rgba(7,26,51,0.06)]">
      <div className="absolute left-3 top-1 font-serif text-4xl leading-none text-[#c89b3c]/45">“</div>
      <p className="relative z-10 pl-4 font-serif text-[11px] italic leading-6 text-[#172033]/85">{quote}</p>
      <div className="mt-3 border-t border-[#d8c7a2]/35 pt-2">
        <p className="font-sans text-[8px] font-black uppercase tracking-[0.12em] text-[#172033]">{name}</p>
        {meta ? <p className="mt-1 text-[7px] uppercase tracking-[0.12em] text-[#5f6470]">{meta}</p> : null}
      </div>
    </article>
  );
}

export function Portrait({ src, name, className = '', initials }) {
  if (src) {
    return <img src={src} alt={name} className={`block bg-[#e8dfcc] object-contain object-center ${className}`} loading="lazy" />;
  }
  return (
    <div className={`grid place-items-center bg-[#e8dfcc] font-serif text-3xl font-bold text-[#071a33] ${className}`}>
      {initials}
    </div>
  );
}

export function Field({ label, value, clamp = true }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className={yb.label}>{label}</p>
      <p className={`mt-1 break-words font-serif text-[8px] leading-[1.45] text-[#172033]/72 ${clamp ? 'line-clamp-2' : ''}`}>{value}</p>
    </div>
  );
}
