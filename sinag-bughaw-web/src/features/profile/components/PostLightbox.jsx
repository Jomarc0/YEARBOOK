import { useState, useEffect, useCallback } from 'react';

export default function PostLightbox({ post, initialIdx = 0, onClose }) {
  const [idx, setIdx]       = useState(initialIdx);
  const [loaded, setLoaded] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  const media   = post?.media ?? [];
  const count   = media.length || 1;
  const current = media[idx] ?? {
    file_path:     post?.file_path,
    resource_type: post?.ai_metadata?.resource_type ?? 'image',
  };
  const isVideo = current.resource_type === 'video'
    || current.file_path?.match(/\.(mp4|mov|webm)(\?|$)/i);

  const poster = post?.user ?? post?.student ?? null;
  const avatar = poster?.profile_picture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(poster?.name ?? 'U')}&background=1d2b4b&color=fdb813&bold=true&size=80`;

  useEffect(() => { setLoaded(false); }, [idx]);
  useEffect(() => { requestAnimationFrame(() => setAnimIn(true)); }, []);

  const handleClose = useCallback(() => {
    setAnimIn(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')     handleClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(count - 1, i + 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [count, handleClose]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (!post) return null;

  return (
    <>
      <style>{`
        @keyframes lb-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .lb-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s ease;
        }
        .lb-backdrop.in { opacity: 1; }
        .lb-shell {
          position: relative;
          display: flex;
          width: min(900px, 94vw);
          max-height: 92vh;
          background: #000;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.8);
          opacity: 0; transform: scale(0.96);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .lb-shell.in { opacity: 1; transform: scale(1); }

        /* Left: media */
        .lb-left {
          position: relative;
          flex: 0 0 62%;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; min-height: 480px;
        }
        .lb-left img, .lb-left video {
          width: 100%; height: 100%;
          object-fit: contain; display: block;
          max-height: 92vh;
          transition: opacity 0.2s ease;
        }
        .lb-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 600px 100%;
          animation: lb-shimmer 1.4s infinite linear;
          transition: opacity 0.2s; pointer-events: none;
        }
        .lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.9); border: none;
          cursor: pointer; font-size: 11px; color: #000;
          display: flex; align-items: center; justify-content: center;
          z-index: 4; transition: background 0.15s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .lb-nav:hover { background: #fff; transform: translateY(-50%) scale(1.1); }
        .lb-nav.prev { left: 10px; }
        .lb-nav.next { right: 10px; }
        .lb-dots {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 4px; z-index: 4;
        }
        .lb-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.4);
          cursor: pointer; transition: background 0.2s;
          border: none; padding: 0;
        }
        .lb-dot.on { background: #fff; }
        .lb-multi-badge {
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.55); border-radius: 4px;
          padding: 3px 7px; display: flex; align-items: center; gap: 4px; z-index: 4;
        }

        /* Right: sidebar — only header + caption */
        .lb-right {
          flex: 0 0 38%;
          background: #fff;
          display: flex; flex-direction: column;
          border-left: 1px solid #dbdbdb;
          overflow: hidden;
        }
        .lb-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid #efefef;
          flex-shrink: 0;
        }
        .lb-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 2px solid #fdb813;
        }
        .lb-username {
          font-size: 14px; font-weight: 700; color: #1d2b4b;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .lb-subline {
          font-size: 11px; color: #8e8e8e; margin-top: 1px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .lb-body {
          flex: 1; overflow-y: auto; padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .lb-body::-webkit-scrollbar { width: 4px; }
        .lb-body::-webkit-scrollbar-track { background: transparent; }
        .lb-body::-webkit-scrollbar-thumb { background: #dbdbdb; border-radius: 4px; }

        /* caption */
        .lb-caption-row {
          display: flex; gap: 10px; margin-bottom: 16px;
        }
        .lb-cap-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
        }
        .lb-cap-name {
          font-size: 13px; font-weight: 700; color: #1d2b4b;
          display: inline; margin-right: 5px;
        }
        .lb-cap-text {
          font-size: 13px; color: #262626; line-height: 1.6; display: inline;
        }
        .lb-cap-date {
          font-size: 11px; color: #8e8e8e; margin-top: 6px;
        }

        /* tagged */
        .lb-tag-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f0f4ff; border: 1px solid #c7d2fe;
          border-radius: 20px; padding: 3px 10px; margin: 3px 3px 0 0;
          font-size: 11px; font-weight: 600; color: #3f51b5;
        }

        /* close */
        .lb-close {
          position: fixed; top: 16px; right: 16px; z-index: 10000;
          background: none; border: none; color: #fff; font-size: 24px;
          cursor: pointer; opacity: 0.85; transition: opacity 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .lb-close:hover { opacity: 1; }

        @media (max-width: 680px) {
          .lb-shell { flex-direction: column; width: 98vw; }
          .lb-left  { flex: none; min-height: 260px; }
          .lb-right { flex: none; max-height: 38vh; }
        }
      `}</style>

      <div className={`lb-backdrop${animIn ? ' in' : ''}`} onClick={handleClose}>

        <button className="lb-close" onClick={handleClose}>
          <i className="fas fa-times" />
        </button>

        <div className={`lb-shell${animIn ? ' in' : ''}`} onClick={e => e.stopPropagation()}>

          {/* ── LEFT: media ── */}
          <div className="lb-left">
            <div className="lb-shimmer" style={{ opacity: loaded ? 0 : 1 }} />

            {isVideo ? (
              <video
                key={current.file_path}
                src={current.file_path}
                controls autoPlay
                style={{ opacity: loaded ? 1 : 0 }}
                onLoadedData={() => setLoaded(true)}
              />
            ) : (
              <img
                key={current.file_path}
                src={current.file_path}
                alt={post.caption ?? ''}
                style={{ opacity: loaded ? 1 : 0 }}
                onLoad={() => setLoaded(true)}
              />
            )}

            {count > 1 && (
              <div className="lb-multi-badge">
                <i className="fas fa-images" style={{ color: '#fff', fontSize: 10 }} />
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{idx + 1}/{count}</span>
              </div>
            )}

            {idx > 0 && (
              <button className="lb-nav prev" onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}>
                <i className="fas fa-chevron-left" />
              </button>
            )}
            {idx < count - 1 && (
              <button className="lb-nav next" onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}>
                <i className="fas fa-chevron-right" />
              </button>
            )}

            {count > 1 && (
              <div className="lb-dots">
                {media.map((_, i) => (
                  <button key={i} className={`lb-dot${i === idx ? ' on' : ''}`}
                    onClick={e => { e.stopPropagation(); setIdx(i); }} />
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: header + caption only ── */}
          <div className="lb-right">

            {/* Header */}
            <div className="lb-header">
              <img className="lb-avatar" src={avatar} alt={poster?.name ?? ''}
                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=1d2b4b&color=fdb813&bold=true`; }} />
              <div>
                <div className="lb-username">{poster?.name ?? 'Pioneer Student'}</div>
                <div className="lb-subline">NU Lipa · 2026</div>
              </div>
            </div>

            {/* Body: caption + tags */}
            <div className="lb-body">

              {post.caption ? (
                <div className="lb-caption-row">
                  <img className="lb-cap-avatar" src={avatar} alt=""
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=1d2b4b&color=fdb813&bold=true`; }} />
                  <div>
                    <span className="lb-cap-name">{poster?.name ?? 'Pioneer Student'}</span>
                    <span className="lb-cap-text">{post.caption}</span>
                    <div className="lb-cap-date">{formatDate(post.created_at)}</div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#8e8e8e', fontStyle: 'italic', margin: 0 }}>No caption.</p>
              )}

              {post.tagged_students?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    <i className="fas fa-user-tag" style={{ marginRight: 5, color: '#fdb813' }} />Tagged
                  </div>
                  <div>
                    {post.tagged_students.map(s => (
                      <span key={s.id} className="lb-tag-chip">
                        <i className="fas fa-at" style={{ fontSize: 9 }} />{s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}