import React from 'react';
import { DarkImageLayer, EditorialHeader, EditorialPage, GoldFrame, PageNumber } from '../editorial/EditorialPrimitives';
import { YEARBOOK_ASSETS } from '../../theme/yearbookTheme';

export default function TOCPage({ page, onNavigate }) {
  const { toc = [], side } = page;
  const half = Math.ceil(toc.length / 2);
  const entries = side === 'left' ? toc.slice(0, half) : toc.slice(half);

  if (side === 'left') {
    return (
      <EditorialPage tone="dark" className="justify-center p-10">
        <DarkImageLayer src={YEARBOOK_ASSETS.building} opacity="opacity-40" />
        <GoldFrame subtle />
        <div className="relative z-10 max-w-[20rem]">
          <p className="font-sans text-[11px] font-black uppercase tracking-[0.42em] text-white">Table of</p>
          <h1 className="mt-2 font-serif text-[46px] font-bold uppercase leading-none tracking-[0.04em] text-[#e4c36a]">Contents</h1>
          <div className="mt-6 h-px w-24 bg-[#c89b3c]" />
          <p className="mt-8 max-w-[17rem] text-center font-serif text-[15px] italic leading-7 text-white/82">
            “The end of one chapter is the beginning of another.”
          </p>
        </div>
        <div className="absolute bottom-7 left-8 z-10 font-sans text-[8px] uppercase tracking-[0.18em] text-[#e4c36a]">
          Sinag-Bughaw | Class of {page.meta?.year || '2025'}
        </div>
      </EditorialPage>
    );
  }

  return (
    <EditorialPage tone="paper" className="p-10">
      <div className="pointer-events-none absolute bottom-7 right-8 font-serif text-[78px] leading-none text-[#d8c7a2]/20">
        {page.meta?.year || '2025'}
      </div>
      <div className="absolute right-8 top-0 h-16 w-10 bg-[#071a33] text-[#c89b3c]">
        <div className="mx-auto mt-4 h-5 w-5 rounded-full border border-current" />
        <div className="absolute bottom-[-12px] left-0 h-0 w-0 border-l-[20px] border-r-[20px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#071a33]" />
      </div>
      <ol className="relative z-10 mt-4 space-y-3">
        {entries.map((entry, index) => (
          <li key={`${entry.label}-${index}`} className="group grid grid-cols-[46px_1fr] items-start gap-4">
            <button onClick={() => onNavigate?.(entry.pageIndex)} className="contents text-left">
              <span className="font-serif text-[26px] font-bold leading-none text-[#071a33]">{String(index + half + 1).padStart(2, '0')}</span>
              <span className="border-b border-[#d8c7a2]/45 pb-2">
                <span className="block font-sans text-[10px] font-black uppercase tracking-[0.1em] text-[#071a33] group-hover:text-[#c89b3c]">{entry.label}</span>
                <span className="mt-1 block font-serif text-[8.5px] text-[#5f6470]">Page {entry.pageIndex + 1}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <PageNumber value={1} right />
    </EditorialPage>
  );
}
