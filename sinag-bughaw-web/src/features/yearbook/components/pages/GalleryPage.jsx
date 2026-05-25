/**
 * GalleryPage.jsx
 * src/features/yearbook/components/pages/GalleryPage.jsx
 *
 * IMPORTANT: This one file exports ALL remaining leaf page components
 * so you don't need separate FacultyPage.jsx / StatsPage.jsx /
 * ClosingPage.jsx / BlankPage.jsx files at all.
 *
 * What to do with those re-export files:
 *   - DELETE FacultyPage.jsx  (or leave, they just re-export from here)
 *   - DELETE StatsPage.jsx
 *   - DELETE ClosingPage.jsx
 *   - DELETE BlankPage.jsx
 *
 * YearbookPageRenderer.jsx imports directly:
 *   import GalleryPage          from '../pages/GalleryPage';
 *   import { FacultyPage }      from '../pages/GalleryPage';
 *   import { StatsPage }        from '../pages/GalleryPage';
 *   import { ClosingPage }      from '../pages/GalleryPage';
 *   import { BlankPage }        from '../pages/GalleryPage';
 *
 * NOTE on "Gallery model":
 *   You have Album.php, not Gallery.php.
 *   The `page.gallery` object is whatever your backend sends from
 *   YearbookController::pages() — it's already mapped to
 *   { id, name, photos: [{ url, caption }] } in the controller.
 *   No Laravel Gallery model is needed on the frontend.
 */
import React from 'react';
import { pageBase, GOLD, DARK, DARKER, CREAM, OFFWHITE, pnumStyle, tagStyle } from './pageStyles';

// ─────────────────────────────────────────────────────────────────────────────
// GalleryPage (default export)
// ─────────────────────────────────────────────────────────────────────────────

export default function GalleryPage({ page }) {
  const { gallery = {}, side, pageNum } = page;
  const photos = gallery.photos ?? [];
  const bg     = side === 'left' ? CREAM : OFFWHITE;

  if (side === 'right') {
    return (
      <div style={pageBase(bg)}>
        <div style={tagStyle}>Memories</div>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: DARK, lineHeight: 1.2, marginBottom: 14 }}>
          Together<br />Always
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: 5, flex: 1 }}>
          {(photos.slice(3, 6).length > 0 ? photos.slice(3, 6) : [{}, {}, {}]).map((photo, i) => (
            <PhotoBlock key={i} photo={photo} label={gallery.name} />
          ))}
        </div>
        <div style={pnumStyle(true)}>— {pageNum} —</div>
      </div>
    );
  }

  return (
    <div style={pageBase(bg)}>
      <div style={tagStyle}>Gallery</div>
      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: DARK, lineHeight: 1.2, marginBottom: 12 }}>
        {gallery.name || 'Memories'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 5, flex: 1 }}>
        <div style={{ gridRow: '1 / 3' }}>
          <PhotoBlock photo={photos[0]} label={gallery.name} />
        </div>
        <PhotoBlock photo={photos[1]} label="" />
        <PhotoBlock photo={photos[2]} label="" />
      </div>
      <div style={pnumStyle()}>— {pageNum} —</div>
    </div>
  );
}

