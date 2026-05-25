// src/features/yearbook/components/BulkUploadZone.jsx
// Matches NU Lipa design: #1d2b4b navy + #fdb813 yellow, Tailwind + inline styles
import { useRef } from 'react';

const fmt = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
};

const TIER_LABELS = {
  free:             'Free',
  premium_standard: 'Premium Standard',
  premium:          'Premium HD',
};

// ── Single queued file row ────────────────────────────────────────────────────
function FileRow({ item, onRemove }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>

      {/* Thumb */}
      {item.type === 'image' ? (
        <img src={item.preview} alt={item.file.name}
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: 40, height: 40 }} />
      ) : (
        <div className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, background: '#e8edf5' }}>
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
        </p>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(item.id)}
        className="flex-shrink-0 border-none cursor-pointer flex items-center justify-center w-7 h-7 rounded-lg transition-all"
        style={{ background: 'transparent', color: '#cbd5e1' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
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
 *   tier     {string}   - 'free' | 'premium_standard' | 'premium'
 *   onCancel {function} - optional close/cancel handler
 */
export default function BulkUploadZone({
  queue, uploading, progress, errors, isDragging, limits,
  addFiles, removeFile, clearQueue, upload,
  dragHandlers,
  tier = 'free',
  onCancel,
}) {
  const inputRef = useRef(null);

  const accept = limits.videoAllowed
    ? 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm'
    : 'image/jpeg,image/png,image/webp,image/gif';

  return (
    <div className="bg-white rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 18px 36px rgba(29,43,75,0.08)', border: '1px solid rgba(0,0,0,0.04)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(29,43,75,0.06)' }}>
            <i className="fas fa-cloud-arrow-up" style={{ color: '#1d2b4b' }} />
          </div>
          <div>
            <h3 className="font-extrabold text-base m-0" style={{ color: '#1d2b4b' }}>
              Upload Media
            </h3>
            <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
              {queue.length} / {limits.maxFiles} files &nbsp;·&nbsp;
              <span style={{ color: '#fdb813', fontWeight: 700 }}>
                {TIER_LABELS[tier] ?? tier}
              </span>
            </p>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel}
            className="border-none cursor-pointer flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: '#f8fafc', color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
            <i className="fas fa-times text-xs" /> Cancel
          </button>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* ── Drop Zone ── */}
        <div
          {...dragHandlers}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl transition-all duration-200 select-none"
          style={{
            padding: '40px 24px',
            border: `2px dashed ${isDragging ? '#1d2b4b' : '#dbe3f0'}`,
            background: isDragging ? 'rgba(29,43,75,0.04)' : '#f8fafc',
          }}>

          <input
            ref={inputRef}
            type="file" multiple accept={accept}
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
            disabled={uploading}
          />

          {isDragging ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#1d2b4b' }}>
                <i className="fas fa-arrow-down text-xl" style={{ color: '#fdb813' }} />
              </div>
              <p className="font-extrabold text-base m-0" style={{ color: '#1d2b4b' }}>
                Drop files here
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(29,43,75,0.06)' }}>
                <i className="fas fa-images text-2xl" style={{ color: '#1d2b4b' }} />
              </div>
              <p className="font-bold text-sm m-0 mb-1" style={{ color: '#1d2b4b' }}>
                Drag & drop or{' '}
                <span style={{ color: '#3f51b5', textDecoration: 'underline' }}>browse files</span>
              </p>
              <p className="text-xs m-0" style={{ color: '#94a3b8' }}>
                {limits.videoAllowed
                  ? `Photos up to ${limits.maxPhotoMB} MB · Videos up to ${limits.maxVideoMB} MB`
                  : `Photos up to ${limits.maxPhotoMB} MB · Upgrade for video uploads`}
              </p>
            </>
          )}
        </div>

        {/* ── Plan info chips ── */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: 'fa-images',    text: `${limits.maxFiles} files max` },
            { icon: 'fa-image',     text: `${limits.maxPhotoMB} MB / photo` },
            limits.videoAllowed
              ? { icon: 'fa-film',  text: `${limits.maxVideoMB} MB / video` }
              : { icon: 'fa-film',  text: 'No video — upgrade', dim: true },
          ].map((chip, i) => (
            <span key={i}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: chip.dim ? '#fff7ed' : 'rgba(29,43,75,0.06)',
                color:      chip.dim ? '#c2410c' : '#1d2b4b',
              }}>
              <i className={`fas ${chip.icon}`}
                style={{ color: chip.dim ? '#fb923c' : '#fdb813', fontSize: 10 }} />
              {chip.text}
            </span>
          ))}
        </div>

        {/* ── Errors ── */}
        {errors.length > 0 && (
          <div className="rounded-2xl px-4 py-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            {errors.map((e, i) => (
              <p key={i} className="text-sm font-semibold m-0 flex items-center gap-2"
                style={{ color: '#dc2626' }}>
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
            <div className="w-full rounded-full overflow-hidden"
              style={{ height: 6, background: '#e8edf5' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #1d2b4b, #3f51b5)',
                }} />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {queue.length > 0 && !uploading && (
          <div className="flex items-center justify-between pt-2"
            style={{ borderTop: '1px solid #f1f5f9' }}>
            <button onClick={clearQueue}
              className="text-sm font-semibold border-none cursor-pointer px-4 py-2 rounded-xl transition-all"
              style={{ background: '#f8fafc', color: '#94a3b8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
              Clear all
            </button>
            <button onClick={upload}
              className="flex items-center gap-2 text-sm font-extrabold border-none cursor-pointer px-5 py-2.5 rounded-xl transition-all text-white"
              style={{ background: '#1d2b4b' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
              <i className="fas fa-cloud-arrow-up" />
              Upload {queue.length} file{queue.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}