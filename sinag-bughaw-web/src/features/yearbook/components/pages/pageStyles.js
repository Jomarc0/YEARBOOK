/**
 * pageStyles.js
 * src/features/yearbook/components/pages/pageStyles.js
 *
 * Shared style constants and tiny helpers used across
 * all leaf page components. No Tailwind here inline
 * styles so react-pageflip can SSR-render without class
 * purging issues.
 */

export const GOLD    = '#c9a84c';
export const DARK    = '#1a1a2e';
export const DARKER  = '#12121f';
export const CREAM   = '#fffdf8';
export const OFFWHITE = '#f7f3ec';
export const INK = '#20243a';
export const MUTED = '#7e796d';
export const BLUE = '#203a73';
export const MAROON = '#6d2634';
export const SAGE = '#687765';
export const RULE    = 'rgba(255,255,255,.1)';

export const PAGE_W = 560;
export const PAGE_H = 420;

/** Base style shared by every page leaf */
export const pageBase = (bg = CREAM, extra = {}) => ({
  width:      '100%',
  height:     '100%',
  background: bg,
  padding:    '30px 26px',
  display:    'flex',
  flexDirection: 'column',
  position:   'relative',
  overflow:   'hidden',
  boxSizing:  'border-box',
  ...extra,
});

/** Section tag above headings */
export const tagStyle = {
  fontSize:      8,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color:         GOLD,
  marginBottom:  6,
};

/** Main page heading */
export const headingStyle = {
  fontFamily:  'Cormorant Garamond, Georgia, serif',
  fontSize:    22,
  lineHeight:  1.2,
  color:       DARK,
  marginBottom: 16,
};

/** Page number footer */
export const pnumStyle = (right = false) => ({
  fontSize:    9,
  color:       '#bbb',
  marginTop:   'auto',
  paddingTop:  8,
  ...(right ? { textAlign: 'right' } : {}),
});

/** Thin horizontal rule */
export const divider = {
  height:     0.5,
  background: '#ece5d4',
  margin:     '10px 0',
};

export const editorialTitle = (size = 26, color = DARK) => ({
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  fontSize: size,
  lineHeight: 1.08,
  color,
  fontWeight: 700,
});

export const smallCaps = (color = GOLD) => ({
  fontSize: 8,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color,
  fontWeight: 700,
});

export const bodyCopy = {
  fontSize: 10.5,
  lineHeight: 1.75,
  color: '#5f5a50',
};

export function textOr(value, fallback = '') {
  return value == null || value === '' ? fallback : value;
}

/** Avatar palette deterministic from student_id */
const PALETTE = [
  { bg: '#e4f0d8', tc: '#2a5618' },
  { bg: '#d8e8f5', tc: '#173660' },
  { bg: '#f5e4d8', tc: '#5c2a10' },
  { bg: '#e8d8f5', tc: '#38185c' },
  { bg: '#d8f0f0', tc: '#0e3d3d' },
  { bg: '#f5f0d8', tc: '#4a3810' },
  { bg: '#f0d8ea', tc: '#4a1838' },
  { bg: '#d8ecd8', tc: '#184818' },
];

export function avatarColor(studentId) {
  const n = parseInt(String(studentId ?? 0).replace(/\D/g, ''), 10) || 0;
  return PALETTE[n % PALETTE.length];
}

export function initials(name = '') {
  const p = name.trim().split(' ');
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase();
}
