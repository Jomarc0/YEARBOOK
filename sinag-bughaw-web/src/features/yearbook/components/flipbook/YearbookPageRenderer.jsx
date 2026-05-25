/**
 * YearbookPageRenderer.jsx
 * src/features/yearbook/components/flipbook/YearbookPageRenderer.jsx
 *
 * Fixed imports: FacultyPage, StatsPage, ClosingPage, BlankPage
 * are all named exports from GalleryPage.jsx — no separate files needed.
 * Delete the stub re-export files if you created them.
 */
import React, { forwardRef } from 'react';

import CoverPage        from '../pages/CoverPage';
import DedicationPage   from '../pages/DedicationPage';
import TOCPage          from '../pages/TOCPage';
import SectionHeader    from '../pages/SectionHeader';
import StudentGridPage  from '../pages/StudentGridPage';
import StudentQuotePage from '../pages/StudentQuotePage';

// All four come from the same barrel — no separate files required
import GalleryPage, {
  FacultyPage,
  StatsPage,
  ClosingPage,
  BlankPage,
} from '../pages/GalleryPage';

const YearbookPageRenderer = forwardRef(({ page, pageIndex, onNavigate }, ref) => {
  const props = { page, pageIndex, onNavigate };

  const content = (() => {
    switch (page?.type) {
      case 'cover':           return <CoverPage        {...props} />;
      case 'dedication':      return <DedicationPage   {...props} />;
      case 'toc':             return <TOCPage          {...props} />;
      case 'section-header':  return <SectionHeader    {...props} />;
      case 'student-grid':    return <StudentGridPage  {...props} />;
      case 'student-quotes':  return <StudentQuotePage {...props} />;
      case 'gallery':         return <GalleryPage      {...props} />;
      case 'faculty':         return <FacultyPage      {...props} />;
      case 'stats':           return <StatsPage        {...props} />;
      case 'closing':         return <ClosingPage      {...props} />;
      default:                return <BlankPage        {...props} />;
    }
  })();

  return (
    <div ref={ref} className="yearbook-page-slot">
      {content}
    </div>
  );
});

YearbookPageRenderer.displayName = 'YearbookPageRenderer';
export default YearbookPageRenderer;