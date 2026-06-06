// src/features/yearbook/components/BulkUploadZone.jsx
// Matches NU Lipa design: #1d2b4b navy + #fdb813 yellow, Tailwind + inline styles
//
// Fixed from previous version:
//  - `limits` prop now has a safe default so the component never crashes
//    when the hook hasn't resolved yet or is called without limits.
//  - `queue` items now include a `type` field ('image' | 'video') so FileRow
//    renders the correct thumbnail / icon.

import { useRef } from 'react';

const fmt = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
};

const TIER_LABELS = {
  free:             'Free',
  standard:         'Standard',
  premium_standard: 'Premium Standard',
  premium:          'Premium HD',
};

// ── Default limits (safe fallback while hook resolves) ────────────────────────
const DEFAULT_LIMITS = {
  videoAllowed: false,
  maxFiles:     5,
  maxPhotoMB:   5,
  maxVideoMB:   0,
};

// ── Single queued file row ────────────────────────────────────────────────────
function FileRow({ item, onRemove }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      {/* Thumb */}
      {item.type === 'image' ? (
        <img
          src={item.preview}
          alt={item.file.name}
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: 40, height: 40 }}
        />
      ) : (
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, background: '#e8edf5' }}
        >
          <i className="fas fa-film text-sm" style={{ color: '#1d2b4b' }} />
        </div>
      )}

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate m-0" style={{ color: '#1d2b4b' }}>
          {item.file.name}
        </p>
        <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
          {fmt(item.file.size)}
          {item.type === 'video' && (
            <span className="ml-2 font-bold" style={{ color: '#3f51b5' }}>VIDEO</span>
          )}
          {item.status === 'error' && item.error && (
            <span className="ml-2 font-bold" style={{ color: '#ef4444' }}>
              <i className="fas fa-triangle-exclamation mr-1" />
              {item.error}
            </span>
          )}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 border-none cursor-pointer flex items-center justify-center w-7 h-7 rounded-lg transition-all"
        style={{ background: 'transparent', color: '#cbd5e1' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
      >
        <i className="fas fa-times text-xs" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * BulkUploadZone
 *
 * Spread the full result of useMediaUpload() as props, plus:
 *   tier     {string}   - 'free' | 'standard' | 'premium_standard' | 'premium'
 *   onCancel {function} - optional close/cancel handler
 *
 * Expected props from useMediaUpload (aliased in the hook):
 *   queue        {Array}    - file queue items
 *   uploading    {boolean}
 *   progress     {number}   - 0–100
 *   errors       {string[]} - array of error strings
 *   isDragging   {boolean}
 *   limits       {object}   - { videoAllowed, maxFiles, maxPhotoMB, maxVideoMB }
 *   addFiles     {function}
 *   removeFile   {function}
 *   clearQueue   {function}
 *   upload       {function}
 *   dragHandlers {object}   - { onDragOver, onDragLeave, onDrop }
 */
export default function BulkUploadZone({
  // File queue
  queue       = [],
  uploading   = false,
  progress    = 0,
  errors      = [],
  isDragging  = false,
  // Limits — safe default so component never crashes while hook resolves
  limits      = DEFAULT_LIMITS,
  // Actions
  addFiles,
  removeFile,
  clearQueue,
  upload,
  dragHandlers = {},
  // Presentation
  tier     = 'free',
  onCancel,
}) {
  const inputRef = useRef(null);

  // Guard: merge with defaults so individual missing keys don't crash
  const safelimits = { ...DEFAULT_LIMITS, ...limits };

  const accept = safelimits.videoAllowed
    ? 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm'
    : 'image/jpeg,image/png,image/webp,image/gif';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-[#1d2b4b]/5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d2b4b]/5">
            <i className="fas fa-cloud-arrow-up text-[#1d2b4b]" />
          </div>
          <div>
            <h3 className="m-0 text-sm font-extrabold text-[#1d2b4b]">
              Upload Media
            </h3>
            <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
              {queue.length} / {safelimits.maxFiles} files &nbsp;·&nbsp;
              <span style={{ color: '#fdb813', fontWeight: 700 }}>
                {TIER_LABELS[tier] ?? tier}
              </span>
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="border-none cursor-pointer flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: '#f8fafc', color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <i className="fas fa-times text-xs" /> Cancel
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* ── Drop Zone ── */}
        <div
          {...dragHandlers}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl transition-all duration-200 select-none"
          style={{
            padding: '28px 20px',
            border:  `2px dashed ${isDragging ? '#1d2b4b' : '#dbe3f0'}`,
            background: isDragging ? 'rgba(29,43,75,0.04)' : '#f8fafc',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            style={{ display: 'none' }}
            onChange={e => addFiles?.(e.target.files)}
            disabled={uploading}
          />

          {isDragging ? (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#1d2b4b' }}
              >
                <i className="fas fa-arrow-down text-xl" style={{ color: '#fdb813' }} />
              </div>
              <p className="font-extrabold text-base m-0" style={{ color: '#1d2b4b' }}>
                Drop files here
              </p>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(29,43,75,0.06)' }}
              >
                <i className="fas fa-images text-2xl" style={{ color: '#1d2b4b' }} />
              </div>
              <p className="font-bold text-sm m-0 mb-1" style={{ color: '#1d2b4b' }}>
                Drag & drop or{' '}
                <span style={{ color: '#3f51b5', textDecoration: 'underline' }}>browse files</span>
              </p>
              <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
                {safelimits.videoAllowed
                  ? `Photos up to ${safelimits.maxPhotoMB} MB · Videos up to ${safelimits.maxVideoMB} MB`
                  : `Photos up to ${safelimits.maxPhotoMB} MB · Upgrade for video uploads`
                }
              </p>
            </>
          )}
        </div>

        {/* ── Plan info chips ── */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: 'fa-images', text: `${safelimits.maxFiles} files max` },
            { icon: 'fa-image',  text: `${safelimits.maxPhotoMB} MB / photo` },
            safelimits.videoAllowed
              ? { icon: 'fa-film', text: `${safelimits.maxVideoMB} MB / video` }
              : { icon: 'fa-film', text: 'No video — upgrade', dim: true },
          ].map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: chip.dim ? '#fff7ed' : 'rgba(29,43,75,0.06)',
                color:      chip.dim ? '#c2410c' : '#1d2b4b',
              }}
            >
              <i
                className={`fas ${chip.icon}`}
                style={{ color: chip.dim ? '#fb923c' : '#fdb813', fontSize: 10 }}
              />
              {chip.text}
            </span>
          ))}
        </div>

        {/* ── Errors ── */}
        {errors.length > 0 && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            {errors.map((e, i) => (
              <p
                key={i}
                className="text-sm font-semibold m-0 flex items-center gap-2"
                style={{ color: '#dc2626' }}
              >
                <i className="fas fa-triangle-exclamation" />
                {e}
              </p>
            ))}
          </div>
        )}

        {/* ── File queue ── */}
        {queue.length > 0 && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {queue.map(item => (
              <FileRow key={item.id} item={item} onRemove={removeFile} />
            ))}
          </div>
        )}

        {/* ── Progress bar ── */}
        {uploading && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold" style={{ color: '#1d2b4b' }}>
                <i className="fas fa-spinner fa-spin mr-1.5" />
                Uploading to Cloudinary…
              </span>
              <span className="text-xs font-bold" style={{ color: '#3f51b5' }}>{progress}%</span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 6, background: '#e8edf5' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width:      `${progress}%`,
                  background: 'linear-gradient(90deg, #1d2b4b, #3f51b5)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {queue.length > 0 && !uploading && (
          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            <button
              onClick={clearQueue}
              className="text-sm font-semibold border-none cursor-pointer px-4 py-2 rounded-xl transition-all"
              style={{ background: '#f8fafc', color: '#94a3b8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              Clear all
            </button>

            <button
              onClick={upload}
              className="flex items-center gap-2 text-sm font-extrabold border-none cursor-pointer px-5 py-2.5 rounded-xl transition-all text-white"
              style={{ background: '#1d2b4b' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}
            >
              <i className="fas fa-cloud-arrow-up" />
              Upload {queue.length} file{queue.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
