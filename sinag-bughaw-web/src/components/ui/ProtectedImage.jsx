import { useRef, useEffect } from 'react';
import { applyElementProtection } from '@/utils/contentProtection';

const GOLD = '#fdb813';

const WATERMARK_TILES = [
  { top: '22%', left: '10%', opacity: 0.10, size: '0.6rem' },
  { top: '50%', left: '50%', opacity: 0.13, size: '0.65rem', center: true },
  { top: '75%', left: '25%', opacity: 0.08, size: '0.55rem' },
  { top: '35%', left: '70%', opacity: 0.08, size: '0.55rem' },
];

export default function ProtectedImage({
  src,
  alt           = '',
  className     = '',
  style         = {},
  imgStyle      = {},
  watermark     = true,
  watermarkText = '© NU Lipa — All Rights Reserved',
  showCopyright = true,
  institution   = 'National University Lipa',
  variant       = 'default',
  onClick,
  onLoad,
  onError,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    applyElementProtection(wrapRef.current);
  }, []);

  const isLightbox = variant === 'lightbox';

  return (
    <div
      ref={wrapRef}
      className={`protected-media-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: onClick ? 'zoom-in' : 'default',
        ...style,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <img
        className="protected-media"
        src={src}
        alt={alt}
        draggable={false}
        style={{
          display: 'block',
          width: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...imgStyle,
        }}
        onDragStart={(e) => e.preventDefault()}
        onLoad={onLoad}
        onError={onError}
      />

      {/* Transparent shield */}
      <div
        className="media-shield"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Watermark tiles */}
      {watermark && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {WATERMARK_TILES.map((tile, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top:  tile.center ? '50%' : tile.top,
                left: tile.center ? '50%' : tile.left,
                transform: tile.center
                  ? 'translate(-50%, -50%) rotate(-35deg)'
                  : 'rotate(-35deg)',
                fontSize:      `calc(${tile.size} + ${isLightbox ? '0.15rem' : '0'})`,
                fontWeight:    700,
                color:         `rgba(29,43,75,${tile.opacity})`,
                whiteSpace:    'nowrap',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontFamily:    "'Plus Jakarta Sans', sans-serif",
                userSelect:    'none',
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      )}

      {/* Copyright badge */}
      {showCopyright && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: isLightbox ? 12 : 7,
            left:   isLightbox ? 12 : 7,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(13,22,45,0.72)',
            backdropFilter: 'blur(6px)',
            borderRadius: 20,
            padding: isLightbox ? '5px 11px' : '3px 8px',
          }}>
            <i className="fas fa-copyright" style={{ color: GOLD, fontSize: isLightbox ? 10 : 8 }} />
            <span style={{
              fontSize:   isLightbox ? '0.65rem' : '0.55rem',
              fontWeight: 700,
              color:      'rgba(255,255,255,0.88)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {institution}
            </span>
          </div>
        </div>
      )}

      <div className="print-blocked-notice" style={{ display: 'none' }}>
        <p>🔒 This content is protected by {institution}.</p>
      </div>
    </div>
  );
}