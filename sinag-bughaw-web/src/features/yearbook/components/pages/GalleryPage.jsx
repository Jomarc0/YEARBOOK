import React from 'react';
import {
  DarkImageLayer,
  EditorialHeader,
  EditorialPage,
  Field,
  GoldFrame,
  GoldRule,
  NUSeal,
  PageNumber,
  Portrait,
  QuoteCard,
  StatBlock,
} from '../editorial/EditorialPrimitives';
import { YEARBOOK_ASSETS } from '../../theme/yearbookTheme';
import { initials } from './pageStyles';

export default function GalleryPage({ page }) {
  const { gallery = {}, side, pageNum } = page;
  const photos = gallery.photos ?? [];
  const visible = side === 'left' ? photos.slice(0, 4) : photos.slice(4, 9);

  return (
    <EditorialPage tone={side === 'left' ? 'paper' : 'cream'} className="p-8" pageNum={pageNum} right={side === 'right'}>
      <EditorialHeader eyebrow="Memories" title={gallery.name || 'Campus Moments'} compact />
      <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 gap-2">
        {visible.map((photo, index) => (
          <PhotoTile key={photo?.id ?? index} photo={photo} index={index} />
        ))}
        {!visible.length ? <PhotoTile photo={null} index={0} /> : null}
      </div>
    </EditorialPage>
  );
}

export function WelcomePage({ page }) {
  const { meta = {}, messageType = 'university', side } = page;
  const messages = {
    university: ['University Message', 'A Tradition of Purpose', `To the Class of ${meta.year}, this yearbook gathers more than portraits. It preserves the discipline, friendship, service, and courage that shaped your years at ${meta.school}.`, meta.school],
    dean: ['Dean Message', 'Scholarship With Character', 'Your achievements are not measured by honors alone, but by the integrity with which you carried your work and the generosity you offered one another.', 'Office of the Dean'],
    chair: ['Department Chair Message', 'The Work Continues', 'May the habits you formed here become the foundation for service, leadership, and excellent work wherever the next chapter calls you.', 'Department Chair'],
  };
  const [eyebrow, title, body, sign] = messages[messageType] ?? messages.university;

  return (
    <EditorialPage tone={side === 'left' ? 'paper' : 'cream'} className="p-10">
      <NUSeal faint className="absolute right-8 top-8 h-28 w-28" />
      <div className="grid h-full grid-cols-[1fr_170px] gap-8">
        <div className="flex flex-col justify-center">
          <EditorialHeader eyebrow={eyebrow} title={title} kicker={body} />
          <div className="mt-8 border-t border-[#d8c7a2]/45 pt-5">
            <p className="font-serif text-xl text-[#071a33]">{sign}</p>
            <p className="mt-1 font-sans text-[8px] font-black uppercase tracking-[0.18em] text-[#c89b3c]">Class of {meta.year}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[#d8c7a2]/25">
          <img src={YEARBOOK_ASSETS.faculty} alt="" className="h-full w-full object-cover opacity-80 grayscale" />
        </div>
      </div>
    </EditorialPage>
  );
}

export function ProgramOverviewPage({ page }) {
  const { meta = {}, stats = {} } = page;
  const courses = Object.entries(stats.courseDistribution ?? {}).slice(0, 4);
  return (
    <EditorialPage tone="paper" className="p-9">
      <img src={YEARBOOK_ASSETS.building} alt="" className="absolute right-0 top-0 h-40 w-56 object-cover opacity-10 grayscale" />
      <EditorialHeader
        eyebrow="Program Overview"
        title="Academic Profile"
        kicker="A graduating community shaped by National University tradition, academic discipline, and service."
      />
      <div className="mt-auto grid grid-cols-4 gap-3 bg-[#071a33] p-4">
        <StatBlock value={stats.totalGraduates ?? 0} label="Graduates" dark />
        <StatBlock value={stats.honorsCount ?? 0} label="With Honors" dark />
        <StatBlock value={stats.sectionCount ?? 0} label="Sections" dark />
        <StatBlock value={courses.length} label="Programs" dark />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {courses.map(([course, count]) => (
          <div key={course} className="border-b border-[#d8c7a2]/45 pb-2">
            <p className="font-sans text-[8px] font-black uppercase tracking-[0.12em] text-[#071a33]">{course}</p>
            <p className="mt-1 font-serif text-lg text-[#c89b3c]">{count}</p>
          </div>
        ))}
      </div>
      <p className="mt-auto font-sans text-[8px] uppercase tracking-[0.18em] text-[#5f6470]">{meta.theme}</p>
    </EditorialPage>
  );
}

export function AchievementsPage({ page }) {
  const { students = [], stats = {} } = page;
  return (
    <EditorialPage tone="paper" className="p-8">
      <EditorialHeader eyebrow="Academic Excellence" title="Distinction and Service" compact />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatBlock value={stats.honorsCount ?? 0} label="Honor Students" />
        <StatBlock value={stats.achievementCount ?? 0} label="Achievement Entries" />
      </div>
      <FeatureList students={students} field="achievements" />
    </EditorialPage>
  );
}

export function OrganizationsPage({ page }) {
  return (
    <EditorialPage tone="cream" className="p-8">
      <EditorialHeader eyebrow="Organizations" title="Leadership in Community" compact />
      <FeatureList students={page.students ?? []} field="organizations" />
    </EditorialPage>
  );
}

export function MemoriesPage({ page }) {
  return (
    <EditorialPage tone="paper" className="p-8">
      <EditorialHeader eyebrow="Memories" title="The Days We Keep" compact />
      <FeatureList students={page.students ?? []} field="fondest_memory" quote />
    </EditorialPage>
  );
}

export function AspirationsPage({ page }) {
  const students = page.students ?? [];
  return (
    <EditorialPage tone="cream" className="p-7">
      <EditorialHeader eyebrow="Future Aspirations" title="Where We’re Going" compact />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_38%] gap-4">
        <FeatureList students={students} field="future_plans" secondaryField="ambition" />
        <div className="relative overflow-hidden">
          <DarkImageLayer src={YEARBOOK_ASSETS.building} opacity="opacity-40" />
          <div className="relative z-10 flex h-full items-end p-5 font-serif text-lg leading-7 text-white">
            Our dreams.<br />Our future.<br />Our time.
          </div>
        </div>
      </div>
    </EditorialPage>
  );
}

