import { useState } from 'react';

export default function FacultyCard({ faculty }) {
  const [imgError, setImgError] = useState(false);

  // Fallback to a generated avatar when no image is provided or it fails to load
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=1d2b4b&color=fdb813&bold=true&size=300`;
  const src = (!faculty.image_url || imgError) ? avatarUrl : faculty.image_url;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d2b4b]/10"
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-[#fdb813]" />

      {/* Avatar */}
      <div className="flex justify-center px-5 pt-6">
        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-[#1d2b4b] shadow-inner">
          <img
            src={src}
            alt={faculty.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pb-5 pt-4 text-center">
        {/* `position` is the aliased `title` column from the server */}
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#fdb813]">
          {faculty.position}
        </span>
        <h3 className="m-0 mt-2 text-base font-black text-[#1d2b4b]">{faculty.name}</h3>

        {faculty.bio && (
          <p className="mx-auto mt-3 line-clamp-3 max-w-[220px] text-xs italic leading-relaxed text-slate-500">"{faculty.bio}"</p>
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
