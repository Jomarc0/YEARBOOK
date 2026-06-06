import React from 'react';
import { EditorialPage, GoldRule, Portrait } from '../editorial/EditorialPrimitives';
import { initials } from './pageStyles';

export default function StudentGridPage({ page, onPortraitClick }) {
  const firstStudent = page.student || page.students?.[0];
  if (!firstStudent) {
    return <EditorialPage tone="paper" className="p-7" />;
  }

  return page.profilePart === 'details'
    ? <StudentDetailsPage page={{ ...page, student: firstStudent }} />
    : <StudentPortraitPage page={{ ...page, student: firstStudent }} onPortraitClick={onPortraitClick} />;
}

function StudentPortraitPage({ page, onPortraitClick }) {
  const { student = {}, section = {}, pageNum, side } = page;
  const displayName = student.name || 'Graduate';
  const photo = student.profile_picture || student.photo;
  const quote = student.student_quote || student.motto || 'A story still unfolding with promise.';

  return (
    <EditorialPage tone={side === 'right' ? 'cream' : 'paper'} className="p-5" pageNum={pageNum} right={side === 'right'}>
      <StudentHeader section={section} />
      <article className="grid min-h-0 flex-1 grid-cols-[48%_52%] overflow-hidden border border-[#d8c7a2]/55 bg-white/75 shadow-[0_16px_36px_rgba(7,26,51,0.08)]">
        <button
          type="button"
          onClick={() => onPortraitClick?.(student.id)}
          className="flex min-h-0 items-center justify-center bg-[#e8dfcc] p-5"
          aria-label={`Open ${displayName}`}
        >
          <Portrait
            src={photo}
            name={displayName}
            initials={initials(displayName)}
            className="h-auto max-h-[245px] max-w-full"
          />
        </button>

        <div className="flex min-w-0 flex-col justify-center overflow-hidden px-6 py-5">
          {student.honors ? (
            <span className="mb-3 w-fit bg-[#c89b3c] px-3 py-1.5 font-sans text-[7px] font-black uppercase tracking-[0.1em] text-white">
              {student.honors}
            </span>
          ) : null}
          <h2 className="break-words font-serif text-[28px] font-bold uppercase leading-[0.98] text-[#071a33]">
            {displayName}
          </h2>
          <p className="mt-3 max-w-[20rem] font-sans text-[8px] font-black uppercase leading-4 tracking-[0.16em] text-[#172033]/68">
            {student.course || student.student_id}
          </p>
          <p className="mt-5 border-l-2 border-[#c89b3c] pl-4 font-serif text-[12px] italic leading-6 text-[#172033]/84">
            "{quote}"
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#d8c7a2]/45 pt-4">
            <Info label="Nickname" value={student.nickname} />
            <Info label="Hometown" value={student.hometown} />
            <Info label="Most Likely To" value={student.most_likely_to} />
          </div>
        </div>
      </article>
    </EditorialPage>
  );
}

function StudentDetailsPage({ page }) {
  const { student = {}, section = {}, pageNum, side } = page;
  return (
    <EditorialPage tone={side === 'right' ? 'cream' : 'paper'} className="p-5" pageNum={pageNum} right={side === 'right'}>
      <StudentHeader section={section} title="Graduate Story" />
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid grid-cols-2 gap-3">
          <StoryCard label="Motto" value={student.motto} />
          <StoryCard label="Organizations" value={student.organizations} />
          <StoryCard label="Achievements" value={student.achievements} />
          <StoryCard label="Ambition" value={student.ambition} />
          <StoryCard label="Future Plans" value={student.future_plans} />
          <StoryCard label="Fondest Memory" value={student.fondest_memory} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StoryCard label="Message to Batchmates" value={student.message_to_batchmates} tall />
          <StoryCard label="Message to Parents" value={student.message_to_parents} tall />
        </div>
        <div className="mt-auto grid grid-cols-4 gap-3 border-t border-[#d8c7a2]/45 pt-3">
          <Info label="Student No." value={student.student_id || student.student_no} />
          <Info label="Email" value={student.email} />
          <Info label="Birthday" value={student.birthday} />
          <Info label="Graduation Year" value={student.graduation_year} />
        </div>
      </article>
    </EditorialPage>
  );
}

function StudentHeader({ section, title = 'Graduate Profile' }) {
  return (
    <header className="relative z-10 mb-3">
      <p className="font-sans text-[7px] font-black uppercase tracking-[0.24em] text-[#c89b3c]">{section.name || section.course}</p>
      <h1 className="mt-1 font-serif text-[25px] font-bold leading-none text-[#172033]">{title}</h1>
      <GoldRule className="mt-2" />
    </header>
  );
}

function StoryCard({ label, value, tall = false }) {
  return (
    <section className={`${tall ? 'min-h-[54px]' : 'min-h-[42px]'} border border-[#d8c7a2]/45 bg-white/65 px-3 py-2`}>
      <p className="font-sans text-[6px] font-black uppercase tracking-[0.16em] text-[#c89b3c]">{label}</p>
      <p className="mt-1.5 font-serif text-[8px] leading-4 text-[#172033]/76 line-clamp-3">{value || '-'}</p>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="font-sans text-[6px] font-black uppercase tracking-[0.14em] text-[#c89b3c]">{label}</p>
      <p className="mt-1 break-words font-serif text-[8px] leading-4 text-[#172033]/76">{value || '-'}</p>
    </div>
  );
}
