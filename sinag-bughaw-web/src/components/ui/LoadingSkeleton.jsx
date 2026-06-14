function SkeletonBlock({ className = '' }) {
  return <div className={`rounded-[10px] bg-[#eef4fb] ${className}`} />;
}

function SkeletonLine({ className = '' }) {
  return <div className={`rounded-full bg-[#eef4fb] ${className}`} />;
}

function SkeletonWatermark({ label }) {
  if (!label) return null;

  return (
    <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 -rotate-[28deg] select-none text-4xl font-black text-[#e8eef7]/55 sm:text-6xl">
      {label}
    </span>
  );
}

function FeedCardSkeleton({ watermark }) {
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-white/80 bg-white/80 shadow-sm">
      <SkeletonWatermark label={watermark} />
      <div className="flex items-center gap-3 px-4 py-3">
        <SkeletonBlock className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <SkeletonLine className="mb-2 h-3 w-32" />
          <SkeletonLine className="h-2.5 w-24 bg-[#f3f7fc]" />
        </div>
      </div>
      <SkeletonBlock className="mx-4 h-[260px] bg-[#f8fbff]" />
      <div className="px-4 py-3">
        <SkeletonLine className="mb-2 h-3 w-3/4 bg-[#f3f7fc]" />
        <SkeletonLine className="h-3 w-1/2 bg-[#f3f7fc]" />
      </div>
    </div>
  );
}

function CardSkeleton({ watermark }) {
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-white/80 bg-white/80 shadow-sm">
      <SkeletonWatermark label={watermark} />
      <SkeletonBlock className="h-44 rounded-none bg-[#f8fbff]" />
      <div className="p-4">
        <SkeletonLine className="mb-3 h-4 w-2/3" />
        <SkeletonLine className="h-3 w-1/2 bg-[#f3f7fc]" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="rounded-[12px] border border-white/80 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <SkeletonLine className="mb-2 h-3.5 w-40" />
          <SkeletonLine className="h-3 w-28 bg-[#f3f7fc]" />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton({ watermark }) {
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-white/80 bg-[#f7faff] p-3 shadow-sm sm:p-4">
      <SkeletonWatermark label={watermark} />
      <div className="space-y-4">
        <div className="rounded-[10px] bg-white/65 p-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <SkeletonLine className="mb-2 h-3 w-36" />
              <SkeletonLine className="h-2.5 w-24 bg-[#f3f7fc]" />
            </div>
          </div>
        </div>
        <SkeletonBlock className="h-48 w-full bg-[#f8fbff] sm:h-64" />
        <div className="rounded-[10px] bg-white/65 p-3">
          <SkeletonLine className="mb-2 h-3 w-3/4" />
          <SkeletonLine className="h-3 w-1/2 bg-[#f3f7fc]" />
        </div>
        <div className="rounded-[10px] bg-white/65 p-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <SkeletonLine className="mb-2 h-3 w-32" />
              <SkeletonLine className="h-2.5 w-20 bg-[#f3f7fc]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniSkeleton() {
  return (
    <div className="rounded-[12px] border border-white/80 bg-white/80 p-3 shadow-sm">
      <SkeletonLine className="mb-2 h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3 bg-[#f3f7fc]" />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'feed',
  count = 3,
  className = '',
  gridClassName = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
  watermark = 'Sinag-Bughaw',
}) {
  const items = Array.from({ length: count });
  const Card = variant === 'page'
    ? PageSkeleton
    : variant === 'row'
      ? RowSkeleton
      : variant === 'mini'
        ? MiniSkeleton
        : variant === 'card'
          ? CardSkeleton
          : FeedCardSkeleton;
  const wrapperClass = variant === 'feed' || variant === 'page' || variant === 'mini'
    ? 'flex flex-col gap-4'
    : gridClassName;

  return (
    <div className={`animate-pulse ${className}`} aria-live="polite" aria-busy="true" role="status">
      <div className={wrapperClass}>
        {items.map((_, i) => <Card key={i} watermark={watermark} />)}
      </div>
    </div>
  );
}
