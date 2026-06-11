/**
 * YearbookPageRenderer.jsx
 * src/features/yearbook/components/flipbook/YearbookPageRenderer.jsx
 *
 * FIXES applied:
 *   1. DedicationPage no longer exports TOCPage/SectionHeader — each has its own file.
 *      Updated imports accordingly.
 *   2. BlankPage was previously imported from DedicationPage (wrong); now from GalleryPage.
 *   3. Passes onPortraitClick through to StudentGridPage
 *      so yearbook profiles can open discovery student profiles.
 *   4. Wrapped in forwardRef (required by react-pageflip).
 */
import { forwardRef } from 'react';

import CoverPage        from '../pages/CoverPage';
import DedicationPage   from '../pages/DedicationPage';   // FIX: only DedicationPage now
import TOCPage          from '../pages/TOCPage';           // FIX: own file
import SectionHeader    from '../pages/SectionHeader';    // FIX: own file
import StudentGridPage  from '../pages/StudentGridPage';
import GalleryPage, {
  WelcomePage,
  ProgramOverviewPage,
  AchievementsPage,
  OrganizationsPage,
  MemoriesPage,
  AspirationsPage,
  DirectoryPage,
  FacultyPage,
  StatsPage,
  ClosingPage,
  BackCoverPage,
  BlankPage,             // FIX: comes from GalleryPage barrel, not DedicationPage
} from '../pages/GalleryPage';

const YearbookPageRenderer = forwardRef(
  ({ page, pageIndex, onNavigate, onPortraitClick }, ref) => {

    const sharedProps = { page, pageIndex, onNavigate };

    const content = (() => {
      switch (page?.type) {
        case 'cover':           return <CoverPage        {...sharedProps} />;
        case 'dedication':      return <DedicationPage   {...sharedProps} />;
        case 'toc':             return <TOCPage          {...sharedProps} />;
        case 'course-header':
        case 'section-header':  return <SectionHeader    {...sharedProps} />;

        case 'student-grid':
        case 'student-profile':
          return (
            <StudentGridPage
              {...sharedProps}
              onPortraitClick={onPortraitClick}
            />
          );

        case 'welcome':          return <WelcomePage         {...sharedProps} />;
        case 'program-overview': return <ProgramOverviewPage {...sharedProps} />;
        case 'achievements':     return <AchievementsPage    {...sharedProps} />;
        case 'organizations':    return <OrganizationsPage   {...sharedProps} />;
        case 'memories':         return <MemoriesPage        {...sharedProps} />;
        case 'aspirations':      return <AspirationsPage     {...sharedProps} />;
        case 'directory':        return <DirectoryPage       {...sharedProps} />;
        case 'gallery':          return <GalleryPage         {...sharedProps} />;
        case 'faculty':          return <FacultyPage         {...sharedProps} />;
        case 'stats':            return <StatsPage           {...sharedProps} />;
        case 'closing':          return <ClosingPage         {...sharedProps} />;
        case 'back-cover':       return <BackCoverPage       {...sharedProps} />;
        default:                 return <BlankPage           {...sharedProps} />;
      }
    })();

    return (
      <div
        ref={ref}
        style={{
          width:    '100%',
          height:   '100%',
          overflow: 'hidden',
          display:  'flex',
        }}
      >
        {content}
      </div>
    );
  }
);

YearbookPageRenderer.displayName = 'YearbookPageRenderer';
export default YearbookPageRenderer;
