// src/features/yearbook/components/StorageUsageBar.jsx
// Matches NU Lipa design: #1d2b4b navy + #fdb813 yellow

const fmt = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
};

const TIER_CFG = {
  free:             { label: 'Free Plan' },
  standard:         { label: 'Standard' },
  premium_standard: { label: 'Premium Standard' },
  premium:          { label: 'Premium HD' },
};

/**
 * StorageUsageBar
 *
 * Props:
 *   usedBytes  {number}
 *   limitBytes {number}
 *   tier       {'free'|'standard'|'premium_standard'|'premium'}
 *   onUpgrade  {function}
 */
export default function StorageUsageBar({ usedBytes = 0, limitBytes = 524288000, tier = 'free', onUpgrade }) {
  const pct  = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;
  const cfg  = TIER_CFG[tier] ?? TIER_CFG.free;
  const warn = pct >= 80;
  const full = pct >= 100;
  const barClass = full ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-[#fdb813]';

  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_4px_20px_rgba(29,43,75,0.07)]">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-database text-sm text-[#fdb813]" />
          <span className="font-bold text-sm text-[#1d2b4b]">
            Cloud Storage
          </span>
          <span className="rounded-full bg-[#1d2b4b]/[0.07] px-2.5 py-0.5 text-xs font-bold text-[#1d2b4b]">
            {cfg.label}
          </span>
        </div>
        <span className={`text-sm font-bold ${full ? 'text-red-500' : warn ? 'text-amber-500' : 'text-slate-500'}`}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Bar */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {fmt(usedBytes)} used of {fmt(limitBytes)}
        </span>
        <span className="text-xs text-slate-400">
          {fmt(limitBytes - usedBytes)} free
        </span>
      </div>

      {/* Warning / upgrade banner */}
      {(warn || full) && (
        <div
          className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-xl"
          style={{ background: full ? '#fef2f2' : '#fffbeb' }}
        >
          <span
            className="text-xs font-bold flex items-center gap-2"
            style={{ color: full ? '#dc2626' : '#d97706' }}
          >
            <i className={`fas ${full ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}`} />
            {full
              ? 'Storage full — delete files or upgrade to upload more.'
              : `Storage ${pct.toFixed(0)}% full.`}
          </span>
          {tier === 'free' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-xs font-extrabold border-none cursor-pointer px-3 py-1.5 rounded-lg transition-all"
              style={{ background: '#fdb813', color: '#1d2b4b' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5b200'}
              onMouseLeave={e => e.currentTarget.style.background = '#fdb813'}
            >
              Upgrade
            </button>
          )}
        </div>
      )}
    </div>
  );
}
