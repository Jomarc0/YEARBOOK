// src/features/yearbook/components/StorageUsageBar.jsx
// Matches NU Lipa design: #1d2b4b navy + #fdb813 yellow

const fmt = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
};

const TIER_CFG = {
  free:             { label: 'Free Plan',        color: '#94a3b8' },
  standard:         { label: 'Standard',         color: '#3b82f6' },
  premium_standard: { label: 'Premium Standard', color: '#3b82f6' },
  premium:          { label: 'Premium HD',       color: '#8b5cf6' },
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
  const bar  = full ? '#ef4444' : warn ? '#f59e0b' : '#1d2b4b';

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-database text-sm" style={{ color: cfg.color }} />
          <span className="font-bold text-sm" style={{ color: '#1d2b4b' }}>
            Cloud Storage
          </span>
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(29,43,75,0.07)', color: '#1d2b4b' }}
          >
            {cfg.label}
          </span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: full ? '#ef4444' : warn ? '#f59e0b' : '#64748b' }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Bar */}
      <div
        className="w-full rounded-full overflow-hidden mb-2"
        style={{ height: '8px', background: '#f1f5f9' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: bar }}
        />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          {fmt(usedBytes)} used of {fmt(limitBytes)}
        </span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>
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