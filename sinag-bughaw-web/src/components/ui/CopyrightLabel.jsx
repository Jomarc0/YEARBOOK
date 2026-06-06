export default function CopyrightLabel({
  institution = 'National University Lipa',
  year,
  variant = 'dark',
  size = 'sm',
  className = '',
}) {
  const currentYear = year ?? new Date().getFullYear();

  const sizes = {
    xs: 'gap-1 rounded-full px-2 py-0.5 text-[0.55rem] [&_i]:text-[8px]',
    sm: 'gap-1.5 rounded-full px-3 py-1 text-[0.65rem] [&_i]:text-[10px]',
    md: 'gap-1.5 rounded-full px-4 py-1.5 text-xs [&_i]:text-xs',
    lg: 'gap-2 rounded-full px-5 py-2 text-sm [&_i]:text-sm',
  };

  const variants = {
    dark: 'bg-[#0d162d]/90 text-white/90 [&_i]:text-[#fdb813]',
    light: 'border border-[#1d2b4b]/10 bg-white/90 text-[#1d2b4b] [&_i]:text-[#1d2b4b]',
    gold: 'bg-[#fdb813] text-[#1d2b4b] [&_i]:text-[#1d2b4b]',
    glass: 'border border-white/20 bg-white/10 text-white backdrop-blur [&_i]:text-[#fdb813]',
  };

  return (
    <div className={`pointer-events-none inline-flex select-none items-center whitespace-nowrap font-bold tracking-[0.03em] ${sizes[size] ?? sizes.sm} ${variants[variant] ?? variants.dark} ${className}`}>
      <i className="fas fa-copyright" />
      <span>{currentYear} {institution} - All Rights Reserved</span>
    </div>
  );
}

export function ContentOwnershipBanner({
  institution = 'National University Lipa',
  message = 'All media in this gallery is the exclusive property of',
}) {
  return (
    <div className="pointer-events-none flex select-none items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-6 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#fdb813]">
        <i className="fas fa-shield-halved text-[13px] text-[#fdb813]" />
      </div>
      <div>
        <p className="m-0 text-[0.62rem] font-semibold tracking-[0.04em] text-white/55">
          CONTENT OWNERSHIP
        </p>
        <p className="m-0 text-[0.72rem] font-bold text-white">
          {message} <span className="text-[#fdb813]">{institution}</span>
        </p>
      </div>
      <div className="ml-auto rounded-lg border border-[#fdb813]/30 bg-[#fdb813]/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.08em] text-[#fdb813]">
        Protected
      </div>
    </div>
  );
}
