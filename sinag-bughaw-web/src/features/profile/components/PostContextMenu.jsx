import { useState, useEffect, useRef } from 'react';
import { profileApi } from '@/api/gallery.api';
import TagPeopleSearch from './TagPeopleSearch';
import { useAuth } from '@/features/auth/hooks/useAuth';

const VIS_OPTS = [
  { value: 'public',  icon: 'fa-globe',        label: 'Public'  },
  { value: 'friends', icon: 'fa-user-friends',  label: 'Friends' },
  { value: 'private', icon: 'fa-lock',          label: 'Only Me' },
];

const MENU_ITEMS = [
  { icon: 'fa-pen',      iconCls: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Edit Caption & Visibility', sub: 'Change caption or audience',   view: 'edit'           },
  { icon: 'fa-user-tag', iconCls: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Tag People',              sub: 'Tag classmates in this post',  view: 'tag'            },
  { icon: 'fa-trash',    iconCls: 'text-red-500',     bg: 'bg-red-50',     label: 'Delete Post',             sub: 'Permanently remove this post', view: 'confirm_delete' },
];

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
    const h = (e) => { if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [onClose]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const saveEdit = async () => {
    setSaving(true); setError(null);
    try {
      const { data } = await profileApi.updatePost(post.id, {
        caption, visibility, tagged_user_ids: taggedUsers.map(u => u.id),
      });
      onUpdated?.(data.data ?? data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try { await profileApi.deletePost(post.id); onDelete?.(post.id); onClose(); }
    catch { setError('Failed to delete post.'); }
  };

  const back = () => { setView('menu'); setError(null); };

  return (
    <>
      <style>{`@keyframes sheetUp{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[8000] bg-[#0f172a]/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-0 z-[8001] flex items-center justify-center pointer-events-none">
        <div ref={sheetRef}
          className="w-[400px] max-w-[92vw] bg-white rounded-2xl overflow-visible shadow-2xl border border-slate-100 pointer-events-auto font-sans"
          style={{ animation: 'sheetUp 0.22s cubic-bezier(0.34,1.2,0.64,1)' }}
        >

          {/* ── MAIN MENU ── */}
          {view === 'menu' && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1d2b4b] to-[#2d4270] px-4 py-3.5 flex items-center gap-3 rounded-t-2xl">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/10 shrink-0 flex items-center justify-center">
                  {post.ai_metadata?.resource_type === 'video'
                    ? <i className="fas fa-video text-[#fdb813] text-lg" />
                    : <img src={post.file_path} alt="" className="w-full h-full object-cover" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold m-0 leading-none">Post Options</p>
                  <p className="text-white/50 text-[11px] m-0 mt-1 truncate">
                    {post.caption ? (post.caption.length > 36 ? post.caption.slice(0, 36) + '…' : post.caption) : 'No caption'}
                  </p>
                </div>
                <button onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border-none text-white/60 hover:text-white cursor-pointer flex items-center justify-center text-xs transition">
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* Actions */}
              {MENU_ITEMS.map((item, i, arr) => (
                <button key={item.label}
                  onClick={() => setView(item.view)}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer border-none text-left
                    ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <i className={`fas ${item.icon} ${item.iconCls} text-sm`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1d2b4b] m-0">{item.label}</p>
                    <p className="text-xs text-slate-400 m-0 mt-0.5">{item.sub}</p>
                  </div>
                  <i className="fas fa-chevron-right text-slate-200 text-xs" />
                </button>
              ))}

              <button onClick={onClose}
                className="w-full py-3.5 text-center text-sm font-semibold text-slate-400 bg-white hover:bg-slate-50 transition-colors cursor-pointer border-none border-t border-slate-100 rounded-b-2xl">
                Cancel
              </button>
            </>
          )}

          {/* ── EDIT VIEW ── */}
          {view === 'edit' && (
            <>
              <SubHeader title="Edit Post" onBack={back} onAction={saveEdit} actionLabel={saving ? 'Saving…' : 'Save'} saving={saving} />
              <div className="p-5">
                <FieldLabel>Caption</FieldLabel>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4}
                  placeholder="Write a caption…"
                  className="w-full px-3 py-2.5 border-2 border-slate-200 focus:border-[#1d2b4b] rounded-xl resize-none text-sm text-[#1d2b4b] outline-none bg-slate-50 font-sans leading-relaxed transition-colors mb-4 box-border"
                  style={{ fontFamily: 'inherit' }}
                />
                <FieldLabel>Visibility</FieldLabel>
                <div className="flex gap-2">
                  {VIS_OPTS.map(opt => (
                    <button key={opt.value} onClick={() => setVisibility(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border-2
                        ${visibility === opt.value ? 'border-[#1d2b4b] bg-[#1d2b4b] text-[#fdb813]' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'}`}>
                      <i className={`fas ${opt.icon} text-[10px]`} /> {opt.label}
                    </button>
                  ))}
                </div>
                {error && <ErrorMsg msg={error} />}
              </div>
            </>
          )}

          {/* ── TAG VIEW ── */}
          {view === 'tag' && (
            <>
              <SubHeader title="Tag People" onBack={back} onAction={saveEdit} actionLabel={saving ? 'Saving…' : 'Done'} saving={saving} />
              <div className="p-5" style={{ minHeight: 260, overflow: 'visible' }}>
                <TagPeopleSearch
                  tagged={taggedUsers}
                  onTag={u   => setTaggedUsers(prev => [...prev.filter(x => x.id !== u.id), u])}
                  onUntag={uid => setTaggedUsers(prev => prev.filter(u => u.id !== uid))}
                  excludeId={authUser?.id}
                />
                {error && <ErrorMsg msg={error} />}
              </div>
            </>
          )}

          {/* ── CONFIRM DELETE ── */}
          {view === 'confirm_delete' && (
            <>
              <div className="px-6 py-7 text-center border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trash text-red-500 text-xl" />
                </div>
                <h3 className="text-base font-black text-[#1d2b4b] mb-2">Delete this post?</h3>
                <p className="text-sm text-slate-400 leading-relaxed m-0">
                  This will permanently remove the photo. This action cannot be undone.
                </p>
              </div>
              <button onClick={confirmDelete}
                className="w-full py-4 text-red-500 text-sm font-bold bg-white hover:bg-red-50 transition-colors cursor-pointer border-none border-b border-slate-100">
                Delete Permanently
              </button>
              <button onClick={() => setView('menu')}
                className="w-full py-4 text-slate-500 text-sm font-medium bg-white hover:bg-slate-50 transition-colors cursor-pointer border-none rounded-b-2xl">
                Cancel
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}

function SubHeader({ title, onBack, onAction, actionLabel, saving }) {
  return (
    <div className="flex items-center px-5 py-3.5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-[#1d2b4b] text-sm font-semibold transition-colors cursor-pointer border-none bg-transparent p-0">
        <i className="fas fa-arrow-left text-xs" /> Back
      </button>
      <span className="text-sm font-black text-[#1d2b4b] mx-auto">{title}</span>
      <button onClick={onAction} disabled={saving}
        className="text-[#fdb813] text-sm font-bold border-none bg-transparent cursor-pointer p-0 disabled:opacity-50">
        {actionLabel}
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 m-0">{children}</p>;
}

function ErrorMsg({ msg }) {
  return (
    <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 flex items-center gap-2">
      <i className="fas fa-circle-exclamation shrink-0" /> {msg}
    </div>
  );
}