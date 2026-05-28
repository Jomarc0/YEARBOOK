const GOLD = '#fdb813';
const NAVY = '#1d2b4b';

export default function CopyrightLabel({
  institution = 'National University Lipa',
  year,
  variant     = 'dark',
  size        = 'sm',
  className   = '',
  style       = {},
}) {
  const currentYear = year ?? new Date().getFullYear();

  const SIZES = {
    xs: { fontSize: '0.55rem', padding: '3px 9px',  icon: 8,  gap: 4, radius: 20 },
    sm: { fontSize: '0.65rem', padding: '5px 12px', icon: 10, gap: 5, radius: 20 },
    md: { fontSize: '0.75rem', padding: '7px 16px', icon: 12, gap: 6, radius: 24 },
    lg: { fontSize: '0.85rem', padding: '9px 20px', icon: 14, gap: 7, radius: 28 },
  };

  const VARIANTS = {
    dark:  { bg: 'rgba(13,22,45,0.88)',  color: 'rgba(255,255,255,0.9)', iconColor: GOLD, border: 'none' },
    light: { bg: 'rgba(255,255,255,0.92)', color: NAVY, iconColor: NAVY, border: `1px solid rgba(29,43,75,0.12)` },
    gold:  { bg: GOLD, color: NAVY, iconColor: NAVY, border: 'none' },
    glass: { bg: 'rgba(255,255,255,0.12)', color: '#fff', iconColor: GOLD, border: '1px solid rgba(255,255,255,0.2)' },
  };

  const s = SIZES[size]    ?? SIZES.sm;
  const v = VARIANTS[variant] ?? VARIANTS.dark;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: s.gap,
        background: v.bg, backdropFilter: 'blur(8px)',
        border: v.border, borderRadius: s.radius, padding: s.padding,
        userSelect: 'none', pointerEvents: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...style,
      }}
    >
      <i className="fas fa-copyright" style={{ color: v.iconColor, fontSize: s.icon }} />
      <span style={{ fontSize: s.fontSize, fontWeight: 700, color: v.color, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
        {currentYear} {institution} — All Rights Reserved
      </span>
    </div>
  );
}

export function ContentOwnershipBanner({
  institution = 'National University Lipa',
  message     = 'All media in this gallery is the exclusive property of',
  style       = {},
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: `linear-gradient(135deg, ${NAVY} 0%, #2a3d66 100%)`,
      padding: '10px 24px', borderRadius: 14,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      userSelect: 'none', pointerEvents: 'none',
      ...style,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `1.5px solid ${GOLD}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className="fas fa-shield-halved" style={{ color: GOLD, fontSize: 13 }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>
          CONTENT OWNERSHIP
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
          {message} <span style={{ color: GOLD }}>{institution}</span>
        </p>
      </div>
      <div style={{
        marginLeft: 'auto', background: 'rgba(253,184,19,0.12)',
        border: '1px solid rgba(253,184,19,0.3)', borderRadius: 8,
        padding: '4px 10px', fontSize: '0.6rem', fontWeight: 800,
        color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Protected
      </div>
    </div>
  );
}