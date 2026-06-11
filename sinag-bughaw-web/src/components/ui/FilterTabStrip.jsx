export default function FilterTabStrip({ tabs, activeValue, onChange, ariaLabel }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 pb-1"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = tab.value === activeValue;

        return (
          <button
            key={String(tab.value ?? 'all')}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-150 ease-out ${
              active
                ? 'border border-transparent bg-[#fdb813] font-black text-[#1d2b4b] shadow-sm shadow-amber-200/60'
                : 'border-[1.5px] border-[#cbd5e1] bg-transparent font-semibold text-slate-500 hover:border-[#fdb813]/60 hover:text-[#1d2b4b]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span className="ml-1.5 text-[10px] font-bold opacity-55">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
