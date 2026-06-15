/**
 * yearbook.routes.jsx
 * src/routes/yearbook.routes.jsx
 *
 * Add these routes inside your existing router.
 * Import and nest them inside your authenticated route group.
 *
 * Example (inside src/routes/index.jsx):
 *
 *   import yearbookRoutes from './yearbook.routes';
 *
 *   <Routes>
 *     <Route element={<PrivateRoute />}>
 *       {yearbookRoutes}
 *       ...existing routes...
 *     </Route>
 *   </Routes>
 */
import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const YearbookHomePage    = lazy(() => import('../features/yearbook/pages/YearbookHomePage'));
const FlipbookViewerPage  = lazy(() => import('../features/yearbook/pages/FlipbookViewerPage'));

const Fallback = () => (
  <div className="min-h-screen bg-[#f4f7fe] px-4 py-8">
    <div className="mx-auto w-full max-w-3xl">
      <LoadingSkeleton variant="page" count={1} />
    </div>
  </div>
);

const yearbookRoutes = (
  <>
    {/* Yearbook home / generator /yearbook or /yearbook/:batchId */}
    <Route
      path="/yearbook"
      element={<Suspense fallback={<Fallback />}><YearbookHomePage /></Suspense>}
    />
    <Route
      path="/yearbook/:batchId"
      element={<Suspense fallback={<Fallback />}><YearbookHomePage /></Suspense>}
    />

    {/* Flipbook viewer /yearbook/:batchId/view */}
    <Route
      path="/yearbook/:batchId/view"
      element={<Suspense fallback={<Fallback />}><FlipbookViewerPage /></Suspense>}
    />
  </>
);

export default yearbookRoutes;