function PhotoBlock({ photo, label }) {
  const src = photo?.url ?? photo?.cloudinary_url;

  if (src) {
    return (
      <div style={{ borderRadius: 5, overflow: 'hidden', width: '100%', height: '100%' }}>
        <img
          src={src}
          alt={photo?.caption || label || 'Photo'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>
    );
  }

  const PLACEHOLDER_COLORS = ['#e8d5b7', '#d9e8d9', '#d9dff0', '#f0d9d9', '#e8d9f0'];
  const colorIdx = Math.abs((label?.charCodeAt(0) ?? 0)) % PLACEHOLDER_COLORS.length;
  return (
    <div style={{ borderRadius: 5, background: PLACEHOLDER_COLORS[colorIdx], width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FacultyPage (named export)
// ─────────────────────────────────────────────────────────────────────────────

export function FacultyPage({ page }) {
  const { faculty = [], side } = page;
  const half    = Math.ceil(faculty.length / 2);
  const members = side === 'left' ? faculty.slice(0, half) : faculty.slice(half);
  const bg      = side === 'left' ? CREAM : OFFWHITE;

  return (
    <div style={pageBase(bg)}>
      <div style={tagStyle}>Faculty</div>
      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: DARK, lineHeight: 1.2, marginBottom: 16 }}>
        {side === 'left' ? 'Our\nAdvisers' : 'Faculty\nMembers'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {members.map((f, i) => (
          <div key={f.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', border: '0.5px solid #ece5d4', borderRadius: 7 }}>
            {f.photo
              ? <img src={f.photo} alt={f.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0ece0', color: '#8a6a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {(f.name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: DARK, lineHeight: 1.2 }}>{f.name}</div>
              <div style={{ fontSize: 8.5, color: '#aaa', marginTop: 2 }}>{f.role ?? f.position}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatsPage (named export)
// ─────────────────────────────────────────────────────────────────────────────

export function StatsPage({ page }) {
  const { meta = {}, studentCount = 0, sectionCount = 0, side } = page;

  if (side === 'right') {
    return (
      <div style={{ ...pageBase(DARK), justifyContent: 'flex-end' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, color: GOLD, lineHeight: 1.25, marginBottom: 14 }}>
          Until We<br />Meet Again
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.42)', lineHeight: 1.9, marginBottom: 'auto' }}>
          Thank you for the laughter,<br />the tears, and the growth.<br />
          Class of {meta.year}, forever.
        </div>
        <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,.18)', letterSpacing: '0.18em', textTransform: 'uppercase', borderTop: '0.5px solid rgba(255,255,255,.1)', paddingTop: 12 }}>
          {meta.school}
        </div>
      </div>
    );
  }

  return (
    <div style={pageBase(OFFWHITE)}>
      <div style={tagStyle}>By the numbers</div>
      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: DARK, lineHeight: 1.2, marginBottom: 16 }}>
        {meta.year}<br />at a Glance
      </div>
      {[
        [studentCount || '—', 'Graduates',  sectionCount || '—', 'Sections'],
        [4,                   'Years',       '96%',               'With honors'],
      ].map(([n1, l1, n2, l2], ri) => (
        <div key={ri} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[[n1, l1], [n2, l2]].map(([n, l]) => (
            <div key={l} style={{ flex: 1, background: '#f0ebe0', borderRadius: 5, padding: '9px 6px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, color: DARK, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 7.5, color: '#999', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ height: 0.5, background: '#ece5d4', margin: '10px 0' }} />
      <div style={{ fontSize: 9.5, color: '#999', lineHeight: 2, flex: 1 }}>
        School: {meta.school}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClosingPage (named export)
// ─────────────────────────────────────────────────────────────────────────────

export function ClosingPage({ page }) {
  const { meta = {}, side } = page;

  if (side === 'right') {
    return (
      <div style={{ ...pageBase(DARKER), alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 72, color: 'rgba(255,255,255,.04)', userSelect: 'none', lineHeight: 1 }} aria-hidden="true">
            {String(meta.year ?? '').slice(-2)}
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.15)', marginTop: 8 }}>
            {meta.school}
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13, color: 'rgba(255,255,255,.25)', marginTop: 6 }}>
            Batch {meta.year}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageBase(DARK), justifyContent: 'flex-end' }}>
      <div style={{ color: GOLD, fontSize: 24, marginBottom: 16 }} aria-hidden="true">✦</div>
      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
        The End of<br />a Chapter
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', lineHeight: 1.85, marginBottom: 'auto' }}>
        You carried these years with grace.<br />Now carry them forward.
      </div>
      <div style={{ height: 0.5, background: 'rgba(255,255,255,.1)', marginBottom: 12 }} />
      <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,.2)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        {meta.school} · {meta.year}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BlankPage (named export) — padding page for even page count
// ─────────────────────────────────────────────────────────────────────────────

export function BlankPage() {
  return <div style={pageBase(OFFWHITE)} aria-hidden="true" />;
}