import { useState, useEffect, useRef } from 'react';
import { profileApi } from '@/api/gallery.api';
import TagPeopleSearch from './TagPeopleSearch';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function PostContextMenu({ post, position, onClose, onDelete, onUpdated }) {
  const { user: authUser } = useAuth();
  const sheetRef = useRef(null);

  const [view,        setView]        = useState('menu');
  const [caption,     setCaption]     = useState(post?.caption    ?? '');
  const [visibility,  setVisibility]  = useState(post?.visibility ?? 'public');
  const [taggedUsers, setTaggedUsers] = useState(post?.tagged_users ?? []);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const handler = (e) => { if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const saveEdit = async () => {
    setSaving(true); setError(null);
    try {
      const { data } = await profileApi.updatePost(post.id, { caption, visibility, tagged_user_ids: taggedUsers.map(u => u.id) });
      onUpdated?.(data.data ?? data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await profileApi.deletePost(post.id);
      onDelete?.(post.id);
      onClose();
    } catch { setError('Failed to delete post.'); }
  };

  const visOpts = [
    { value: 'public',  icon: 'fa-globe',       label: 'Public'  },
    { value: 'friends', icon: 'fa-user-friends', label: 'Friends' },
    { value: 'private', icon: 'fa-lock',         label: 'Only Me' },
  ];

  return (
    <>
      <style>{`
        @keyframes sheetUp {
          from { opacity:0; transform:scale(0.96) translateY(12px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        .nu-sheet-item { transition: background 0.12s; cursor: pointer; }
        .nu-sheet-item:hover { background: #f4f7fe !important; }
      `}</style>

      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }} onClick={onClose} />

      {/* Centered sheet */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 8001, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div ref={sheetRef} style={{
          width: 400, maxWidth: '92vw',
          background: '#fff', borderRadius: 20,
          overflow: 'visible',  // ← CHANGE THIS
          boxShadow: '0 24px 64px rgba(29,43,75,0.28)',
          border: '1px solid #e8edf5',
          animation: 'sheetUp 0.22s cubic-bezier(0.34,1.2,0.64,1)',
          pointerEvents: 'all',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>

          {/* ── MAIN MENU ── */}
          {view === 'menu' && (
            <>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1d2b4b, #2d4270)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
                  {post.ai_metadata?.resource_type === 'video'
                    ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fdb813', fontSize: 18 }}><i className="fas fa-video" /></div>
                    : <img src={post.file_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Post Options</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                    {post.caption ? (post.caption.length > 32 ? post.caption.slice(0, 32) + '…' : post.caption) : 'No caption'}
                  </div>
                </div>
                <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 28, height: 28, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* Actions */}
              {[
                { icon: 'fa-pen',      iconColor: '#3f51b5', bg: '#eef2ff', label: 'Edit Caption & Visibility', sub: 'Change caption or audience',   action: () => setView('edit')           },
                { icon: 'fa-user-tag', iconColor: '#10b981', bg: '#ecfdf5', label: 'Tag People',                sub: 'Tag classmates in this post',  action: () => setView('tag')            },
                { icon: 'fa-trash',    iconColor: '#ef4444', bg: '#fef2f2', label: 'Delete Post',              sub: 'Permanently remove this post', action: () => setView('confirm_delete') },
              ].map((item, i, arr) => (
                <div key={item.label} className="nu-sheet-item"
                  onClick={item.action}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', background: '#fff' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${item.icon}`} style={{ color: item.iconColor, fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#e2e8f0', fontSize: 10, marginLeft: 'auto' }} />
                </div>
              ))}

              <div className="nu-sheet-item" onClick={onClose} style={{ padding: '14px', textAlign: 'center', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Cancel</span>
              </div>
            </>
          )}

          {/* ── EDIT VIEW ── */}
          {view === 'edit' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                <button onClick={() => { setView('menu'); setError(null); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: 0, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b' }}>Edit Post</span>
                <button onClick={saveEdit} disabled={saving} style={{ background: 'none', border: 'none', color: '#fdb813', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginLeft: 'auto', opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Caption</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} placeholder="Write a caption..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, resize: 'none', fontFamily: 'inherit', fontSize: 13, color: '#1d2b4b', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5, transition: 'border-color 0.15s', background: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = '#1d2b4b'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'block', margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Visibility</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {visOpts.map(opt => (
                    <button key={opt.value} onClick={() => setVisibility(opt.value)}
                      style={{ flex: 1, padding: '9px 4px', borderRadius: 10, cursor: 'pointer', border: visibility === opt.value ? '2px solid #1d2b4b' : '1.5px solid #e2e8f0', background: visibility === opt.value ? '#1d2b4b' : '#fafafa', color: visibility === opt.value ? '#fdb813' : '#94a3b8', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.12s' }}>
                      <i className={`fas ${opt.icon}`} style={{ fontSize: 9 }} /> {opt.label}
                    </button>
                  ))}
                </div>
                {error && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#ef4444', border: '1px solid #fecaca' }}>{error}</div>}
              </div>
            </div>
          )}

          {/* ── TAG VIEW ── */}
          {view === 'tag' && (
            <div>
              {/* Header — needs its own border-radius since parent is now overflow:visible */}
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid #f1f5f9',
                background: '#fafafa',
                borderRadius: '20px 20px 0 0', // ← clip top corners here instead
              }}>
                <button
                  onClick={() => { setView('menu'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: 0, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b' }}>Tag People</span>
                <button
                  onClick={saveEdit} disabled={saving}
                  style={{ background: 'none', border: 'none', color: '#fdb813', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginLeft: 'auto', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? 'Saving...' : 'Done'}
                </button>
              </div>

              {/* Body — needs enough minHeight so dropdown doesn't get cut */}
              <div style={{
                padding: '16px 18px',
                minHeight: 260,      // ← gives room for dropdown to render below input
                overflow: 'visible', // ← explicitly allow dropdown to escape
              }}>
                <TagPeopleSearch
                  tagged={taggedUsers}
                  onTag={u => setTaggedUsers(prev => [...prev.filter(x => x.id !== u.id), u])}
                  onUntag={uid => setTaggedUsers(prev => prev.filter(u => u.id !== uid))}
                  excludeId={authUser?.id}
                />
                {error && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#ef4444', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CONFIRM DELETE ── */}
          {view === 'confirm_delete' && (
            <div>
              <div style={{ padding: '28px 20px 20px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-trash" style={{ color: '#ef4444', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1d2b4b', marginBottom: 6 }}>Delete this post?</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>This will permanently remove the photo. This action cannot be undone.</div>
              </div>
              <button onClick={confirmDelete} style={{ width: '100%', padding: '15px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setView('menu')} style={{ width: '100%', padding: '15px', border: 'none', background: '#fff', color: '#1d2b4b', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}