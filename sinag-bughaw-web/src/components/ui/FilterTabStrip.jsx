import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * FilterTabStrip
 *
 * Props:
 *  - tabs:         { label, value, count? }[]
 *  - activeValue:  any
 *  - onChange:     (value) => void
 *  - ariaLabel:    string
 *  - visibleCount: number  — pills shown before "more" (default: 5)
 */
export default function FilterTabStrip({
  tabs = [],
  activeValue,
  onChange,
  ariaLabel,
  visibleCount = 5,
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef(null);
  const triggerRef  = useRef(null);

  const visibleTabs  = tabs.slice(0, visibleCount);
  const overflowTabs = tabs.slice(visibleCount);
  const hasOverflow  = overflowTabs.length > 0;

  const activeInOverflow = overflowTabs.some((t) => t.value === activeValue);
  const activeOverflow   = overflowTabs.find((t) => t.value === activeValue);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const minWidth = 200;
      setDropdownPos({
        left: Math.min(rect.left, window.innerWidth - minWidth - 12),
        top: rect.bottom + 8,
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current  && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => () => {}, []);

  const handleSelect = (value) => { onChange(value); setOpen(false); };

  return (
    <div className="relative min-w-0">

      {/* Scrollable row */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-nowrap items-center overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Segmented track */}
        <div className="inline-flex items-center gap-0.5 rounded-xl bg-[#eef1f9] p-1 shrink-0">

          {/* Visible pills */}
          {visibleTabs.map((tab) => {
            const active = tab.value === activeValue;
            return (
              <button
                key={String(tab.value ?? 'all')}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelect(tab.value)}
                className={[
                  'inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-[9px] px-3.5 py-[7px]',
                  'text-xs font-semibold cursor-pointer border-none outline-none transition-all duration-150 font-inherit',
                  'focus-visible:ring-2 focus-visible:ring-[#fdb813] focus-visible:ring-offset-1',
                  active
                    ? 'bg-[#fdb813] text-[#12163A] font-bold shadow-[0_1px_4px_rgba(29,43,75,0.18)]'
                    : 'bg-transparent text-[#6b7a99] hover:bg-white/60 hover:text-[#1d2b4b]',
                ].join(' ')}
              >
                {/* Active dot — dark navy on yellow fill */}
                <span
                  aria-hidden="true"
                  className={[
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    active ? 'bg-[#12163A]' : 'bg-transparent',
                  ].join(' ')}
                />
                {tab.label}
                {tab.count != null && (
                  <span className={[
                    'text-[10px] tabular-nums',
                    active ? 'text-[#12163A]/50' : 'text-[#9aa3b8]',
                  ].join(' ')}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Divider */}
          {hasOverflow && (
            <span
              aria-hidden="true"
              className="w-px h-4 bg-[#d8dde8] shrink-0 mx-1"
            />
          )}

          {/* More trigger */}
          {hasOverflow && (
            <div className="relative shrink-0">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={
                  activeInOverflow
                    ? `Active: ${activeOverflow?.label}. Open more filters`
                    : `${overflowTabs.length} more filters`
                }
                className={[
                  'inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-[9px] px-3.5 py-[7px]',
                  'text-xs font-semibold cursor-pointer border-none outline-none transition-all duration-150 font-inherit',
                  'focus-visible:ring-2 focus-visible:ring-[#fdb813] focus-visible:ring-offset-1',
                  // active overflow item → full yellow fill (same as active pill)
                  // open but no active overflow → subtle yellow tint
                  // default → light yellow tint, clearly secondary
                  activeInOverflow
                    ? 'bg-[#fdb813] text-[#12163A] font-bold shadow-[0_1px_4px_rgba(29,43,75,0.18)]'
                    : open
                    ? 'bg-[#fdb813]/20 text-[#854F0B]'
                    : 'bg-[#fdb813]/15 text-[#854F0B] hover:bg-[#fdb813]/25',
                ].join(' ')}
              >
                {activeInOverflow ? (
                  <>
                    {/* Dark dot on yellow fill — matches visible pills */}
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#12163A] shrink-0" />
                    {activeOverflow.label}
                    {activeOverflow.count != null && (
                      <span className="text-[10px] tabular-nums text-[#12163A]/50">
                        {activeOverflow.count}
                      </span>
                    )}
                  </>
                ) : (
                  <span>+{overflowTabs.length} more</span>
                )}
                <svg
                  className={[
                    'h-3 w-3 shrink-0 transition-transform duration-200',
                    open ? 'rotate-180' : 'rotate-0',
                  ].join(' ')}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown — white surface so it reads as elevated above dark cards */}
              {open && createPortal(
                <div
                  ref={dropdownRef}
                  role="listbox"
                  aria-label="More programs"
                  style={{ position: 'fixed', left: dropdownPos.left, top: dropdownPos.top, zIndex: 9999 }}
                  className="min-w-[200px] rounded-2xl overflow-hidden bg-white border border-[#e8e8ee] shadow-[0_8px_32px_rgba(29,43,75,0.15)]"
                >
                  {/* Header */}
                  <div className="border-b border-[#f0f0f4] px-4 py-2.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#9aa3b8]">
                      More programs
                    </span>
                  </div>

                  {/* Items */}
                  <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#e0e0e8]">
                    {overflowTabs.map((tab) => {
                      const active = tab.value === activeValue;
                      return (
                        <button
                          key={String(tab.value)}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => handleSelect(tab.value)}
                          className={[
                            'flex w-full items-center justify-between gap-4 border-none px-4 py-2.5',
                            'text-left text-xs cursor-pointer outline-none transition-all duration-[120ms] font-inherit',
                            // yellow fill for active — dark navy text on top (WCAG AAA)
                            active
                              ? 'bg-[#fdb813] text-[#12163A] font-bold'
                              : 'bg-transparent text-[#4a5568] font-medium hover:bg-[#fdb813]/10 hover:text-[#1d2b4b]',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-2">
                            {/* Dark dot on yellow active row */}
                            {active && (
                              <span
                                aria-hidden="true"
                                className="w-1.5 h-1.5 rounded-full bg-[#12163A] shrink-0"
                              />
                            )}
                            <span className={[
                              'overflow-hidden text-ellipsis whitespace-nowrap',
                              active ? 'pl-0' : 'pl-3.5',
                            ].join(' ')}>
                              {tab.label}
                            </span>
                          </span>

                          <span className="flex items-center gap-2 shrink-0">
                            {tab.count != null && (
                              <span className={[
                                'text-[10px] font-normal',
                                // count: dark navy/50 on yellow active, muted gray on white inactive
                                active ? 'text-[#12163A]/50' : 'text-[#9aa3b8]',
                              ].join(' ')}>
                                {tab.count}
                              </span>
                            )}
                            {/* Checkmark — dark navy on yellow fill */}
                            {active && (
                              <svg
                                className="h-3.5 w-3.5 text-[#12163A]"
                                viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right fade hint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#f4f7fe] to-transparent"
      />
    </div>
  );
}