export function FacultyPage({ page }) {
  const { faculty = [], side, pageNum } = page;
  return (
    <EditorialPage tone={side === 'left' ? 'paper' : 'cream'} className="p-7" pageNum={pageNum} right={side === 'right'}>
      <EditorialHeader eyebrow="Our Faculty" title="Mentors and Guides" compact />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden">
        {faculty.map((f, index) => <FacultyCard key={f.id ?? index} faculty={f} />)}
        {!faculty.length ? <p className="font-serif text-sm text-[#172033]/65">Faculty profiles will appear here once added.</p> : null}
      </div>
    </EditorialPage>
  );
}

export function StatsPage({ page }) {
  const { meta = {}, stats = {} } = page;
  const courses = Object.entries(stats.courseDistribution ?? {}).slice(0, 5);
  const honors = Object.entries(stats.honorsDistribution ?? {}).slice(0, 5);

  return (
    <EditorialPage tone="paper" className="p-8">
      <EditorialHeader eyebrow="Class Statistics" title={`${meta.year} at a Glance`} compact />
      <div className="grid grid-cols-[120px_1fr] gap-6">
        <div className="space-y-3">
          <StatBlock value={stats.totalGraduates ?? page.studentCount ?? 0} label="Total Graduates" />
          <StatBlock value={stats.honorsCount ?? 0} label="Latin Honors" />
          <StatBlock value={stats.organizationCount ?? 0} label="Organizations" />
        </div>
        <div className="space-y-5">
          <Distribution title="Course Distribution" rows={courses} />
          <Distribution title="Honors Distribution" rows={honors} />
        </div>
      </div>
    </EditorialPage>
  );
}

export function DirectoryPage({ page }) {
  const { students = [], side } = page;
  return (
    <EditorialPage tone={side === 'left' ? 'paper' : 'cream'} className="p-8">
      <EditorialHeader eyebrow="Graduate Directory" title="Class Roster" compact />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-6 gap-y-1">
        {students.map((student) => (
          <div key={student.id} className="grid grid-cols-[1fr_64px] gap-2 border-b border-[#d8c7a2]/45 py-1.5">
            <p className="truncate font-serif text-[9px] font-bold text-[#071a33]">{student.name}</p>
            <p className="truncate text-right font-sans text-[7px] uppercase tracking-[0.08em] text-[#5f6470]">{student.student_id || student.course}</p>
          </div>
        ))}
      </div>
    </EditorialPage>
  );
}

export function ClosingPage({ page }) {
  const { meta = {}, side } = page;
  if (side === 'left') {
    return (
      <EditorialPage tone="paper" className="justify-center p-12">
        <EditorialHeader eyebrow={`To the Class of ${meta.year}`} title="The Next Chapter Begins" kicker="You have written your story with courage, hard work, and heart. May your journey ahead be filled with purpose, success, and happiness." />
        <p className="mt-4 font-serif text-[11px] leading-7 text-[#172033]/75">Congratulations, graduates.</p>
      </EditorialPage>
    );
  }
  return (
    <EditorialPage tone="dark" className="justify-center p-12">
      <DarkImageLayer src={YEARBOOK_ASSETS.gallery} opacity="opacity-50" />
      <GoldFrame subtle />
      <div className="relative z-10 max-w-[22rem]">
        <div className="font-serif text-5xl text-[#e4c36a]">“</div>
        <p className="font-serif text-[23px] italic leading-9 text-[#f7f1e6]">The end of one chapter is the beginning of another.</p>
      </div>
    </EditorialPage>
  );
}

