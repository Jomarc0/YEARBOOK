import { useEffect, useState } from 'react';

const SHARE_OPTIONS = [
  { key: 'facebook',  label: 'Facebook',  icon: 'fab fa-facebook-f',        color: '#1877F2', bg: 'bg-blue-50',   getUrl: (u)    => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'twitter',   label: 'X',         icon: 'fab fa-x-twitter',          color: '#000',    bg: 'bg-slate-100', getUrl: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { key: 'linkedin',  label: 'LinkedIn',  icon: 'fab fa-linkedin-in',        color: '#0A66C2', bg: 'bg-sky-50',    getUrl: (u)    => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { key: 'viber',     label: 'Viber',     icon: 'fab fa-viber',              color: '#7360F2', bg: 'bg-violet-50', getUrl: (u, t) => `viber://forward?text=${encodeURIComponent(t + ' ' + u)}` },
  { key: 'telegram',  label: 'Telegram',  icon: 'fab fa-telegram-plane',     color: '#229ED9', bg: 'bg-cyan-50',   getUrl: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { key: 'messenger', label: 'Messenger', icon: 'fab fa-facebook-messenger', color: '#0084FF', bg: 'bg-blue-50',   getUrl: (u)    => `https://www.facebook.com/dialog/send?link=${encodeURIComponent(u)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(u)}` },
];

export default function ShareModal({ isOpen, onClose, student }) {
  const [copied, setCopied] = useState(false);

  const profileUrl = student?.id
    ? `${window.location.origin}/profile/${student.id}`
    : window.location.href;
  const shareText = `Check out ${student?.name}'s profile on Sinag-Bughaw Pioneers — NU Lipa!`;

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(profileUrl); }
    catch {
      const el = document.createElement('textarea');
      el.value = profileUrl;
      document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.18s_ease]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[popIn_0.22s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">

          {/* Header */}
          <div className="bg-[#1d2b4b] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-black text-sm m-0 leading-none">Share Profile</p>
              <p className="text-white/50 text-[11px] m-0 mt-1">{student?.name}</p>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border-none text-white/60 hover:text-white cursor-pointer flex items-center justify-center text-sm transition">
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 m-0">Share via</p>

            {/* 3 2 grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {SHARE_OPTIONS.map(opt => (
                <button key={opt.key}
                  onClick={() => window.open(opt.getUrl(profileUrl, shareText), '_blank', 'noopener,noreferrer,width=600,height=500')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${opt.bg} border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm"
                    style={{ background: opt.color }}>
                    <i className={opt.icon} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[9px] text-slate-300 font-bold tracking-wider uppercase">or copy link</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Copy row */}
            <div className="flex gap-1.5">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-400 truncate font-mono">
                {profileUrl}
              </div>
              <button onClick={handleCopy}
                className={`shrink-0 px-3 py-2 rounded-xl border-none cursor-pointer font-bold text-[11px] flex items-center gap-1.5 transition-all
                  ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#1d2b4b] text-white hover:bg-[#162038]'}`}>
                {copied ? <><i className="fas fa-check" /> Done</> : <><i className="fas fa-copy" /> Copy</>}
              </button>
            </div>

            {/* Native share */}
            {navigator.share && (
              <button
                onClick={async () => { try { await navigator.share({ title: student?.name, text: shareText, url: profileUrl }); } catch (_) {} }}
                className="w-full mt-3 border border-slate-200 text-slate-400 hover:text-slate-600 font-semibold py-2.5 rounded-xl bg-transparent cursor-pointer hover:bg-slate-50 transition text-xs flex items-center justify-center gap-1.5">
                <i className="fas fa-share-alt" /> More options
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}