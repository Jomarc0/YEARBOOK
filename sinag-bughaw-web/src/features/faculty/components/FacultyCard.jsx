import { useState } from 'react';

export default function FacultyCard({ faculty }) {
  const [imgError, setImgError] = useState(false);

  const initials = faculty.name?.trim().split(/\s+/).map(part => part[0]?.toUpperCase() || '').slice(0, 2).join('');
  const hasPhoto = !!faculty.image_url && !imgError;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d2b4b]/10">
      <div className="flex justify-center bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-5 py-7">
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#fdb813] bg-[#1d2b4b] shadow-xl">
          {hasPhoto ? (
            <img
              src={faculty.image_url}
              alt={faculty.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl font-black text-[#fdb813]">
              {initials || 'NU'}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-4 text-center">
        <h3 className="m-0 text-base font-black uppercase tracking-wide text-[#1d2b4b]">{faculty.name}</h3>
        <p className="m-0 mt-1 text-sm font-bold text-slate-700">{faculty.position}</p>
        <p className="m-0 mt-0.5 text-xs font-semibold text-[#b77905]">{faculty.department}</p>

        {faculty.bio && (
          <p className="mx-auto mt-4 line-clamp-4 max-w-[240px] text-sm leading-relaxed text-slate-500">{faculty.bio}</p>
        )}

        {faculty.email && (
          <a
            href={`mailto:${faculty.email}`}
            className="mt-4 inline-flex max-w-full items-center justify-center gap-1.5 truncate rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 no-underline transition hover:bg-slate-100 hover:text-[#1d2b4b]"
          >
            <svg
              className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <span className="truncate">{faculty.email}</span>
          </a>
        )}
      </div>
    </article>
  );
}