export function BackCoverPage({ page }) {
  const { meta = {} } = page;
  return (
    <EditorialPage tone="dark" className="items-center justify-center p-12 text-center">
      <DarkImageLayer src={YEARBOOK_ASSETS.building} opacity="opacity-40" />
      <GoldFrame />
      <NUSeal className="relative z-10 mb-6 h-20 w-20" />
      <p className="relative z-10 font-sans text-[10px] font-black uppercase tracking-[0.3em] text-white">{meta.school}</p>
      <h1 className="relative z-10 mt-6 font-serif text-3xl uppercase tracking-[0.16em] text-[#f7f1e6]">Sinag-Bughaw</h1>
      <p className="relative z-10 mt-3 font-sans text-[9px] uppercase tracking-[0.28em] text-[#e4c36a]">Senior Yearbook {meta.year}</p>
      <p className="relative z-10 mt-5 text-[8px] tracking-[0.18em] text-white/55">www.nul.edu.ph</p>
    </EditorialPage>
  );
}

export function BlankPage() {
  return <EditorialPage tone="paper" aria-hidden="true" />;
}

function FeatureList({ students = [], field, secondaryField, quote = false }) {
  if (!students.length) {
    return <p className="font-serif text-sm leading-7 text-[#172033]/65">This section will grow as more yearbook entries are completed.</p>;
  }
  return (
    <div className="grid min-h-0 flex-1 gap-2 overflow-hidden">
      {students.slice(0, 5).map((student) => {
        const value = student[field] || (secondaryField ? student[secondaryField] : null) || 'A story of excellence, service, and promise.';
        return quote ? (
          <QuoteCard key={student.id} quote={value} name={student.name} meta={student.course} />
        ) : (
          <article key={student.id} className="min-h-0 border-l-2 border-[#c89b3c] bg-white/60 px-3 py-2.5 shadow-[0_8px_20px_rgba(7,26,51,0.05)]">
            <p className="break-words font-serif text-[14px] font-bold leading-[1.05] text-[#071a33] line-clamp-2">{student.name}</p>
            <p className="mt-1.5 line-clamp-2 font-serif text-[8px] leading-4 text-[#172033]/72">{value}</p>
            <p className="mt-1.5 line-clamp-2 font-sans text-[6px] font-black uppercase leading-3 tracking-[0.12em] text-[#c89b3c]">{student.honors || student.course}</p>
          </article>
        );
      })}
    </div>
  );
}

function FacultyCard({ faculty }) {
  const photo = faculty.photo || faculty.image || faculty.image_url;

  return (
    <article className="grid min-h-0 grid-cols-[112px_minmax(0,1fr)] gap-4 overflow-hidden border border-[#d8c7a2]/45 bg-white/65 p-3.5 shadow-[0_8px_20px_rgba(7,26,51,0.05)]">
      <Portrait src={photo} name={faculty.name} initials={initials(faculty.name)} className="h-[118px] w-[112px] object-cover" />
      <div className="min-w-0 overflow-hidden">
        <h2 className="break-words font-serif text-[20px] font-bold leading-[1.02] text-[#071a33] line-clamp-2">{faculty.name}</h2>
        <p className="mt-2 break-words font-sans text-[7px] font-black uppercase leading-4 tracking-[0.12em] text-[#c89b3c] line-clamp-2">{faculty.title || faculty.department}</p>
        <p className="mt-1 font-serif text-[9px] leading-4 text-[#172033]/72 line-clamp-2">{faculty.department}</p>
        <p className="mt-3 line-clamp-4 font-serif text-[9px] leading-5 text-[#172033]/66">{faculty.bio || 'Guiding students with excellence and care.'}</p>
      </div>
    </article>
  );
}

function Distribution({ title, rows }) {
  const max = Math.max(...rows.map(([, count]) => count), 1);
  return (
    <div>
      <p className="mb-3 font-sans text-[8px] font-black uppercase tracking-[0.18em] text-[#071a33]">{title}</p>
      <div className="space-y-2">
        {rows.map(([label, count]) => (
          <div key={label} className="grid grid-cols-[92px_1fr_28px] items-center gap-2">
            <span className="truncate text-[8px] font-bold uppercase tracking-[0.08em] text-[#5f6470]">{label}</span>
            <span className="h-2 bg-[#d8c7a2]/45"><span className="block h-full bg-[#071a33]" style={{ width: `${(count / max) * 100}%` }} /></span>
            <span className="text-right font-serif text-[10px] text-[#071a33]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoTile({ photo, index }) {
  const span = index === 0 ? 'col-span-3 row-span-2' : index === 1 ? 'col-span-2 row-span-2' : 'col-span-2 row-span-2';
  return (
    <div className={`${span} relative overflow-hidden bg-[#071a33]`}>
      {photo?.file_path ? <img src={photo.file_path} alt={photo.caption || ''} className="h-full w-full object-cover" /> : <img src={YEARBOOK_ASSETS.gallery} alt="" className="h-full w-full object-cover opacity-80" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#031225]/70 to-transparent" />
      {photo?.caption ? <p className="absolute bottom-2 left-2 right-2 line-clamp-2 font-serif text-[9px] text-white">{photo.caption}</p> : null}
    </div>
  );
}
