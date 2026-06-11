import { DarkImageLayer, EditorialPage, GoldFrame, PageNumber } from '../editorial/EditorialPrimitives';
import { YEARBOOK_ASSETS } from '../../theme/yearbookTheme';

const PER_PAGE = 7;

export default function TOCPage({ page, onNavigate }) {
  const { toc = [], side, tocStart } = page;
  const start = Number.isFinite(tocStart) ? tocStart : side === 'left' ? 0 : PER_PAGE;
  const entries = toc.slice(start, start + PER_PAGE);

  if (side === 'left') {
    return (
      <EditorialPage tone="dark" className="px-9 py-8">
        <DarkImageLayer src={YEARBOOK_ASSETS.building} opacity="opacity-40" />
        <GoldFrame subtle />
        <div className="relative z-10 max-w-[21rem]">
          <p className="font-sans text-[9px] font-black uppercase tracking-[0.34em] text-white">Table of</p>
          <h1 className="mt-1.5 font-serif text-[36px] font-bold uppercase leading-none tracking-[0.04em] text-[#e4c36a]">Contents</h1>
          <div className="mt-4 h-px w-20 bg-[#c89b3c]" />
          <ContentsList entries={entries} start={start} onNavigate={onNavigate} dark />
        </div>
        <div className="absolute bottom-5 left-8 z-10 font-sans text-[7px] uppercase tracking-[0.18em] text-[#e4c36a]">
          Sinag-Bughaw | Class of {page.meta?.year || '2025'}
        </div>
      </EditorialPage>
    );
  }

  return (
    <EditorialPage tone="paper" className="px-9 py-8">
      <div className="pointer-events-none absolute bottom-6 right-8 font-serif text-[64px] leading-none text-[#d8c7a2]/20">
        {page.meta?.year || '2025'}
      </div>
      <div className="absolute right-8 top-0 h-14 w-9 bg-[#071a33] text-[#c89b3c]">
        <div className="mx-auto mt-3.5 h-4 w-4 rounded-full border border-current" />
        <div className="absolute bottom-[-11px] left-0 h-0 w-0 border-l-[18px] border-r-[18px] border-t-[11px] border-l-transparent border-r-transparent border-t-[#071a33]" />
      </div>
      <ContentsList entries={entries} start={start} onNavigate={onNavigate} />
      <PageNumber value={1} right />
    </EditorialPage>
  );
}

function ContentsList({ entries, start, onNavigate, dark = false }) {
  const numberClass = dark ? 'text-[#e4c36a]' : 'text-[#071a33]';
  const labelClass = dark ? 'text-white group-hover:text-[#e4c36a]' : 'text-[#071a33] group-hover:text-[#c89b3c]';
  const metaClass = dark ? 'text-white/45' : 'text-[#5f6470]';
  const borderClass = dark ? 'border-white/15' : 'border-[#d8c7a2]/45';

  return (
    <ol className={`relative z-10 ${dark ? 'mt-5 space-y-1.5' : 'mt-2 space-y-1.5'}`}>
      {entries.map((entry, index) => (
        <li key={`${entry.label}-${index}`} className="group grid grid-cols-[34px_1fr] items-start gap-2.5">
          <button onClick={() => onNavigate?.(entry.pageIndex)} className="contents text-left">
            <span className={`font-serif text-[19px] font-bold leading-none ${numberClass}`}>
              {String(index + start + 1).padStart(2, '0')}
            </span>
            <span className={`min-w-0 border-b pb-1 ${borderClass}`}>
              <span className={`block truncate font-sans text-[7.5px] font-black uppercase tracking-[0.08em] ${labelClass}`}>
                {entry.label}
              </span>
              <span className={`mt-0.5 block font-serif text-[6.5px] ${metaClass}`}>Page {entry.pageIndex + 1}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
