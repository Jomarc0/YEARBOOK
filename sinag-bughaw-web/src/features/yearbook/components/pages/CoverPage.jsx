import React from 'react';
import { DarkImageLayer, GoldFrame, GoldRule, NUSeal } from '../editorial/EditorialPrimitives';
import { YEARBOOK_ASSETS } from '../../theme/yearbookTheme';

export default function CoverPage({ page }) {
  const { meta = {} } = page;
  const title = meta.title || 'Sinag-Bughaw';
  const year = meta.year || '2025';
  const school = meta.school || 'National University Lipa';
  const theme = meta.theme || 'Celebrating Excellence, Leadership & Legacy';
  const cover = meta.coverUrl || YEARBOOK_ASSETS.building;

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#071a33] px-10 py-8 text-center text-[#f7f1e6]">
      <DarkImageLayer src={cover} opacity="opacity-50" />
      <GoldFrame />
      <NUSeal faint className="absolute -left-8 top-10 h-44 w-44" />

      <div className="relative z-10 flex max-w-[34rem] flex-col items-center">
        <NUSeal className="mb-4 h-16 w-16 drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]" />
        <p className="font-sans text-[9px] font-black uppercase tracking-[0.32em] text-[#e4c36a]">{school}</p>
        <h1 className="mt-5 font-serif text-[44px] font-bold uppercase leading-[0.9] tracking-[0.07em] text-[#e4c36a] drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
          {title}
        </h1>
        <GoldRule className="mt-4" />
        <p className="mt-4 max-w-[24rem] font-sans text-[9px] font-semibold uppercase leading-5 tracking-[0.34em] text-white/82">
          {theme}
        </p>
        <p className="mt-6 font-serif text-2xl italic leading-none text-white">Class of</p>
        <div className="mt-1 font-serif text-[68px] font-bold leading-[0.78] text-[#e4c36a]">{year}</div>
        <div className="mt-5 border-y border-[#c89b3c]/55 px-8 py-1.5 font-sans text-[9px] font-black uppercase tracking-[0.34em] text-[#e4c36a]">
          Senior Yearbook
        </div>
      </div>

      <div className="absolute bottom-6 left-10 z-10 border-l border-[#c89b3c] pl-4 text-left">
        <p className="font-sans text-[8px] uppercase tracking-[0.22em] text-white/70">Academic Year</p>
        <p className="mt-1 font-serif text-xl text-[#e4c36a]">{meta.academic_year || `${Number(year) - 1}-${year}`}</p>
      </div>
    </section>
  );
}
