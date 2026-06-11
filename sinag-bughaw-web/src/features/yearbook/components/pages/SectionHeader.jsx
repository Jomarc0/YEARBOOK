import { DarkImageLayer, GoldFrame, GoldRule, EditorialPage } from '../editorial/EditorialPrimitives';
import { YEARBOOK_ASSETS } from '../../theme/yearbookTheme';

export default function SectionHeader({ page }) {
  const { section = {}, side } = page;
  const isCoursePage = page?.type === 'course-header';
  const courseData = page?.course || {};
  const course = courseData.name || section.course || section.strand || section.name || 'Course';
  const sectionName = section.name || 'Section';
  const title = isCoursePage ? course : sectionName;
  const subtitle = isCoursePage
    ? `${courseData.sectionCount ?? 0} sections - ${courseData.studentCount ?? 0} graduates`
    : course;
  const code = String(title).slice(0, 8).toUpperCase();

  return (
    <EditorialPage tone="dark" className={`items-center justify-center p-10 ${side === 'left' ? 'text-left' : 'text-center'}`}>
      <DarkImageLayer src={YEARBOOK_ASSETS.building} opacity="opacity-35" />
      <GoldFrame subtle />
      <div className="pointer-events-none absolute inset-x-0 top-16 text-center font-serif text-[126px] font-bold uppercase leading-none tracking-[-0.06em] text-white/[0.035]">
        {code}
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <p className="font-sans text-[9px] font-black uppercase tracking-[0.32em] text-[#e4c36a]">
          {isCoursePage ? 'Course' : 'Section'}
        </p>
        <h1 className="mt-3 max-w-[32rem] text-center font-serif text-[48px] font-bold leading-[0.95] text-[#e4c36a]">{title}</h1>
        <p className="mt-4 font-sans text-[10px] font-black uppercase tracking-[0.24em] text-white/62">
          {subtitle}
        </p>
        <p className="mt-4 max-w-[28rem] text-center font-sans text-[9px] font-black uppercase leading-5 tracking-[0.24em] text-white/70">
          {isCoursePage ? `${courseData.sections?.join(' / ') || 'Course sections'}` : `${section.studentCount ?? 0} Graduates`}
        </p>
        <GoldRule className="mt-8" />
        <p className="mt-7 max-w-[24rem] text-center font-serif text-[19px] italic leading-8 text-white/88">
          “Dream. Build. Lead. Inspire the future.”
        </p>
        {section.adviser ? (
          <p className="mt-8 font-sans text-[8px] uppercase tracking-[0.18em] text-white/45">Adviser: {section.adviser}</p>
        ) : null}
      </div>
    </EditorialPage>
  );
}
