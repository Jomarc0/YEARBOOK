import { useState } from 'react';

export default function PostCard({ post, onClick, isOwn, onMenuClick }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const media      = post.media ?? [];
  const mediaCount = media.length || 1;
  const current    = media[activeIdx] ?? {
    file_path:     post.file_path,
    resource_type: post.ai_metadata?.resource_type ?? 'image',
  };
  const isVideo = current.resource_type === 'video'
    || current.file_path?.match(/\.(mp4|mov|webm)(\?|$)/i);
  const isMulti = mediaCount > 1;

  return (
    <div
      className="ig-post"
      style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#1d2b4b', cursor: 'pointer' }}
      onClick={() => onClick?.(post, activeIdx)}
    >
      {/* Media */}
      {isVideo ? (
        <video
          src={current.file_path}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          muted
        />
      ) : (
        <img
          src={current.file_path}
          alt={post.caption ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Multi-image counter badge */}
      {isMulti && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '3px 7px',
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 3,
        }}>
          <i className="fas fa-images" style={{ color: '#fff', fontSize: 9 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {activeIdx + 1}/{mediaCount}
          </span>
        </div>
      )}

      {/* Dot nav for multi */}
      {isMulti && (
        <div style={{
          position: 'absolute', bottom: 26, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 4, zIndex: 3,
        }}>
          {media.map((_, i) => (
            <div
              key={i}
              onClick={e => { e.stopPropagation(); setActiveIdx(i); }}
              style={{
                width: i === activeIdx ? 16 : 6, height: 6,
                borderRadius: 99,
                background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* Video play icon */}
      {isVideo && !isMulti && (
        <i className="fas fa-play-circle" style={{
          position: 'absolute', top: 8, right: 8,
          color: '#fff', fontSize: 16,
          filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))', zIndex: 3,
        }} />
      )}

      {/* Tagged badge */}
      {post.tagged_students?.length > 0 && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(29,43,75,0.75)', backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '3px 7px',
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 3,
        }}>
          <i className="fas fa-user-tag" style={{ color: '#fdb813', fontSize: 9 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {post.tagged_students.length}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="ig-overlay" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(29,43,75,0.55)', opacity: 0,
        transition: 'opacity 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 2,
      }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
          <i className="fas fa-heart" style={{ marginRight: 5, color: '#fdb813' }} />0
        </span>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
          <i className="fas fa-comment" style={{ marginRight: 5, color: '#fdb813' }} />0
        </span>
      </div>

      {/* Owner menu button */}
      {isOwn && (
        <button
          className="ig-menu-btn"
          onClick={e => { e.stopPropagation(); onMenuClick?.(e, post); }}
          style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(29,43,75,0.75)', backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, opacity: 0, transition: 'opacity 0.18s', zIndex: 4,
          }}
        >
          <i className="fas fa-ellipsis-v" />
        </button>
      )}

      {/* Caption */}
      {post.caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(29,43,75,0.85))',
          padding: '24px 10px 10px',
          fontSize: 11, color: '#fff', fontWeight: 500, lineHeight: 1.3, zIndex: 3,
        }}>
          {post.caption.length > 38 ? post.caption.slice(0, 38) + '…' : post.caption}
        </div>
      )}
    </div>
  );
}